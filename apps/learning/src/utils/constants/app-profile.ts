import { Subdomain } from '@enums';
import { COMPANY } from './company';

/** This app, for `isProfileForApp`, and where a profile that does not fit it opens instead. */
export const THIS_APP = Subdomain.LEARN;
export const OTHER_APP = { name: 'Teaching', url: COMPANY.teachUrl };
