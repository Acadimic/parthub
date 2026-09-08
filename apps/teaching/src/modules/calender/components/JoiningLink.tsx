import { Link, Tooltip } from '@parthhub/ui/app';
import { ArrowSquareOutIcon, LinkSimpleIcon } from '@phosphor-icons/react';

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
            <ArrowSquareOutIcon weight="regular" className="w-5 h-5" />
          </Link>
        </Tooltip>
      ) : (
        <Link leftsection={<LinkSimpleIcon weight="bold" className="w-5 h-5" />} href={url} target="_blank">
          Join Session
        </Link>
      )}
    </>
  );
};
