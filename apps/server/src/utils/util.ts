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
    _id: getObjectId(),
    org: getObjectId(),
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    name: firebaseUser.name,
    // A Google or Microsoft sign-up arrives with a photo; it is stored as the avatar from day one.
    avatar: firebaseUser.picture,
    permission: DEFAULT_PERMISSION_BY_APP[subdomain],
  };
};
