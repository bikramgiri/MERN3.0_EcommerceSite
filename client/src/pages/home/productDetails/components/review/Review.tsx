import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../../../hooks/hooks";
import {
  Edit,
  PencilIcon,
  Trash2,
  X,
  AlertTriangle,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import AddReview from "./AddReview";
import EditReview from "./EditReview";
import type { Review } from "../../../../../types/customer/reviewTypes";
import { toast } from "react-toastify";
import {
  deleteReview,
  fetchProductReviews,
} from "../../../../../store/customer/reviewSlice";
import { Status } from "../../../../../global/statuses";
import { Skeleton, SkeletonContainer } from "../../../../../global/Skeleton";
import { Link, useNavigate } from "react-router-dom";
import useIsAdmin from "../../../../../hooks/useIsAdmin";
import { fetchSingleProduct } from "../../../../../store/customer/productSlice";
import { useStoreSettings } from "../../../../../services/storeSettingsService";
import { hideBrokenImage, responsiveImage } from "../../../../../utils/helpers";
import { APIAuthenticated } from "../../../../../http";

interface SingleProductProps {
  productId: string;
}

function ReviewsSkeleton() {
  return (
    <SkeletonContainer label="Loading reviews">
      <div className="py-6 md:py-10">
        <Skeleton className="h-8 md:h-9 w-56 mb-6" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-12">
          <div className="flex flex-col items-center sm:items-start gap-2">
            <Skeleton className="h-12 md:h-15 w-24 md:w-28" />
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-9 w-full sm:w-36" />
          </div>

          <div className="flex-1 space-y-4 sm:space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-5 w-4 sm:w-6" />
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-2.5 flex-1 rounded-full" />
                <Skeleton className="h-5 w-8 sm:w-10" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <Skeleton className="h-7 sm:h-8 w-48" />
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full sm:w-auto">
          <Skeleton className="h-10 w-full sm:w-52 rounded-lg" />
          <Skeleton className="h-10 w-full sm:w-56 rounded-lg" />
        </div>
      </div>

      <div className="space-y-1 border-t border-[#1A1613]/15">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="border-b border-[#1A1613]/15 p-5 md:p-2">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="flex-shrink-0 w-full sm:w-48">
                <div className="flex items-center gap-3 mb-2">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3.5 w-32" />
                  </div>
                </div>
                <Skeleton className="h-5 w-28" />
              </div>
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </SkeletonContainer>
  );
}

// Row of five stars, filled up to `value`
const Stars = ({ value, size = "h-4 w-4" }: { value: number; size?: string }) => (
  <span className="flex" aria-label={`${value} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((s) => (
      <svg
        key={s}
        className={`${size} ${s <= value ? "text-amber-400" : "text-[#1A1613]/15"}`}
        fill="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
      </svg>
    ))}
  </span>
);

const Review = ({ productId }: SingleProductProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isAdmin = useIsAdmin();
  const { storeName } = useStoreSettings();
  const { review, status } = useAppSelector((state) => state.review);
  const { user } = useAppSelector((state) => state.auth);

  const [showModal, setShowModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Reviews are written by signed-in customers; send visitors to log in first
  const openAddModal = () => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }
    setSelectedReview(null);
    setShowModal(true);
  };

  // The signed-in customer's own review, including one the team has hidden
  // (the public list only shows approved reviews)
  const [myReview, setMyReview] = useState<Review | null>(null);
  const isCustomerSignedIn = !!localStorage.getItem("token") && !isAdmin;

  const loadMyReview = () => {
    if (!isCustomerSignedIn) return;
    APIAuthenticated.get(`/customer/review/product/${productId}/mine`)
      .then((res) => setMyReview(res.data.data))
      .catch(() => {});
  };

  // The rating summary at the top of the page comes from the product, so refresh both
  const refreshReviews = () => {
    dispatch(fetchProductReviews(productId)).catch(() => {});
    dispatch(fetchSingleProduct(productId)).catch(() => {});
    loadMyReview();
  };

  const openEditModal = (review: Review) => {
    setSelectedReview(review);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedReview(null);
  };

  const handleSuccess = () => {
    const wasHidden = selectedReview?.status === "FLAGGED" || selectedReview?.status === "PENDING";
    toast.success(
      !selectedReview
        ? "Review added successfully!"
        : wasHidden
          ? "Review updated. Our team will check it before it's shown again."
          : "Review updated successfully!",
    );
    refreshReviews();
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState("allstar");
  const [sort, setSort] = useState("recent");

  const itemsPerPage = 5;

  useEffect(() => {
    if (productId) {
      dispatch(fetchProductReviews(productId)).catch(() => {});
    }
  }, [dispatch, productId]);

  useEffect(() => {
    if (!isCustomerSignedIn) return;
    let active = true;
    APIAuthenticated.get(`/customer/review/product/${productId}/mine`)
      .then((res) => {
        if (active) setMyReview(res.data.data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [productId, isCustomerSignedIn]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const averageRating =
    review && review.length > 0
      ? (
          review.reduce((acc, r) => acc + Number(r.rating || 0), 0) /
          review.length
        ).toFixed(1)
      : "0.0";

  const hasRating = (rating: number) =>
    review?.some((r) => Number(r.rating) === rating) ?? false;

  const filteredReviews =
    filter === "allstar"
      ? review || []
      : (review || []).filter(
          (r) => Number(r.rating) === Number(filter.replace("star", "")),
        );

  const sortedReviews = [...filteredReviews].sort((a, b) => {
    switch (sort) {
      case "recent":
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case "highest":
        return Number(b.rating || 0) - Number(a.rating || 0);
      case "lowest":
        return Number(a.rating || 0) - Number(b.rating || 0);
      default:
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }
  });

  const totalPages = Math.ceil(sortedReviews.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedReviews.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // The slice may still hold another product's reviews until this product's fetch lands
  const hasOtherProductReviews =
    review?.length > 0 && review[0].productId !== productId;
  const isInitialLoad =
    (status === Status.LOADING && !review?.length) ||
    (hasOtherProductReviews && status !== Status.ERROR);

  const requestDelete = (review: Review) => {
    setReviewToDelete(review);
  };

  const confirmDelete = async () => {
    if (!reviewToDelete) return;
    setIsDeleting(true);
    try {
      await dispatch(deleteReview(reviewToDelete.id as string));
      toast.success("Review deleted successfully.");
      setReviewToDelete(null);
      refreshReviews();
    } catch (error) {
      console.error("Error deleting review:", error);
      toast.error("Failed to delete review. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    if (isDeleting) return;
    setReviewToDelete(null);
  };

  const myHiddenReview =
    myReview && (myReview.status === "FLAGGED" || myReview.status === "PENDING") ? myReview : null;
  const canWriteReview = !isAdmin && !myReview && !review?.some((r) => r.userId === user?.id);

  const writeButton = (
    <button
      type="button"
      onClick={openAddModal}
      className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#E6540B] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#c94806]"
    >
      <PencilIcon className="h-4 w-4" />
      Write a review
    </button>
  );

  return (
    <>
      <section className="bg-[#FDF8ED] text-[#1A1613]">
        <div id="reviews" className="mx-auto max-w-7xl scroll-mt-24 px-4 pb-16 sm:px-6 lg:px-8">
          <div className="border-t border-[#1A1613]/10 pt-10">
            {/* Only the author sees their hidden review, with the reason and how to fix it */}
            {myHiddenReview && (
              <div className="mb-8 rounded-xl border border-amber-300 bg-amber-50 p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-amber-900">
                      {myHiddenReview.status === "FLAGGED"
                        ? "Your review is hidden"
                        : "Your review is waiting to be checked"}
                    </p>
                    <p className="mt-1 text-sm text-amber-900/80">
                      {myHiddenReview.status === "FLAGGED" ? (
                        <>
                          Other shoppers can't see it because it may not follow our{" "}
                          <Link to="/terms#reviews" className="font-medium underline">
                            review rules
                          </Link>
                          . Edit it and our team will check it again.
                        </>
                      ) : (
                        "Only you can see it for now. It will appear for everyone once our team has checked it."
                      )}
                    </p>

                    <div className="mt-4 rounded-lg bg-white p-4">
                      <Stars value={Number(myHiddenReview.rating || 0)} />
                      <p className="mt-2 whitespace-pre-line text-sm text-[#1A1613]/80">{myHiddenReview.message}</p>
                      {myHiddenReview.reviewImage && (
                        <img
                          {...responsiveImage(myHiddenReview.reviewImage, [160, 320], "112px")}
                          alt="Photo from your review"
                          onError={hideBrokenImage}
                          className="mt-3 h-28 w-28 rounded-lg border border-[#1A1613]/10 object-cover"
                        />
                      )}
                      {myHiddenReview.adminReply && (
                        <p className="mt-3 border-l-4 border-[#E6540B] pl-3 text-sm text-[#1A1613]/80">
                          <span className="font-semibold text-[#E6540B]">Reply from {storeName}: </span>
                          {myHiddenReview.adminReply}
                        </p>
                      )}
                      <div className="mt-3 flex gap-4 text-sm">
                        <button
                          type="button"
                          onClick={() => openEditModal(myHiddenReview)}
                          className="inline-flex cursor-pointer items-center gap-1 font-medium text-[#1A1613]/70 hover:text-[#E6540B]"
                        >
                          <Edit className="h-4 w-4" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => requestDelete(myHiddenReview)}
                          className="inline-flex cursor-pointer items-center gap-1 font-medium text-[#1A1613]/70 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isInitialLoad ? (
              <ReviewsSkeleton />
            ) : !review || review.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#1A1613]/15 bg-white px-4 py-10 text-center">
                <h2 className="text-xl font-bold">No reviews yet</h2>
                <p className="mt-1 text-[#1A1613]/70">
                  {isAdmin ? "Customers haven't reviewed this product yet." : "Bought this product? Be the first to share what you think."}
                </p>
                {canWriteReview && <div className="mt-5">{writeButton}</div>}
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold">Ratings &amp; reviews</h2>

                {/* Summary */}
                <div className="mt-6 grid gap-8 md:grid-cols-[220px_1fr] md:items-center">
                  <div className="text-center md:text-left">
                    <p className="text-5xl font-bold">{averageRating}</p>
                    <div className="mt-2 flex justify-center md:justify-start">
                      <Stars value={Math.round(Number(averageRating))} size="h-5 w-5" />
                    </div>
                    <p className="mt-1 text-sm text-[#1A1613]/60">
                      Based on {review.length} {review.length === 1 ? "review" : "reviews"}
                    </p>
                    {canWriteReview && <div className="mt-4">{writeButton}</div>}
                  </div>

                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((stars) => {
                      const count = review.filter((r) => Number(r.rating) === stars).length;
                      const percentage = (count / review.length) * 100;
                      return (
                        <button
                          key={stars}
                          type="button"
                          disabled={count === 0}
                          onClick={() => {
                            setFilter(filter === `${stars}star` ? "allstar" : `${stars}star`);
                            setCurrentPage(1);
                          }}
                          className="flex w-full cursor-pointer items-center gap-3 rounded-md px-1 py-0.5 text-sm hover:bg-[#F4EEDF] disabled:cursor-default disabled:hover:bg-transparent"
                          aria-label={`Show ${stars}-star reviews (${count})`}
                        >
                          <span className="flex w-10 items-center gap-1 font-medium">
                            {stars}
                            <svg className="h-3.5 w-3.5 text-amber-400" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                            </svg>
                          </span>
                          <span className="h-2 flex-1 overflow-hidden rounded-full bg-[#1A1613]/10">
                            <span
                              className={`block h-full rounded-full ${filter === `${stars}star` ? "bg-[#c94806]" : "bg-[#E6540B]"}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </span>
                          <span className="w-8 text-right text-[#1A1613]/60">{count}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Filter + sort */}
                <div className="mt-10 flex flex-col gap-3 border-b border-[#1A1613]/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-[#1A1613]/60">
                    Showing {sortedReviews.length} {sortedReviews.length === 1 ? "review" : "reviews"}
                  </p>
                  <div className="flex gap-3">
                    <select
                      value={filter}
                      onChange={(e) => {
                        setFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      aria-label="Filter reviews by rating"
                      className="flex-1 cursor-pointer rounded-lg border border-[#1A1613]/20 bg-white px-3 py-2 text-sm focus:border-[#E6540B] focus:outline-none focus:ring-1 focus:ring-[#E6540B] sm:flex-none"
                    >
                      <option value="allstar">All ratings</option>
                      {[5, 4, 3, 2, 1].map((s) => (
                        <option key={s} value={`${s}star`} disabled={!hasRating(s)}>
                          {s} {s === 1 ? "star" : "stars"}
                        </option>
                      ))}
                    </select>
                    <select
                      value={sort}
                      onChange={(e) => {
                        setSort(e.target.value);
                        setCurrentPage(1);
                      }}
                      aria-label="Sort reviews"
                      className="flex-1 cursor-pointer rounded-lg border border-[#1A1613]/20 bg-white px-3 py-2 text-sm focus:border-[#E6540B] focus:outline-none focus:ring-1 focus:ring-[#E6540B] sm:flex-none"
                    >
                      <option value="recent">Newest first</option>
                      <option value="highest">Highest rating</option>
                      <option value="lowest">Lowest rating</option>
                    </select>
                  </div>
                </div>

                {/* Review list */}
                <ul className="divide-y divide-[#1A1613]/10">
                  {currentItems.map((item) => {
                    const name = item.User?.username || "Customer";
                    const isMine = item.userId === user?.id;
                    return (
                      <li key={item.id} className="py-6">
                        <div className="flex items-start gap-3">
                          {item.User?.avatar ? (
                            <img
                              {...responsiveImage(item.User.avatar, [48, 96, 144], "40px")}
                              alt=""
                              referrerPolicy="no-referrer"
                              className="h-10 w-10 shrink-0 rounded-full object-cover"
                            />
                          ) : (
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E6540B]/10 font-semibold text-[#E6540B]">
                              {name.charAt(0).toUpperCase()}
                            </span>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                              <p className="font-semibold">
                                {name}
                                {isMine && <span className="ml-2 text-xs font-medium text-[#1A1613]/50">(you)</span>}
                              </p>
                              <p className="text-sm text-[#1A1613]/50">{formatDate(item.createdAt)}</p>
                            </div>
                            <div className="mt-1">
                              <Stars value={Number(item.rating || 0)} />
                            </div>
                            <p className="mt-2 whitespace-pre-line leading-relaxed text-[#1A1613]/80">{item.message}</p>

                            {item.reviewImage && (
                              <a href={item.reviewImage} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block">
                                <img
                                  {...responsiveImage(item.reviewImage, [160, 320, 480], "160px")}
                                  alt={`Photo from ${name}'s review`}
                                  loading="lazy"
                                  onError={hideBrokenImage}
                                  className="h-28 w-28 rounded-lg border border-[#1A1613]/10 object-cover sm:h-32 sm:w-32"
                                />
                              </a>
                            )}

                            {item.adminReply && (
                              <div className="mt-4 rounded-lg border-l-4 border-[#E6540B] bg-white p-3">
                                <p className="flex items-center gap-1.5 text-xs font-semibold text-[#E6540B]">
                                  <ShieldCheck className="h-3.5 w-3.5" />
                                  Reply from {storeName}
                                  {item.repliedAt && (
                                    <span className="font-normal text-[#1A1613]/50">· {formatDate(item.repliedAt)}</span>
                                  )}
                                </p>
                                <p className="mt-1 whitespace-pre-line text-sm text-[#1A1613]/80">{item.adminReply}</p>
                              </div>
                            )}

                            {isMine && (
                              <div className="mt-3 flex gap-4 text-sm">
                                <button
                                  type="button"
                                  onClick={() => openEditModal(item)}
                                  className="inline-flex cursor-pointer items-center gap-1 font-medium text-[#1A1613]/70 hover:text-[#E6540B]"
                                >
                                  <Edit className="h-4 w-4" /> Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => requestDelete(item)}
                                  className="inline-flex cursor-pointer items-center gap-1 font-medium text-[#1A1613]/70 hover:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" /> Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                {totalPages > 1 && (
                  <nav aria-label="Review pages" className="mt-6 flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="h-9 cursor-pointer rounded-lg border border-[#1A1613]/15 bg-white px-3 text-sm hover:bg-[#F4EEDF] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => paginate(page)}
                        aria-current={currentPage === page ? "page" : undefined}
                        className={`h-9 w-9 cursor-pointer rounded-lg text-sm font-medium ${
                          currentPage === page ? "bg-[#E6540B] text-white" : "border border-[#1A1613]/15 bg-white hover:bg-[#F4EEDF]"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="h-9 cursor-pointer rounded-lg border border-[#1A1613]/15 bg-white px-3 text-sm hover:bg-[#F4EEDF] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                    </button>
                  </nav>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {showModal && !selectedReview && (
        <AddReview
          productId={productId}
          onClose={closeModal}
          onSuccess={handleSuccess}
        />
      )}

      {showModal && selectedReview && (
        <EditReview
          review={selectedReview}
          onClose={closeModal}
          onSuccess={handleSuccess}
        />
      )}

      {reviewToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm bg-[#FDF8ED] rounded-2xl shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-[#9B3A2E]">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[#FDF8ED]" />
                <h2 className="text-lg font-['Fraunces',serif] font-semibold text-[#FDF8ED]">
                  Delete Review
                </h2>
              </div>
              <button
                onClick={cancelDelete}
                disabled={isDeleting}
                className="cursor-pointer p-1.5 rounded-full hover:bg-[#7a2e24] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="h-5 w-5 text-[#FDF8ED]" />
              </button>
            </div>

            <div className="px-6 py-6">
              <p className="text-[#1A1613]/80 leading-relaxed">
                Are you sure you want to delete this review? This action cannot
                be undone.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 px-6 pb-6">
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="cursor-pointer flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#9B3A2E] hover:bg-[#7a2e24] text-[#FDF8ED] font-semibold rounded-lg transition disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting....
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={cancelDelete}
                disabled={isDeleting}
                className="cursor-pointer flex-1 px-4 py-2.5 bg-[#F4EEDF] border border-[#1A1613]/15 text-[#1A1613] font-semibold rounded-lg hover:bg-[#1A1613]/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Review;
