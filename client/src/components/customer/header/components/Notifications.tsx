import { Bell } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom';

const Notifications = () => {
  const [, setIsOpen] = useState(false);
        const [isNotificationsOpen, setIsNotificationsOpen] = useState(false); 
        const notificationsRef = useRef<HTMLDivElement>(null);

        const unreadNotifications = 2;


  const markAllAsRead = () => {
    alert("All notifications marked as read!");
  };

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          notificationsRef.current &&
          !notificationsRef.current.contains(event.target as Node)
        ) {
          setIsNotificationsOpen(false);
        }
      };
  
      if (isNotificationsOpen) {
        document.addEventListener("mousedown", handleClickOutside);
      }
  
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isNotificationsOpen]);

  return (
    <div className="relative" ref={notificationsRef}>
                <button
                  type="button"
                  className="cursor-pointer relative text-[#1A1613]/80 hover:text-[#E6540B] p-1.5 rounded-full transition-colors"
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                >
                  <Bell className="h-6 w-6" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {unreadNotifications}
                    </span>
                  )}
                </button>

                {isNotificationsOpen && (
                  <div
                    className="
      fixed left-3 right-3 top-16
      sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-3 sm:w-80
      max-w-full sm:max-w-none
      bg-[#FDF8ED] rounded-xl shadow-2xl border border-[#1A1613]/10 overflow-hidden z-50
    "
                  >
                    <div className="flex items-center justify-between px-4 sm:px-5 py-3 bg-gradient-to-r from-[#E6540B] to-[#c94806] text-white">
                      <h3 className="font-['Fraunces',serif] font-semibold text-sm sm:text-base">
                        Notifications
                      </h3>
                      <button
                        onClick={markAllAsRead}
                        className="cursor-pointer text-xs underline hover:text-white/80 transition-colors"
                      >
                        Mark all read
                      </button>
                    </div>

                    <div className="max-h-[60vh] sm:max-h-96 overflow-y-auto">
                      <div className="cursor-pointer p-3 sm:p-4 border-b border-[#1A1613]/10 hover:bg-[#F4EEDF] transition-colors flex gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-green-100 flex items-center justify-center">
                            <span className="text-green-600 text-lg sm:text-xl">
                              ✓
                            </span>
                          </div>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-[#1A1613] break-words">
                            Your booking has been{" "}
                            <span className="text-green-600 font-semibold">
                              confirmed
                            </span>
                          </p>
                          <p className="text-xs text-[#1A1613]/60 mt-1">
                            2 minutes ago
                          </p>
                        </div>
                      </div>

                      <div className="cursor-pointer p-3 sm:p-4 border-b border-[#1A1613]/10 hover:bg-[#F4EEDF] transition-colors flex gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#E6540B]/10 flex items-center justify-center">
                            <span className="text-[#E6540B] text-lg sm:text-xl">
                              %
                            </span>
                          </div>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-[#1A1613] break-words">
                            Special offer! Get{" "}
                            <span className="text-[#E6540B] font-semibold">
                              20% off
                            </span>{" "}
                            your next booking
                          </p>
                          <p className="text-xs text-[#1A1613]/60 mt-1">
                            1 hour ago
                          </p>
                        </div>
                      </div>

                      <div className="cursor-pointer p-3 sm:p-4 hover:bg-[#F4EEDF] transition-colors flex gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-green-100 flex items-center justify-center">
                            <span className="text-green-600 text-lg sm:text-xl">
                              $
                            </span>
                          </div>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-[#1A1613] break-words">
                            Payment of{" "}
                            <span className="font-semibold">$150</span> was
                            successful
                          </p>
                          <p className="text-xs text-[#1A1613]/60 mt-1">
                            Yesterday
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="px-4 sm:px-5 py-3 bg-[#F4EEDF] text-center border-t border-[#1A1613]/10">
                      <Link
                        to="/notifications"
                        className="text-[#E6540B] hover:text-[#c94806] font-medium text-sm transition-colors"
                        onClick={() => {
                          setIsNotificationsOpen(false);
                          setIsOpen(false);
                        }}
                      >
                        View All Notifications
                      </Link>
                    </div>
                  </div>
                )}
              </div>
  )
}

export default Notifications