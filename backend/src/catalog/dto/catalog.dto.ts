import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateBrandDto {
  @ApiProperty({ example: 'Genuine Suzuki' })
  @IsString()
  @MinLength(1)
  name: string;
}

export class UpdateBrandDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;
}

export class CreateCategoryDto {
  @ApiProperty({ example: 'Oil Filter' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiPropertyOptional({ example: 'آئل فلٹر' })
  @IsOptional()
  @IsString()
  nameUrdu?: string;
}

export class UpdateCategoryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nameUrdu?: string;
}

export class CreateVehicleDto {
  @ApiProperty({ example: 'Mehran' })
  @IsString()
  @MinLength(1)
  name: string;
}

export class UpdateVehicleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;
}
