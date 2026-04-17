import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApplicationService } from './application.service';
import { SubmitApplicationDto } from './applications.dto';

@Controller('apply')
export class RecipientController {
  constructor(private readonly service: ApplicationService) {}

  @Get(':token')
  getForm(@Param('token') token: string) {
    return this.service.getByToken(token);
  }

  @Post(':token')
  @HttpCode(HttpStatus.OK)
  submit(@Param('token') token: string, @Body() dto: SubmitApplicationDto) {
    return this.service.submit(token, dto);
  }
}
