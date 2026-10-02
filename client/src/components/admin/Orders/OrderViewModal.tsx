import React from "react";
import {
  X,
  Copy,
  Check,
  User,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  SlidersHorizontal,
  Clock,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  ImageIcon,
  Printer,
} from "lucide-react";
import { AdminOrder } from "../../../types/admin/orderTypes";

interface OrderViewModalProps {
  order: AdminOrder | null;
  onClose: () => void;
  onOpenStatusModal: (order: AdminOrder) => void;
  onCopyId: (id: string, e: React.MouseEvent) => void;
  copiedId: string | null;
  formatDate: (dateStr?: string) => string;
}

const OrderViewModal: React.FC<OrderViewModalProps> = ({
  order,
  onClose,
  onOpenStatusModal,
  onCopyId,
  copiedId,
  formatDate,
}) => {
  if (!order) return null;

  const items = order.OrderDetails || [];
  const payment = order.Payment;
  const user = order.User;

  const itemsSubtotal = items.reduce((sum, item) => {
    const price = Number(item.Product?.productPrice) || 0;
    const qty = Number(item.quantity) || 1;
    return sum + price * qty;
  }, 0);
  const totalAmount = Number(order.totalAmount || 0);
  const shippingFee = Math.max(0, totalAmount - itemsSubtotal);

  const handlePrintSlip = () => {
    if (!order) return;

    // Create an isolated hidden iframe for printing
    const printFrame = document.createElement("iframe");
    printFrame.style.position = "fixed";
    printFrame.style.right = "0";
    printFrame.style.bottom = "0";
    printFrame.style.width = "0";
    printFrame.style.height = "0";
    printFrame.style.border = "0";
    document.body.appendChild(printFrame);

    const frameDoc =
      printFrame.contentDocument || printFrame.contentWindow?.document;
    if (!frameDoc) return;

    const itemsRows = items
      .map((item, idx) => {
        const prod = item.Product;
        const price = Number(prod?.productPrice || 0);
        const qty = item.quantity || 1;
        const lineTotal = price * qty;
        return `
          <tr>
            <td style="padding: 8px 10px; border-bottom: 1px solid #EFEAE0; color: #1A1613; font-size: 12px;">${idx + 1}</td>
            <td style="padding: 8px 10px; border-bottom: 1px solid #EFEAE0; color: #1A1613; font-size: 12px; font-weight: 600;">
              ${prod?.productName || "Product"}
            </td>
            <td style="padding: 8px 10px; border-bottom: 1px solid #EFEAE0; color: #1A1613; font-size: 12px; text-align: center;">${qty}</td>
            <td style="padding: 8px 10px; border-bottom: 1px solid #EFEAE0; color: #1A1613; font-size: 12px; text-align: right;">Rs. ${price.toLocaleString()}</td>
            <td style="padding: 8px 10px; border-bottom: 1px solid #EFEAE0; color: #1A1613; font-size: 12px; font-weight: 600; text-align: right;">Rs. ${lineTotal.toLocaleString()}</td>
          </tr>
        `;
      })
      .join("");

    const slipHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Order_${order.id.slice(0, 8)}_Slip</title>
          <style>
            @page {
              size: portrait;
              margin: 0mm; /* Suppresses browser URL and page headers/footers */
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
              color: #1A1613;
              background: #FFFFFF;
              padding: 14mm 16mm;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .slip-container {
              max-width: 100%;
              margin: 0 auto;
            }
            .header-table {
              width: 100%;
              margin-bottom: 16px;
              border-bottom: 2px solid #E6540B;
              padding-bottom: 12px;
            }
            .brand-name {
              font-size: 22px;
              font-weight: 800;
              color: #E6540B;
              letter-spacing: -0.5px;
            }
            .brand-tagline {
              font-size: 11px;
              color: #716D68;
              margin-top: 2px;
            }
            .slip-title {
              text-align: right;
              font-size: 16px;
              font-weight: 700;
              color: #1A1613;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .slip-meta {
              text-align: right;
              font-size: 11px;
              color: #716D68;
              margin-top: 3px;
            }
            .grid-table {
              width: 100%;
              margin-bottom: 16px;
              border-collapse: separate;
              border-spacing: 10px;
            }
            .card-box {
              background: #FDF8ED;
              border: 1px solid #E8DFCE;
              border-radius: 8px;
              padding: 12px 14px;
              font-size: 11px;
              vertical-align: top;
            }
            .card-title {
              font-size: 10px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.8px;
              color: #928B80;
              margin-bottom: 6px;
            }
            .card-row {
              margin-bottom: 3px;
              line-height: 1.35;
            }
            .card-bold {
              font-weight: 700;
              color: #1A1613;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 16px;
              border: 1px solid #E8DFCE;
              border-radius: 8px;
              overflow: hidden;
            }
            .items-table th {
              background: #F4EEDF;
              padding: 8px 10px;
              font-size: 10px;
              font-weight: 700;
              text-transform: uppercase;
              color: #4A443B;
              letter-spacing: 0.5px;
              text-align: left;
              border-bottom: 1px solid #E8DFCE;
            }
            .summary-card {
              float: right;
              width: 250px;
              background: #FDF8ED;
              border: 1px solid #E8DFCE;
              border-radius: 8px;
              padding: 12px 14px;
              margin-bottom: 16px;
            }
            .summary-line {
              display: flex;
              justify-content: space-between;
              font-size: 11px;
              margin-bottom: 4px;
              color: #555047;
            }
            .summary-line.total {
              border-top: 1px solid #DDD4C3;
              padding-top: 6px;
              margin-top: 6px;
              font-size: 13px;
              font-weight: 800;
              color: #E6540B;
            }
            .badge {
              display: inline-block;
              padding: 2px 7px;
              border-radius: 9999px;
              font-size: 9px;
              font-weight: 700;
            }
            .badge-delivered { background: #ECFDF5; color: #047857; }
            .badge-preparation { background: #EFF6FF; color: #1D4ED8; }
            .badge-transit { background: #EEF2FF; color: #4338CA; }
            .badge-pending { background: #FFFBEB; color: #B45309; }
            .badge-cancelled { background: #FFF1F2; color: #BE123C; }
            .badge-paid { background: #ECFDF5; color: #047857; font-weight: 700; }
            .badge-unpaid { background: #FFFBEB; color: #B45309; font-weight: 700; }
            .footer-note {
              clear: both;
              margin-top: 24px;
              padding-top: 12px;
              border-top: 1px dashed #DDD4C3;
              text-align: center;
              font-size: 10px;
              color: #8A847A;
            }
          </style>
        </head>
        <body>
          <div class="slip-container">
            <table class="header-table">
              <tr>
                <td style="vertical-align: middle;">
                  <div class="brand-name">Truvora.</div>
                  <div class="brand-tagline">Quality Everyday Goods • Verified Order Slip</div>
                </td>
                <td style="vertical-align: middle;">
                  <div class="slip-title">Packing Slip</div>
                  <div class="slip-meta"><strong>Order:</strong> #${order.id.slice(0, 8)}</div>
                  <div class="slip-meta"><strong>Date:</strong> ${formatDate(order.createdAt)}</div>
                </td>
              </tr>
            </table>

            <table class="grid-table">
              <tr>
                <td class="card-box" style="width: 50%;">
                  <div class="card-title">Customer & Shipping Information</div>
                  <div class="card-row"><span class="card-bold">${user?.username || "Guest Customer"}</span></div>
                  ${user?.email ? `<div class="card-row" style="color: #555047;">${user.email}</div>` : ""}
                  <div class="card-row" style="color: #555047;">Phone: ${order.phoneNumber || "N/A"}</div>
                  <div class="card-row" style="margin-top: 5px; padding-top: 5px; border-top: 1px solid #EFEAE0;">
                    <strong>Delivery Address:</strong><br />
                    ${order.shippingAddress || "Standard delivery address"}
                  </div>
                </td>
                <td class="card-box" style="width: 50%;">
                  <div class="card-title">Payment & Fulfillment Status</div>
                  <div class="card-row">
                    Payment Method: <span class="card-bold">${payment?.paymentMethod || "COD"}</span>
                  </div>
                  <div class="card-row">
                    Payment Status: <span class="badge ${payment?.paymentStatus === "Paid" ? "badge-paid" : "badge-unpaid"}">${payment?.paymentStatus || "Pending"}</span>
                  </div>
                  <div class="card-row" style="margin-top: 5px; padding-top: 5px; border-top: 1px solid #EFEAE0;">
                    Order Status: <span class="badge badge-${order.orderStatus.toLowerCase().replace(/\s+/g, "")}">${order.orderStatus}</span>
                  </div>
                </td>
              </tr>
            </table>

            <table class="items-table">
              <thead>
                <tr>
                  <th style="width: 30px;">#</th>
                  <th>Product Details</th>
                  <th style="width: 50px; text-align: center;">Qty</th>
                  <th style="width: 90px; text-align: right;">Unit Price</th>
                  <th style="width: 100px; text-align: right;">Line Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRows || '<tr><td colspan="5" style="padding: 12px; text-align: center; color: #888;">No items in this order</td></tr>'}
              </tbody>
            </table>

            <div style="overflow: hidden;">
              <div class="summary-card">
                <div class="summary-line">
                  <span>Items Subtotal:</span>
                  <span style="font-weight: 600; color: #1A1613;">Rs. ${itemsSubtotal.toLocaleString()}</span>
                </div>
                <div class="summary-line">
                  <span>Delivery / Shipping:</span>
                  <span style="font-weight: 600; color: #1A1613;">${shippingFee > 0 ? `Rs. ${shippingFee.toLocaleString()}` : "Free"}</span>
                </div>
                <div class="summary-line total">
                  <span>Total Amount:</span>
                  <span>Rs. ${totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div class="footer-note">
              Thank you for shopping with Truvora! For order tracking or returns, visit truvora.com or contact support.
            </div>
          </div>
        </body>
      </html>
    `;

    frameDoc.open();
    frameDoc.write(slipHtml);
    frameDoc.close();

    printFrame.contentWindow?.focus();
    setTimeout(() => {
      printFrame.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(printFrame)) {
          document.body.removeChild(printFrame);
        }
      }, 2000);
    }, 200);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Delivered":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Delivered</span>
          </span>
        );
      case "In Transit":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1 text-xs font-bold text-indigo-700">
            <Truck className="w-3.5 h-3.5" />
            <span>In Transit</span>
          </span>
        );
      case "Preparation":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-bold text-blue-700">
            <Package className="w-3.5 h-3.5" />
            <span>Preparation</span>
          </span>
        );
      case "Cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-xs font-bold text-rose-700">
            <XCircle className="w-3.5 h-3.5" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-700">
            <Clock className="w-3.5 h-3.5" />
            <span>Pending</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-2xl border border-[#1A1613]/15 bg-[#FFFDF8] p-5 sm:p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1A1613]/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#E6540B]/10 text-[#E6540B] flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#1A1613]">
                  Order #{order.id.slice(0, 8)}
                </h3>
                <button
                  onClick={(e) => onCopyId(order.id, e)}
                  title="Copy Full Order ID"
                  className="text-[#1A1613]/40 hover:text-[#E6540B] transition-colors"
                >
                  {copiedId === order.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-[#1A1613]/55">
                Placed on {formatDate(order.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {getStatusBadge(order.orderStatus)}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#1A1613]/40 hover:text-[#1A1613] hover:bg-[#F4EEDF] transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2-Column Info Grid: Customer & Payment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Customer & Delivery Card */}
          <div className="p-3.5 rounded-xl bg-[#FDF8ED] border border-[#1A1613]/10 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#1A1613]/45 block">
              Customer &amp; Shipping
            </span>

            <div className="flex items-center gap-2 font-bold text-[#1A1613]">
              <User className="w-3.5 h-3.5 text-[#E6540B]" />
              <span>{user?.username || "Guest Customer"}</span>
            </div>

            {user?.email && (
              <div className="flex items-center gap-2 text-[#1A1613]/70">
                <Mail className="w-3.5 h-3.5 text-[#1A1613]/40" />
                <span className="truncate">{user.email}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-[#1A1613]/70">
              <Phone className="w-3.5 h-3.5 text-[#1A1613]/40" />
              <span>{order.phoneNumber || "No phone provided"}</span>
            </div>

            <div className="flex items-start gap-2 text-[#1A1613]/70 pt-1 border-t border-[#1A1613]/6">
              <MapPin className="w-3.5 h-3.5 text-[#1A1613]/40 mt-0.5 shrink-0" />
              <span className="leading-relaxed">
                {order.shippingAddress || "Standard delivery address"}
              </span>
            </div>
          </div>

          {/* Payment & Order Summary Card */}
          <div className="p-3.5 rounded-xl bg-[#FDF8ED] border border-[#1A1613]/10 space-y-2 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#1A1613]/45 block mb-2">
                Payment Details
              </span>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[#1A1613]/60">Payment Method:</span>
                  <span className="font-bold text-[#1A1613] uppercase">
                    {payment?.paymentMethod || "COD"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#1A1613]/60">Payment Status:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                      payment?.paymentStatus === "Paid"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : payment?.paymentStatus === "Failed"
                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {payment?.paymentStatus || "Pending"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#1A1613]/60">Order Date:</span>
                  <span className="text-[#1A1613]">
                    {formatDate(order.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#1A1613]/8 space-y-1">
              <div className="flex items-center justify-between text-xs text-[#1A1613]/65">
                <span>Items Subtotal:</span>
                <span className="font-semibold text-[#1A1613]">
                  Rs. {itemsSubtotal.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-[#1A1613]/65">
                <span>Shipping / Delivery:</span>
                <span className="font-semibold text-[#1A1613]">
                  {shippingFee > 0 ? `Rs. ${shippingFee.toLocaleString()}` : "Free"}
                </span>
              </div>
              <div className="pt-1.5 border-t border-[#1A1613]/8 flex items-baseline justify-between">
                <span className="font-bold text-xs text-[#1A1613]">
                  Total Amount:
                </span>
                <span className="text-base font-bold text-[#E6540B]">
                  Rs. {totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Ordered Items List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-[#1A1613] uppercase tracking-wider">
              Ordered Products ({items.length})
            </h4>
          </div>

          <div className="divide-y divide-[#1A1613]/8 border border-[#1A1613]/10 rounded-xl overflow-hidden bg-white max-h-56 overflow-y-auto">
            {items.length === 0 ? (
              <div className="p-4 text-center text-xs text-[#1A1613]/50">
                No items recorded in this order.
              </div>
            ) : (
              items.map((item, idx) => {
                const prod = item.Product;
                const price = prod?.productPrice || 0;
                const qty = item.quantity || 1;
                const lineTotal = price * qty;

                return (
                  <div
                    key={item.id || `item-${idx}`}
                    className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-[#FDF8ED]/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-11 h-11 rounded-lg overflow-hidden border border-[#1A1613]/10 bg-[#FDF8ED] shrink-0 flex items-center justify-center">
                        <ImageIcon className="w-5 h-5 text-[#1A1613]/25 shrink-0" />
                        {prod?.productImage && (
                          <img
                            src={prod.productImage}
                            alt={prod?.productName || "Product"}
                            className="absolute inset-0 w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="font-bold text-[#1A1613] truncate max-w-[220px]">
                          {prod?.productName || "Product"}
                        </p>
                        <p className="text-[11px] text-[#1A1613]/50 mt-0.5">
                          Rs. {price.toLocaleString()} &times; {qty}{" "}
                          {qty === 1 ? "unit" : "units"}
                        </p>
                      </div>
                    </div>

                    <div className="text-right font-bold text-sm text-[#1A1613] whitespace-nowrap">
                      Rs. {lineTotal.toLocaleString()}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[#1A1613]/10">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenStatusModal(order);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E6540B] text-xs font-semibold text-white hover:bg-[#d44c0a] shadow-xs active:scale-95 transition-all"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Update Order Status</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintSlip}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#1A1613]/15 text-xs font-semibold text-[#1A1613] hover:bg-[#F4EEDF] transition-all cursor-pointer"
              title="Print Order / Packing Slip"
            >
              <Printer className="w-3.5 h-3.5 text-[#1A1613]/70" />
              <span className="hidden sm:inline">Print Slip</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#1A1613]/15 text-xs font-semibold text-[#1A1613] hover:bg-[#F4EEDF] transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderViewModal;
