import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
} from "react";
import { getRole } from "../services/permissionService";
import {
  permissionRuleService,
  PermissionAction,
  PermissionResourceType,
  PermissionRule,
} from "../services/permissionRuleService";
import { supabase } from "../lib/supabase";

export type Role = "User" | "Admin" | "Global Admin" | "Developer";

const VALID_ROLES: Role[] = ["User", "Admin", "Global Admin", "Developer"];
const LOCAL_ROLE_PREVIEW_KEY = "mc-dashboard:local-role-preview";
const applyRole = (raw: string, set: (r: Role) => void) => {
  if (VALID_ROLES.includes(raw as Role)) set(raw as Role);
};

const canUseLocalRolePreview = () =>
  import.meta.env.DEV &&
  typeof window !== "undefined" &&
  ["localhost", "127.0.0.1"].includes(window.location.hostname);

const getLocalRolePreview = (): Role | null => {
  if (!canUseLocalRolePreview()) return null;

  const roleParam = new URLSearchParams(window.location.search).get(
    "previewRole",
  );
  if (roleParam && VALID_ROLES.includes(roleParam as Role)) {
    localStorage.setItem(LOCAL_ROLE_PREVIEW_KEY, roleParam);
    return roleParam as Role;
  }

  const storedRole = localStorage.getItem(LOCAL_ROLE_PREVIEW_KEY);
  return VALID_ROLES.includes(storedRole as Role) ? (storedRole as Role) : null;
};

interface PermissionContextType {
  currentRole: Role;
  userEmail: string;
  isAuthorized: boolean | null; // null = still checking, true = authorized, false = not in permissions list
  loggedOut: boolean;
  forcePasswordChange: boolean; // true = signed in but must change password before app access
  isPasswordRecovery: boolean; // true = user clicked a password reset link and needs to set a new password
  setCurrentRole: (role: Role) => void;
  setUserEmail: (email: string) => void;
  hasPermission: (requiredRole: Role) => boolean;
  permissionRules: PermissionRule[];
  permissionLoading: boolean;
  permissionError: string | null;
  refreshPermissionRules: () => Promise<void>;
  can: (
    resourceType: PermissionResourceType,
    resourceKey: string,
    action: PermissionAction,
  ) => boolean;
  canAny: (rules: PermissionCheck[]) => boolean;
  canAll: (rules: PermissionCheck[]) => boolean;
  logout: () => void;
  clearPasswordRecovery: () => void;
}

export interface PermissionCheck {
  resourceType: PermissionResourceType;
  resourceKey: string;
  action: PermissionAction;
}

const roleHierarchy: Record<Role, number> = {
  User: 1,
  Admin: 2,
  "Global Admin": 3,
  Developer: 4,
};

const PermissionContext = createContext<PermissionContextType | undefined>(
  undefined,
);

