interface IProps {
  width?: number | string;
  height?: number | string;
}

export const RectangleSkeleton = ({ width, height }: IProps) => {
  return (
    <div className="bg-accent animate-pulse rounded" style={{ width: width || '100%', height: height || '100%' }} />
  );
};
