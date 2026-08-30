import { getAlphabet } from '@utils/helpers';
import { ReactNode } from 'react';

export const Option = ({ index, children }: { index: number; children: ReactNode }) => {
  return (
    <div className="flex justify-start items-center space-x-2">
      <div className={`font-semibold w-4 text-sm md:text-base`}>{getAlphabet(index)}.</div>
      <div className="">{children}</div>
    </div>
  );
};
