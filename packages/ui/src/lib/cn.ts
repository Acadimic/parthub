import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// The preset's own scale steps, which tailwind-merge cannot know about. Unregistered, `text-xxs`
// reads as a colour and is dropped beside `text-muted-foreground`, leaving the text at full size.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['xxs'] }],
      tracking: [{ tracking: ['caps'] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
