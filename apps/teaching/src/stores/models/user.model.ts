import { getRoot, Instance, SnapshotIn, SnapshotOut, types as t } from 'mobx-state-tree';
import { AccountType, Gender, Permission } from '../../enums';
import { IStore } from '../root.store';
import { BaseOrgModel, BaseTimestampModel } from './base-models';

export const User = t
  .compose(
    BaseTimestampModel,
    BaseOrgModel,
    t.model('User', {
      _id: t.identifier,
      uid: t.string,
      name: t.string,
      firstName: t.optional(t.string, ''),
      lastName: t.optional(t.string, ''),
      email: t.string,
      role: t.string,
      isUpdated: t.boolean,
      permission: t.enumeration('Permission', Object.values(Permission)),
      accountType: t.enumeration('AccountType', Object.values(AccountType)),
      gender: t.optional(t.enumeration('Gender', Object.values(Gender)), Gender.OTHER),
      phoneNumber: t.maybeNull(t.string),
      countryCode: t.maybeNull(t.string),
      lastActive: t.maybeNull(t.string),
      dob: t.maybeNull(t.string),
      isNew: t.optional(t.boolean, false),
      standards: t.optional(t.array(t.string), []),
      photoUrl: t.maybeNull(t.string),
    }),
  )
  .views((self) => ({
    get rootStore() {
      return getRoot<IStore>(self);
    },

    get isStudent() {
      return self.permission === Permission.STUDENT;
    },
  }))
  .actions((self) => ({
    setFirstName: (firstName: string) => {
      self.firstName = firstName;
      self.name = `${self.firstName.trim()} ${self.lastName.trim()}`;
    },

    setLastName: (lastName: string) => {
      self.lastName = lastName;
      self.name = `${self.firstName.trim()} ${self.lastName.trim()}`;
    },

    setEmail: (email: string) => {
      self.email = email.toLowerCase();
    },

    setRole: (role: string) => {
      self.role = role;
    },

    setGender: (gender: Gender) => {
      self.gender = gender;
    },

    setStandards: (standardIds: string[]) => {
      self.standards.replace(standardIds);
    },

    setDob: (dob: string) => {
      self.dob = dob.trim();
    },

    setPhotoUrl: (photoUrl: string) => {
      self.photoUrl = photoUrl;
    },

    setCountryCode: (countryCode: string) => {
      self.countryCode = countryCode;
    },

    setPhoneNumber: (phoneNumber: string) => {
      self.phoneNumber = phoneNumber;
    },

    resetIsNew: () => {
      self.isNew = false;
    },
  }));

export interface IUser extends Instance<typeof User> {}
export interface IUserSnapshotIn extends SnapshotIn<typeof User> {}
export interface IUserSnapshotOut extends SnapshotOut<typeof User> {}
