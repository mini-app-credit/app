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
import { ApplicationsDocs } from './applications.docs';

@Controller('applications')
@ApplicationsDocs.tags()
export class ApplicationsController {
  constructor(private readonly service: ApplicationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApplicationsDocs.create()
  create(@Body() dto: CreateApplicationDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApplicationsDocs.list()
  list(@Query() query: ListApplicationsDto) {
    return this.service.list(query);
  }

  @Get(':id')
  @ApplicationsDocs.get()
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Patch(':id')
  @ApplicationsDocs.update()
  update(@Param('id') id: string, @Body() dto: UpdateApplicationDto) {
    return this.service.update(id, dto);
  }

  @Post(':id/send')
  @HttpCode(HttpStatus.OK)
  @ApplicationsDocs.send()
  send(@Param('id') id: string, @Body() dto: SendApplicationDto) {
    return this.service.send(id, dto);
  }

  @Post(':id/decide')
  @HttpCode(HttpStatus.OK)
  @ApplicationsDocs.decide()
  decide(@Param('id') id: string, @Body() dto: DecideApplicationDto) {
    return this.service.decide(id, dto);
  }

  @Post(':id/ai-summary')
  @HttpCode(HttpStatus.OK)
  @ApplicationsDocs.aiSummary()
  generateAiSummary(@Param('id') id: string) {
    return this.service.generateAiSummary(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApplicationsDocs.delete()
  async delete(@Param('id') id: string) {
    await this.service.delete(id);
  }
}
