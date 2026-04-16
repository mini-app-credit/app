import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { RequireAuth } from 'src/modules/iam/presentation/http/decorators';
import { NOTIFICATIONS_DI_TOKENS } from '../../../infrastructure';
import {
  CreateEmailTemplateUseCase,
  DeleteEmailTemplateUseCase,
  GetEmailTemplateUseCase,
  ListEmailTemplatesUseCase,
} from '../../../application/use-cases';
import {
  CreateEmailTemplateBodyDto,
  EmailTemplateResponseDto,
  ListEmailTemplatesQueryDto,
  ListEmailTemplatesResponseDto,
} from '../dtos';
import { Docs } from '../docs';

@Controller('notifications/templates')
@Docs.templates.tags()
@RequireAuth()
export class EmailTemplatesController {
  constructor(
    @Inject(NOTIFICATIONS_DI_TOKENS.USE_CASES.CREATE_EMAIL_TEMPLATE)
    private readonly createEmailTemplateUseCase: CreateEmailTemplateUseCase,
    @Inject(NOTIFICATIONS_DI_TOKENS.USE_CASES.GET_EMAIL_TEMPLATE)
    private readonly getEmailTemplateUseCase: GetEmailTemplateUseCase,
    @Inject(NOTIFICATIONS_DI_TOKENS.USE_CASES.DELETE_EMAIL_TEMPLATE)
    private readonly deleteEmailTemplateUseCase: DeleteEmailTemplateUseCase,
    @Inject(NOTIFICATIONS_DI_TOKENS.USE_CASES.LIST_EMAIL_TEMPLATES)
    private readonly listEmailTemplatesUseCase: ListEmailTemplatesUseCase,
  ) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Docs.templates.create()
  async create(@Body() body: CreateEmailTemplateBodyDto): Promise<EmailTemplateResponseDto> {
    const [error, result] = await this.createEmailTemplateUseCase.execute({
      eventName: body.eventName,
      templatePath: body.templatePath,
    });

    if (error) throw error;
    return result!.props;
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @Docs.templates.getById()
  async getById(@Param('id', ParseUUIDPipe) id: string): Promise<EmailTemplateResponseDto> {
    const [error, result] = await this.getEmailTemplateUseCase.execute({ id });
    if (error) throw error;
    return result!.props;
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @Docs.templates.list()
  async list(@Query() query: ListEmailTemplatesQueryDto): Promise<ListEmailTemplatesResponseDto> {
    const [error, result] = await this.listEmailTemplatesUseCase.execute({
      limit: query.limit,
      offset: query.offset,
    });

    if (error) throw error;
    return result!;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Docs.templates.delete()
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    const [error] = await this.deleteEmailTemplateUseCase.execute({ id });
    if (error) throw error;
  }
}
