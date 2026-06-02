import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  BarChart3,
  Bell,
  BriefcaseBusiness,
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
import { TutorTooltip } from "./TutorTooltip";

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

const primaryNavItems: NavItem[] = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    path: "/",
    description: "Live activity and priority work",
  },
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
    icon: BriefcaseBusiness,
    label: "Services",
    path: "/services",
    description: "Provider service account pages",
  },
  {
    icon: BarChart3,
    label: "Reports",
    path: "/reports",
    description: "Performance and operational reporting",
  },
];

const isRouteActive = (pathname: string, path: string) => {
  if (path === "/") return pathname === "/";
  return pathname === path || pathname.startsWith(`${path}/`);
};

const getPageInfo = (pathname: string) => {
  if (pathname === "/") {
    return {
      label: "Dashboard",
      purpose: "Live operational overview for order activity, priorities, and recent work.",
    };
  }
  if (pathname === "/orders/new") {
    return {
      label: "Create New Order",
      purpose: "Create a new cloud service order and capture order, customer, cloud service, and provisioning details.",
    };
  }
  if (/^\/orders\/[^/]+$/.test(pathname)) {
    return {
      label: "Order Details",
      purpose: "Review and update one order, including customer details, service fields, provisioning progress, timeline, and email actions.",
    };
  }
  if (pathname === "/orders") {
    return {
      label: "Order Registry",
      purpose: "Search, filter, export, and open cloud service orders by status, customer, provider, and delivery details.",
    };
  }
  if (/^\/customers\/[^/]+$/.test(pathname)) {
    return {
      label: "Customer Profile",
      purpose: "Review one customer account, related orders, contacts, and account activity.",
    };
  }
  if (pathname === "/customers") {
    return {
      label: "Customers",
      purpose: "Browse, search, filter, import, export, and open customer records.",
    };
  }
  if (/^\/services\/[^/]+$/.test(pathname)) {
    return {
      label: "Service Details",
      purpose: "Review provider-specific service account records, account IDs, login emails, references, and linked source orders.",
    };
  }
  if (pathname === "/services") {
    return {
      label: "Services",
      purpose: "Choose a cloud provider and view service account coverage across linked orders.",
    };
  }
  if (pathname === "/reports") {
    return {
      label: "Reports",
      purpose: "Analyze order volume, provider mix, service types, trends, status breakdowns, and top customers.",
    };
  }
  if (pathname === "/quick-links") {
    return {
      label: "Useful Links",
      purpose: "Open shared operational tools and external reference links.",
    };
  }
  if (pathname === "/audit-log") {
    return {
      label: "Audit Log",
      purpose: "Review system activity, permission changes, and important operational events.",
    };
  }
  if (pathname === "/email-templates") {
    return {
      label: "Email Templates",
      purpose: "Manage reusable customer email templates for order and service communications.",
    };
  }
  if (pathname === "/settings") {
    return {
      label: "Settings",
      purpose: "Manage dashboard preferences, access-related settings, and account configuration.",
    };
  }
  if (pathname === "/help") {
    return {
      label: "Help & Support",
      purpose: "Find guidance, support contacts, and answers for using the dashboard.",
    };
  }
  if (pathname === "/feedback/new") {
    return {
      label: "Report Feedback",
      purpose: "Submit a bug, idea, or other feedback item, optionally prefilled from Report Mode.",
    };
  }
  if (pathname === "/feedback") {
    return {
      label: "Feedback",
      purpose: "Review, filter, and update reported issues and requests.",
    };
  }
  return {
    label: "Dashboard",
    purpose: "Use this dashboard page to manage Multi Cloud operations.",
  };
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
        label: "Work",
        accent: "bg-[#84e7a5]",
        items: [
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

  const currentPageInfo = getPageInfo(location.pathname);
  const currentPageLabel = currentPageInfo.label;

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
      <div
        ref={headerRef}
        className="mx-auto w-full max-w-[min(100%,1600px)] px-4 md:px-6 xl:px-8"
      >
        <div className="flex min-h-16 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <TutorTooltip
              text="Return to the dashboard home page."
              position="bottom"
              wrapperClass="inline-flex"
              componentName="TopNav.Brand"
            >
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
            </TutorTooltip>

            <TutorTooltip
              text={currentPageInfo.purpose}
              position="bottom"
              wrapperClass="hidden min-w-0 sm:block"
              componentName="TopNav.CurrentPage"
            >
              <div className="hidden min-w-0 flex-col border-l border-[#dad4c8] pl-3 sm:flex">
                <span className="label-text text-[#9f9b93]">Current page</span>
                <span className="truncate text-sm font-semibold text-[#000]">
                  {currentPageLabel}
                </span>
              </div>
            </TutorTooltip>
          </div>

          <nav
            className="hidden flex-1 justify-center lg:flex"
            aria-label="Primary navigation"
          >
            <TutorTooltip
              text="Primary navigation for the main dashboard work areas."
              position="bottom"
              wrapperClass="inline-flex"
              componentName="TopNav.PrimaryNavigation"
            >
              <div className="flex items-center gap-1 rounded-2xl border border-[#dad4c8] bg-white/80 p-1.5 shadow-[rgba(0,0,0,0.08)_0px_1px_1px,rgba(0,0,0,0.04)_0px_-1px_1px_inset]">
              {primaryNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = isRouteActive(location.pathname, item.path);

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={`relative flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#146ef5] ${
                      isActive
                        ? "bg-[#000] text-white shadow-[rgb(0,0,0)_-3px_3px_0px_0px]"
                        : "text-[#55534e] hover:bg-[#faf9f7] hover:text-[#000]"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                    {isActive && (
                      <span className="absolute inset-x-3 -bottom-1 h-0.5 rounded-full bg-[#fbbd41]" />
                    )}
                  </NavLink>
                );
              })}
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
            </TutorTooltip>
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <TutorTooltip
              text="Turn guided tool tips on or off for highlighted dashboard components."
              position="bottom"
              wrapperClass="hidden sm:inline-flex"
              componentName="TopNav.TutorModeToggle"
            >
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
            </TutorTooltip>

            <TutorTooltip
              text="Turn Report Mode on or off. When on, highlighted components can open a prefilled feedback report."
              position="bottom"
              wrapperClass="hidden sm:inline-flex"
              componentName="TopNav.ReportModeToggle"
            >
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
            </TutorTooltip>

            <TutorTooltip
              text="Notification entry point for new updates and alerts."
              position="bottom"
              wrapperClass="inline-flex"
              componentName="TopNav.Notifications"
            >
              <button
                className="relative rounded-xl p-2 text-[#55534e] transition-colors hover:bg-white/70 hover:text-[#000] focus:outline-none focus:ring-2 focus:ring-[#146ef5]"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#fc7981]" />
              </button>
            </TutorTooltip>

            <div className="relative hidden border-l border-[#dad4c8] pl-3 md:block">
              <TutorTooltip
                text="Open account actions, settings, help, role preview, and log out."
                position="bottom"
                wrapperClass="inline-flex"
                componentName="TopNav.AccountMenu"
              >
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
              </TutorTooltip>

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

            <TutorTooltip
              text="Open or close the mobile navigation menu."
              position="bottom"
              wrapperClass="inline-flex lg:hidden"
              componentName="TopNav.MobileMenuToggle"
            >
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
            </TutorTooltip>
          </div>
        </div>

        {isMobileMenuOpen && (
            <nav
              id="mobile-navigation"
              className="border-t border-[#dad4c8] py-4 lg:hidden"
              aria-label="Mobile navigation"
            >
              <div className="grid gap-3">
                <section className="rounded-3xl border border-[#dad4c8] bg-white/80 p-3">
                  <div className="mb-2 flex items-center gap-2 px-1">
                    <span className="h-2 w-2 rounded-full bg-[#fbbd41]" />
                    <span className="label-text text-[#9f9b93]">Main</span>
                  </div>
                  <div className="grid gap-1 sm:grid-cols-2">
                    {primaryNavItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <TutorTooltip
                          key={item.path}
                          text={item.description}
                          position="bottom"
                          wrapperClass="block"
                          componentName={`TopNav.MobileMenu.${item.label}`}
                        >
                          <NavLink
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
                        </TutorTooltip>
                      );
                    })}
                  </div>
                </section>
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
                          <TutorTooltip
                            key={item.path}
                            text={item.description}
                            position="bottom"
                            wrapperClass="block"
                            componentName={`TopNav.MobileMenu.${item.label}`}
                          >
                            <NavLink
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
                          </TutorTooltip>
                        );
                      })}
                    </div>
                  </section>
                ))}

                <div className="grid gap-2 rounded-3xl border border-dashed border-[#dad4c8] bg-[#faf9f7] p-3 sm:grid-cols-2">
                  <TutorTooltip
                    text="Open dashboard settings and account configuration."
                    position="bottom"
                    wrapperClass="block"
                    componentName="TopNav.MobileMenu.Settings"
                  >
                    <NavLink
                      to="/settings"
                      className="flex items-center gap-3 rounded-2xl bg-white px-3 py-3 text-sm font-semibold text-[#55534e]"
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </NavLink>
                  </TutorTooltip>
                  {currentRole === "Developer" && (
                    <TutorTooltip
                      text="Preview the dashboard as another role to check permission-based views."
                      position="bottom"
                      wrapperClass="block"
                      componentName="TopNav.MobileMenu.RolePreview"
                    >
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
                    </TutorTooltip>
                  )}
                  <TutorTooltip
                    text="Turn guided tool tips on or off for highlighted dashboard components."
                    position="bottom"
                    wrapperClass="block"
                    componentName="TopNav.MobileMenu.TutorMode"
                  >
                    <button
                      onClick={toggleTutorMode}
                      aria-pressed={isTutorMode}
                      className="flex w-full items-center gap-3 rounded-2xl bg-white px-3 py-3 text-sm font-semibold text-[#55534e]"
                    >
                      <GraduationCap className="h-4 w-4" />
                      {isTutorMode ? "Tutor: ON" : "Tutor: OFF"}
                    </button>
                  </TutorTooltip>
                  <TutorTooltip
                    text="Turn Report Mode on or off so highlighted components can open prefilled feedback reports."
                    position="bottom"
                    wrapperClass="block"
                    componentName="TopNav.MobileMenu.ReportMode"
                  >
                    <button
                      onClick={toggleFeedbackMode}
                      aria-pressed={isFeedbackMode}
                      className="flex w-full items-center gap-3 rounded-2xl bg-white px-3 py-3 text-sm font-semibold text-[#55534e]"
                    >
                      <Flag className="h-4 w-4" />
                      {isFeedbackMode ? "Report: ON" : "Report: OFF"}
                    </button>
                  </TutorTooltip>
                  <TutorTooltip
                    text="Sign out of the dashboard."
                    position="top"
                    wrapperClass="block sm:col-span-2"
                    componentName="TopNav.MobileMenu.LogOut"
                  >
                    <button
                      onClick={logout}
                      className="flex w-full items-center gap-3 rounded-2xl bg-white px-3 py-3 text-sm font-semibold text-[#9d1c22]"
                    >
                      <LogOut className="h-4 w-4" />
                      Log Out
                    </button>
                  </TutorTooltip>
                </div>
              </div>
            </nav>
        )}
      </div>
    </header>
  );
};

export default TopNav;
