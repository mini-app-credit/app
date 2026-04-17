import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApplicationService } from './application.service';
import { SubmitApplicationDto } from './applications.dto';
import { RecipientDocs } from './applications.docs';

@Controller('apply')
@RecipientDocs.tags()
export class RecipientController {
  constructor(private readonly service: ApplicationService) {}

  @Get(':token')
  @RecipientDocs.getForm()
  getForm(@Param('token') token: string) {
    return this.service.getByToken(token);
  }

  @Post(':token')
  @HttpCode(HttpStatus.OK)
  @RecipientDocs.submit()
  submit(@Param('token') token: string, @Body() dto: SubmitApplicationDto) {
    return this.service.submit(token, dto);
  }
}
