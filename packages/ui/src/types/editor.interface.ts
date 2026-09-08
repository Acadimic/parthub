import type { ReactNode } from 'react';

export interface ICmdItem {
  cmd: string;
  html: string;
  icon?: ReactNode;
}
