import NextLink from 'next/link';
import { type HTMLAttributeAnchorTarget } from 'react';
import { Button, type IButtonProps } from '../buttons';

interface IProps extends IButtonProps {
  href: string;
  children: React.ReactNode;
  linkClassName?: string;
  target?: HTMLAttributeAnchorTarget;
}

export const Link = (props: IProps) => {
  const { href, children, linkClassName, target } = props;

  return (
    <NextLink
      className={linkClassName ? linkClassName : `text-primary font-medium text-sm`}
      href={href}
      target={target}
    >
      <Button {...props}>{children}</Button>
    </NextLink>
  );
};
