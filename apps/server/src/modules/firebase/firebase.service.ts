import { AppConfigService } from '@config';
import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private app: admin.app.App;

  constructor(private configService: AppConfigService) {}

  onModuleInit() {
    const base64 = this.configService.firebaseAuthBase64;
    if (base64) {
      const serviceAccount = JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));
      this.app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
  }

  async validateToken(token: string) {
    if (!this.app) return null;
    return this.app.auth().verifyIdToken(token);
  }
}
