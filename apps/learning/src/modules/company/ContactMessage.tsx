import { ReportDialog } from '@components/app/report';
import { TicketCategory } from '@enums';
import { ChatCircleTextIcon } from '@phosphor-icons/react';
import { Button, Link } from '@repo/ui/app';
import { useSelectedUser } from '@stores';
import { useState } from 'react';

/**
 * Write to support from the page: a signed-in learner's message becomes a ticket they can follow
 * under Help & support. A visitor without an account uses the email channels below instead.
 */
export const ContactMessage = () => {
  const selectedUser = useSelectedUser();
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-primary/30 bg-primary/5 p-5 sm:flex-row sm:items-center">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <ChatCircleTextIcon weight="bold" className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="text-base font-semibold">Send us a message</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {selectedUser
            ? 'Reach support without leaving the app, and read the reply under Account settings → Help & support.'
            : 'Sign in to message support and follow the reply in the app, or email one of the teams below.'}
        </p>
      </div>
      {selectedUser ? (
        <Button text="Write a message" onClick={() => setIsOpen(true)} />
      ) : (
        <Link href="/sign-in" isSecondary>
          Sign in
        </Link>
      )}
      <ReportDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        target={{ category: TicketCategory.CONTACT }}
        title="Contact support"
        description="Tell us what you need. We answer within two working days."
      />
    </div>
  );
};
