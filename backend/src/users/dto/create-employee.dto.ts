import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { Permission } from '../../common/enums';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'Ahmed Khan' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'ahmed.pos', description: 'Login username (not email)' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9._@-]{2,40}$/, {
    message: 'Username must be 2–40 characters',
  })
  username: string;

  @ApiProperty({ example: '1234' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  password: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    enum: Permission,
    isArray: true,
    example: [Permission.BILLING],
  })
  @IsArray()
  @ArrayUnique()
  @IsEnum(Permission, { each: true })
  permissions: Permission[];
}
