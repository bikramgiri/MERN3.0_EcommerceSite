import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../../hooks/hooks";
import { Heart, Loader2, Minus, Plus } from "lucide-react";
import { BsMessenger, BsWhatsapp } from "react-icons/bs";
import { fetchSingleProduct } from "../../../../store/customer/productSlice";
import { Status } from "../../../../global/statuses";
import {
  AddToWishlist,
  removeFromWishlist,
} from "../../../../store/customer/wishlistSlice";
import { FaFacebook } from "react-icons/fa";
import Breadcrumb from "../../../../global/components/Breadcrumb";
import { toast } from "react-toastify";
import {
  addToCart,
  updateCartItems,
} from "../../../../store/customer/cartSlice";
import { useNavigate } from "react-router-dom";

interface SingleProductProps {
  productId: string;
}

const SingleProduct = ({ productId }: SingleProductProps) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { singleProduct, status } = useAppSelector((state) => state.product);
  const { wishlist } = useAppSelector((state) => state.wishlist);
  const { cart } = useAppSelector((state) => state.cart);

  useEffect(() => {
    if (productId && productId !== "undefined") {
      dispatch(fetchSingleProduct(productId));
    } else {
      console.error("Invalid product ID:", productId);
    }
  }, [dispatch, productId]);

  const [localQuantity, setLocalQuantity] = useState(1);

  const handleIncrease = () => {
    if (singleProduct && localQuantity < singleProduct.productStock) {
      setLocalQuantity((prev) => prev + 1);
    }
  };

  const handleDecrease = () => {
    if (localQuantity > 1) {
      setLocalQuantity((prev) => prev - 1);
    }
  };

  const handleAddToCart = async () => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }

    if (!singleProduct) return;

    const existingItem = cart.find((i) => i.productId === productId);

    try {
      if (existingItem) {
        await dispatch(
          updateCartItems({
            ...existingItem,
            quantity: existingItem.quantity + localQuantity,
          }),
        );
        toast.success("Cart updated successfully!");
      } else {
        await dispatch(addToCart(productId, localQuantity));
        toast.success("Product added to cart successfully!");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  };

  if (!singleProduct || status === Status.LOADING) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FDF8ED] to-[#FAF3E4]">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-[#E6540B] mx-auto mb-4" />
          <p className="text-xl text-[#1A1613]/70">Loading product.....</p>
        </div>
      </div>
    );
  }

  const isWishlisted = wishlist.some((item) => item.id === singleProduct.id);

  const handleWishlistToggle = async () => {
    if (isWishlisted) {
      dispatch(removeFromWishlist(singleProduct.id));
      toast.success("Product removed from wishlist!");
    } else {
      await dispatch(AddToWishlist({ id: singleProduct.id }));
      toast.success("Product added to wishlist!");
    }
  };

  const averageRating =
    singleProduct.reviews && singleProduct.reviews.length > 0
      ? (
          singleProduct.reviews.reduce(
            (acc, r) => acc + Number(r.rating || 0),
            0,
          ) / singleProduct.reviews.length
        ).toFixed(1)
      : "0.0";

  const reviewCount = singleProduct.reviews?.length || 0;

  return (
    <section className="py-8 md:py-8 bg-[#FDF8ED] font-['Inter',sans-serif] text-[#1A1613]">
      <div className="mt-10 ml-4 md:ml-9">
        <Breadcrumb  items={[{ label: "Products", href: "/products" }, { label: singleProduct.productName }]} />
      </div>

      <div className="flex flex-col lg:flex-row lg:gap-12 bg-[#FDF8ED] shadow-sm overflow-hidden">
        <div className="w-full lg:w-1/2 p-4 md:p-8 lg:p-10 bg-[#F4EEDF]">
          <div className="overflow-hidden rounded-sm shadow-md">
            <img
              className="w-full max-h-100 object-cover *:transition-transform duration-300 ease-in-out hover:scale-105"
              src={singleProduct.productImage}
              alt={singleProduct.productName}
            />
          </div>
        </div>

        <div className="w-full lg:w-1/2 p-6 md:p-8 lg:p-10">
          <h1 className="text-4xl md:text-3xl lg:text-4xl font-['Fraunces',serif] font-semibold text-[#1A1613] mb-4">
            {singleProduct.productName}
          </h1>

          <div className="flex items-center gap-4 mb-6">
            <span className="font-['IBM_Plex_Mono',monospace] text-2xl md:text-2xl font-bold text-[#8A3B12]">
              Rs. {singleProduct.productPrice}
            </span>
            {singleProduct.oldPrice && (
              <span className="text-xl text-[#1A1613]/50 line-through">
                Rs. {singleProduct.oldPrice}
              </span>
            )}
            {Boolean(singleProduct.productDiscount) &&
              singleProduct.productDiscount > 0 && (
                <span className="bg-[#9B3A2E] text-[#FDF8ED] px-3 py-1 rounded-full text-sm font-bold">
                  - {singleProduct.productDiscount}%
                </span>
              )}
          </div>

          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
            <div className="flex flex-wrap items-center gap-1 sm:gap-2">
              {reviewCount > 0 ? (
                <>
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-4 h-4 sm:w-5 sm:h-5 ${
                        i < Math.round(Number(averageRating))
                          ? "text-[#E6540B]"
                          : "text-[#1A1613]/15"
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <span className="ml-1 text-sm font-medium text-[#1A1613]/80">
                    {averageRating}
                  </span>
                  <a
                    href="#reviews"
                    className="cursor-pointer text-sm font-medium leading-none text-[#1A1613] underline hover:text-[#E6540B]"
                  >
                    ({reviewCount} Reviews)
                  </a>
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 text-[#1A1613]/15"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="ml-1 text-sm font-medium text-[#1A1613]/80">
                    0.0
                  </span>
                  <span className="text-sm text-[#1A1613]/50">(0)</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-4 sm:gap-5">
              <span className="text-md text-[#1A1613]/80 whitespace-nowrap">
                Share:
              </span>

              <div className="flex items-center gap-4 sm:gap-5">
                <button className="cursor-pointer text-blue-600 hover:text-blue-800 transition-colors">
                  <FaFacebook className="w-6 h-6 sm:w-7 sm:h-7" />
                </button>

                <button className="cursor-pointer text-green-600 hover:text-green-800 transition-colors">
                  <BsWhatsapp className="w-6 h-6 sm:w-7 sm:h-7" />
                </button>

                <button className="cursor-pointer text-blue-600 hover:text-blue-800 transition-colors">
                  <BsMessenger className="w-6 h-6 sm:w-7 sm:h-7" />
                </button>
              </div>
            </div>
          </div>

          <div className="block text-md font-medium text-[#1A1613]/70 mb-8">
            Quantity: {singleProduct.productStock}
          </div>

          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={handleDecrease}
              disabled={localQuantity <= 1}
              className="cursor-pointer w-10 h-10 flex items-center justify-center rounded-full border border-[#1A1613]/20 text-[#1A1613] hover:bg-[#F4EEDF] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Minus className="text-[#1A1613] h-4 w-4" />
            </button>
            <span className="w-12 text-center text-lg font-semibold text-[#1A1613]">
              {localQuantity}
            </span>
            <button
              onClick={handleIncrease}
              disabled={localQuantity >= singleProduct.productStock}
              className="cursor-pointer w-10 h-10 flex items-center justify-center rounded-full border border-[#1A1613]/20 text-[#1A1613] hover:bg-[#F4EEDF] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="text-[#1A1613] h-4 w-4" />
            </button>
          </div>

          <div className="prose max-w-none text-[#1A1613]/80 leading-relaxed mb-6">
            <p className="text-base">{singleProduct.productDescription}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-8">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={singleProduct.productStock === 0}
              className="cursor-pointer flex-1 disabled:bg-[#1A1613]/20 disabled:cursor-not-allowed flex items-center justify-center rounded-xl px-8 py-4 text-base font-semibold text-[#FDF8ED] bg-[#E6540B] hover:bg-[#c94806] transition-colors shadow-md"
            >
              <svg
                className="w-6 h-6 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              Add to Cart
            </button>

            <button
              type="button"
              onClick={handleWishlistToggle}
              className={`cursor-pointer flex flex-1 gap-3 items-center justify-center rounded-xl px-8 py-2 text-base font-semibold border-2 transition-colors ${
                isWishlisted
                  ? "text-[#9B3A2E] border-[#9B3A2E] bg-[#9B3A2E]/10"
                  : "text-[#9B3A2E] border-[#9B3A2E] hover:bg-[#9B3A2E]/10"
              }`}
            >
              <Heart
                className="w-6 h-6"
                fill={isWishlisted ? "currentColor" : "none"}
              />
              Add to Favourite
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SingleProduct;
