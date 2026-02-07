import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HiOutlineAcademicCap,
  HiOutlineSquares2X2,
  HiOutlineDocumentText,
  HiOutlineClock,
  HiOutlineCalendarDays,
  HiOutlineTrophy,
  HiOutlineUserGroup,
  HiOutlineClipboardDocumentCheck,
  HiOutlineCog6Tooth,
  HiOutlineDocumentChartBar,
  HiOutlineBell,
  HiOutlineFolderOpen,
  HiOutlineChartBar,
  HiOutlineUserCircle,
  HiOutlineArrowRightOnRectangle,
  HiOutlineShieldCheck,
} from 'react-icons/hi2';
import type { UserRole } from '../../types';

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const studentNav: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: HiOutlineSquares2X2 },
  { label: 'HD Requests', path: '/hd-requests', icon: HiOutlineDocumentText },
  { label: 'Submissions', path: '/progress', icon: HiOutlineClock },
  { label: 'Academic Progress', path: '/milestones', icon: HiOutlineTrophy },
  { label: 'Calendar', path: '/calendar', icon: HiOutlineCalendarDays },
];

const supervisorNav: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: HiOutlineSquares2X2 },
  { label: 'My Students', path: '/students', icon: HiOutlineUserGroup },
  { label: 'Pending Reviews', path: '/reviews', icon: HiOutlineClipboardDocumentCheck },
  { label: 'Calendar', path: '/calendar', icon: HiOutlineCalendarDays },
];

const coordinatorNav: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: HiOutlineSquares2X2 },
  { label: 'All Students', path: '/students', icon: HiOutlineUserGroup },
  { label: 'HD Pipeline', path: '/pipeline', icon: HiOutlineChartBar },
  { label: 'Committee Prep', path: '/committee', icon: HiOutlineDocumentChartBar },
  { label: 'Calendar', path: '/calendar', icon: HiOutlineCalendarDays },
  { label: 'Records', path: '/hd-requests', icon: HiOutlineFolderOpen },
];

const adminNav: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: HiOutlineSquares2X2 },
  { label: 'User Management', path: '/users', icon: HiOutlineUserCircle },
  { label: 'All Submissions', path: '/hd-requests', icon: HiOutlineDocumentText },
  { label: 'Data Export', path: '/pipeline', icon: HiOutlineDocumentChartBar },
  { label: 'Notifications', path: '/reviews', icon: HiOutlineBell },
  { label: 'Calendar', path: '/calendar', icon: HiOutlineCalendarDays },
  { label: 'Audit Logs', path: '/audit-logs', icon: HiOutlineShieldCheck },
  { label: 'Settings', path: '/settings', icon: HiOutlineCog6Tooth },
];

const navByRole: Record<UserRole, NavItem[]> = {
  student: studentNav,
  supervisor: supervisorNav,
  coordinator: coordinatorNav,
  admin: adminNav,
};

export default function Sidebar() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const navItems = navByRole[user.role];

  return (
    <aside className="w-[270px] bg-gradient-to-b from-[#003366] via-[#003366] to-[#002851] min-h-screen flex flex-col shadow-xl shadow-[#003366]/10">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/[0.08]">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C5A55A] to-[#D4B76A] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#C5A55A]/20">
            <HiOutlineAcademicCap className="w-5 h-5 text-[#003366]" />
          </div>
          <div>
            <h1 className="text-white font-bold text-[15px] tracking-tight">PG Portal</h1>
            <p className="text-blue-300/50 text-[10px] tracking-widest uppercase font-medium">University of the Western Cape</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 overflow-y-auto">
        <p className="px-3.5 text-[10px] font-semibold text-blue-300/30 uppercase tracking-[0.1em] mb-3">Navigation</p>
        <ul className="space-y-0.5">
          {navItems.map((item) => (
            <li key={item.path + item.label}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
                    isActive
                      ? 'bg-white/[0.12] text-white shadow-sm shadow-white/5 backdrop-blur-sm'
                      : 'text-blue-200/60 hover:bg-white/[0.06] hover:text-blue-100'
                  }`
                }
              >
                <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Info & Logout */}
      <div className="px-3 pb-5 pt-3 border-t border-white/[0.08] mt-auto">
        <div className="flex items-center gap-3 px-3.5 py-3 mb-1">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#C5A55A]/25 to-[#C5A55A]/15 flex items-center justify-center flex-shrink-0 ring-1 ring-[#C5A55A]/20">
            <span className="text-[#C5A55A] font-bold text-xs">
              {user.name.split(' ').map((n: string) => n[0]).join('')}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-[13px] font-semibold truncate">{user.name}</p>
            <p className="text-blue-300/40 text-[11px] capitalize font-medium">{user.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 text-blue-200/50 hover:text-white hover:bg-white/[0.06] rounded-xl text-[13px] font-medium transition-all"
        >
          <HiOutlineArrowRightOnRectangle className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