export const PermissionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [currentRole, setCurrentRole] = useState<Role>(
    () => getLocalRolePreview() ?? "Global Admin",
  );
  const [userEmail, setUserEmail] = useState<string>(
    () => localStorage.getItem("userEmail") ?? "",
  );
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [loggedOut, setLoggedOut] = useState(false);
  const [forcePasswordChange, setForcePasswordChange] = useState(false);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [permissionRules, setPermissionRules] = useState<PermissionRule[]>([]);
  const [permissionLoading, setPermissionLoading] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const setResolvedRole = (role: Role) => {
    setCurrentRole(getLocalRolePreview() ?? role);
  };

  const refreshPermissionRules = useCallback(async () => {
    setPermissionLoading(true);
    setPermissionError(null);
    try {
      const rules = await permissionRuleService.findAll({
        includeInactive: false,
      });
      setPermissionRules(rules);
    } catch (error) {
      setPermissionRules([]);
      setPermissionError(
        error instanceof Error
          ? error.message
          : "Permission rules failed to load.",
      );
    } finally {
      setPermissionLoading(false);
    }
  }, []);

  function authorizeSession(email: string, metaRole?: string) {
    setUserEmail(email);

    // If the Power Automate permissions URL isn't configured (e.g. local dev or
    // Cloudflare Pages without the env var), skip the network call and fall back
    // to the role stored in Supabase user_metadata.
    const paUrl = (import.meta.env.VITE_API_PERMISSION_URL ??
      import.meta.env.VITE_API_PERMISSIONS_URL) as
      | string
      | undefined;
    if (!paUrl) {
      const role: Role = VALID_ROLES.includes(metaRole as Role)
        ? (metaRole as Role)
        : "User";
      setResolvedRole(role);
      setIsAuthorized(true);
      void refreshPermissionRules();
      return;
    }

    getRole(email)
      .then((role) => {
        if (VALID_ROLES.includes(role as Role)) {
          setResolvedRole(role as Role);
          setIsAuthorized(true);
          void refreshPermissionRules();
        } else {
          setIsAuthorized(false);
        }
      })
      .catch(() => {
        // PA call failed — fall back to Supabase user_metadata role.
        // If that's also missing, grant "User" so a valid invited account
        // can still access the app.
        const role: Role = VALID_ROLES.includes(metaRole as Role)
          ? (metaRole as Role)
          : "User";
        setResolvedRole(role);
        setIsAuthorized(true);
        void refreshPermissionRules();
      });
  }

  useEffect(() => {
    let resolved = false;

    // Safety net: if Supabase is unreachable (wrong URL/key, project paused,
    // network issue) INITIAL_SESSION never fires and the loading screen hangs.
    // After 8 s we give up and show the login form.
    const timeout = setTimeout(() => {
      if (!resolved) setLoggedOut(true);
    }, 8000);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") resolved = true;

      if (event === "PASSWORD_RECOVERY") {
        setIsPasswordRecovery(true);
      }

      if (event === "INITIAL_SESSION" || event === "SIGNED_OUT") {
        if (!session?.user?.email) {
          setIsAuthorized(null);
          setForcePasswordChange(false);
          setLoggedOut(true);
          return;
        }
      }

      if (
        event === "INITIAL_SESSION" ||
        event === "SIGNED_IN" ||
        event === "USER_UPDATED"
      ) {
        if (!session?.user?.email) return;
        if (session.user.user_metadata?.force_password_change) {
          setForcePasswordChange(true);
          setUserEmail(session.user.email);
          return;
        }
        setForcePasswordChange(false);
        setLoggedOut(false);
        authorizeSession(
          session.user.email,
          session.user.user_metadata?.role as string | undefined,
        );
      }
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist email to localStorage whenever it changes
  useEffect(() => {
    if (userEmail) localStorage.setItem("userEmail", userEmail);
  }, [userEmail]);

  const handleSetUserEmail = (email: string) => {
    setUserEmail(email);
    if (email) {
      getRole(email)
        .then((role) => {
          if (VALID_ROLES.includes(role as Role)) {
            setResolvedRole(role as Role);
          }
          void refreshPermissionRules();
        })
        .catch(() => {});
    }
  };

  const handleSetCurrentRole = (role: Role) => {
    if (canUseLocalRolePreview()) {
      localStorage.setItem(LOCAL_ROLE_PREVIEW_KEY, role);
    }
    setCurrentRole(role);
  };

  const hasPermission = (requiredRole: Role) => {
    return roleHierarchy[currentRole] >= roleHierarchy[requiredRole];
  };

  const can = (
    resourceType: PermissionResourceType,
    resourceKey: string,
    action: PermissionAction,
  ) => {
    if (currentRole === "Developer") return true;

    return permissionRules.some(
      (rule) =>
        rule.IsActive &&
        rule.ResourceType === resourceType &&
        rule.ResourceKey === resourceKey &&
        rule.Action === action &&
        rule.AllowedRoles.includes(currentRole),
    );
  };

  const canAny = (rules: PermissionCheck[]) =>
    rules.some((rule) => can(rule.resourceType, rule.resourceKey, rule.action));

  const canAll = (rules: PermissionCheck[]) =>
    rules.every((rule) => can(rule.resourceType, rule.resourceKey, rule.action));

  const logout = () => {
    supabase.auth.signOut().then(() => {
      localStorage.removeItem("userEmail");
      setForcePasswordChange(false);
      setLoggedOut(true);
    });
  };

  const clearPasswordRecovery = () => {
    setIsPasswordRecovery(false);
  };

  return (
    <PermissionContext.Provider
      value={{
        currentRole,
        userEmail,
        isAuthorized,
        loggedOut,
        forcePasswordChange,
        isPasswordRecovery,
        setCurrentRole: handleSetCurrentRole,
        setUserEmail: handleSetUserEmail,
        hasPermission,
        permissionRules,
        permissionLoading,
        permissionError,
        refreshPermissionRules,
        can,
        canAny,
        canAll,
        logout,
        clearPasswordRecovery,
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
};


export const usePermission = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error("usePermission must be used within a PermissionProvider");
  }
  return context;
};
