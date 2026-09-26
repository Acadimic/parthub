import { Injectable, NotFoundException } from '@nestjs/common';
import { Secrets } from '@secrets/secrets';
import { SecretsService } from '@secrets/secrets.service';
import { type App, cert, initializeApp } from 'firebase-admin/app';
import { type Auth, type DecodedIdToken, getAuth, type UserRecord } from 'firebase-admin/auth';
import { isEmpty, isNil } from 'lodash';
import { CreateFirebaseUserDto, FirebaseUserUpdatePayloadDto, UpdateFirebaseUserDto } from './firebase.dto';

/** How long a verified token is trusted before Google is asked again, revocation included. */
const TOKEN_CACHE_MS = 5 * 60 * 1000;
/** The cache is swept of expired entries once it holds this many tokens. */
const TOKEN_CACHE_PRUNE_AT = 1000;

@Injectable()
export class FirebaseService {
  private defaultApp: App | undefined;
  private readonly verifiedTokens = new Map<string, { decoded: DecodedIdToken; until: number }>();

  constructor(private secretsService: SecretsService) {
    const base64 = secretsService.get(Secrets.FIREBASE_AUTH_BASE_64) as string;
    const firebaseParams = base64 && (JSON.parse(Buffer.from(base64, 'base64').toString()) as string);
    this.defaultApp = firebaseParams ? initializeApp({ credential: cert(firebaseParams) }) : undefined;
  }

  /**
   * The Auth service, or undefined when no credentials were configured.
   *
   * firebase-admin 14 removed the legacy namespace, so `app.auth()` is gone and the modular
   * `getAuth(app)` is the entry point. Kept optional so a server without FIREBASE_AUTH_BASE_64
   * still boots — every caller already handles the undefined case.
   */
  private auth(): Auth | undefined {
    return this.defaultApp ? getAuth(this.defaultApp) : undefined;
  }

  async getUser(uid: string) {
    return await this.auth()?.getUser(uid);
  }

  async getUserByEmail(email: string): Promise<UserRecord | undefined> {
    return await this.auth()?.getUserByEmail(email);
  }

  async createCustomToken(uid: string): Promise<string | undefined> {
    return await this.auth()?.createCustomToken(uid);
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
    return await this.auth()?.updateUser(uid, firebasePayload);
  }

  async updatePassword(uid: string, password: string) {
    const firebaseUser = await this.getUser(uid);
    if (!firebaseUser) throw new NotFoundException('Firebase user not found!');
    return await this.auth()?.updateUser(uid, { password });
  }

  async generateEmailVerificationLink(email: string): Promise<string> {
    return (await this.auth()?.generateEmailVerificationLink(email)) as string;
  }

  async generatePasswordResetLink(email: string): Promise<string> {
    return (await this.auth()?.generatePasswordResetLink(email)) as string;
  }

  async createUser(firebaseUser: CreateFirebaseUserDto) {
    return await this.auth()?.createUser(firebaseUser);
  }

  async upsertUser(firebaseUser: CreateFirebaseUserDto) {
    try {
      return await this.createUser(firebaseUser);
    } catch {
      return await this.getUserByEmail(firebaseUser.email);
    }
  }

  async deleteFirebaseUser(uid: string) {
    return await this.auth()?.deleteUser(uid);
  }

  async deleteFirebaseUserByEmail(email: string) {
    const firebaseUser = await this.getUserByEmail(email);
    if (!firebaseUser) throw new NotFoundException('Firebase user not found!');
    return await this.deleteFirebaseUser(firebaseUser?.uid);
  }

  /**
   * Verifies a token, remembering the answer for a short while.
   *
   * `verifyIdToken(token, true)` checks revocation, which is a call to Google on every request —
   * measured at roughly half a second — on top of the signature check. A learner's session sends
   * the same token dozens of times a minute, so the decoded result is kept for `TOKEN_CACHE_MS` or
   * until the token expires, whichever is sooner. Revocation is therefore honoured within that
   * window rather than instantly; a failed verification is never cached.
   */
  async validateToken(token: string): Promise<DecodedIdToken | void> {
    const cached = this.verifiedTokens.get(token);
    if (cached && cached.until > Date.now()) return cached.decoded;
    this.verifiedTokens.delete(token);
    const decoded = await this.auth()
      ?.verifyIdToken(token, true)
      .catch((error: unknown) => {
        console.error(error);
      });
    if (decoded) {
      const until = Math.min(Date.now() + TOKEN_CACHE_MS, decoded.exp * 1000);
      this.verifiedTokens.set(token, { decoded, until });
      this.pruneVerifiedTokens();
    }
    return decoded;
  }

  /** Drops expired entries once the cache grows, so it cannot fill with tokens from old sessions. */
  private pruneVerifiedTokens() {
    if (this.verifiedTokens.size < TOKEN_CACHE_PRUNE_AT) return;
    const now = Date.now();
    for (const [token, entry] of this.verifiedTokens) {
      if (entry.until <= now) this.verifiedTokens.delete(token);
    }
  }
}
