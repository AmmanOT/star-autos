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

  @ApiProperty()
  @IsString()
  nameUrdu: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  partNumber: string;

  @ApiProperty()
  @IsString()
  companyNumber: string;

  @ApiProperty({ example: 'Genuine Suzuki' })
  @IsString()
  @MinLength(1)
  brand: string;

  @ApiProperty({ example: 'Oil Filter' })
  @IsString()
  @MinLength(1)
  category: string;

  @ApiProperty({ type: [String], example: ['Mehran', 'Alto'] })
  @IsArray()
  @IsString({ each: true })
  vehicleModels: string[];

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

  @ApiProperty()
  @IsInt()
  @Min(0)
  minStock: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;
}
