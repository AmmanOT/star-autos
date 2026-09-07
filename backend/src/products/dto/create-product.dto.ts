import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  name: string;

  @ApiPropertyOptional({ default: '' })
  @IsOptional()
  @IsString()
  nameUrdu?: string;

  @ApiPropertyOptional({ default: '' })
  @IsOptional()
  @IsString()
  partNumber?: string;

  @ApiPropertyOptional({ default: '' })
  @IsOptional()
  @IsString()
  companyNumber?: string;

  @ApiPropertyOptional({ example: 'Genuine Suzuki', default: '' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ example: 'Oil Filter', default: '' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ type: [String], example: ['Mehran', 'Alto'], default: [] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  vehicleModels?: string[];

  @ApiProperty()
  @IsNumber()
  @Min(0)
  purchasePrice: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  salePrice: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  quantity: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  minStock?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;
}
