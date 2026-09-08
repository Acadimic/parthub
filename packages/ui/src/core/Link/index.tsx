import NextLink, { type LinkProps as NextLinkProps } from 'next/link';
import { type HTMLAttributeAnchorTarget } from 'react';
import { Button, type IButtonProps } from '../Button';

interface ILinkProps extends IButtonProps {
  href: NextLinkProps['href'];
  children: React.ReactNode;
  linkClassName?: string;
  target?: HTMLAttributeAnchorTarget;
  isButton?: boolean;
}

export const Link = (props: ILinkProps) => {
  const { href, children, linkClassName, target, isButton, isSecondary, leftSection, rightSection, ...rest } = props;

  if (isButton) {
    return (
      <NextLink href={href} target={target} className={linkClassName}>
        <Button isSecondary={isSecondary} leftSection={leftSection} rightSection={rightSection} {...rest}>
          {children}
        </Button>
      </NextLink>
    );
  }

  return (
    <NextLink
      className={linkClassName || 'text-blue-primary font-medium text-sm hover:underline'}
      href={href}
      target={target}
    >
      <Button isSubtle leftSection={leftSection} rightSection={rightSection} className="px-0.5 text-xs" {...rest}>
        {children}
      </Button>
    </NextLink>
  );
};

export type { ILinkProps };
