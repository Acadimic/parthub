import { createContext, useContext, type ReactNode } from 'react';

/**
 * Whether code blocks here may show a Run button. Off by default: in a test question, or a "what does
 * this print?" check, running the code would give the answer away. A lesson's reading view turns it
 * on with <CodeRunScope>, and check and reveal blocks turn it off for the code inside them until the
 * learner has seen the answer (AnsweredRunScope).
 */
const CodeRunContext = createContext(false);

export const CodeRunScope = ({ isEnabled = true, children }: { isEnabled?: boolean; children: ReactNode }) => (
  <CodeRunContext.Provider value={isEnabled}>{children}</CodeRunContext.Provider>
);

export const useCanRunCode = () => useContext(CodeRunContext);

/** Run stays off inside a question until it has been answered, and then only where the page allows it. */
export const AnsweredRunScope = ({ isAnswered, children }: { isAnswered: boolean; children: ReactNode }) => (
  <CodeRunScope isEnabled={useCanRunCode() && isAnswered}>{children}</CodeRunScope>
);

/** The languages the browser can run, and code that needs nothing it cannot supply. */
export const isRunnable = (language: string, code: string) =>
  language === 'python' || (language === 'javascript' && !/^\s*(import\s|export\s)/m.test(code));
