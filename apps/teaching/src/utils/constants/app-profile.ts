import { Subdomain } from '@enums';

/** This app, for `isProfileForApp`, and where a profile that does not fit it opens instead. */
export const THIS_APP = Subdomain.TEACH;
export const OTHER_APP = { name: 'Learning', url: process.env.NEXT_PUBLIC_LEARN_URL };

/** The learning app, where an order link or a course's public address opens. */
export const LEARN_URL = process.env.NEXT_PUBLIC_LEARN_URL;
