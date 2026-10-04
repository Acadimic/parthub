import {
  PrintClosing,
  type IPrintPaper,
  PrintOptionPicker,
  PrintSheet,
  PrintShell,
  PrintTestPaper,
} from '@repo/ui/print';
import { BlankState } from '@components/others';
import { useTestPaperStore } from '@stores';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import {
  buildEyebrow,
  closePrintTab,
  readPrintPaper,
  toPrintVersion,
  VERSION_LABELS,
  VERSION_OPTIONS,
} from './print-data';

interface IProps {
  testPaperId: string;
}

/** A paper as a printout, in whichever version `?version=` names. */
export const TestPaperPrint = ({ testPaperId }: IProps) => {
  const { query, replace, push } = useRouter();
  const version = toPrintVersion(query.version);
  // A snapshot taken once everything has loaded: a printout should not change under the dialog.
  const [snapshot, setSnapshot] = useState<{ paper: IPrintPaper; tags: [string[], string[]] } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!testPaperId) return;
    const load = async () => {
      const store = useTestPaperStore.getState();
      // `reloadTestPaper` sits outside the request slice, so a failed read arrives as a rejection;
      // the missing row below then reports it.
      await Promise.all([
        store.reloadTestPaper(testPaperId).catch(() => undefined),
        store.loadTestPaperSectionsWithQuestions(testPaperId),
      ]);
      const loaded = readPrintPaper(testPaperId);
      const row = useTestPaperStore.getState().getTestPaperById(testPaperId);
      const failure = useTestPaperStore.getState().getError('testPaperSections');
      if (failure || !loaded || !row) setError(failure ?? 'This paper does not exist, or was deleted.');
      else setSnapshot({ paper: loaded, tags: [row.standards ?? [], row.subjects ?? []] });
    };
    load();
  }, [testPaperId]);

  if (error) return <BlankState label="Could not load this paper" description={error} className="py-24" />;

  const name = snapshot?.paper.paper.name ?? 'Test paper';
  return (
    <PrintShell
      documentTitle={`${name} - ${VERSION_LABELS[version]}`}
      footer={name}
      isLoaded={!!snapshot}
      onClose={() => closePrintTab(() => push(`/test-papers/${testPaperId}`))}
      controls={
        <PrintOptionPicker
          options={VERSION_OPTIONS}
          value={version}
          onChange={(next) => replace({ query: { ...query, version: next } }, undefined, { shallow: true })}
        />
      }
    >
      {snapshot ? (
        <PrintSheet isNewPage={false}>
          <PrintTestPaper
            paper={snapshot.paper}
            version={version}
            solutions="shown"
            eyebrow={buildEyebrow(version === 'key' ? 'Answer key' : 'Test paper', ...snapshot.tags)}
            placement="standalone"
            sitting={null}
          />
          <PrintClosing />
        </PrintSheet>
      ) : null}
    </PrintShell>
  );
};
