import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Users, Settings, HelpCircle, LogOut, BarChart3, ChevronLeft, ChevronRight, ClipboardList, ExternalLink, Mail, X, MessageSquare } from 'lucide-react';
import { usePermission } from '../contexts/PermissionContext';
import { TutorTooltip } from './TutorTooltip';

interface SidebarProps {
  isDrawerOpen?: boolean;
  onClose?: () => void;
}

const Sidebar = ({ isDrawerOpen = false, onClose }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { hasPermission, logout } = usePermission();

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: FileText, label: 'Order Registry', path: '/orders' },
    { icon: Users, label: 'Customers', path: '/customers' },
    { icon: BarChart3, label: 'Reports', path: '/reports' },
    { icon: ExternalLink, label: 'Useful Links', path: '/quick-links' },
  ];

  if (hasPermission('Admin')) {
    navItems.push({ icon: ClipboardList, label: 'Audit Log', path: '/audit-log' });
    navItems.push({ icon: Mail, label: 'Email Templates', path: '/email-templates' });
  }

  if (hasPermission('Developer')) {
    navItems.push({ icon: MessageSquare, label: 'Feedback', path: '/feedback' });
  }

  const bottomNavItems = [
    { icon: Settings, label: 'Settings', path: '/settings' },
    { icon: HelpCircle, label: 'Help & Support', path: '/help' },
  ];

  // On desktop: sticky sidebar, collapsible. On mobile: fixed drawer controlled by isDrawerOpen.
  const asideClasses = [
    'bg-[#1d1d1f] flex flex-col h-screen z-40 shrink-0',
    // Mobile: fixed off-screen drawer
    'fixed inset-y-0 left-0 w-72',
    'transition-transform duration-300 ease-in-out',
    isDrawerOpen ? 'translate-x-0' : '-translate-x-full',
    // Desktop: override to sticky visible sidebar
    'md:sticky md:top-0 md:translate-x-0 md:z-20',
    isCollapsed ? 'md:w-20' : 'md:w-64',
  ].join(' ');

  const showLabels = !isCollapsed;

  return (
    <aside className={asideClasses}>
      {/* Header */}
      <div className={`p-6 flex items-center ${!showLabels ? 'justify-center' : 'justify-between'} gap-3 relative border-b border-white/[0.06]`}>
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-[#0071e3] flex items-center justify-center text-white font-bold text-xl shrink-0">
            A
          </div>
          {showLabels && (
            <span className="font-bold text-xl tracking-tight text-white whitespace-nowrap" style={{ fontFamily: 'SF Pro Display, Helvetica Neue, Helvetica, Arial, sans-serif' }}>
              Multi Cloud
            </span>
          )}
        </div>

        {/* Mobile: close button */}
        <button
          onClick={onClose}
          className="md:hidden p-1.5 text-white/40 hover:text-white transition-colors rounded-lg hover:bg-white/10"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Desktop: collapse toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex absolute -right-3 top-8 w-6 h-6 bg-[#272729] border border-white/10 rounded-full items-center justify-center text-white/40 hover:text-white hover:border-white/30 transition-colors shadow-md z-30"
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Main nav */}
      <div className="px-4 py-4 flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
        {showLabels && <div className="label-text text-white/30 mb-3 px-2 whitespace-nowrap">Main Menu</div>}
        <nav className="flex flex-col gap-0.5">
          {navItems.map((item) => (
            <TutorTooltip key={item.path} text={`Navigate to the ${item.label} page.`} position="right" wrapperClass="w-full block" componentName="Sidebar.Navigation">
              <NavLink
                to={item.path}
                title={!showLabels ? item.label : undefined}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center ${!showLabels ? 'justify-center' : 'gap-3 px-3'} py-2.5 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-white/55 hover:bg-white/[0.06] hover:text-white/90'
                  }`
                }
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {showLabels && <span className="whitespace-nowrap text-sm font-medium">{item.label}</span>}
              </NavLink>
            </TutorTooltip>
          ))}
        </nav>
      </div>

      {/* Bottom nav */}
      <div className="mt-auto px-4 py-5 border-t border-white/[0.06]">
        {showLabels && <div className="label-text text-white/30 mb-3 px-2 whitespace-nowrap">Preferences</div>}
        <nav className="flex flex-col gap-0.5 mb-4">
          {bottomNavItems.map((item) => (
            <TutorTooltip key={item.path} text={`Navigate to ${item.label}.`} position="right" wrapperClass="w-full block" componentName="Sidebar.Navigation">
              <NavLink
                to={item.path}
                title={!showLabels ? item.label : undefined}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center ${!showLabels ? 'justify-center' : 'gap-3 px-3'} py-2.5 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-white/55 hover:bg-white/[0.06] hover:text-white/90'
                  }`
                }
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {showLabels && <span className="whitespace-nowrap text-sm font-medium">{item.label}</span>}
              </NavLink>
            </TutorTooltip>
          ))}
        </nav>

        <button
          title={!showLabels ? 'Log Out' : undefined}
          onClick={logout}
          className={`flex items-center ${!showLabels ? 'justify-center' : 'gap-3 px-3'} py-2.5 rounded-lg text-white/40 hover:bg-red-900/25 hover:text-red-400 transition-all duration-200 w-full`}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {showLabels && <span className="whitespace-nowrap text-sm font-medium">Log Out</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
