import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { RentCharge } from './entities/rent-charge.entity';
import { RentCollection } from './entities/rent-collection.entity';
import { RentalProperty } from './entities/rental-property.entity';
import { RentalUnit } from './entities/rental-unit.entity';
import type {
  CreateChargeDto,
  CreateCollectionDto,
  CreatePropertyDto,
  CreateUnitDto,
  UpdatePropertyDto,
  UpdateUnitDto,
} from './dto/rental.dto';
import {
  monthsOfYear,
  round2 as roundMoney,
  statementFor,
  type LedgerCharge,
  type LedgerPayment,
  type LedgerUnit,
} from './rent-ledger';

export type RentStatus = 'vacant' | 'paid' | 'partial' | 'unpaid';

function round2(value: number): number {
  return roundMoney(value);
}

function blank(value: string | undefined | null): string | null {
  const trimmed = value?.trim() ?? '';
  return trimmed ? trimmed : null;
}

function cmpName(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

function pkToday(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
}

function dueDate(period: string, dueDay: number): string {
  const [year, month] = period.split('-').map(Number);
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const day = Math.min(Math.max(dueDay, 1), last);
  return `${period}-${String(day).padStart(2, '0')}`;
}

function asDate(value: string | Date): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

@Injectable()
export class RentalsService {
  constructor(
    @InjectRepository(RentalProperty)
    private readonly propertiesRepository: Repository<RentalProperty>,
    @InjectRepository(RentalUnit)
    private readonly unitsRepository: Repository<RentalUnit>,
    @InjectRepository(RentCollection)
    private readonly collectionsRepository: Repository<RentCollection>,
    @InjectRepository(RentCharge)
    private readonly chargesRepository: Repository<RentCharge>,
    private readonly dataSource: DataSource,
    private readonly activityLogs: ActivityLogsService,
  ) {}

  async listProperties() {
    const [properties, units] = await Promise.all([
      this.propertiesRepository.find(),
      this.unitsRepository.find(),
    ]);
    return properties
      .sort((a, b) => cmpName(a.name, b.name))
      .map((property) => ({
        ...this.presentProperty(property),
        units: units
          .filter((unit) => unit.propertyId === property.id)
          .sort(compareUnits)
          .map((unit) => this.presentUnit(unit)),
      }));
  }

  async createProperty(dto: CreatePropertyDto, user: AuthUser) {
    const saved = await this.dataSource.transaction(async (manager) => {
      const row = manager.create(RentalProperty, {
        name: dto.name.trim(),
        address: blank(dto.address),
        notes: blank(dto.notes),
      });
      const property = await manager.save(row);
      await this.activityLogs.write(
        {
          action: 'rent.property.created',
          entityType: 'rent',
          entityId: property.id,
          user,
          summary: `${user.name} added property ${property.name}`,
          meta: { name: property.name },
        },
        manager,
      );
      return property;
    });
    return { ...this.presentProperty(saved), units: [] };
  }

  async updateProperty(id: string, dto: UpdatePropertyDto, user: AuthUser) {
    const property = await this.mustProperty(id);
    if (dto.name !== undefined) property.name = dto.name.trim();
    if (dto.address !== undefined) property.address = blank(dto.address);
    if (dto.notes !== undefined) property.notes = blank(dto.notes);
    const saved = await this.dataSource.transaction(async (manager) => {
      const row = await manager.save(property);
      await this.activityLogs.write(
        {
          action: 'rent.property.updated',
          entityType: 'rent',
          entityId: row.id,
          user,
          summary: `${user.name} updated property ${row.name}`,
          meta: { name: row.name },
        },
        manager,
      );
      return row;
    });
    const units = await this.unitsRepository.find({ where: { propertyId: id } });
    return {
      ...this.presentProperty(saved),
      units: units.sort(compareUnits).map((unit) => this.presentUnit(unit)),
    };
  }

  async removeProperty(id: string, user: AuthUser) {
    const property = await this.mustProperty(id);
    await this.dataSource.transaction(async (manager) => {
      await manager.delete(RentalProperty, id);
      await this.activityLogs.write(
        {
          action: 'rent.property.deleted',
          entityType: 'rent',
          entityId: id,
          user,
          summary: `${user.name} deleted property ${property.name}`,
          meta: { name: property.name },
        },
        manager,
      );
    });
  }

  async createUnit(dto: CreateUnitDto, user: AuthUser) {
    const property = await this.mustProperty(dto.propertyId);
    const saved = await this.dataSource.transaction(async (manager) => {
      const row = manager.create(RentalUnit, {
        propertyId: property.id,
        name: dto.name.trim(),
        kind: dto.kind,
        monthlyRent: round2(dto.monthlyRent),
        dueDay: dto.dueDay,
        tenantName: blank(dto.tenantName),
        tenantPhone: blank(dto.tenantPhone),
        occupied: dto.occupied !== false,
        openingBalance: round2(dto.openingBalance ?? 0),
        startMonth: dto.startMonth ?? pkToday().slice(0, 7),
        notes: blank(dto.notes),
      });
      const unit = await manager.save(row);
      await this.activityLogs.write(
        {
          action: 'rent.unit.created',
          entityType: 'rent',
          entityId: unit.id,
          user,
          summary: `${user.name} added ${unit.kind} ${unit.name} at ${property.name} (Rs. ${unit.monthlyRent.toLocaleString('en-PK')}, due day ${unit.dueDay})`,
          meta: {
            propertyId: property.id,
            propertyName: property.name,
            unitName: unit.name,
            monthlyRent: unit.monthlyRent,
            dueDay: unit.dueDay,
          },
        },
        manager,
      );
      return unit;
    });
    return this.presentUnit(saved);
  }

  async updateUnit(id: string, dto: UpdateUnitDto, user: AuthUser) {
    const unit = await this.mustUnit(id);
    if (dto.name !== undefined) unit.name = dto.name.trim();
    if (dto.kind !== undefined) unit.kind = dto.kind;
    if (dto.monthlyRent !== undefined) unit.monthlyRent = round2(dto.monthlyRent);
    if (dto.dueDay !== undefined) unit.dueDay = dto.dueDay;
    if (dto.tenantName !== undefined) unit.tenantName = blank(dto.tenantName);
    if (dto.tenantPhone !== undefined) unit.tenantPhone = blank(dto.tenantPhone);
    if (dto.occupied !== undefined) unit.occupied = dto.occupied;
    if (dto.openingBalance !== undefined) unit.openingBalance = round2(dto.openingBalance);
    if (dto.startMonth !== undefined) unit.startMonth = dto.startMonth;
    if (dto.notes !== undefined) unit.notes = blank(dto.notes);
    const property = await this.mustProperty(unit.propertyId);
    const saved = await this.dataSource.transaction(async (manager) => {
      const row = await manager.save(unit);
      await this.activityLogs.write(
        {
          action: 'rent.unit.updated',
          entityType: 'rent',
          entityId: row.id,
          user,
          summary: `${user.name} updated ${row.kind} ${row.name} at ${property.name}`,
          meta: { propertyName: property.name, unitName: row.name },
        },
        manager,
      );
      return row;
    });
    return this.presentUnit(saved);
  }

  async removeUnit(id: string, user: AuthUser) {
    const unit = await this.mustUnit(id);
    const property = await this.mustProperty(unit.propertyId);
    await this.dataSource.transaction(async (manager) => {
      await manager.delete(RentalUnit, id);
      await this.activityLogs.write(
        {
          action: 'rent.unit.deleted',
          entityType: 'rent',
          entityId: id,
          user,
          summary: `${user.name} deleted ${unit.kind} ${unit.name} at ${property.name}`,
          meta: { propertyName: property.name, unitName: unit.name },
        },
        manager,
      );
    });
  }

  async board(month: string | undefined) {
    const period = this.assertPeriod(month);
    const [properties, units, collections, charges] = await Promise.all([
      this.propertiesRepository.find(),
      this.unitsRepository.find(),
      this.collectionsRepository.find({ order: { paidOn: 'ASC', createdAt: 'ASC' } }),
      this.chargesRepository.find({ order: { chargedOn: 'ASC', createdAt: 'ASC' } }),
    ]);
    const propertyById = new Map(properties.map((property) => [property.id, property]));
    const today = pkToday();
    const todayMonth = today.slice(0, 7);
    const year = monthsOfYear(Number(period.slice(0, 4)));
    const rows = units
      .filter((unit) => propertyById.has(unit.propertyId))
      .map((unit) => {
        const property = propertyById.get(unit.propertyId)!;
        const ledgerUnit = this.ledgerUnit(unit);
        const unitPayments = collections
          .filter((row) => row.unitId === unit.id)
          .map((row) => this.presentCollection(row));
        const unitCharges = charges
          .filter((row) => row.unitId === unit.id)
          .map((row) => this.presentCharge(row));
        const statement = statementFor(ledgerUnit, period, unitPayments, unitCharges, todayMonth);
        const due = dueDate(period, unit.dueDay);
        const active =
          unit.occupied ||
          statement.broughtForward > 0.009 ||
          statement.extras > 0.009 ||
          statement.collected > 0.009;
        const status: RentStatus = !active
          ? 'vacant'
          : statement.collected <= 0 && statement.remaining > 0.009
            ? 'unpaid'
            : statement.remaining > 0.009
              ? 'partial'
              : 'paid';
        return {
          unitId: unit.id,
          propertyId: property.id,
          propertyName: property.name,
          unitName: unit.name,
          kind: unit.kind,
          tenantName: unit.tenantName,
          tenantPhone: unit.tenantPhone,
          dueDay: unit.dueDay,
          dueDate: due,
          monthlyRent: round2(Number(unit.monthlyRent)),
          openingBalance: ledgerUnit.openingBalance,
          startMonth: ledgerUnit.startMonth,
          occupied: unit.occupied,
          broughtForward: statement.broughtForward,
          monthRent: statement.monthRent,
          extras: statement.extras,
          expected: statement.expected,
          collected: statement.collected,
          remaining: statement.remaining,
          extra: statement.credit,
          status,
          overdue: statement.remaining > 0.009 && period <= todayMonth && today > due,
          charges: statement.charges,
          payments: statement.payments,
          year: year.map((item) => {
            const cell = statementFor(ledgerUnit, item, unitPayments, unitCharges, todayMonth);
            return {
              month: item,
              collected: cell.collected,
              remaining: cell.remaining,
              expected: cell.expected,
            };
          }),
        };
      })
      .sort((a, b) => {
        const property = cmpName(a.propertyName, b.propertyName);
        if (property !== 0) return property;
        return compareUnits(a, b);
      });

    const sum = (pick: (row: (typeof rows)[number]) => number) =>
      round2(rows.reduce((total, row) => total + pick(row), 0));

    return {
      month: period,
      today,
      totals: {
        broughtForward: sum((row) => Math.max(0, row.broughtForward)),
        monthRent: sum((row) => row.monthRent),
        extras: sum((row) => row.extras),
        expected: sum((row) => row.expected),
        collected: sum((row) => row.collected),
        remaining: sum((row) => row.remaining),
        paid: rows.filter((row) => row.status === 'paid').length,
        partial: rows.filter((row) => row.status === 'partial').length,
        unpaid: rows.filter((row) => row.status === 'unpaid').length,
        overdue: rows.filter((row) => row.overdue).length,
        vacant: rows.filter((row) => row.status === 'vacant').length,
      },
      rows,
    };
  }

  async collect(dto: CreateCollectionDto, user: AuthUser) {
    const unit = await this.mustUnit(dto.unitId);
    const amount = round2(dto.amount);
    if (!(amount > 0)) {
      throw new BadRequestException('Enter an amount greater than zero.');
    }
    const period = this.assertPeriod(dto.period);
    const property = await this.mustProperty(unit.propertyId);
    const saved = await this.dataSource.transaction(async (manager) => {
      const row = manager.create(RentCollection, {
        unitId: unit.id,
        period,
        amount,
        paidOn: dto.paidOn,
        method: dto.method,
        notes: blank(dto.notes),
      });
      const collection = await manager.save(row);
      await this.activityLogs.write(
        {
          action: 'rent.collected',
          entityType: 'rent',
          entityId: collection.id,
          user,
          summary: `${user.name} took Rs. ${amount.toLocaleString('en-PK')} rent for ${unit.name} (${property.name}) · ${period} on ${dto.paidOn}`,
          meta: {
            propertyName: property.name,
            unitName: unit.name,
            period,
            amount,
            paidOn: dto.paidOn,
            method: dto.method,
            notes: collection.notes,
          },
        },
        manager,
      );
      return collection;
    });
    return this.presentCollection(saved);
  }

  async addCharge(dto: CreateChargeDto, user: AuthUser) {
    const unit = await this.mustUnit(dto.unitId);
    const property = await this.mustProperty(unit.propertyId);
    const amount = round2(dto.amount);
    if (!(amount > 0)) {
      throw new BadRequestException('Enter an amount greater than zero.');
    }
    const saved = await this.dataSource.transaction(async (manager) => {
      const row = manager.create(RentCharge, {
        unitId: unit.id,
        amount,
        chargedOn: dto.chargedOn,
        description: dto.description.trim(),
      });
      const charge = await manager.save(row);
      await this.activityLogs.write(
        {
          action: 'rent.charge.created',
          entityType: 'rent',
          entityId: charge.id,
          user,
          summary: `${user.name} added Rs. ${amount.toLocaleString('en-PK')} (${charge.description}) for ${unit.name} (${property.name})`,
          meta: {
            propertyName: property.name,
            unitName: unit.name,
            amount,
            chargedOn: dto.chargedOn,
            description: charge.description,
          },
        },
        manager,
      );
      return charge;
    });
    return this.presentCharge(saved);
  }

  async removeCharge(id: string, user: AuthUser) {
    const charge = await this.chargesRepository.findOne({ where: { id } });
    if (!charge) throw new NotFoundException('Amount not found');
    const unit = await this.mustUnit(charge.unitId);
    const property = await this.mustProperty(unit.propertyId);
    await this.dataSource.transaction(async (manager) => {
      await manager.delete(RentCharge, id);
      await this.activityLogs.write(
        {
          action: 'rent.charge.deleted',
          entityType: 'rent',
          entityId: id,
          user,
          summary: `${user.name} removed Rs. ${Number(charge.amount).toLocaleString('en-PK')} (${charge.description ?? 'amount'}) for ${unit.name} (${property.name})`,
          meta: { propertyName: property.name, unitName: unit.name, amount: Number(charge.amount) },
        },
        manager,
      );
    });
  }

  async removeCollection(id: string, user: AuthUser) {
    const collection = await this.collectionsRepository.findOne({ where: { id } });
    if (!collection) throw new NotFoundException('Rent payment not found');
    const unit = await this.mustUnit(collection.unitId);
    const property = await this.mustProperty(unit.propertyId);
    await this.dataSource.transaction(async (manager) => {
      await manager.delete(RentCollection, id);
      await this.activityLogs.write(
        {
          action: 'rent.collection.deleted',
          entityType: 'rent',
          entityId: id,
          user,
          summary: `${user.name} removed Rs. ${Number(collection.amount).toLocaleString('en-PK')} rent for ${unit.name} (${property.name}) · ${collection.period}`,
          meta: {
            propertyName: property.name,
            unitName: unit.name,
            period: collection.period,
            amount: Number(collection.amount),
          },
        },
        manager,
      );
    });
  }

  private assertPeriod(month: string | undefined): string {
    if (!month || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      throw new BadRequestException('Pick a month like 2026-11.');
    }
    return month;
  }

  private async mustProperty(id: string): Promise<RentalProperty> {
    const property = await this.propertiesRepository.findOne({ where: { id } });
    if (!property) throw new NotFoundException('Property not found');
    return property;
  }

  private async mustUnit(id: string): Promise<RentalUnit> {
    const unit = await this.unitsRepository.findOne({ where: { id } });
    if (!unit) throw new NotFoundException('Room or shop not found');
    return unit;
  }

  private presentProperty(property: RentalProperty) {
    return {
      id: property.id,
      name: property.name,
      address: property.address,
      notes: property.notes,
      createdAt: property.createdAt,
    };
  }

  private presentUnit(unit: RentalUnit) {
    return {
      id: unit.id,
      propertyId: unit.propertyId,
      name: unit.name,
      kind: unit.kind,
      monthlyRent: round2(Number(unit.monthlyRent)),
      dueDay: unit.dueDay,
      tenantName: unit.tenantName,
      tenantPhone: unit.tenantPhone,
      occupied: unit.occupied,
      openingBalance: round2(Number(unit.openingBalance ?? 0)),
      startMonth: unit.startMonth || this.createdMonth(unit.createdAt),
      notes: unit.notes,
      createdAt: unit.createdAt,
    };
  }

  private ledgerUnit(unit: RentalUnit): LedgerUnit {
    return {
      id: unit.id,
      occupied: unit.occupied,
      monthlyRent: round2(Number(unit.monthlyRent)),
      openingBalance: round2(Number(unit.openingBalance ?? 0)),
      startMonth: unit.startMonth || this.createdMonth(unit.createdAt),
    };
  }

  private createdMonth(value: Date | string): string {
    return new Date(value).toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' }).slice(0, 7);
  }

  private presentCharge(row: RentCharge): LedgerCharge {
    return {
      id: row.id,
      unitId: row.unitId,
      amount: round2(Number(row.amount)),
      chargedOn: asDate(row.chargedOn),
      description: row.description,
      createdAt: row.createdAt,
    };
  }

  private presentCollection(row: RentCollection): LedgerPayment {
    return {
      id: row.id,
      unitId: row.unitId,
      period: row.period,
      amount: round2(Number(row.amount)),
      paidOn: asDate(row.paidOn),
      method: row.method,
      notes: row.notes,
      createdAt: row.createdAt,
    };
  }
}

function compareUnits(
  a: { kind: string; name?: string; unitName?: string },
  b: { kind: string; name?: string; unitName?: string },
): number {
  if (a.kind !== b.kind) return a.kind === 'room' ? -1 : 1;
  return cmpName(a.name ?? a.unitName ?? '', b.name ?? b.unitName ?? '');
}
