import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
} from '@nestjs/common';
import { SubmitApplicationDto } from '../applications.dto';
import { RecipientDocs } from '../applications.docs';
import { APPLICATION_DI_TOKENS } from '../infrastructure/constants/di';
import type {
  GetApplicationByToken,
  SubmitApplication,
} from '../application/use-cases';

@Controller('apply')
@RecipientDocs.tags()
export class RecipientController {
  constructor(
    @Inject(APPLICATION_DI_TOKENS.USE_CASES.GET_BY_TOKEN)
    private readonly getByTokenUc: GetApplicationByToken,
    @Inject(APPLICATION_DI_TOKENS.USE_CASES.SUBMIT)
    private readonly submitUc: SubmitApplication,
  ) {}

  @Get(':token')
  @RecipientDocs.getForm()
  async getForm(@Param('token') token: string) {
    const [err, data] = await this.getByTokenUc.execute({ token });
    if (err) throw err;
    return data;
  }

  @Post(':token')
  @HttpCode(HttpStatus.OK)
  @RecipientDocs.submit()
  async submit(@Param('token') token: string, @Body() dto: SubmitApplicationDto) {
    const [err, data] = await this.submitUc.execute({ token, ...dto });
    if (err) throw err;
    return data;
  }
}
