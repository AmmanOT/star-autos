import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@ApiTags('users')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List employees (admin)' })
  list() {
    return this.usersService.listEmployees();
  }

  @Post()
  @ApiOperation({ summary: 'Create employee with username, password and permissions' })
  create(@Body() dto: CreateEmployeeDto) {
    return this.usersService.createEmployee(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update employee credentials and permissions' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateEmployeeDto) {
    return this.usersService.updateEmployee(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete employee' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.usersService.deleteEmployee(id);
    return { success: true };
  }
}
