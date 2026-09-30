import { type FirebaseError, initializeApp } from '@firebase/app';
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  type MultiFactorError,
  OAuthProvider,
  SAMLAuthProvider,
  TotpMultiFactorGenerator,
  type TotpSecret,
  applyActionCode,
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  getAuth,
  getMultiFactorResolver,
  multiFactor,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithCustomToken,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
  updateProfile,
  verifyPasswordResetCode,
} from '@firebase/auth';

import { type ICreateFirebaseUser } from '../../interfaces';
import { Subdomain } from '../../enums';
import { setToken } from '../helpers';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
// typeof window !== 'undefined' &&
//   initializeRecaptchaConfig(auth)
//     .then(() => {
//       console.log('Recaptcha Enterprise Config Initialization successful.');
//     })
//     .catch((error) => {
//       console.error('Recaptcha Enterprise Config Initialization failed with ' + error);
//     });

export const signIn = async (email: string, password: string) => {
  return await signInWithEmailAndPassword(auth, email, password).then(async (result) => {
    await generateAndSetNewToken();
    return result;
  });
};

export const signInWithToken = async (token: string) => {
  return await signInWithCustomToken(auth, token).then(async (result) => {
    await generateAndSetNewToken();
    return result;
  });
};

export const logOut = async () => {
  return await signOut(auth);
};

export const getFirebaseUser = () => {
  const loggedInUser = auth?.currentUser;
  return loggedInUser;
};

export const getIsEmailVerified = () => {
  return getFirebaseUser()?.emailVerified || false;
};

// export const sendVerificationEmail = async () => {
//   const loggedInUser = getFirebaseUser();
//   return loggedInUser && sendEmailVerification(loggedInUser);
// };

export const sendForgotPasswordEmail = async (email: string) => {
  return sendPasswordResetEmail(auth, email);
};

export const generateAndSetNewToken = async (): Promise<string> => {
  const user = getFirebaseUser();
  if (!user) return '';
  return user.getIdToken().then(async (idToken) => {
    setToken(Subdomain.SUPPORT, idToken);
    return idToken;
  });
};

export const loadFirebaseUser = async () => {
  try {
    await new Promise((resolve, reject) => {
      return onAuthStateChanged(auth, (user) => {
        if (!user) return reject('No user signed in.');
        return resolve(user);
      });
    });
    await generateAndSetNewToken();
  } catch (err) {
    // Expected on every public page: there is simply nobody signed in yet. Warn rather than error
    // so it does not register as a failure in the dev overlay's error count.
    console.warn('Firebase token refresh skipped:', String(err));
  }
};

export const verifyEmail = async (code: string) => {
  return await applyActionCode(auth, code);
};

export const verifyAndSetNewPassword = (code: string, newPassword: string) => {
  return verifyPasswordResetCode(auth, code).then(() => confirmPasswordReset(auth, code, newPassword));
};

export const updateDisplayName = (name: string) => {
  const user = getFirebaseUser();
  if (!user) return;
  return updateProfile(user, { displayName: name });
};

export const createFirebaseUser = async (data: ICreateFirebaseUser) => {
  const { email, password } = data;
  const result = await createUserWithEmailAndPassword(auth, email, password);
  return result;
};

export const updateUserPassword = async (oldPassword: string, newPassword: string) => {
  let firebaseUser = getFirebaseUser();
  if (!firebaseUser) return Promise.reject('Firebase user not found!');
  const { email } = firebaseUser;
  if (!email) return Promise.reject('Email not found!');
  await signIn(email, oldPassword);
  firebaseUser = getFirebaseUser();
  if (!firebaseUser) return Promise.reject('Firebase user not found!');
  await updatePassword(firebaseUser, newPassword);
  await signIn(email, newPassword);
};

/**
 * `auth/invalid-credential` is what Firebase returns for a wrong password OR an unknown email once
 * email enumeration protection is on, which is the default for new projects. The two cases are
 * deliberately indistinguishable, so the message must not say which it was — and
 * `auth/user-not-found` and `auth/wrong-password` stop arriving at all, which is why the sign-in
 * screens no longer pre-check whether an address exists.
 */
