import { type StandardDto, type SubjectDto } from '@repo/shared/contracts';
import { useAttachment } from '@hooks/attachment.hook';
import { type ICourse, useCourseLookups, useStandardLookups } from '@stores';
import { STANDARD_GROUP_ORDER } from '@utils/constants';
import { useEffect, useState } from 'react';

const UNGROUPED = 'other';
/** How many matching courses a panel lists before pointing at the full results page. */
const MAX_COURSE_MATCHES = 6;

/** Marks the search box that drives the Explore popover, so a click into it keeps the panel open. */
export const EXPLORE_SEARCH_ATTRIBUTE = 'data-explore-search';

export interface IExploreCounts {
  standards: Record<string, number>;
  subjects: Record<string, number>;
}

export interface IExploreData {
  /** The query with its edges trimmed; empty when the learner is browsing rather than searching. */
  query: string;
  standards: StandardDto[];
  subjects: SubjectDto[];
  /** Matching courses, only while searching. */
  courses: ICourse[];
  counts: IExploreCounts;
  isEmpty: boolean;
}

const matches = (text: string | undefined | null, needle: string) =>
  !needle || (text ?? '').toLowerCase().includes(needle);

/** Standards in their catalogue order, grouped the way the support app groups them. */
export const groupStandards = (standards: StandardDto[]) => {
  const groups = standards.reduce<Record<string, StandardDto[]>>((result, standard) => {
    const key = standard.group ?? UNGROUPED;
    result[key] = [...(result[key] ?? []), standard];
    return result;
  }, {});
  return Object.entries(groups).sort(
    ([a], [b]) =>
      (STANDARD_GROUP_ORDER[a] ?? Number.MAX_SAFE_INTEGER) - (STANDARD_GROUP_ORDER[b] ?? Number.MAX_SAFE_INTEGER),
  );
};

/**
 * What the Explore surfaces show for a query: the catalogue narrowed by name, matching courses,
 * and how many published courses sit under each row. Counts come from whatever courses are already
 * in the store, so they appear once the catalogue has loaded and are simply absent before.
 */
export const useExploreData = (rawQuery: string): IExploreData => {
  const { getStandards, getSubjects } = useStandardLookups();
  const { getCourses } = useCourseLookups();
  const query = rawQuery.trim();
  const needle = query.toLowerCase();
  const standards = getStandards().filter((standard) => matches(standard.name, needle));
  const subjects = getSubjects()
    .filter((subject) => matches(subject.name, needle))
    .sort((a, b) => a.name.localeCompare(b.name));
  const courses = needle
    ? getCourses()
        .filter((course) => matches(course.name, needle) || matches(course.description, needle))
        .slice(0, MAX_COURSE_MATCHES)
    : [];
  const counts = getCourses().reduce<IExploreCounts>(
    (result, course) => {
      (course.standards ?? []).forEach((id) => (result.standards[id] = (result.standards[id] ?? 0) + 1));
      (course.subjects ?? []).forEach((id) => (result.subjects[id] = (result.subjects[id] ?? 0) + 1));
      return result;
    },
    { standards: {}, subjects: {} },
  );
  return {
    query,
    standards,
    subjects,
    courses,
    counts,
    isEmpty: !standards.length && !subjects.length && !courses.length,
  };
};

/**
 * Signs every logo in one request before any tile asks for its own. The tiles read the signed
 * address back out of the cache, so a panel makes one call instead of one per logo; until it
 * returns they show initials. Mounts with the panel, so this runs on each open and is a cache hit
 * after the first.
 */
export const useWarmLogos = (rows: { logo?: string | null }[]) => {
  const { getPresignedUrls } = useAttachment();
  const [isWarm, setIsWarm] = useState(false);
  useEffect(() => {
    let isCurrent = true;
    const urls = rows.map((row) => row.logo).filter((logo): logo is string => !!logo);
    getPresignedUrls(urls).finally(() => isCurrent && setIsWarm(true));
    return () => {
      isCurrent = false;
    };
  }, []);
  return isWarm;
};
