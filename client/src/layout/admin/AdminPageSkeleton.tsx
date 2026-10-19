import { Skeleton, SkeletonContainer } from "../../global/Skeleton";
import { useTheme } from "../../context/ThemeContext";

// Shown while admin code chunks download, so keep this file free of admin imports.

const cardClass = "rounded-2xl border border-[#1A1613]/10 dark:border-white/10 bg-[#FFFDF8] dark:bg-[#1E1A17] shadow-xs";
const rowWidths = ["w-40", "w-52", "w-36", "w-48"];

const ContentBlocks = () => (
  <div className="space-y-6">
    {/* Page title + actions */}
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-9 w-9 rounded-xl" />
          <Skeleton className="h-8 w-48 sm:h-9 sm:w-64" />
        </div>
        <Skeleton className="mt-2 h-3.5 w-64 max-w-full sm:w-80" />
      </div>
      <div className="flex items-center gap-2.5">
        <Skeleton className="h-9 w-24 rounded-xl" />
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>
    </div>

    {/* KPI cards */}
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, idx) => (
        <div key={idx} className={`${cardClass} p-4`}>
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
          <div className="mt-2 flex items-end gap-2">
            <Skeleton className="h-8 w-14" />
            <Skeleton className="mb-1 h-2.5 w-12" />
          </div>
        </div>
      ))}
    </div>

    {/* Filter bar + table */}
    <div className="overflow-hidden rounded-xl border border-[#1A1613]/10 dark:border-white/10 bg-[#FFFDF8] dark:bg-[#1E1A17] shadow-xs">
      <div className="flex flex-col gap-3 border-b border-[#1A1613]/10 dark:border-white/10 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <Skeleton className="h-10 w-full max-w-md rounded-lg" />
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-9 w-32 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      </div>
      <div className="border-b border-[#1A1613]/10 dark:border-white/10 bg-[#F4EEDF]/40 dark:bg-[#2A2420] px-4 py-3.5">
        <Skeleton className="h-3 w-2/3" />
      </div>
      <div className="divide-y divide-[#1A1613]/8 dark:divide-white/10">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="flex items-center gap-4 px-4 py-3.5">
            <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className={`h-3.5 ${rowWidths[idx % rowWidths.length]}`} />
              <Skeleton className="h-2.5 w-20" />
            </div>
            <Skeleton className="hidden h-5 w-20 rounded-full sm:block" />
            <Skeleton className="hidden h-3.5 w-16 md:block" />
            <Skeleton className="hidden h-3 w-20 lg:block" />
            <Skeleton className="h-7 w-16 rounded-lg" />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-[#1A1613]/10 dark:border-white/10 bg-[#FDF8ED]/30 dark:bg-[#1E1A17] p-4">
        <Skeleton className="h-3.5 w-32" />
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-7 w-7 rounded-lg" />
          <Skeleton className="h-7 w-7 rounded-lg" />
        </div>
      </div>
    </div>
  </div>
);

/** Content-area skeleton, shown inside the admin layout while a page chunk loads. */
export const AdminContentSkeleton = () => (
  <SkeletonContainer label="Loading page">
    <ContentBlocks />
  </SkeletonContainer>
);

/** Full admin shell (sidebar + header + content), shown while the layout chunk loads. */
const AdminPageSkeleton = () => {
  const { theme } = useTheme();
  return (
  <div className={theme === "dark" ? "dark" : undefined} style={{ colorScheme: theme }}>
  <SkeletonContainer label="Loading admin dashboard" className="min-h-screen xl:flex dark:bg-[#14110F]">
    <aside className="fixed left-0 top-0 z-50 hidden h-screen w-65 flex-col border-r border-[#1A1613]/10 dark:border-white/10 bg-[#FFFDF8] dark:bg-[#1E1A17] lg:flex">
      <div className="flex h-19 items-center gap-3 border-b border-[#1A1613]/10 dark:border-white/10 px-4">
        <Skeleton className="h-10 w-10 rounded-md" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <div className="flex-1 space-y-4 px-3 py-4">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div key={idx} className="flex items-center gap-3 px-3 py-2">
            <Skeleton className="h-5 w-5 shrink-0" />
            <Skeleton className="h-3.5 flex-1" />
          </div>
        ))}
      </div>
    </aside>

    <div className="flex-1 lg:ml-65">
      <header className="sticky top-0 z-40 w-full border-b border-[#1A1613]/10 dark:border-white/10 bg-[#FFFDF8] dark:bg-[#1E1A17] shadow-xs">
        <div className="flex h-19 items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex max-w-2xl flex-1 items-center gap-2 sm:gap-4">
            <Skeleton className="h-10 w-10 shrink-0 rounded-lg lg:h-11 lg:w-11" />
            <Skeleton className="h-10 w-full max-w-md rounded-lg" />
          </div>
          <div className="flex shrink-0 items-center gap-3 sm:gap-5">
            <Skeleton className="hidden h-10 w-10 rounded-full sm:block sm:h-11 sm:w-11" />
            <Skeleton className="h-10 w-10 rounded-full sm:h-11 sm:w-11" />
            <Skeleton className="h-10 w-10 rounded-full sm:h-11 sm:w-11" />
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-(--breakpoint-2xl) p-4 md:p-6">
        <ContentBlocks />
      </div>
    </div>
  </SkeletonContainer>
  </div>
  );
};

export default AdminPageSkeleton;
