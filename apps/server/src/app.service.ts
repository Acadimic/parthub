import { Injectable } from '@nestjs/common';
import { WELCOME_MESSAGE } from '@utils/constants';

@Injectable()
export class AppService {
  getHello(): string {
    return WELCOME_MESSAGE;
  }
}
