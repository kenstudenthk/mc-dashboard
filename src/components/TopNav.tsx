import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  BarChart3,
  Bell,
  ChevronDown,
  ClipboardList,
  ExternalLink,
  FileText,
  Flag,
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  MessageSquare,
  Settings,
  Shield,
  Users,
  X,
} from "lucide-react";
import { usePermission, Role } from "../contexts/PermissionContext";
import { useTutor } from "../contexts/TutorContext";

type NavItem = {
  icon: typeof LayoutDashboard;
  label: string;
  path: string;
  description: string;
};

type NavGroup = {
  label: string;
  accent: string;
  items: NavItem[];
};

const isRouteActive = (pathname: string, path: string) => {
  if (path === "/") return pathname === "/";
  return pathname === path || pathname.startsWith(`${path}/`);
};

const TopNav = () => {
  const location = useLocation();
  const { currentRole, setCurrentRole, userEmail, hasPermission, logout } =
    usePermission();
  const { isTutorMode, toggleTutorMode, isFeedbackMode, toggleFeedbackMode } =
    useTutor();
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);

  const navGroups = useMemo<NavGroup[]>(() => {
    const groups: NavGroup[] = [
      {
        label: "Overview",
        accent: "bg-[#fbbd41]",
        items: [
          {
            icon: LayoutDashboard,
            label: "Dashboard",
            path: "/",
            description: "Live activity and priority work",
          },
          {
            icon: BarChart3,
            label: "Reports",
            path: "/reports",
            description: "Performance and operational reporting",
          },
        ],
      },
      {
        label: "Work",
        accent: "bg-[#84e7a5]",
        items: [
          {
            icon: FileText,
            label: "Order Registry",
            path: "/orders",
            description: "Orders, status, and delivery details",
          },
          {
            icon: Users,
            label: "Customers",
            path: "/customers",
            description: "Customer records and profiles",
          },
          {
            icon: ExternalLink,
            label: "Useful Links",
            path: "/quick-links",
            description: "Shared tools and external references",
          },
        ],
      },
      {
        label: "Support",
        accent: "bg-[#3bd3fd]",
        items: [
          {
            icon: HelpCircle,
            label: "Help & Support",
            path: "/help",
            description: "Guides and contact options",
          },
        ],
      },
    ];

    const adminItems: NavItem[] = [];

    if (hasPermission("Admin")) {
      adminItems.push(
        {
          icon: ClipboardList,
          label: "Audit Log",
          path: "/audit-log",
          description: "System events and change history",
        },
        {
          icon: Mail,
          label: "Email Templates",
          path: "/email-templates",
          description: "Reusable customer message templates",
        },
      );
    }

    if (hasPermission("Developer")) {
      adminItems.push({
        icon: MessageSquare,
        label: "Feedback",
        path: "/feedback",
        description: "Review reported issues and requests",
      });
    }

    if (adminItems.length > 0) {
      groups.splice(2, 0, {
        label: "Admin",
        accent: "bg-[#c1b0ff]",
        items: adminItems,
      });
    }

    return groups;
  }, [hasPermission]);

  const currentItem = navGroups
    .flatMap((group) => group.items)
    .find((item) => isRouteActive(location.pathname, item.path));
  const currentPageLabel = isRouteActive(location.pathname, "/settings")
    ? "Settings"
    : currentItem?.label ?? "Dashboard";

  useEffect(() => {
    setOpenGroup(null);
    setIsAccountMenuOpen(false);
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) {
        setOpenGroup(null);
        setIsAccountMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenGroup(null);
        setIsAccountMenuOpen(false);
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <header className="glass-panel sticky top-0 z-30 border-b border-[#dad4c8]">
      <div ref={headerRef} className="px-4 md:px-6 lg:px-8">
        <div className="flex min-h-16 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              to="/"
              className="flex shrink-0 items-center gap-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#146ef5]"
              aria-label="Go to dashboard"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#000] bg-[#000] text-sm font-semibold text-white shadow-[rgb(0,0,0)_-3px_3px_0px_0px]">
                MC
              </span>
              <span className="hidden text-base font-semibold text-[#000] sm:inline">
                Multi Cloud
              </span>
            </Link>

            <div className="hidden min-w-0 flex-col border-l border-[#dad4c8] pl-3 sm:flex">
              <span className="label-text text-[#9f9b93]">Current page</span>
              <span className="truncate text-sm font-semibold text-[#000]">
                {currentPageLabel}
              </span>
            </div>
          </div>

          <nav
            className="hidden flex-1 justify-center lg:flex"
            aria-label="Primary navigation"
          >
            <div className="flex items-center gap-1 rounded-full border border-[#dad4c8] bg-white/80 p-1 shadow-[rgba(0,0,0,0.08)_0px_1px_1px,rgba(0,0,0,0.04)_0px_-1px_1px_inset]">
              {navGroups.map((group) => {
                const isActive = group.items.some((item) =>
                  isRouteActive(location.pathname, item.path),
                );
                const isOpen = openGroup === group.label;

                return (
                  <div key={group.label} className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenGroup(isOpen ? null : group.label)
                      }
                      className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#146ef5] ${
                        isActive
                          ? "bg-[#000] text-white shadow-[rgb(0,0,0)_-4px_4px_0px_0px]"
                          : "text-[#55534e] hover:bg-[#faf9f7] hover:text-[#000]"
                      }`}
                      aria-controls={`nav-menu-${group.label.toLowerCase()}`}
                      aria-expanded={isOpen}
                      aria-haspopup="menu"
                    >
                      <span className={`h-2 w-2 rounded-full ${group.accent}`} />
                      {group.label}
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {isOpen && (
                      <div
                        id={`nav-menu-${group.label.toLowerCase()}`}
                        className="absolute left-1/2 top-full mt-3 w-80 -translate-x-1/2 rounded-3xl border border-[#dad4c8] bg-[#fff] p-2 shadow-[rgba(0,0,0,0.1)_0px_1px_1px,rgba(0,0,0,0.04)_0px_-1px_1px_inset,rgba(0,0,0,0.05)_0px_-0.5px_1px]"
                        role="menu"
                      >
                        <div className="px-3 py-2">
                          <div className="label-text text-[#9f9b93]">
                            {group.label}
                          </div>
                        </div>
                        {group.items.map((item) => {
                          const Icon = item.icon;
                          return (
                            <NavLink
                              key={item.path}
                              to={item.path}
                              className={({ isActive }) =>
                                `flex items-start gap-3 rounded-2xl px-3 py-3 transition-colors focus:outline-none focus:ring-2 focus:ring-[#146ef5] ${
                                  isActive
                                    ? "bg-[#faf9f7] text-[#000]"
                                    : "text-[#55534e] hover:bg-[#faf9f7] hover:text-[#000]"
                                }`
                              }
                              role="menuitem"
                            >
                              <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                              <span className="min-w-0">
                                <span className="block text-sm font-semibold">
                                  {item.label}
                                </span>
                                <span className="block text-xs leading-5 text-[#9f9b93]">
                                  {item.description}
                                </span>
                              </span>
                            </NavLink>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={toggleTutorMode}
              aria-pressed={isTutorMode}
              className={`hidden items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors sm:flex ${
                isTutorMode
                  ? "border-[#dad4c8] bg-[#c1b0ff] text-[#000]"
                  : "border-[#dad4c8] bg-white/70 text-[#55534e] hover:bg-white"
              }`}
            >
              <GraduationCap className="h-3.5 w-3.5" />
              {isTutorMode ? "Tutor: ON" : "Tutor: OFF"}
            </button>

            <button
              onClick={toggleFeedbackMode}
              aria-pressed={isFeedbackMode}
              className={`hidden items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors sm:flex ${
                isFeedbackMode
                  ? "border-[#dad4c8] bg-[#fbbd41] text-[#000]"
                  : "border-[#dad4c8] bg-white/70 text-[#55534e] hover:bg-white"
              }`}
            >
              <Flag className="h-3.5 w-3.5" />
              {isFeedbackMode ? "Report: ON" : "Report: OFF"}
            </button>

            <button
              className="relative rounded-xl p-2 text-[#55534e] transition-colors hover:bg-white/70 hover:text-[#000] focus:outline-none focus:ring-2 focus:ring-[#146ef5]"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#fc7981]" />
            </button>

            <div className="relative hidden border-l border-[#dad4c8] pl-3 md:block">
              <button
                type="button"
                onClick={() => {
                  setIsAccountMenuOpen((isOpen) => !isOpen);
                  setOpenGroup(null);
                }}
                className="flex items-center gap-2.5 rounded-2xl p-1 transition-colors hover:bg-white/70 focus:outline-none focus:ring-2 focus:ring-[#146ef5]"
                aria-controls="account-menu"
                aria-expanded={isAccountMenuOpen}
                aria-haspopup="menu"
              >
                <span className="hidden text-right xl:block">
                  <span className="block max-w-40 truncate text-xs font-semibold text-[#000]">
                    {userEmail || "Not signed in"}
                  </span>
                  <span className="block text-[10px] text-[#9f9b93]">
                    {currentRole}
                  </span>
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#000] text-xs font-semibold uppercase text-white">
                  {userEmail ? userEmail[0] : "?"}
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-[#9f9b93] transition-transform ${
                    isAccountMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isAccountMenuOpen && (
                <div
                  id="account-menu"
                  className="absolute right-0 top-full mt-3 w-72 rounded-3xl border border-[#dad4c8] bg-white p-2 shadow-[rgba(0,0,0,0.1)_0px_1px_1px,rgba(0,0,0,0.04)_0px_-1px_1px_inset,rgba(0,0,0,0.05)_0px_-0.5px_1px]"
                  role="menu"
                >
                  <div className="border-b border-[#dad4c8] px-3 py-3">
                    <div className="truncate text-sm font-semibold text-[#000]">
                      {userEmail || "Not signed in"}
                    </div>
                    <div className="text-xs text-[#9f9b93]">{currentRole}</div>
                    {currentRole === "Developer" && (
                      <label className="mt-3 flex items-center gap-2 rounded-2xl border border-[#dad4c8] bg-[#faf9f7] px-3 py-2">
                        <Shield className="h-3.5 w-3.5 shrink-0 text-[#43089f]" />
                        <span className="sr-only">Preview role</span>
                        <select
                          value={currentRole}
                          onChange={(e) => setCurrentRole(e.target.value as Role)}
                          className="w-full cursor-pointer border-none bg-transparent text-xs font-medium text-[#1d1d1f]/80 focus:outline-none"
                          aria-label="Preview role"
                        >
                          <option value="User">User View</option>
                          <option value="Admin">Admin View</option>
                          <option value="Global Admin">Global Admin View</option>
                          <option value="Developer">Developer View</option>
                        </select>
                      </label>
                    )}
                  </div>
                  <NavLink
                    to="/settings"
                    className="mt-2 flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-[#55534e] hover:bg-[#faf9f7] hover:text-[#000] focus:outline-none focus:ring-2 focus:ring-[#146ef5]"
                    role="menuitem"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </NavLink>
                  <NavLink
                    to="/help"
                    className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-[#55534e] hover:bg-[#faf9f7] hover:text-[#000] focus:outline-none focus:ring-2 focus:ring-[#146ef5]"
                    role="menuitem"
                  >
                    <HelpCircle className="h-4 w-4" />
                    Help & Support
                  </NavLink>
                  <button
                    onClick={logout}
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-semibold text-[#9d1c22] hover:bg-[#fff0f1] focus:outline-none focus:ring-2 focus:ring-[#146ef5]"
                    role="menuitem"
                  >
                    <LogOut className="h-4 w-4" />
                    Log Out
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
              className="rounded-xl border border-[#dad4c8] bg-white/70 p-2 text-[#000] transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#146ef5] lg:hidden"
              aria-controls="mobile-navigation"
              aria-label={
                isMobileMenuOpen ? "Close navigation" : "Open navigation"
              }
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <nav
            id="mobile-navigation"
            className="border-t border-[#dad4c8] py-4 lg:hidden"
            aria-label="Mobile navigation"
          >
            <div className="grid gap-3">
              {navGroups.map((group) => (
                <section
                  key={group.label}
                  className="rounded-3xl border border-[#dad4c8] bg-white/80 p-3"
                >
                  <div className="mb-2 flex items-center gap-2 px-1">
                    <span className={`h-2 w-2 rounded-full ${group.accent}`} />
                    <span className="label-text text-[#9f9b93]">
                      {group.label}
                    </span>
                  </div>
                  <div className="grid gap-1 sm:grid-cols-2">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          className={({ isActive }) =>
                            `flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition-colors ${
                              isActive
                                ? "bg-[#000] text-white"
                                : "text-[#55534e] hover:bg-[#faf9f7] hover:text-[#000]"
                            }`
                          }
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          {item.label}
                        </NavLink>
                      );
                    })}
                  </div>
                </section>
              ))}

              <div className="grid gap-2 rounded-3xl border border-dashed border-[#dad4c8] bg-[#faf9f7] p-3 sm:grid-cols-2">
                <NavLink
                  to="/settings"
                  className="flex items-center gap-3 rounded-2xl bg-white px-3 py-3 text-sm font-semibold text-[#55534e]"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </NavLink>
                {currentRole === "Developer" && (
                  <label className="flex items-center gap-3 rounded-2xl bg-white px-3 py-3 text-sm font-semibold text-[#55534e]">
                    <Shield className="h-4 w-4 text-[#43089f]" />
                    <span className="sr-only">Preview role</span>
                    <select
                      value={currentRole}
                      onChange={(e) => setCurrentRole(e.target.value as Role)}
                      className="w-full cursor-pointer border-none bg-transparent text-sm font-semibold text-[#55534e] focus:outline-none"
                      aria-label="Preview role"
                    >
                      <option value="User">User View</option>
                      <option value="Admin">Admin View</option>
                      <option value="Global Admin">Global Admin View</option>
                      <option value="Developer">Developer View</option>
                    </select>
                  </label>
                )}
                <button
                  onClick={toggleTutorMode}
                  aria-pressed={isTutorMode}
                  className="flex items-center gap-3 rounded-2xl bg-white px-3 py-3 text-sm font-semibold text-[#55534e]"
                >
                  <GraduationCap className="h-4 w-4" />
                  {isTutorMode ? "Tutor: ON" : "Tutor: OFF"}
                </button>
                <button
                  onClick={toggleFeedbackMode}
                  aria-pressed={isFeedbackMode}
                  className="flex items-center gap-3 rounded-2xl bg-white px-3 py-3 text-sm font-semibold text-[#55534e]"
                >
                  <Flag className="h-4 w-4" />
                  {isFeedbackMode ? "Report: ON" : "Report: OFF"}
                </button>
                <button
                  onClick={logout}
                  className="flex items-center gap-3 rounded-2xl bg-white px-3 py-3 text-sm font-semibold text-[#9d1c22] sm:col-span-2"
                >
                  <LogOut className="h-4 w-4" />
                  Log Out
                </button>
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default TopNav;
