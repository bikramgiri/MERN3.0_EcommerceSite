import {ArrowRight, Loader2} from "lucide-react";
import { Status } from "../../../global/statuses";
import { useAppDispatch, useAppSelector } from "../../../hooks/hooks";
import { fetchCategories } from "../../../store/customer/categorySlice";
import { useEffect } from "react";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-['IBM_Plex_Mono',monospace] text-xl tracking-[0.25em] uppercase text-[#E6540B]">
      {children}
    </p>
  );
}

export default function Categories() {
  const dispatch = useAppDispatch();
  const { categories, status } = useAppSelector((state) => state.category);

  useEffect(() => {
    dispatch(fetchCategories());
    /// eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  if (status === Status.LOADING) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FDF8ED] to-[#FAF3E4]">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-[#E6540B] mx-auto mb-4" />
          <p className="text-xl text-gray-600">Loading category.....</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FDF8ED] text-[#1A1613] font-['Inter',sans-serif] antialiased">
      <style>{`
        @keyframes truvora-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .truvora-marquee-track {
          animation: truvora-marquee 22s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .truvora-marquee-track { animation: none; }
        }
      `}</style>

      <section
        id="categories"
        className="mx-auto max-w-[1500px] px-6 py-20 lg:px-10"
      >
            <SectionLabel>Shop by category</SectionLabel>
            <h2 className="mt-3 font-['Fraunces',serif] text-3xl sm:text-4xl">
            Explore Your Favorite Categories
            </h2>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-6">
          {categories.map((cat) => (
            <a
              key={cat.id}
              href="#"
              className="group relative overflow-hidden rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E6540B]"
            >
              <img
                src={cat.categoryImage}
                alt={cat.categoryName}
                className="h-64 w-full object-cover transition duration-500 group-hover:scale-105 sm:h-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A1613]/75 via-[#1A1613]/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="font-['Fraunces',serif] text-lg text-[#FDF8ED]">
                  {cat.categoryName}
                </p>
                <div className="flex items-center justify-between">
                  <p className="font-['IBM_Plex_Mono',monospace] text-[11px] text-[#FDF8ED]/70">
                    {cat.totalProducts ?? 0} items
                  </p>
                  <ArrowRight
                    size={14}
                    className="text-[#FDF8ED] opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100"
                  />
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}