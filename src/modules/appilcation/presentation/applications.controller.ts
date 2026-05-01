import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  CreateApplicationDto,
  DecideApplicationDto,
  ListApplicationsDto,
  SendApplicationDto,
  UpdateApplicationDto,
} from '../applications.dto';
import { ApplicationsDocs } from '../applications.docs';
import { APPLICATION_DI_TOKENS } from '../infrastructure/constants/di';
import type {
  CreateApplication,
  DecideApplication,
  DeleteApplication,
  GenerateAiSummary,
  GetApplication,
  ListApplications,
  ParseApplicationPdf,
  SendApplication,
  UpdateApplication,
} from '../application/use-cases';

@Controller('applications')
@ApplicationsDocs.tags()
export class ApplicationsController {
  constructor(
    @Inject(APPLICATION_DI_TOKENS.USE_CASES.CREATE)
    private readonly createUc: CreateApplication,
    @Inject(APPLICATION_DI_TOKENS.USE_CASES.UPDATE)
    private readonly updateUc: UpdateApplication,
    @Inject(APPLICATION_DI_TOKENS.USE_CASES.SEND)
    private readonly sendUc: SendApplication,
    @Inject(APPLICATION_DI_TOKENS.USE_CASES.DECIDE)
    private readonly decideUc: DecideApplication,
    @Inject(APPLICATION_DI_TOKENS.USE_CASES.GET)
    private readonly getUc: GetApplication,
    @Inject(APPLICATION_DI_TOKENS.USE_CASES.LIST)
    private readonly listUc: ListApplications,
    @Inject(APPLICATION_DI_TOKENS.USE_CASES.DELETE)
    private readonly deleteUc: DeleteApplication,
    @Inject(APPLICATION_DI_TOKENS.USE_CASES.AI_SUMMARY)
    private readonly aiUc: GenerateAiSummary,
    @Inject(APPLICATION_DI_TOKENS.USE_CASES.PARSE_PDF)
    private readonly parsePdfUc: ParseApplicationPdf,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApplicationsDocs.create()
  async create(@Body() dto: CreateApplicationDto) {
    const [err, data] = await this.createUc.execute(dto);
    if (err) throw err;
    return data;
  }

  @Get()
  @ApplicationsDocs.list()
  async list(@Query() query: ListApplicationsDto) {
    const [err, data] = await this.listUc.execute(query);
    if (err) throw err;
    return data;
  }

  @Get(':id')
  @ApplicationsDocs.get()
  async get(@Param('id') id: string) {
    const [err, data] = await this.getUc.execute({ id });
    if (err) throw err;
    return data;
  }

  @Patch(':id')
  @ApplicationsDocs.update()
  async update(@Param('id') id: string, @Body() dto: UpdateApplicationDto) {
    const [err, data] = await this.updateUc.execute({ id, patch: dto });
    if (err) throw err;
    return data;
  }

  @Post(':id/send')
  @HttpCode(HttpStatus.OK)
  @ApplicationsDocs.send()
  async send(@Param('id') id: string, @Body() dto: SendApplicationDto) {
    const [err, data] = await this.sendUc.execute({ id, ...dto });
    if (err) throw err;
    return data;
  }

  @Post(':id/decide')
  @HttpCode(HttpStatus.OK)
  @ApplicationsDocs.decide()
  async decide(@Param('id') id: string, @Body() dto: DecideApplicationDto) {
    const [err, data] = await this.decideUc.execute({ id, ...dto });
    if (err) throw err;
    return data;
  }

  @Post('parse-pdf')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (file.mimetype !== 'application/pdf') {
          cb(new BadRequestException('Only PDF files are accepted'), false);
        } else {
          cb(null, true);
        }
      },
    }),
  )
  @ApplicationsDocs.parsePdf()
  async parsePdf(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('file is required');
    const [err, data] = await this.parsePdfUc.execute({ buffer: file.buffer });
    if (err) throw err;
    return data;
  }

  @Post(':id/ai-summary')
  @HttpCode(HttpStatus.OK)
  @ApplicationsDocs.aiSummary()
  async generateAiSummary(@Param('id') id: string) {
    const [err, data] = await this.aiUc.execute({ id });
    if (err) throw err;
    return data;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApplicationsDocs.delete()
  async delete(@Param('id') id: string) {
    const [err] = await this.deleteUc.execute({ id });
    if (err) throw err;
  }
}
