import { useAppSelector } from '../../../hooks/hooks';
import { OrderStatus, PaymentStatus } from '../../../types/customer/checkoutTypes';

const orderStatusStyles: Record<string, string> = {
  [OrderStatus.Delivered]: 'bg-[#2F6B4F]/10 text-[#2F6B4F]',
  [OrderStatus.Cancelled]: 'bg-[#9B3A2E]/10 text-[#9B3A2E]',
  [OrderStatus.Pending]: 'bg-[#E6540B]/10 text-[#E6540B]',
  [OrderStatus.Preparation]: 'bg-[#B9860B]/10 text-[#B9860B]',
  [OrderStatus.InTransit]: 'bg-[#1A1613]/10 text-[#1A1613]/70',
};

const paymentStatusStyles: Record<string, string> = {
  [PaymentStatus.Paid]: 'bg-[#2F6B4F]/10 text-[#2F6B4F]',
  [PaymentStatus.Pending]: 'bg-[#E6540B]/10 text-[#E6540B]',
  [PaymentStatus.Failed]: 'bg-[#9B3A2E]/10 text-[#9B3A2E]',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const TableTwo = () => {
  const { recentOrders, status } = useAppSelector((state) => state.datas);

  return (
    <div className="rounded-sm border border-[#1A1613]/10 bg-[#FDF8ED] shadow-md shadow-[#1A1613]/5">
      <div className="py-6 px-4 md:px-6 xl:px-7.5">
        <h4 className="font-['Fraunces',serif] text-xl text-[#1A1613]">
          Recent Orders
        </h4>
      </div>

      <div className="grid grid-cols-6 border-t border-[#1A1613]/10 bg-[#F4EEDF] py-3 px-4 sm:grid-cols-8 md:px-6 2xl:px-7.5">
        <div className="col-span-2 flex items-center sm:col-span-2">
          <p className="font-['IBM_Plex_Mono',monospace] text-xs font-medium uppercase tracking-wider text-[#1A1613]/60">
            Order
          </p>
        </div>
        <div className="col-span-2 hidden items-center sm:flex">
          <p className="font-['IBM_Plex_Mono',monospace] text-xs font-medium uppercase tracking-wider text-[#1A1613]/60">
            Customer
          </p>
        </div>
        <div className="col-span-1 flex items-center">
          <p className="font-['IBM_Plex_Mono',monospace] text-xs font-medium uppercase tracking-wider text-[#1A1613]/60">
            Amount
          </p>
        </div>
        <div className="col-span-2 hidden items-center sm:flex">
          <p className="font-['IBM_Plex_Mono',monospace] text-xs font-medium uppercase tracking-wider text-[#1A1613]/60">
            Payment
          </p>
        </div>
        <div className="col-span-3 flex items-center justify-end sm:col-span-1">
          <p className="font-['IBM_Plex_Mono',monospace] text-xs font-medium uppercase tracking-wider text-[#1A1613]/60">
            Status
          </p>
        </div>
      </div>

      {status === 'loading' && recentOrders.length === 0 && (
        <div className="py-10 text-center text-sm text-[#1A1613]/50">
          Loading recent orders...
        </div>
      )}

      {status !== 'loading' && recentOrders.length === 0 && (
        <div className="py-10 text-center text-sm text-[#1A1613]/50">
          No orders yet.
        </div>
      )}

      {recentOrders.map((order) => (
        <div
          className="grid grid-cols-6 items-center border-t border-[#1A1613]/10 py-4 px-4 transition-colors hover:bg-[#F4EEDF]/60 sm:grid-cols-8 md:px-6 2xl:px-7.5"
          key={order.id}
        >
          <div className="col-span-2 flex flex-col">
            <p className="font-['IBM_Plex_Mono',monospace] text-xs text-[#1A1613]">
              #{order.id.slice(0, 8)}
            </p>
            <p className="mt-0.5 text-[11px] text-[#1A1613]/50">
              {formatDate(order.createdAt)}
            </p>
          </div>

          <div className="col-span-2 hidden sm:flex sm:flex-col">
            <p className="truncate text-sm text-[#1A1613]">
              {order.User?.username ?? '—'}
            </p>
            <p className="truncate text-[11px] text-[#1A1613]/50">
              {order.User?.email ?? ''}
            </p>
          </div>

          <div className="col-span-1 flex items-center">
            <p className="text-sm text-[#1A1613]">Rs {order.totalAmount}</p>
          </div>

          <div className="col-span-2 hidden sm:flex">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 font-['IBM_Plex_Mono',monospace] text-[11px] uppercase tracking-wide ${
                paymentStatusStyles[order.Payment?.paymentStatus] ?? 'bg-[#1A1613]/10 text-[#1A1613]/60'
              }`}
            >
              {order.Payment?.paymentMethod ?? '—'}
            </span>
          </div>

          <div className="col-span-3 flex items-center justify-end sm:col-span-1">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 font-['IBM_Plex_Mono',monospace] text-[11px] uppercase tracking-wide ${
                orderStatusStyles[order.orderStatus] ?? 'bg-[#1A1613]/10 text-[#1A1613]/60'
              }`}
            >
              {order.orderStatus}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TableTwo;