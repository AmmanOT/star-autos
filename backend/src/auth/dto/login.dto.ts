import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'sa', description: 'Staff username' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9._@-]{2,60}$/, {
    message: 'Enter a valid username',
  })
  username: string;

  @ApiProperty({ example: '••••••••' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  password: string;
}
