import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../../hooks/hooks";
import { Edit, PencilIcon, Trash2, X, AlertTriangle, Loader2 } from "lucide-react";
import AddReview from "./AddReview";
import EditReview from "./EditReview";
import type { Review } from "../../../../types/reviewTypes";
import { toast } from "react-toastify";
import { deleteReview, fetchProductReviews } from "../../../../store/customer/reviewSlice";

interface SingleProductProps {
  productId: string;
}

const Review = ({ productId }: SingleProductProps) => {
  const dispatch = useAppDispatch();
  const { review } = useAppSelector((state) => state.review);
  const { user } = useAppSelector((state) => state.auth);

  const [showModal, setShowModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const openAddModal = () => {
    setSelectedReview(productId ? null : selectedReview);
    setShowModal(true);
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
    toast.success(
      selectedReview
        ? "Review updated successfully!"
        : "Review added successfully!",
    );
    dispatch(fetchProductReviews(productId));
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState("allstar");
  const [sort, setSort] = useState("default");

  const itemsPerPage = 2;

  useEffect(() => {
    if (productId) {
      dispatch(fetchProductReviews(productId));
    }
  }, [dispatch, productId]);

  useEffect(() => {
    setTimeout(() => {
      setCurrentPage(1);
    }, 500);
  }, [filter, sort]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

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
        return 0;
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

  const productName = review?.[0]?.Product?.productName || "This Product";

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
      dispatch(fetchProductReviews(productId));
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

  return (
    <>
      <section className="bg-[#FDF8ED] font-['Inter',sans-serif] text-[#1A1613]">
        <div id="reviews" className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-10">
          {!review || review.length === 0 ? (
            <div className="text-center py-10">
              <h2 className="text-2xl font-['Fraunces',serif] font-semibold text-[#1A1613] mb-4">
                No reviews for {productName} yet.
              </h2>
              <p className="text-[#1A1613]/70 mb-6">
                Be the first to share your thoughts on this product!
              </p>
              <button
                onClick={openAddModal}
                className="cursor-pointer inline-block px-8 py-4 bg-[#E6540B] text-[#FDF8ED] font-semibold rounded-xl hover:bg-[#c94806] transition"
              >
                Write a Review
              </button>
            </div>
          ) : (
            <>
              <div className="py-6 md:py-10 bg-[#FDF8ED]">
                <h1 className="text-2xl md:text-3xl font-['Fraunces',serif] font-semibold mb-6 text-[#1A1613]">
                  Ratings & Reviews
                </h1>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-12">
                  <div className="text-center sm:text-left">
                    <div className="font-['IBM_Plex_Mono',monospace] text-5xl md:text-6xl font-bold text-[#1A1613]">
                      {averageRating}
                    </div>
                    <div className="font-medium text-2xl text-[#1A1613]/60">
                      out of 5
                    </div>
                    <div className="mt-2 flex justify-center sm:justify-start">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-6 h-6 ${
                            i < Math.floor(Number(averageRating))
                              ? "text-[#E6540B]"
                              : "text-[#1A1613]/15"
                          }`}
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                      ))}
                    </div>
                    <p className="mt-2 text-lg text-[#1A1613]/70">
                      Based on {review.length} review
                      {review.length !== 1 ? "s" : ""}
                    </p>
                    {!review.some((r) => r.userId === user?.id) && (
                      <button
                        type="button"
                        onClick={openAddModal}
                        className="cursor-pointer inline-flex gap-1 mt-2 items-center justify-center px-3 py-2 bg-[#E6540B] hover:bg-[#c94806] text-[#FDF8ED] font-medium rounded-md transition-colors w-full sm:w-auto"
                      >
                        <PencilIcon className="w-4 h-4 mr-1" />
                        Write a Review
                      </button>
                    )}
                  </div>

                  <div className="flex-1 space-y-4 sm:space-y-3">
                    {[5, 4, 3, 2, 1].map((rating) => {
                      const count =
                        review?.filter((r) => Number(r.rating) === rating)
                          .length || 0;
                      const percentage =
                        review?.length > 0 ? (count / review.length) * 100 : 0;

                      return (
                        <div key={rating} className="flex items-center">
                          <span className="w-6 sm:w-8 text-start text-md sm:text-base font-medium text-[#1A1613]">
                            {rating}
                          </span>

                          <div className="flex items-center gap-2 flex-1">
                            <div className="flex gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <svg
                                  key={i}
                                  className={`w-6 h-6 ${
                                    i < rating
                                      ? "text-[#E6540B]"
                                      : "text-[#1A1613]/15"
                                  }`}
                                  fill="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                </svg>
                              ))}
                            </div>

                            <div className="h-2.5 flex-1 bg-[#1A1613]/10 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#E6540B] rounded-full transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>

                          <span className="w-10 sm:w-12 text-right text-md sm:text-base font-medium text-[#1A1613]">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="bg-[#FDF8ED] mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                  <h2 className="text-xl sm:text-2xl font-['Fraunces',serif] font-semibold text-[#1A1613]">
                    Product Reviews
                  </h2>

                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full sm:w-auto">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-[#1A1613]/80 whitespace-nowrap">
                        Filter by:
                      </span>
                      <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="cursor-pointer flex-1 px-3 py-2.5 bg-[#F4EEDF] border border-[#1A1613]/15 rounded-lg text-sm text-[#1A1613] focus:ring-1 focus:ring-[#E6540B] focus:border-[#E6540B]"
                      >
                        <option value="allstar">All Stars</option>
                        <option value="5star" disabled={!hasRating(5)}>
                          5 Stars
                        </option>
                        <option value="4star" disabled={!hasRating(4)}>
                          4 Stars
                        </option>
                        <option value="3star" disabled={!hasRating(3)}>
                          3 Stars
                        </option>
                        <option value="2star" disabled={!hasRating(2)}>
                          2 Stars
                        </option>
                        <option value="1star" disabled={!hasRating(1)}>
                          1 Star
                        </option>
                      </select>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-[#1A1613]/80 whitespace-nowrap">
                        Sort by:
                      </span>
                      <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                        className="cursor-pointer flex-1 px-3 py-2.5 bg-[#F4EEDF] border border-[#1A1613]/15 rounded-lg text-sm text-[#1A1613] focus:ring-1 focus:ring-[#E6540B] focus:border-[#E6540B]"
                      >
                        <option value="default">Default</option>
                        <option value="recent">Most Recent</option>
                        <option value="highest">Highest Rating</option>
                        <option value="lowest">Lowest Rating</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1 border-t border-[#1A1613]/15">
                {currentItems.map((review) => {
                  const renderAvatar = (size: "small" | "large") => {
                    const avatarSize =
                      size === "small" ? "w-10 h-10" : "w-12 h-12";
                    const textSize = size === "small" ? "text-xl" : "text-2xl";

                    if (review.User?.avatar) {
                      return (
                        <img
                          className={`${avatarSize} rounded-full object-cover border-2 border-[#E6540B]/30`}
                          src={review.User?.avatar}
                          alt={`${review.User?.username}'s avatar`}
                        />
                      );
                    }

                    const initials =
                      review.User?.username?.charAt(0).toUpperCase() || "U";

                    return (
                      <div
                        className={`${avatarSize} rounded-full bg-[#E6540B] text-[#FDF8ED] flex items-center justify-center font-bold border-2 border-[#E6540B]/30 ${textSize}`}
                      >
                        {initials}
                      </div>
                    );
                  };
                  return (
                    <div
                      key={review.id}
                      className="bg-[#FDF8ED] rounded border-b border-[#1A1613]/15 p-5 md:p-2"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        <div className="flex-shrink-0 w-full sm:w-48">
                          <div className="flex items-center gap-3 mb-2">
                            {renderAvatar("large")}
                            <div>
                              <p className="font-medium text-[#1A1613]">
                                {review.User?.username || "Anonymous"}
                              </p>
                              <p className="text-sm text-[#1A1613]/60">
                                {formatDate(review.createdAt)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`w-5 h-5 ${
                                  i < Number(review.rating || 0)
                                    ? "text-[#E6540B]"
                                    : "text-[#1A1613]/15"
                                }`}
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                              </svg>
                            ))}
                          </div>

                          {review.userId === user?.id && (
                            <div className="mt-4 flex flex-wrap gap-3">
                              <button
                                type="button"
                                onClick={() => openEditModal(review)}
                                className="inline-flex cursor-pointer items-center justify-center py-2 w-full bg-[#E6540B] hover:bg-[#c94806] text-[#FDF8ED] rounded-lg transition-colors text-md"
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                              </button>
                              <button
                                onClick={() => requestDelete(review)}
                                className="inline-flex cursor-pointer items-center justify-center py-2 w-full bg-[#9B3A2E] hover:bg-[#7a2e24] text-[#FDF8ED] rounded-lg transition-colors text-md"
                              >
                                <Trash2 className="w-4 h-4 mr-1 " />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="flex-1">
                          <p className="text-[#1A1613]/80 leading-relaxed">
                            {review.message}
                          </p>

                          {review.reviewImage && (
                            <img
                              src={review.reviewImage || ""}
                              alt=""
                              className="mt-4 rounded-lg max-h-40 object-cover"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="mt-4 mb-4 flex justify-center">
                  <nav
                    className="inline-flex rounded-md shadow-sm"
                    aria-label="Pagination"
                  >
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="cursor-pointer relative inline-flex items-center px-4 py-2 rounded-l-md border border-[#1A1613]/15 bg-[#FDF8ED] text-sm font-medium text-[#1A1613] hover:bg-[#F4EEDF] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <button
                          key={page}
                          onClick={() => paginate(page)}
                          className={`cursor-pointer relative inline-flex items-center px-4 py-2 border border-[#1A1613]/15 text-sm font-medium ${
                            currentPage === page
                              ? "bg-[#E6540B] text-[#FDF8ED] border-[#E6540B]"
                              : "bg-[#FDF8ED] text-[#1A1613] hover:bg-[#F4EEDF]"
                          }`}
                        >
                          {page}
                        </button>
                      ),
                    )}

                    <button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="cursor-pointer relative inline-flex items-center px-4 py-2 rounded-r-md border border-[#1A1613]/15 bg-[#FDF8ED] text-sm font-medium text-[#1A1613] hover:bg-[#F4EEDF] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              )}
            </>
          )}
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
                Are you sure you want to delete this review? This action
                cannot be undone.
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
