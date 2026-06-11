import MuiCheckbox, { CheckboxProps as MuiCheckboxProps } from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';

interface ICheckboxProps extends MuiCheckboxProps {
  label?: string;
}

export const Checkbox = ({ label, className, ...rest }: ICheckboxProps) => {
  const checkbox = (
    <MuiCheckbox
      {...rest}
      className={`text-color-secondary ${className || ''}`}
      size="small"
      sx={{
        '&.Mui-checked': {
          color: 'var(--tw-color-blue-primary, #009ef7)',
        },
        ...rest.sx,
      }}
    />
  );

  if (label) {
    return <FormControlLabel control={checkbox} label={label} classes={{ label: 'text-sm text-color-primary' }} />;
  }

  return checkbox;
};

export type { ICheckboxProps };
