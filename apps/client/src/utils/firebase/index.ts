import { FirebaseError, initializeApp } from '@firebase/app';
import {
  GoogleAuthProvider,
  OAuthProvider,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from '@firebase/auth';
import { setToken } from '../helpers';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export const signIn = async (email: string, password: string) => {
  return await signInWithEmailAndPassword(auth, email, password).then(async (result) => {
    await generateAndSetNewToken();
    return result;
  });
};

export const logOut = async () => {
  return await signOut(auth);
};

export const getFirebaseUser = () => {
  return auth?.currentUser;
};

export const generateAndSetNewToken = async (): Promise<string> => {
  const user = getFirebaseUser();
  if (!user) return '';
  return user.getIdToken().then(async (idToken) => {
    setToken(idToken);
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
    console.log(err);
  }
};

export const createFirebaseUser = async (email: string, password: string) => {
  return await createUserWithEmailAndPassword(auth, email, password).then(async (result) => {
    await generateAndSetNewToken();
    return result;
  });
};

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  return await signInWithPopup(auth, provider).then(async (result) => {
    await generateAndSetNewToken();
    return result;
  });
};

export const signInWithMicrosoft = async () => {
  const provider = new OAuthProvider('microsoft.com');
  return await signInWithPopup(auth, provider).then(async (result) => {
    await generateAndSetNewToken();
    return result;
  });
};

export const getFirebaseErrorMessage = (e: FirebaseError) => {
  if (e?.code === 'auth/user-not-found') return 'User not found!';
  if (e?.code === 'auth/wrong-password') return 'Wrong Password!';
  if (e?.code === 'auth/email-already-in-use') return 'Email already in use.';
  return e?.message || 'Something went wrong. Please try again.';
};
