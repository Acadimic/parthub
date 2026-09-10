import { Textarea } from '../../ui/textarea';
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
        className={`border-border bg-background text-foreground text-sm font-medium placeholder:text-muted-foreground focus:border-primary ${className || ''}`}
        {...props}
      />
    </div>
  );
};
