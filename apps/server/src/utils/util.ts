import { type FirebaseUserDto } from '@modules/firebase/firebase.dto';
import { type Subdomain } from '@repo/shared/enums';
import { DEFAULT_PERMISSION_BY_APP } from '@repo/shared/utils';
import { type RegisterUserDto } from '@repo/shared/validations';
import ObjectID from 'bson-objectid';

export const getObjectId = () => {
  return ObjectID().toHexString();
};

export const getRegisterPayload = (subdomain: Subdomain, firebaseUser: FirebaseUserDto): RegisterUserDto => {
  return {
    ...firebaseUser,
    _id: getObjectId(),
    org: getObjectId(),
    permission: DEFAULT_PERMISSION_BY_APP[subdomain],
  };
};