const ERROR_MESSAGE_BY_CODE: Record<string, string> = {
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/user-not-found': 'Incorrect email or password.',
  'auth/wrong-password': 'Incorrect email or password.',
  'auth/invalid-password': 'Invalid Password!',
  'auth/email-already-in-use': 'That email already has an account. Please sign in.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/network-request-failed': 'Network error. Please check your connection.',
};

export const getFirebaseErrorMessage = (e: FirebaseError) => {
  // Logged as plain values and at warn level, never as the Error instance. Next's dev overlay
  // intercepts console.error and, when handed an Error, renders it as a full-page
  // "Runtime FirebaseError" dialog built from that error's own stack — which points at `signIn`,
  // where the error was constructed, and so reads exactly like an uncaught crash. It is not one:
  // every caller reaches this function from its own catch block, and the return value is the
  // message they toast. The code is the part worth grepping for anyway.
  console.warn(`Firebase auth error: ${e?.code ?? 'unknown'} — ${e?.message ?? ''}`);
  const known = e?.code ? ERROR_MESSAGE_BY_CODE[e.code] : undefined;
  return known ?? e?.message ?? 'Something went wrong. Please try again.';
};

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  const data = await signInWithPopup(auth, provider).then(async (result) => {
    await generateAndSetNewToken();
    return result;
  });
  return data;
};

export const signInSAML = async (providerId: string) => {
  const provider = new SAMLAuthProvider(providerId);
  const data = await signInWithPopup(auth, provider).then(async (result) => {
    await generateAndSetNewToken();
    return result;
  });
  return data;
};

export const signInWithMicrosoft = async () => {
  const provider = new OAuthProvider('microsoft.com');
  const data = await signInWithPopup(auth, provider).then(async (result) => {
    await generateAndSetNewToken();
    return result;
  });
  return data;
};

export const fetchSignInMethods = async (email: string) => {
  return await fetchSignInMethodsForEmail(auth, email);
};

export const generateTotpSecret = async (): Promise<TotpSecret> => {
  const currentUser = getFirebaseUser();
  if (!currentUser) throw new Error('Cannot generate a TOTP secret without a signed-in user.');
  const multiFactorSession = await multiFactor(currentUser).getSession();
  return await TotpMultiFactorGenerator.generateSecret(multiFactorSession);
};

export const getQrCodeUrl = (totpSecret: TotpSecret): string | null => {
  const currentUser = getFirebaseUser();
  if (!currentUser?.email) return null;
  return totpSecret.generateQrCodeUrl(currentUser.email, 'Ablespace');
};

export const getDisplayKey = (totpSecret: TotpSecret): string => {
  return totpSecret.secretKey;
};

export const verifyMfaCode = async (totpSecret: TotpSecret, otpFromAuthenticator: string) => {
  const currentUser = getFirebaseUser();
  if (!currentUser) throw new Error('Cannot enrol MFA without a signed-in user.');
  const multiFactorAssertion = TotpMultiFactorGenerator.assertionForEnrollment(totpSecret, otpFromAuthenticator);
  await multiFactor(currentUser).enroll(multiFactorAssertion, 'Ablespace');
};

export const verifyTotp = async (error: MultiFactorError, otpFromAuthenticator: string) => {
  const mfaResolver = getMultiFactorResolver(getAuth(), error);
  const totpFactor = mfaResolver.hints.find((info) => info.factorId === 'totp');
  if (!totpFactor) throw new Error('TOTP not found!');
  const multiFactorAssertion = TotpMultiFactorGenerator.assertionForSignIn(totpFactor.uid, otpFromAuthenticator);
  return mfaResolver.resolveSignIn(multiFactorAssertion).then(async (result) => {
    await generateAndSetNewToken();
    return result;
  });
};

export const unenrollFromTotp = async (totpUid: string) => {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;
  await multiFactor(currentUser).unenroll(totpUid);
};

export const reAuthenticate = async (password: string) => {
  const user = auth.currentUser;
  if (!user?.email) return;
  const credential = EmailAuthProvider.credential(user.email, password);
  await reauthenticateWithCredential(user, credential);
};

export const fetchMultiFactors = async () => {
  const currentUser = getFirebaseUser();
  if (!currentUser) return [];
  const enrolledFactors = multiFactor(currentUser).enrolledFactors;
  return enrolledFactors;
};
