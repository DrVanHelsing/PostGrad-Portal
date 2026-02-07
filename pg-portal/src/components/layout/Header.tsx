import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getNotificationsForUser } from '../../data/mockData';
import {
  HiOutlineBell,
  HiOutlineMagnifyingGlass,
  HiOutlineXMark,
  HiOutlineChevronDown,
} from 'react-icons/hi2';
import { format } from 'date-fns';

export default function Header() {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  if (!user) return null;

  const notifications = getNotificationsForUser(user.id);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-100/80 px-8 py-3.5 sticky top-0 z-30">
      <div className="flex items-center justify-between">
        {/* Search */}
        <div className="flex-1 max-w-lg">
          <div className="relative group">
            <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 group-focus-within:text-[#003366] transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search requests, students, or documents..."
              className="w-full pl-12 pr-4 py-2.5 bg-gray-50/80 border border-gray-100 rounded-xl text-[13px] placeholder-gray-400 focus:bg-white focus:border-[#003366]/20 focus:ring-2 focus:ring-[#003366]/8 focus:shadow-sm"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1.5 ml-6">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-all"
            >
              <HiOutlineBell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="badge-pulse absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="dropdown-enter absolute right-0 top-full mt-2.5 w-[340px] bg-white border border-gray-100 rounded-2xl shadow-xl shadow-gray-200/60 z-50">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100/80">
                  <h3 className="font-semibold text-sm text-gray-900">Notifications</h3>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <HiOutlineXMark className="w-4 h-4" />
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`px-5 py-3.5 border-b border-gray-50/80 hover:bg-gray-50/50 cursor-pointer transition-colors ${
                          !notification.read ? 'bg-blue-50/40 border-l-2 border-l-[#003366]' : ''
                        }`}
                      >
                        <p className="text-[13px] font-medium text-gray-800 leading-snug">
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                          {notification.message}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-2 font-medium">
                          {format(notification.createdAt, 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="px-5 py-10 text-center">
                      <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <HiOutlineBell className="w-6 h-6 text-gray-300" />
                      </div>
                      <p className="text-sm text-gray-500 font-medium">All caught up!</p>
                      <p className="text-xs text-gray-400 mt-0.5">No new notifications</p>
                    </div>
                  )}
                </div>
                <div className="px-5 py-3 border-t border-gray-100/80">
                  <button className="w-full text-center text-xs font-semibold text-[#003366] hover:text-[#004d99] py-1">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-gradient-to-b from-transparent via-gray-200 to-transparent mx-2" />

          {/* User Menu */}
          <button className="flex items-center gap-2.5 hover:bg-gray-50/80 rounded-xl px-3 py-2 transition-all">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#003366] to-[#004d99] flex items-center justify-center shadow-sm shadow-[#003366]/20">
              <span className="text-white text-[11px] font-bold">
                {user.name.split(' ').map((n: string) => n[0]).join('')}
              </span>
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-[13px] font-semibold text-gray-800 leading-tight">{user.name}</p>
              <p className="text-[11px] text-gray-400 capitalize leading-tight font-medium">{user.role}</p>
            </div>
            <HiOutlineChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </div>
      </div>
    </header>
  );
}
