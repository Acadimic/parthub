import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-firebase-jwt';

@Injectable()
export class FirebaseStrategy extends PassportStrategy(Strategy, 'firebase-auth') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  async validate(token: string) {
    // TODO: Validate with Firebase Admin SDK
    return token;
  }
}
