import React from 'react';
import { Search, Bell, ChevronRight, Shield, GraduationCap } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import { usePermission, Role } from '../contexts/PermissionContext';
import { useTutor } from '../contexts/TutorContext';

const TopNav = () => {
  const location = useLocation();
  const { currentRole, setCurrentRole } = usePermission();
  const { isTutorMode, toggleTutorMode } = useTutor();
  
  // Simple breadcrumb logic based on path
  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    if (paths.length === 0) return [{ label: 'Dashboard', path: '/' }];
    
    const breadcrumbs = [{ label: 'Home', path: '/' }];
    let currentPath = '';
    
    paths.forEach((path, index) => {
      currentPath += `/${path}`;
      // Format label: capitalize and replace dashes
      let label = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
      if (path === 'orders' && paths.length > 1 && paths[1] !== 'new') {
         label = 'Order Registry';
      }
      breadcrumbs.push({ label, path: currentPath });
    });
    
    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="h-20 px-8 flex items-center justify-between glass-panel sticky top-0 z-10">
      <div className="flex items-center text-sm font-medium text-gray-500">
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={crumb.path}>
            {index > 0 && <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />}
            {index === breadcrumbs.length - 1 ? (
              <span className="text-gray-900">{crumb.label}</span>
            ) : (
              <Link to={crumb.path} className="hover:text-primary transition-colors">
                {crumb.label}
              </Link>
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="flex items-center gap-6">
        <button 
          onClick={toggleTutorMode}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-sm transition-colors border ${
            isTutorMode 
              ? 'bg-purple-100 text-purple-700 border-purple-200 shadow-inner' 
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          {isTutorMode ? 'Tutor Mode: ON' : 'Tutor Mode: OFF'}
        </button>

        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
          <Shield className="w-4 h-4 text-primary" />
          <select 
            value={currentRole}
            onChange={(e) => setCurrentRole(e.target.value as Role)}
            className="text-sm font-medium bg-transparent border-none focus:outline-none text-gray-700 cursor-pointer"
          >
            <option value="User">User View</option>
            <option value="Admin">Admin View</option>
            <option value="Global Admin">Global Admin View</option>
            <option value="Developer">Developer View</option>
          </select>
        </div>

        <div className="relative hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search anything..." 
            className="pl-10 pr-4 py-2 bg-gray-100/50 border-none rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-48 transition-all"
          />
        </div>
        
        <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        
        <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
          <div className="text-right hidden md:block">
            <div className="text-sm font-semibold text-gray-900">Eleanor Pena</div>
            <div className="text-xs text-gray-500">{currentRole}</div>
          </div>
          <img 
            src="https://i.pravatar.cc/150?u=eleanor" 
            alt="User avatar" 
            className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
          />
        </div>
      </div>
    </header>
  );
};

export default TopNav;
