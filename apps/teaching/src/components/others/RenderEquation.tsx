import { MathJax } from 'better-react-mathjax';

export const RenderEquation = ({ equation, onClick }: { equation: string; onClick?: () => void }) => {
  return <MathJax inline className="" onClick={onClick}>{`$$${equation}$$`}</MathJax>;
};
