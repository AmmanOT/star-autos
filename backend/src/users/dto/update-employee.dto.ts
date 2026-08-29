import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { Permission } from '../../common/enums';

export class UpdateEmployeeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ description: 'Login username (not email)' })
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9._@-]{2,40}$/, {
    message: 'Username must be 2–40 characters',
  })
  username?: string;

  @ApiPropertyOptional({ description: 'Leave empty to keep the current password' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  password?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ enum: Permission, isArray: true })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsEnum(Permission, { each: true })
  permissions?: Permission[];
}
