import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Users, Settings, HelpCircle, LogOut, BarChart3, ChevronLeft, ChevronRight, ClipboardList, ExternalLink } from 'lucide-react';
import { usePermission } from '../contexts/PermissionContext';
import { TutorTooltip } from './TutorTooltip';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { hasPermission } = usePermission();

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: FileText, label: 'Order Registry', path: '/orders' },
    { icon: Users, label: 'Customers', path: '/customers' },
    { icon: BarChart3, label: 'Reports', path: '/reports' },
    { icon: ExternalLink, label: 'Quick Links', path: '/quick-links' },
  ];

  // Only show Audit Log to Admin and above
  if (hasPermission('Admin')) {
    navItems.push({ icon: ClipboardList, label: 'Audit Log', path: '/audit-log' });
  }

  const bottomNavItems = [
    { icon: Settings, label: 'Settings', path: '/settings' },
    { icon: HelpCircle, label: 'Help & Support', path: '/help' },
  ];

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0 transition-all duration-300 z-20 shrink-0`}>
      <div className={`p-6 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} gap-3 relative`}>
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-serif font-bold text-xl shrink-0">
            A
          </div>
          {!isCollapsed && <span className="font-serif font-bold text-xl tracking-tight text-gray-900 whitespace-nowrap">Alexandria</span>}
        </div>
        
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-8 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:text-primary hover:border-primary transition-colors shadow-sm z-30"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <div className="px-4 py-2 flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
        {!isCollapsed && <div className="label-text text-gray-400 mb-4 px-2 whitespace-nowrap">Main Menu</div>}
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <TutorTooltip key={item.path} text={`Navigate to the ${item.label} page.`} position="right" wrapperClass="w-full block">
              <NavLink
                to={item.path}
                title={isCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-3'} py-2.5 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-light text-primary font-medium'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
              </NavLink>
            </TutorTooltip>
          ))}
        </nav>
      </div>

      <div className="mt-auto px-4 py-6 border-t border-gray-50">
        {!isCollapsed && <div className="label-text text-gray-400 mb-4 px-2 whitespace-nowrap">Preferences</div>}
        <nav className="flex flex-col gap-1 mb-6">
          {bottomNavItems.map((item) => (
            <TutorTooltip key={item.path} text={`Navigate to ${item.label}.`} position="right" wrapperClass="w-full block">
              <NavLink
                to={item.path}
                title={isCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-3'} py-2.5 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-light text-primary font-medium'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
              </NavLink>
            </TutorTooltip>
          ))}
        </nav>
        
        <button 
          title={isCollapsed ? "Log Out" : undefined}
          className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-3'} py-2.5 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200 w-full`}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span className="whitespace-nowrap">Log Out</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
