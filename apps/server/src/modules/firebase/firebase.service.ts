import { Injectable, NotFoundException } from '@nestjs/common';
import { Secrets } from '@secrets/secrets';
import { SecretsService } from '@secrets/secrets.service';
import * as firebase from 'firebase-admin';
import { DecodedIdToken } from 'firebase-admin/auth';
import { isEmpty, isNil } from 'lodash';
import { CreateFirebaseUserDto, FirebaseUserUpdatePayloadDto, UpdateFirebaseUserDto } from './firebase.dto';

@Injectable()
export class FirebaseService {
  private defaultApp: firebase.app.App | undefined;
  constructor(private secretsService: SecretsService) {
    const base64 = secretsService.get(Secrets.FIREBASE_AUTH_BASE_64) as string;
    const firebaseParams = base64 && (JSON.parse(Buffer.from(base64, 'base64').toString()) as string);
    this.defaultApp = firebaseParams
      ? firebase.initializeApp({
          credential: firebase.credential.cert(firebaseParams),
        })
      : undefined;
  }

  async getUser(uid: string) {
    return await this.defaultApp?.auth().getUser(uid);
  }

  async getUserByEmail(email: string): Promise<firebase.auth.UserRecord | undefined> {
    return await this.defaultApp?.auth().getUserByEmail(email);
  }

  async createCustomToken(uid: string): Promise<string | undefined> {
    return await this.defaultApp?.auth().createCustomToken(uid);
  }

  async updateUser(payload: FirebaseUserUpdatePayloadDto) {
    const { name, email, uid, isEmailVerified } = payload;
    const firebasePayload: UpdateFirebaseUserDto = {};
    if (name) firebasePayload.displayName = name;
    if (email) {
      firebasePayload.email = email;
      firebasePayload.providersToUnlink = ['google.com', 'microsoft.com'];
    }
    if (!isNil(isEmailVerified)) firebasePayload.emailVerified = isEmailVerified;
    if (isEmpty(firebasePayload)) return;
    return await this.defaultApp?.auth().updateUser(uid, firebasePayload);
  }

  async updatePassword(uid: string, password: string) {
    const firebaseUser = await this.getUser(uid);
    if (!firebaseUser) throw new NotFoundException('Firebase user not found!');
    return await this.defaultApp?.auth().updateUser(uid, { password });
  }

  async generateEmailVerificationLink(email: string): Promise<string> {
    return (await this.defaultApp?.auth().generateEmailVerificationLink(email)) as string;
  }

  async generatePasswordResetLink(email: string): Promise<string> {
    return (await this.defaultApp?.auth().generatePasswordResetLink(email)) as string;
  }

  async createUser(firebaseUser: CreateFirebaseUserDto) {
    return await this.defaultApp?.auth().createUser(firebaseUser);
  }

  async upsertUser(firebaseUser: CreateFirebaseUserDto) {
    try {
      return await this.createUser(firebaseUser);
    } catch {
      return await this.getUserByEmail(firebaseUser.email);
    }
  }

  async deleteFirebaseUser(uid: string) {
    return await this.defaultApp?.auth().deleteUser(uid);
  }

  async deleteFirebaseUserByEmail(email: string) {
    const firebaseUser = await this.getUserByEmail(email);
    if (!firebaseUser) throw new NotFoundException('Firebase user not found!');
    return await this.deleteFirebaseUser(firebaseUser?.uid);
  }

  async validateToken(token: string): Promise<DecodedIdToken | void> {
    const firebaseUser = await this.defaultApp
      ?.auth()
      .verifyIdToken(token, true)
      .catch((err) => {
        console.error(err);
      });
    return firebaseUser;
  }
}
