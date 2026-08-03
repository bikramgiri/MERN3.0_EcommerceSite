import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bell, 
  CheckCircle2, 
  MessageCircle, 
  AlertCircle, 
  ShoppingBag, 
  X, 
  Clock 
} from 'lucide-react';
import ClickOutside from '../ClickOutside';

interface Notification {
  id: string;
  type: 'success' | 'message' | 'warning' | 'sale';
  title: string;
  message: string;
  time: string;
  unread?: boolean;
}

const notifications: Notification[] = [
  { id: '1', type: 'success', title: 'Order completed', message: 'Your order #1234 has been completed', time: '4 hours ago', unread: true },
  { id: '2', type: 'message', title: 'New message', message: 'You have a new message from John Doe', time: '5 hours ago', unread: true },
  { id: '3', type: 'warning', title: 'Payment pending', message: 'Invoice #5678 payment is pending', time: '6 hours ago', unread: false },
  { id: '4', type: 'sale', title: 'New sale', message: 'Product "Wireless Headphones" sold', time: '9 hours ago', unread: false },
];

const DropdownNotifications: React.FC = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifying, setNotifying] = useState(true);

  const unreadCount = notifications.filter(n => n.unread).length;

  const getIconAndColor = (type: string) => {
    switch (type) {
      case 'success':
        return { 
          icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
          bg: 'bg-green-100',
          border: 'border-green-400'
        };
      case 'message':
        return { 
          icon: <MessageCircle className="h-5 w-5 text-blue-600" />,
          bg: 'bg-blue-100',
          border: 'border-blue-400'
        };
      case 'warning':
        return { 
          icon: <AlertCircle className="h-5 w-5 text-yellow-600" />,
          bg: 'bg-yellow-100',
          border: 'border-yellow-400'
        };
      case 'sale':
        return { 
          icon: <ShoppingBag className="h-5 w-5 text-purple-600" />,
          bg: 'bg-purple-100 dark:bg-purple-900/30',
          border: 'border-purple-400'
        };
      default:
        return { icon: null, bg: '', border: 'border-gray-300' };
    }
  };

  return (
    <ClickOutside onClick={() => setDropdownOpen(false)} className="relative">
      {/* Bell Button */}
      <button
      type='button'
        onClick={() => {
          setDropdownOpen(!dropdownOpen);
          if (notifying) setNotifying(false);
        }}
        // outline-none focus:outline-none focus:ring-0
        className="relative cursor-pointer outline-none focus:outline-none focus-visible:outline-none flex h-11 w-11 items-center justify-center p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        aria-label="Open notifications"
      >
        <Bell className="h-7 w-7" />
        {notifying && unreadCount > 0 && (
          <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-xs font-semibold">
            <p>{unreadCount}</p>
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {dropdownOpen && (
        <div
          className={`
            absolute right-0 sm:right-0 mt-4 w-70 sm:w-92
            max-h-[480px] flex flex-col rounded-xl 
            border border-gray-300 bg-gray-100 shadow-md 
            overflow-hidden z-50
            transform transition-all duration-200 ease-out
            origin-top-right scale-95 opacity-0
            ${dropdownOpen ? 'scale-100 opacity-100' : ''}
          `}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-gray-100">
            <div className="flex items-center gap-3">
              <h5 className="text-lg font-semibold text-gray-600">
                Notifications
              </h5>
              {unreadCount > 0 && (
                <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                  {unreadCount} new
                </span>
              )}
            </div>

            <button
            type='button'
              onClick={() => setDropdownOpen(false)}
              className="outline-none focus:outline-none focus-visible:outline-none p-1.5 cursor-pointer rounded-full bg-gray-300 hover:bg-gray-400 transition-colors"
              aria-label="Close notifications"
            >
              <X className="h-5 w-5 text-black" />
            </button>
          </div>

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                No new notifications
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {notifications.map((notif) => {
                  const { icon, border } = getIconAndColor(notif.type);
                  return (
                    <li
                      key={notif.id}
                      className={`
                        flex cursor-pointer gap-4 py-2 border-b border-gray-300 transition-colors
                        ${notif.unread 
                          ? 'bg-gray-100' 
                          : 'hover:bg-gray-200'}
                      `}
                    >
                      {/* Left colored border */}
                      <div className={`h-full rounded-full ${border} flex-shrink-0`} />

                      {/* Icon */}
                      <div className="p-2 rounded-full">{icon}</div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {notif.title}
                        </p>
                        <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                          {notif.message}
                        </p>
                        <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {notif.time}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-gray-200 bg-gray-100 text-center">
            <Link
              to="/notifications"
              onClick={() => setDropdownOpen(false)}
              className="outline-none focus:outline-none text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </ClickOutside>
  );
};

export default DropdownNotifications;