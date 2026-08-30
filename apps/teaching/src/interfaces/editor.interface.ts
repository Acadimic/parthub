import { ReactNode } from 'react';

export interface ICmdItem {
  cmd: string;
  html: string;
  icon?: ReactNode;
}

export interface ITarget {
  target: {
    name: string;
    value: string;
  };
}

export interface IFunctionProps {
  handleChange: (target: ITarget) => void;
  name: string;
  closeModal: () => void;
}

export interface IPosition {
  start: number;
  end: number;
}
