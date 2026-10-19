import type { ReactNode } from "react";

/**
 * Grey pulsing placeholder used to build page-shaped loading skeletons.
 * (The dark variant only applies inside the admin area, where dark mode is scoped.)
 * Size and shape come from className (e.g. "h-4 w-1/2", "aspect-square rounded-xl").
 */
export const Skeleton = ({ className = "" }: { className?: string }) => (
  <div
    aria-hidden="true"
    className={`animate-pulse rounded-md bg-[#1A1613]/10 dark:bg-white/10 ${className}`}
  />
);

/**
 * Wraps a page skeleton so screen readers announce a single "Loading" message
 * instead of reading out every placeholder block.
 */
export const SkeletonContainer = ({
  children,
  label = "Loading",
  className = "",
}: {
  children: ReactNode;
  label?: string;
  className?: string;
}) => (
  <div role="status" aria-busy="true" aria-label={label} className={className}>
    {children}
  </div>
);

export default Skeleton;
