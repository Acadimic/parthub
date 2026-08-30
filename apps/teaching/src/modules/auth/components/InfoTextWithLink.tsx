import { Link } from '@components/app';

interface IProps {
  infoText: string;
  linkText: string;
  href: string;
}

export const InfoTextWithLink = ({ infoText, linkText, href }: IProps) => {
  return (
    <div className="text-sm text-center text-color-secondary my-4 md:my-4">
      {infoText}&nbsp;
      <Link
        isSubtle
        href={href}
        className="text-blue-primary font-medium cursor-pointer hover:underline hover:decoration-blue-primary"
      >
        {linkText}
      </Link>
    </div>
  );
};
