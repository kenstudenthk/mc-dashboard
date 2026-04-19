import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Users, Settings, HelpCircle, LogOut, BarChart3, ChevronLeft, ChevronRight, ClipboardList, ExternalLink, Mail } from 'lucide-react';
import { usePermission } from '../contexts/PermissionContext';
import { TutorTooltip } from './TutorTooltip';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { hasPermission, logout } = usePermission();

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: FileText, label: 'Order Registry', path: '/orders' },
    { icon: Users, label: 'Customers', path: '/customers' },
    { icon: BarChart3, label: 'Reports', path: '/reports' },
    { icon: ExternalLink, label: 'Quick Links', path: '/quick-links' },
  ];

  // Only show Audit Log and Email Templates to Admin and above
  if (hasPermission('Admin')) {
    navItems.push({ icon: ClipboardList, label: 'Audit Log', path: '/audit-log' });
    navItems.push({ icon: Mail, label: 'Email Templates', path: '/email-templates' });
  }

  const bottomNavItems = [
    { icon: Settings, label: 'Settings', path: '/settings' },
    { icon: HelpCircle, label: 'Help & Support', path: '/help' },
  ];

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-[#1d1d1f] flex flex-col h-screen sticky top-0 transition-all duration-300 z-20 shrink-0`}>
      <div className={`p-6 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} gap-3 relative border-b border-white/[0.06]`}>
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-[#0071e3] flex items-center justify-center text-white font-bold text-xl shrink-0">
            A
          </div>
          {!isCollapsed && <span className="font-bold text-xl tracking-tight text-white whitespace-nowrap" style={{ fontFamily: 'SF Pro Display, Helvetica Neue, Helvetica, Arial, sans-serif' }}>Multi Cloud</span>}
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-8 w-6 h-6 bg-[#272729] border border-white/10 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 transition-colors shadow-md z-30"
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      <div className="px-4 py-4 flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
        {!isCollapsed && <div className="label-text text-white/30 mb-3 px-2 whitespace-nowrap">Main Menu</div>}
        <nav className="flex flex-col gap-0.5">
          {navItems.map((item) => (
            <TutorTooltip key={item.path} text={`Navigate to the ${item.label} page.`} position="right" wrapperClass="w-full block">
              <NavLink
                to={item.path}
                title={isCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-3'} py-2.5 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-white/55 hover:bg-white/[0.06] hover:text-white/90'
                  }`
                }
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span className="whitespace-nowrap text-sm font-medium">{item.label}</span>}
              </NavLink>
            </TutorTooltip>
          ))}
        </nav>
      </div>

      <div className="mt-auto px-4 py-5 border-t border-white/[0.06]">
        {!isCollapsed && <div className="label-text text-white/30 mb-3 px-2 whitespace-nowrap">Preferences</div>}
        <nav className="flex flex-col gap-0.5 mb-4">
          {bottomNavItems.map((item) => (
            <TutorTooltip key={item.path} text={`Navigate to ${item.label}.`} position="right" wrapperClass="w-full block">
              <NavLink
                to={item.path}
                title={isCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-3'} py-2.5 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-white/55 hover:bg-white/[0.06] hover:text-white/90'
                  }`
                }
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span className="whitespace-nowrap text-sm font-medium">{item.label}</span>}
              </NavLink>
            </TutorTooltip>
          ))}
        </nav>

        <button
          title={isCollapsed ? "Log Out" : undefined}
          onClick={logout}
          className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-3'} py-2.5 rounded-lg text-white/40 hover:bg-red-900/25 hover:text-red-400 transition-all duration-200 w-full`}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span className="whitespace-nowrap text-sm font-medium">Log Out</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
