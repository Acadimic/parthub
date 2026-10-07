import { createContext, useContext } from 'react';

/** True inside a printout, where content that only works on screen draws a still in its place. */
export const PrintContext = createContext(false);

export const useIsPrint = (): boolean => useContext(PrintContext);
