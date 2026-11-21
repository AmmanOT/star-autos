import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const DAY = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export class CreatePropertyDto {
  @ApiProperty({ example: 'Amman Manzil' })
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name: string;
}

export class UpdatePropertyDto {
  @ApiProperty({ example: 'Amman Manzil' })
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name: string;
}

export class CreateUnitDto {
  @ApiProperty()
  @IsUUID()
  propertyId: string;

  @ApiProperty({ enum: ['shop', 'room'] })
  @IsIn(['shop', 'room'])
  kind: 'shop' | 'room';

  @ApiProperty({ example: '1' })
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  unitNo: string;

  @ApiProperty({ example: 5000 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  monthlyRent: number;

  @ApiProperty({ example: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(31)
  dueDay: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  openingBalance?: number;

  @ApiPropertyOptional({ example: '2026-11' })
  @IsOptional()
  @Matches(MONTH)
  startMonth?: string;
}

export class UpdateUnitDto {
  @ApiPropertyOptional({ enum: ['shop', 'room'] })
  @IsOptional()
  @IsIn(['shop', 'room'])
  kind?: 'shop' | 'room';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  unitNo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  monthlyRent?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(31)
  dueDay?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  openingBalance?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(MONTH)
  startMonth?: string;
}

export class CreateRentPaymentDto {
  @ApiProperty()
  @IsUUID()
  unitId: string;

  @ApiProperty({ example: 3000 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ example: '2026-11-10' })
  @Matches(DAY)
  paidOn: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  notes?: string;
}
