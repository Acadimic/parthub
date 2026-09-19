import { type StandardDto } from '@repo/shared/contracts';
import { LogoTile } from '@components/app/attachments';
import { UpsertStandardModal } from '@modules/standards/components';
import { RectangleSkeleton } from '@repo/ui/app';
import { useRequest } from '@repo/ui/hooks';
import { useSelectorStore, useStandardStore } from '@stores';
import { pluralize, titleCase } from '@utils/helpers';
import Link from 'next/link';
import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { CatalogueHero, CatalogueSummary, SectionHeader, StandardCard } from './components';

/** How many subject chips the home page shows before "View all" is the better route. */
const SUBJECT_LIMIT = 24;

const HomeSkeleton = () => (
  <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading the catalogue">
    <RectangleSkeleton height={150} width="100%" />
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {Array.from({ length: 6 }, (_, index) => (
        <RectangleSkeleton key={index} height={64} width="100%" />
      ))}
    </div>
    <RectangleSkeleton height={220} width="100%" />
  </div>
);

export const Home = () => {
  // `_app` loads all three collections once after sign-in; this screen only reads them.
  const { isLoading } = useRequest(useStandardStore, 'initialData');
  const standards = useStandardStore(useShallow((state) => state.getStandards()));
  const subjects = useStandardStore(useShallow((state) => state.getSubjects()));
  const standardsByGroup = useStandardStore(useShallow((state) => state.getStandardsByGroup()));
  const subjectNamesByStandard = useStandardStore(useShallow((state) => state.getSubjectNamesByStandard()));
  const standardIdsBySubject = useStandardStore(useShallow((state) => state.getStandardIdsBySubject()));
  const mappingCount = useStandardStore((state) => Object.keys(state.mappingMap).length);
  const setSelectedStandardId = useSelectorStore((state) => state.setSelectedStandardId);
  const [isOpenStandardModal, setIsOpenStandardModal] = useState(false);

  if (isLoading) return <HomeSkeleton />;

  const savedStandards = standards.filter((standard) => !standard.isNew);
  const savedSubjects = subjects.filter((subject) => !subject.isNew);
  const missingLogoCount =
    savedStandards.filter((standard) => !standard.logo).length +
    savedSubjects.filter((subject) => !subject.logo).length;
  const unmappedSubjects = savedSubjects.filter((subject) => !(standardIdsBySubject[subject._id] ?? []).length);
  const sortedSubjects = [...savedSubjects].sort((a, b) => a.name.localeCompare(b.name));

  const openStandard = (standard: StandardDto) => {
    setSelectedStandardId(standard._id);
    setIsOpenStandardModal(true);
  };

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 pb-16">
      <CatalogueHero />

      <CatalogueSummary
        standardCount={savedStandards.length}
        groupCount={standardsByGroup.length}
        subjectCount={savedSubjects.length}
        mappingCount={mappingCount}
        missingLogoCount={missingLogoCount}
        unmappedSubjectCount={unmappedSubjects.length}
      />

      {standardsByGroup.map(({ group, standards: groupStandards }) => (
        <section key={group}>
          <SectionHeader title={titleCase(group)} count={groupStandards.length} href="/standards" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {groupStandards.map((standard) => (
              <StandardCard
                key={standard._id}
                standard={standard}
                subjectNames={subjectNamesByStandard[standard._id] ?? []}
                onOpen={openStandard}
              />
            ))}
          </div>
        </section>
      ))}

      <section>
        <SectionHeader
          title="Subjects"
          count={savedSubjects.length}
          href="/subjects"
          hint={
            unmappedSubjects.length
              ? `${pluralize(unmappedSubjects.length, 'subject is', 'subjects are')} in no standard yet.`
              : 'Every subject is mapped to at least one standard.'
          }
        />
        <div className="flex flex-wrap gap-2">
          {sortedSubjects.slice(0, SUBJECT_LIMIT).map((subject) => (
            <Link
              key={subject._id}
              href="/subjects"
              className="flex items-center gap-2 rounded-full border border-border bg-background py-1 pl-1 pr-3 text-sm text-foreground transition-colors hover:border-primary/50 hover:bg-accent"
            >
              <LogoTile url={subject.logo} name={subject.name} size="sm" className="rounded-full" />
              <span className="truncate">{subject.name}</span>
              <span className="font-mono text-xxs text-muted-foreground">
                {(standardIdsBySubject[subject._id] ?? []).length}
              </span>
            </Link>
          ))}
          {sortedSubjects.length > SUBJECT_LIMIT ? (
            <Link
              href="/subjects"
              className="flex items-center rounded-full border border-dashed border-border px-3 py-1 text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              +{sortedSubjects.length - SUBJECT_LIMIT} more
            </Link>
          ) : null}
        </div>
      </section>

      <UpsertStandardModal isOpen={isOpenStandardModal} onClose={() => setIsOpenStandardModal(false)} />
    </div>
  );
};
