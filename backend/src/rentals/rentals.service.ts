import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RentalProperty } from './entities/rental-property.entity';
import { RentalUnit } from './entities/rental-unit.entity';
import { RentPayment } from './entities/rent-payment.entity';
import { CreatePropertyDto, CreateRentPaymentDto, CreateUnitDto, UpdatePropertyDto, UpdateUnitDto } from './dto/rental.dto';
import { karachiDate, karachiMonth, round2, statementFor } from './rent-ledger';

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

@Injectable()
export class RentalsService {
  constructor(
    @InjectRepository(RentalProperty) private readonly properties: Repository<RentalProperty>,
    @InjectRepository(RentalUnit) private readonly units: Repository<RentalUnit>,
    @InjectRepository(RentPayment) private readonly payments: Repository<RentPayment>,
  ) {}

  listProperties() {
    return this.properties.find({ order: { name: 'ASC' } });
  }

  async createProperty(dto: CreatePropertyDto) {
    const saved = await this.properties.save(this.properties.create({ name: dto.name.trim() }));
    return saved;
  }

  async updateProperty(id: string, dto: UpdatePropertyDto) {
    const property = await this.mustProperty(id);
    property.name = dto.name.trim();
    return this.properties.save(property);
  }

  async removeProperty(id: string) {
    const property = await this.mustProperty(id);
    await this.properties.remove(property);
    return { ok: true };
  }

  async createUnit(dto: CreateUnitDto) {
    await this.mustProperty(dto.propertyId);
    const saved = await this.units.save(
      this.units.create({
        propertyId: dto.propertyId,
        kind: dto.kind,
        unitNo: dto.unitNo.trim(),
        monthlyRent: round2(dto.monthlyRent),
        dueDay: dto.dueDay,
        openingBalance: round2(dto.openingBalance ?? 0),
        startMonth: dto.startMonth || karachiMonth(),
      }),
    );
    return saved;
  }

  async updateUnit(id: string, dto: UpdateUnitDto) {
    const unit = await this.mustUnit(id);
    if (dto.kind) unit.kind = dto.kind;
    if (dto.unitNo != null) unit.unitNo = dto.unitNo.trim();
    if (dto.monthlyRent != null) unit.monthlyRent = round2(dto.monthlyRent);
    if (dto.dueDay != null) unit.dueDay = dto.dueDay;
    if (dto.openingBalance != null) unit.openingBalance = round2(dto.openingBalance);
    if (dto.startMonth) unit.startMonth = dto.startMonth;
    return this.units.save(unit);
  }

  async removeUnit(id: string) {
    const unit = await this.mustUnit(id);
    await this.units.remove(unit);
    return { ok: true };
  }

  async addPayment(dto: CreateRentPaymentDto) {
    await this.mustUnit(dto.unitId);
    return this.payments.save(
      this.payments.create({
        unitId: dto.unitId,
        amount: round2(dto.amount),
        paidOn: dto.paidOn,
        notes: dto.notes?.trim() || null,
      }),
    );
  }

  async removePayment(id: string) {
    const payment = await this.payments.findOne({ where: { id } });
    if (!payment) throw new NotFoundException('Payment not found');
    await this.payments.remove(payment);
    return { ok: true };
  }

  async board(month?: string) {
    const viewMonth = month && MONTH.test(month) ? month : karachiMonth();
    const today = karachiDate();
    const [properties, units, payments] = await Promise.all([
      this.properties.find({ order: { name: 'ASC' } }),
      this.units.find({ order: { unitNo: 'ASC' } }),
      this.payments.find(),
    ]);
    const propertyName = new Map(properties.map((property) => [property.id, property.name]));
    const byUnit = new Map<string, RentPayment[]>();
    for (const payment of payments) {
      const list = byUnit.get(payment.unitId) ?? [];
      list.push(payment);
      byUnit.set(payment.unitId, list);
    }

    const rows = units
      .filter((unit) => propertyName.has(unit.propertyId))
      .map((unit) => {
        const lines = (byUnit.get(unit.id) ?? []).map((payment) => ({
          id: payment.id,
          amount: Number(payment.amount),
          paidOn: String(payment.paidOn).slice(0, 10),
          notes: payment.notes,
        }));
        const statement = statementFor({
          openingBalance: Number(unit.openingBalance) || 0,
          monthlyRent: Number(unit.monthlyRent) || 0,
          dueDay: unit.dueDay,
          startMonth: unit.startMonth,
          viewMonth,
          today,
          payments: lines,
        });
        return {
          id: unit.id,
          propertyId: unit.propertyId,
          propertyName: propertyName.get(unit.propertyId) ?? '',
          kind: unit.kind,
          unitNo: unit.unitNo,
          monthlyRent: Number(unit.monthlyRent) || 0,
          dueDay: unit.dueDay,
          openingBalance: Number(unit.openingBalance) || 0,
          startMonth: unit.startMonth,
          ...statement,
        };
      })
      .sort((a, b) => a.propertyName.localeCompare(b.propertyName) || a.unitNo.localeCompare(b.unitNo, undefined, { numeric: true }));

    const totals = rows.reduce(
      (sum, row) => {
        sum.collected = round2(sum.collected + row.collected);
        sum.remaining = round2(sum.remaining + row.remaining);
        sum.monthRent = round2(sum.monthRent + row.monthRent);
        sum.broughtForward = round2(sum.broughtForward + Math.max(0, row.broughtForward));
        return sum;
      },
      { collected: 0, remaining: 0, monthRent: 0, broughtForward: 0 },
    );

    return {
      month: viewMonth,
      totals,
      properties: properties.map((property) => ({ id: property.id, name: property.name })),
      units: rows,
    };
  }

  private async mustProperty(id: string) {
    const property = await this.properties.findOne({ where: { id } });
    if (!property) throw new NotFoundException('Property not found');
    return property;
  }

  private async mustUnit(id: string) {
    const unit = await this.units.findOne({ where: { id } });
    if (!unit) throw new NotFoundException('Shop or room not found');
    return unit;
  }
}
