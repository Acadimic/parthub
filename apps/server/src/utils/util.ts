import { Subdomain } from '@repo/shared/enums';
import { type FirebaseUserDto } from '@modules/firebase/firebase.dto';
import { type RegisterUserDto } from '@repo/shared/validations';
import ObjectID from 'bson-objectid';

export const getObjectId = () => {
  return ObjectID().toHexString();
};

export const getRegisterPayload = (firebaseUser: FirebaseUserDto): RegisterUserDto => {
  return {
    ...firebaseUser,
    _id: getObjectId(),
    org: getObjectId(),
  };
};

const SUBDOMAINS = new Set<string>(Object.values(Subdomain));

/** Extracts the app subdomain segment (learn | teach | admin) from a request path such as `/user/teach/profile`. */
export const getSubdomainFromUrl = (url: string): Subdomain | undefined => {
  const path = url.split('?')[0];
  return path.split('/').find((segment) => SUBDOMAINS.has(segment)) as Subdomain | undefined;
};
