import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'sa', description: 'Staff or customer login name' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(80)
  username: string;

  @ApiProperty({ example: '••••••••' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  password: string;
}
