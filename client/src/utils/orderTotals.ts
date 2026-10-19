interface OrderAmounts {
  totalAmount: number | string;
  subtotalAmount?: number | string | null;
  shippingFee?: number | string | null;
  discountAmount?: number | string | null;
  couponCode?: string | null;
}

type PricedItem = { quantity: number; unitPrice?: number | string | null; Product?: { productPrice?: number } | null };

const toNumber = (value: number | string | null | undefined) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

/** Price paid for one item, falling back to today's price on orders placed before it was saved */
export const unitPriceOf = (item: PricedItem) =>
  item.unitPrice == null ? toNumber(item.Product?.productPrice) : toNumber(item.unitPrice);

export const itemsSubtotal = (items: PricedItem[]) =>
  items.reduce((sum, item) => sum + unitPriceOf(item) * item.quantity, 0);

/**
 * Subtotal, discount, delivery and total for an order. Orders placed since the
 * breakdown was saved use the saved values; older orders fall back to the item
 * prices, with delivery being whatever is left of the total.
 */
export const orderBreakdown = (order: OrderAmounts, itemsTotal: number) => {
  const total = toNumber(order.totalAmount);
  const discount = toNumber(order.discountAmount);
  const subtotal = order.subtotalAmount == null ? itemsTotal : toNumber(order.subtotalAmount);
  const shipping =
    order.shippingFee == null ? Math.max(0, total - subtotal + discount) : toNumber(order.shippingFee);
  return { subtotal, discount, shipping, total, couponCode: order.couponCode || null };
};
