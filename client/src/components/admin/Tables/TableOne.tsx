import { useAppSelector } from '../../../hooks/hooks';

function initials(name: string) {
  return name?.trim()?.[0]?.toUpperCase() || '?';
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const TableOne = () => {
  const { recentUsers, status } = useAppSelector((state) => state.datas);

  return (
    <div className="col-span-8 xl:col-span-8 rounded-sm border border-[#1A1613]/10 bg-[#FDF8ED] px-5 pt-6 pb-2.5 shadow-md shadow-[#1A1613]/5 sm:px-7.5 xl:pb-4">
      <div className="mb-6 flex items-center justify-between">
        <h4 className="font-['Fraunces',serif] text-xl text-[#1A1613]">
          Recent Users
        </h4>
        <span className="font-['IBM_Plex_Mono',monospace] text-xs uppercase tracking-[0.15em] text-[#E6540B]">
          Last {recentUsers.length}
        </span>
      </div>

      <div className="flex flex-col">
        {/* Header row */}
        <div className="grid grid-cols-3 rounded-sm bg-[#F4EEDF] sm:grid-cols-4">
          <div className="p-2.5 xl:p-4">
            <h5 className="font-['IBM_Plex_Mono',monospace] text-xs font-medium uppercase tracking-wider text-[#1A1613]/60">
              User
            </h5>
          </div>
          <div className="p-2.5 xl:p-4">
            <h5 className="font-['IBM_Plex_Mono',monospace] text-xs font-medium uppercase tracking-wider text-[#1A1613]/60">
              Email
            </h5>
          </div>
          <div className="hidden p-2.5 sm:block xl:p-4">
            <h5 className="font-['IBM_Plex_Mono',monospace] text-xs font-medium uppercase tracking-wider text-[#1A1613]/60">
              Joined
            </h5>
          </div>
          <div className="p-2.5 text-right xl:p-4">
            <h5 className="font-['IBM_Plex_Mono',monospace] text-xs font-medium uppercase tracking-wider text-[#1A1613]/60">
              Status
            </h5>
          </div>
        </div>

        {/* Loading state */}
        {status === 'loading' && recentUsers.length === 0 && (
          <div className="py-10 text-center text-sm text-[#1A1613]/50">
            Loading recent users...
          </div>
        )}

        {/* Empty state */}
        {status !== 'loading' && recentUsers.length === 0 && (
          <div className="py-10 text-center text-sm text-[#1A1613]/50">
            No users yet.
          </div>
        )}

        {/* Rows */}
        {recentUsers.map((user, key) => (
          <div
            className={`grid grid-cols-3 items-center sm:grid-cols-4 ${
              key === recentUsers.length - 1 ? '' : 'border-b border-[#1A1613]/10'
            } transition-colors hover:bg-[#F4EEDF]/60`}
            key={user.id}
          >
            <div className="flex items-center gap-3 p-2.5 xl:p-4">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="h-9 w-9 flex-shrink-0 rounded-full object-cover border border-[#1A1613]/10"
                />
              ) : (
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#E6540B] font-['Fraunces',serif] text-sm font-semibold text-[#FDF8ED]">
                  {initials(user.username)}
                </div>
              )}
              <p className="truncate text-sm text-[#1A1613] sm:text-[15px]">
                {user.username}
              </p>
            </div>

            <div className="p-2.5 xl:p-4">
              <p className="truncate text-sm text-[#1A1613]/70">{user.email}</p>
            </div>

            <div className="hidden p-2.5 sm:block xl:p-4">
              <p className="font-['IBM_Plex_Mono',monospace] text-xs text-[#1A1613]/60">
                {/* createdAt isn't on UserData yet — see note below */}
                {(user).createdAt ? formatDate((user).createdAt) : '—'}
              </p>
            </div>

            <div className="flex justify-end p-2.5 xl:p-4">
              <span className="inline-flex items-center rounded-full bg-[#9B3A2E]/10 px-2.5 py-1 font-['IBM_Plex_Mono',monospace] text-[11px] uppercase tracking-wide text-[#9B3A2E]">
                Customer
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TableOne;