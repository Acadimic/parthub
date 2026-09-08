import { Public } from '@decorators/public.decorator';
import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { OK } from '@utils/constants';
import { Connection, ConnectionStates } from 'mongoose';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly appService: AppService,
  ) {}

  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Public()
  @Get('health')
  healthCheck() {
    if (this.connection.readyState === ConnectionStates.connected) {
      return OK;
    }
    throw new HttpException('Database connection is not ready', HttpStatus.SERVICE_UNAVAILABLE);
  }
}
