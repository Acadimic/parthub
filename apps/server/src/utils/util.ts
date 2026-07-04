import { FirebaseUserDto } from '@modules/firebase/firebase.dto';
import { RegisterUserDto } from '@parthhub/shared/dist/dtos/validations';
import ObjectID from 'bson-objectid';

export const getObjectId = () => {
  return ObjectID().toHexString();
};

export const getRegisterPayload = (firebaseUser: FirebaseUserDto): RegisterUserDto => {
  return {
    ...firebaseUser,
    _id: getObjectId(),
    orgId: getObjectId(),
  };
};
