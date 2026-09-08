import {
  AlertDialog as ShadcnAlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../ui/alert-dialog';
import { cn } from '../../lib/cn';

interface IAlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  className?: string;
}

export const AlertDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger,
  className,
}: IAlertDialogProps) => {
  return (
    <ShadcnAlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className={cn('bg-background-primary border-color-border', className)}>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-color-primary">{title}</AlertDialogTitle>
          {message && <AlertDialogDescription className="text-color-secondary">{message}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={onClose}
            className="border-color-border text-color-primary bg-transparent hover:bg-background-secondary"
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={cn(
              isDanger ? 'bg-red-primary hover:bg-red-primary/90' : 'bg-blue-primary hover:bg-blue-primary/90',
              'text-white',
            )}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </ShadcnAlertDialog>
  );
};

export type { IAlertDialogProps };
