import { flow, getRoot, Instance, SnapshotIn, SnapshotOut, types as t } from 'mobx-state-tree';
import { AccountType, Gender, Permission } from '../../enums';
import { FollowerService } from '../../services';
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
      countryCode: t.maybeNull(t.string),
      phoneNumber: t.maybeNull(t.string),
      lastActive: t.maybeNull(t.string),
      dob: t.maybeNull(t.string),
      isNew: t.optional(t.boolean, false),
      standards: t.optional(t.array(t.string), []),
      photoUrl: t.maybeNull(t.string),
      followersCount: t.optional(t.number, 0),
      isLoadingFollowersCount: t.optional(t.boolean, false),
      isLoadedFollowersCount: t.optional(t.boolean, false),
      isLoadedCompletedModules: t.optional(t.boolean, false),
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

    setFollowersCount: (followersCount: number) => {
      self.followersCount = followersCount;
    },

    setIsLoadingFollowersCount: (isLoadingFollowersCount: boolean) => {
      self.isLoadingFollowersCount = isLoadingFollowersCount;
    },

    setIsLoadedFollowersCount: (isLoadedFollowersCount: boolean) => {
      self.isLoadedFollowersCount = isLoadedFollowersCount;
    },

    setIsLoadedCompletedModules(isLoaded: boolean) {
      self.isLoadedCompletedModules = isLoaded;
    },
  }))
  .actions((self) => ({
    loadFollowersCount: flow(function* () {
      if (!self._id) return;
      self.isLoadingFollowersCount = true;
      const result = yield FollowerService.getFollowersCount(self._id);
      console.log('followers count: ', result);
      self.setFollowersCount(result.data);
      self.isLoadingFollowersCount = false;
      self.isLoadedFollowersCount = true;
    }),
  }));

export interface IUser extends Instance<typeof User> {}
export interface IUserSnapshotIn extends SnapshotIn<typeof User> {}
export interface IUserSnapshotOut extends SnapshotOut<typeof User> {}
