import { Textarea } from '@components/ui/textarea';
import { Label } from './Label';

interface ITextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  required?: boolean;
}

export const TextArea = ({ label, required, className, ...props }: ITextAreaProps) => {
  return (
    <div className="flex flex-col gap-1">
      {label && <Label label={label} required={required} />}
      <Textarea
        className={`border-color-border bg-background-primary text-color-primary text-sm font-medium placeholder:text-color-secondary focus:border-blue-primary ${className || ''}`}
        {...props}
      />
    </div>
  );
};
