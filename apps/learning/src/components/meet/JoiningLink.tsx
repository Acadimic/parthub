import { Link, Tooltip } from '@components/app';
import { ArrowSquareOut, LinkSimple } from '@phosphor-icons/react';

interface IProps {
  url: string;
  isSmall?: boolean;
}

export const JoiningLink = ({ url, isSmall = false }: IProps) => {
  return (
    <>
      {isSmall ? (
        <Tooltip title="Join Session">
          <Link isSubtle href={url} target="_blank" className="px-1">
            <ArrowSquareOut weight="regular" className="w-5 h-5" />
          </Link>
        </Tooltip>
      ) : (
        <Link leftsection={<LinkSimple weight="bold" className="w-5 h-5" />} href={url} target="_blank">
          Join Session
        </Link>
      )}
    </>
  );
};
