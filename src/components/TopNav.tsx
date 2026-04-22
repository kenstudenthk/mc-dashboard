import React from "react";
import {
  Search,
  Bell,
  ChevronRight,
  Shield,
  GraduationCap,
  Menu,
  Flag,
} from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { usePermission, Role } from "../contexts/PermissionContext";
import { useTutor } from "../contexts/TutorContext";

interface TopNavProps {
  onMenuOpen?: () => void;
}

const TopNav = ({ onMenuOpen }: TopNavProps) => {
  const location = useLocation();
  const { currentRole, setCurrentRole, userEmail } = usePermission();
  const { isTutorMode, toggleTutorMode, isFeedbackMode, toggleFeedbackMode } = useTutor();

  const getBreadcrumbs = () => {
    const paths = location.pathname.split("/").filter(Boolean);
    if (paths.length === 0) return [{ label: "Dashboard", path: "/" }];

    const breadcrumbs = [{ label: "Home", path: "/" }];
    let currentPath = "";

    paths.forEach((path, index) => {
      currentPath += `/${path}`;
      let label =
        path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, " ");
      if (path === "orders" && paths.length > 1 && paths[1] !== "new") {
        label = "Order Registry";
      }
      breadcrumbs.push({ label, path: currentPath });
    });

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="h-16 px-4 md:px-8 flex items-center justify-between glass-panel sticky top-0 z-10">
      <div className="flex items-center gap-2 md:gap-0">
        <button
          className="md:hidden p-1.5 -ml-1 text-[#1d1d1f]/60 hover:text-[#1d1d1f] transition-colors rounded-lg hover:bg-[#1d1d1f]/06"
          onClick={onMenuOpen}
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center text-sm text-[#1d1d1f]/50" style={{ letterSpacing: '-0.224px' }}>
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.path}>
              {index > 0 && (
                <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-[#1d1d1f]/25" />
              )}
              {index === breadcrumbs.length - 1 ? (
                <span className="text-[#1d1d1f] font-medium">{crumb.label}</span>
              ) : (
                <Link
                  to={crumb.path}
                  className="hover:text-[#0071e3] transition-colors hidden sm:inline"
                >
                  {crumb.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <button
          onClick={toggleTutorMode}
          className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
            isTutorMode
              ? "bg-purple-100 text-purple-700 border-purple-200"
              : "bg-[#f5f5f7] text-[#1d1d1f]/60 border-[#1d1d1f]/10 hover:bg-[#ededf2]"
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          {isTutorMode ? "Tutor: ON" : "Tutor: OFF"}
        </button>

        <button
          onClick={toggleFeedbackMode}
          className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
            isFeedbackMode
              ? "bg-orange-100 text-orange-700 border-orange-200"
              : "bg-[#f5f5f7] text-[#1d1d1f]/60 border-[#1d1d1f]/10 hover:bg-[#ededf2]"
          }`}
        >
          <Flag className="w-3.5 h-3.5" />
          {isFeedbackMode ? "Report: ON" : "Report: OFF"}
        </button>

        {currentRole === "Developer" && (
          <div className="hidden sm:flex items-center gap-1.5 bg-[#f5f5f7] border border-[#1d1d1f]/08 rounded-[11px] px-3 py-1.5">
            <Shield className="w-3.5 h-3.5 text-[#0071e3]" />
            <select
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value as Role)}
              className="text-xs font-medium bg-transparent border-none focus:outline-none text-[#1d1d1f]/80 cursor-pointer"
            >
              <option value="User">User View</option>
              <option value="Admin">Admin View</option>
              <option value="Global Admin">Global Admin View</option>
              <option value="Developer">Developer View</option>
            </select>
          </div>
        )}

        <div className="relative hidden md:block">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#1d1d1f]/30" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-9 pr-4 py-1.5 bg-[#f5f5f7] border border-[#1d1d1f]/08 rounded-full text-xs text-[#1d1d1f] placeholder:text-[#1d1d1f]/30 focus:outline-none focus:ring-2 focus:ring-[#0071e3]/25 w-44 transition-all"
          />
        </div>

        <button className="relative p-2 text-[#1d1d1f]/35 hover:text-[#1d1d1f]/70 transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
        </button>

        <div className="flex items-center gap-2.5 pl-3 md:pl-4 border-l border-[#1d1d1f]/08">
          <div className="text-right hidden md:block">
            <div className="text-xs font-semibold text-[#1d1d1f]" style={{ letterSpacing: '-0.224px' }}>
              {userEmail || "Not signed in"}
            </div>
            <div className="text-[10px] text-[#1d1d1f]/45">{currentRole}</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#0071e3] text-white flex items-center justify-center text-xs font-semibold uppercase">
            {userEmail ? userEmail[0] : "?"}
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNav;
