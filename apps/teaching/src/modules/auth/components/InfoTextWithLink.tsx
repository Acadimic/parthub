import { Link } from '@repo/ui/app';

interface IProps {
  infoText: string;
  linkText: string;
  href: string;
}

export const InfoTextWithLink = ({ infoText, linkText, href }: IProps) => {
  return (
    <div className="text-sm text-center text-muted-foreground my-4 md:my-4">
      {infoText}&nbsp;
      <Link
        isSubtle
        href={href}
        className="text-primary font-medium cursor-pointer hover:underline hover:decoration-primary"
      >
        {linkText}
      </Link>
    </div>
  );
};
