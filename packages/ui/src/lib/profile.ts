/** Shape of the profile fields the apps' user models expose; kept structural so both MST models fit. */
export interface IProfileSource {
  firstName?: string;
  lastName?: string;
  name?: string;
  phoneNumber?: string | null;
  countryCode?: string | null;
  gender?: string;
  dob?: string | null;
  photoUrl?: string | null;
  designation?: string;
  standards?: readonly string[];
}

/**
 * Builds the body for `POST user/<subdomain>/profile`. The server runs its validation pipe with
 * `forbidNonWhitelisted`, so this must stay a whitelist of `UpdateProfileDto` fields: any extra key
 * makes the whole request fail. Keep it in sync with that DTO in `@repo/shared`.
 */
export const getProfilePayload = (user: IProfileSource) => ({
  firstName: user.firstName,
  lastName: user.lastName,
  name: user.name,
  phoneNumber: user.phoneNumber || undefined,
  countryCode: user.countryCode || undefined,
  gender: user.gender,
  // A birth date has no timezone: slice the server's ISO date part instead of reformatting locally,
  // which would shift the day for viewers behind UTC.
  dob: user.dob ? user.dob.slice(0, 10) : undefined,
  avatar: user.photoUrl || undefined,
  designation: user.designation || undefined,
  standards: user.standards ? [...user.standards] : undefined,
});
