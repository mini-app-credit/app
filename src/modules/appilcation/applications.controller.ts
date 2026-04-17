import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApplicationService } from './application.service';
import {
  CreateApplicationDto,
  DecideApplicationDto,
  ListApplicationsDto,
  SendApplicationDto,
  UpdateApplicationDto,
} from './applications.dto';

@Controller('applications')
export class ApplicationsController {
  constructor(private readonly service: ApplicationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateApplicationDto) {
    return this.service.create(dto);
  }

  @Get()
  list(@Query() query: ListApplicationsDto) {
    return this.service.list(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateApplicationDto) {
    return this.service.update(id, dto);
  }

  @Post(':id/send')
  @HttpCode(HttpStatus.OK)
  send(@Param('id') id: string, @Body() dto: SendApplicationDto) {
    return this.service.send(id, dto);
  }

  @Post(':id/decide')
  @HttpCode(HttpStatus.OK)
  decide(@Param('id') id: string, @Body() dto: DecideApplicationDto) {
    return this.service.decide(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.service.delete(id);
  }
}
