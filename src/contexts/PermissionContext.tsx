import React, { createContext, useContext, useState, useEffect } from "react";
import { getRole } from "../services/permissionService";
import { supabase } from "../lib/supabase";

export type Role = "User" | "Admin" | "Global Admin" | "Developer";

const VALID_ROLES: Role[] = ["User", "Admin", "Global Admin", "Developer"];
const applyRole = (raw: string, set: (r: Role) => void) => {
  if (VALID_ROLES.includes(raw as Role)) set(raw as Role);
};

interface PermissionContextType {
  currentRole: Role;
  userEmail: string;
  isAuthorized: boolean | null; // null = still checking, true = authorized, false = not in permissions list
  loggedOut: boolean;
  forcePasswordChange: boolean; // true = signed in but must change password before app access
  setCurrentRole: (role: Role) => void;
  setUserEmail: (email: string) => void;
  hasPermission: (requiredRole: Role) => boolean;
  logout: () => void;
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
  const [currentRole, setCurrentRole] = useState<Role>("Global Admin");
  const [userEmail, setUserEmail] = useState<string>(
    () => localStorage.getItem("userEmail") ?? "",
  );
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [loggedOut, setLoggedOut] = useState(false);
  const [forcePasswordChange, setForcePasswordChange] = useState(false);

  function authorizeSession(email: string, metaRole?: string) {
    setUserEmail(email);

    // If the Power Automate permissions URL isn't configured (e.g. local dev or
    // Cloudflare Pages without the env var), skip the network call and fall back
    // to the role stored in Supabase user_metadata.
    const paUrl = import.meta.env.VITE_API_PERMISSIONS_URL as
      | string
      | undefined;
    if (!paUrl) {
      const role: Role = VALID_ROLES.includes(metaRole as Role)
        ? (metaRole as Role)
        : "User";
      setCurrentRole(role);
      setIsAuthorized(true);
      return;
    }

    getRole(email)
      .then((role) => {
        if (VALID_ROLES.includes(role as Role)) {
          applyRole(role, setCurrentRole);
          setIsAuthorized(true);
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
        setCurrentRole(role);
        setIsAuthorized(true);
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
        .then((role) => applyRole(role, setCurrentRole))
        .catch(() => {});
    }
  };

  const hasPermission = (requiredRole: Role) => {
    return roleHierarchy[currentRole] >= roleHierarchy[requiredRole];
  };

  const logout = () => {
    supabase.auth.signOut().then(() => {
      localStorage.removeItem("userEmail");
      setForcePasswordChange(false);
      setLoggedOut(true);
    });
  };

  return (
    <PermissionContext.Provider
      value={{
        currentRole,
        userEmail,
        isAuthorized,
        loggedOut,
        forcePasswordChange,
        setCurrentRole,
        setUserEmail: handleSetUserEmail,
        hasPermission,
        logout,
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
