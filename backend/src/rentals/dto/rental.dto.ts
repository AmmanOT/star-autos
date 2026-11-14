import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const PERIOD = /^\d{4}-(0[1-9]|1[0-2])$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

export class CreatePropertyDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class UpdatePropertyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class CreateUnitDto {
  @ApiProperty()
  @IsString()
  propertyId: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;

  @ApiProperty({ enum: ['room', 'shop'] })
  @IsIn(['room', 'shop'])
  kind: 'room' | 'shop';

  @ApiProperty()
  @IsNumber()
  @Min(0)
  monthlyRent: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  @Max(31)
  dueDay: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  tenantName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  tenantPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  occupied?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({ description: 'Money already owed before monthly rent' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  openingBalance?: number;

  @ApiPropertyOptional({ example: '2026-11' })
  @IsOptional()
  @IsString()
  @Matches(PERIOD, { message: 'Start month must look like 2026-11' })
  startMonth?: string;
}

export class UpdateUnitDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ enum: ['room', 'shop'] })
  @IsOptional()
  @IsIn(['room', 'shop'])
  kind?: 'room' | 'shop';

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyRent?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  dueDay?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  tenantName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  tenantPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  occupied?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  openingBalance?: number;

  @ApiPropertyOptional({ example: '2026-11' })
  @IsOptional()
  @IsString()
  @Matches(PERIOD, { message: 'Start month must look like 2026-11' })
  startMonth?: string;
}

export class CreateChargeDto {
  @ApiProperty()
  @IsString()
  unitId: string;

  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ example: '2026-11-06' })
  @IsString()
  @Matches(DAY, { message: 'Date must look like 2026-11-06' })
  chargedOn: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  description: string;
}

export class CreateCollectionDto {
  @ApiProperty()
  @IsString()
  unitId: string;

  @ApiProperty({ example: '2026-11' })
  @IsString()
  @Matches(PERIOD, { message: 'Month must look like 2026-11' })
  period: string;

  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ example: '2026-11-06' })
  @IsString()
  @Matches(DAY, { message: 'Date must look like 2026-11-06' })
  paidOn: string;

  @ApiProperty({ enum: ['cash', 'bank'] })
  @IsIn(['cash', 'bank'])
  method: 'cash' | 'bank';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
