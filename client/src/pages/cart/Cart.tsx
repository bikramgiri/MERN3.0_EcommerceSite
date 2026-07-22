import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../hooks/hooks";
import {
  removeFromCart,
  updateCartItems,
} from "../../store/customer/cartSlice";
import { Loader2, Minus, Plus, Trash2 } from "lucide-react";
import Breadcrumb from "../../global/components/Breadcrumb";
import { getAverageRatingNumber } from "../../utils/helpers";
import { toast } from "react-toastify";

const Cart = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { cart } = useAppSelector((state) => state.cart);

  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleDeleteItem = async (cartId: string) => {
    setRemovingId(cartId);
    try {
      await dispatch(removeFromCart(cartId));
      toast.success("Item removed from cart");
    } finally {
      setRemovingId(null);
    }
  };

  const handleQuantityChange = async (productId: string, newQuantity: number) => {
    const quantity = Math.max(1, newQuantity);
    const item = cart.find((i) => i.productId === productId);
    if (!item) return;
    if (quantity > item.product.productStock) return;
    await dispatch(updateCartItems({ ...item, quantity }));
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce(
    (sum, item) => sum + item.product.productPrice * item.quantity,
    0,
  );
  const shipping = 70;
  const total = subtotal + shipping;

  return (
    <>
      {!cart || cart.length === 0 ? (
        <section className="py-16 sm:py-20 bg-[#FDF8ED] font-['Inter',sans-serif]">
          <div className="max-w-[1500px] mx-auto px-4 text-center">
            <Breadcrumb items={[{ label: "Cart" }]} />
            <h1 className="text-3xl sm:text-4xl font-['Fraunces',serif] font-bold text-[#1A1613] mb-4 sm:mb-6">
              Your Cart is Empty
            </h1>
            <p className="text-base sm:text-lg text-[#1A1613]/60 mb-8 sm:mb-10">
              Looks like you haven't added anything yet.
            </p>
            <Link
              to="/"
              className="inline-block px-6 sm:px-8 py-3 sm:py-4 bg-[#E6540B] text-[#FDF8ED] font-semibold rounded-xl hover:bg-[#c94806] transition"
            >
              Continue Shopping
            </Link>
          </div>
        </section>
      ) : (
        <section className="py-6 sm:py-8 md:py-12 bg-[#FDF8ED] pb-16 mt-10 md:pt-18 font-['Inter',sans-serif] text-[#1A1613] antialiased">
          <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mt-1 mb-4">
            <Breadcrumb items={[{ label: "Cart" }]} />
              <h1 className=" text-xl sm:text-2xl md:text-3xl font-['Fraunces',serif] font-bold text-[#1A1613]">
                Cart Products
              </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
              <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                {cart.map((item) => {
                  const averageRating = getAverageRatingNumber(
                    item.product.reviews,
                  );
                  const reviewCount = item.product.reviews?.length || 0;
                  const isRemoving = removingId === item.id;

                  return (
                    <div
                      key={item.productId}
                      className={`bg-[#FDF8ED] border border-[#1A1613]/10 rounded-xl p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6

              shadow-[0_-4px_25px_-8px_rgba(0,0,0,0.6),0_3px_20px_-8px_rgba(0,0,0,0.04)]
              dark:shadow-[0_-2px_34px_-14px_rgba(0,0,0,0.2),0_2px_14px_-8px_rgba(0,0,0,0.20)]

              hover:shadow-[0_-6px_26px_-6px_rgba(0,0,0,0.6),0_8px_16px_-6px_rgba(0,0,0,0.1)]
              hover:border-[#E6540B]/40
              dark:hover:shadow-[0_-8px_36px_-6px_rgba(0,0,0,0.12),0_6px_12px_-2px_rgba(0,0,0,0.14)]

              transition-all duration-500
              

              ${isRemoving ? "opacity-50 pointer-events-none" : ""}
              `}
                    >
                      <Link
                        to={`/productdetails/${item.product.id}`}
                        className="overflow-hidden flex-shrink-0 rounded-sm self-center sm:self-auto"
                      >
                        <img
                          src={item.product.productImage || "/placeholder.jpg"}
                          alt={item.product.productName}
                          className="w-full sm:w-40 md:w-50 h-48 sm:h-40 object-cover rounded-md bg-[#F4EEDF]"
                        />
                      </Link>

                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <span className="mb-2">
                          <Link
                            to={`/productdetails/${item.product.id}`}
                            className="text-lg sm:text-xl font-['Fraunces',serif] font-semibold text-[#1A1613] hover:text-[#E6540B] transition break-words"
                          >
                            {item.product.productName}
                          </Link>
                          <p className="text-xl sm:text-2xl font-['IBM_Plex_Mono',monospace] font-bold text-[#8A3B12] mt-2">
                            Rs. {item.product.productPrice}
                          </p>
                        </span>

                        <div className="flex items-center gap-1 mb-3 sm:mb-0">
                          <div className="flex items-center gap-1">
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
                          </div>
                          <span className="ml-1 text-sm font-medium text-[#1A1613]/80">
                            {averageRating}
                          </span>
                          <span className="text-sm text-[#1A1613]/50">
                            ({reviewCount})
                          </span>
                        </div>

                        <div className="flex flex-col xs:flex-row sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                          <div className="flex items-center justify-center sm:justify-start gap-4">
                            <button
                              onClick={() =>
                                handleQuantityChange(
                                  item.productId,
                                  item.quantity - 1,
                                )
                              }
                              disabled={item.quantity === 1 || isRemoving}
                              className="cursor-pointer p-1 rounded-xl border border-[#1A1613]/25 flex items-center justify-center hover:bg-[#F4EEDF] disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                              <Minus className="w-5 h-5 text-[#1A1613]" />
                            </button>

                            <span className="text-lg font-['IBM_Plex_Mono',monospace] font-medium text-[#1A1613]">
                              {item.quantity}
                            </span>

                            <button
                              onClick={() =>
                                handleQuantityChange(
                                  item.productId,
                                  item.quantity + 1,
                                )
                              }
                              disabled={
                                item.quantity >= item.product.productStock ||
                                isRemoving
                              }
                              className="cursor-pointer p-1 rounded-xl border border-[#1A1613]/25 flex items-center justify-center hover:bg-[#F4EEDF] disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                              <Plus className="w-5 h-5 text-[#1A1613]" />
                            </button>
                          </div>

                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            disabled={isRemoving}
                            className="px-3 py-3 cursor-pointer border border-[#1A1613]/15 text-[#9B3A2E] hover:text-[#7a2f24] font-medium flex items-center justify-center gap-2 bg-[#F4EEDF] text-base sm:text-lg rounded-xl hover:bg-[#9B3A2E]/10 transition shadow-sm disabled:opacity-70 disabled:cursor-not-allowed w-full sm:w-auto"
                          >
                            {isRemoving ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Removing...
                              </>
                            ) : (
                              <>
                                <Trash2 className="w-5 h-5" />
                                Remove
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="lg:col-span-1">
                <div
                  className="bg-[#FDF8ED] border border-[#1A1613]/10 rounded-xl p-5 sm:p-8 lg:sticky lg:top-20
              shadow-[0_-4px_25px_-8px_rgba(0,0,0,0.6),0_3px_20px_-8px_rgba(0,0,0,0.04)]
              dark:shadow-[0_-2px_34px_-14px_rgba(0,0,0,0.2),0_2px_14px_-8px_rgba(0,0,0,0.20)]

              hover:shadow-[0_-6px_26px_-6px_rgba(0,0,0,0.6),0_8px_16px_-6px_rgba(0,0,0,0.1)]
              dark:hover:shadow-[0_-8px_36px_-6px_rgba(0,0,0,0.12),0_6px_12px_-2px_rgba(0,0,0,0.14)]

              transition-shadow duration-500
              "
                >
                  <h2 className="text-xl sm:text-2xl font-['Fraunces',serif] font-bold text-[#1A1613] mb-4 sm:mb-6">
                    Order Summary
                  </h2>

                  <div className="space-y-3 sm:space-y-4 text-[#1A1613] text-sm sm:text-base">
                    <div className="flex justify-between">
                      <span>Total Items</span>
                      <span className="font-['IBM_Plex_Mono',monospace] font-semibold">
                        {totalItems}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-['IBM_Plex_Mono',monospace] font-semibold">
                        Rs. {subtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span className="font-['IBM_Plex_Mono',monospace] font-semibold text-green-700">
                        Rs. {shipping}
                      </span>
                    </div>
                    <div className="border-t border-[#1A1613]/10 pt-4 flex justify-between text-lg sm:text-xl font-bold">
                      <span className="font-['Fraunces',serif]">Total</span>
                      <span className="font-['IBM_Plex_Mono',monospace] text-[#8A3B12]">
                        Rs. {total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate("/checkout")}
                    className="cursor-pointer w-full mt-6 sm:mt-8 py-3.5 sm:py-4 bg-[#E6540B] text-[#FDF8ED] text-base sm:text-lg font-semibold rounded-xl hover:bg-[#c94806] transition shadow-md"
                  >
                    Proceed to Checkout
                  </button>

                  <div className="mt-6 sm:mt-8">
                    <label className="block text-sm font-medium text-[#1A1613] mb-2">
                      Promo Code or Gift Card
                    </label>
                    <div className="flex flex-col xs:flex-row sm:flex-row gap-3">
                      <input
                        type="text"
                        placeholder="Enter code"
                        className="flex-1 min-w-0 px-3 py-3 border border-[#1A1613]/15 rounded-xl bg-[#FDF8ED] text-[#1A1613] placeholder:text-[#1A1613]/40 focus:outline-none focus:ring-2 focus:ring-[#E6540B]/40"
                      />
                      <button className="cursor-pointer px-4 py-3 bg-[#E6540B] text-[#FDF8ED] font-medium rounded-xl hover:bg-[#c94806] transition shadow-md whitespace-nowrap">
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
};

export default Cart;