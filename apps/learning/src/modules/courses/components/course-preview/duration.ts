import { getPlural } from '@utils/helpers';

/** "About 61 hours", or minutes under an hour; a decimal hour, or 3648 min, reads as false precision. */
export const formatCourseDuration = (totalMins: number) => {
  const mins = Math.round(totalMins);
  if (mins < 60) return `${mins} ${getPlural(mins, 'minute')}`;
  const hours = Math.round(mins / 60);
  return `About ${hours} ${getPlural(hours, 'hour')}`;
};
