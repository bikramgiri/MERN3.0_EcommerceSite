import { Star } from 'lucide-react';
import { useAppSelector } from '../../../hooks/hooks';

function initials(name?: string) {
  return name?.trim()?.[0]?.toUpperCase() || '?';
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const TableThree = () => {
  const { recentReviews, status } = useAppSelector((state) => state.datas);

  return (
    <div className="rounded-sm border border-[#1A1613]/10 bg-[#FDF8ED] px-5 pt-6 pb-2.5 shadow-md shadow-[#1A1613]/5 sm:px-7.5">
      <h4 className="mb-6 font-['Fraunces',serif] text-xl text-[#1A1613]">
        Recent Reviews
      </h4>

      {status === 'loading' && recentReviews.length === 0 && (
        <div className="py-10 text-center text-sm text-[#1A1613]/50">
          Loading recent reviews...
        </div>
      )}

      {status !== 'loading' && recentReviews.length === 0 && (
        <div className="py-10 text-center text-sm text-[#1A1613]/50">
          No reviews yet.
        </div>
      )}

      <div className="flex flex-col divide-y divide-[#1A1613]/10">
        {recentReviews.map((review) => (
          <div key={review.id} className="flex gap-3 py-4">
            {review.User?.avatar ? (
              <img
                src={review.User.avatar}
                alt={review.User.username}
                className="h-9 w-9 flex-shrink-0 rounded-full border border-[#1A1613]/10 object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#E6540B] font-['Fraunces',serif] text-sm font-semibold text-[#FDF8ED]">
                {initials(review.User?.username)}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium text-[#1A1613]">
                  {review.User?.username ?? 'Anonymous'}
                </p>
                <p className="flex-shrink-0 font-['IBM_Plex_Mono',monospace] text-[11px] text-[#1A1613]/45">
                  {formatDate(review.createdAt)}
                </p>
              </div>

              <div className="mt-1 flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={13}
                    className={i < review.rating ? 'fill-[#E6540B] text-[#E6540B]' : 'text-[#1A1613]/20'}
                  />
                ))}
              </div>

              <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-[#1A1613]/70">
                {review.message}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TableThree;