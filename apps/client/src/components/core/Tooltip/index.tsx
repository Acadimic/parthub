import MuiTooltip, { TooltipProps as MuiTooltipProps } from '@mui/material/Tooltip';

interface ITooltipProps extends Omit<MuiTooltipProps, 'children'> {
  children: React.ReactNode;
}

export const Tooltip = ({ children, title, ...rest }: ITooltipProps) => {
  return (
    <MuiTooltip
      classes={{ tooltip: 'bg-color-primary text-color-opposite', arrow: 'text-color-primary' }}
      title={title || children}
      arrow
      {...rest}
    >
      <span>{children}</span>
    </MuiTooltip>
  );
};

export type { ITooltipProps };
