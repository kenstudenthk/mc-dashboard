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

  function authorizeSession(email: string) {
    setUserEmail(email);
    getRole(email)
      .then((role) => {
        if (VALID_ROLES.includes(role as Role)) {
          applyRole(role, setCurrentRole);
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
        }
      })
      .catch(() => setIsAuthorized(false));
  }

  useEffect(() => {
    // Seed email from localStorage while session check is in-flight
    const cached = localStorage.getItem("userEmail");
    if (cached) setUserEmail(cached);

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user?.email) {
        setLoggedOut(true);
        return;
      }
      if (session.user.user_metadata?.force_password_change) {
        setForcePasswordChange(true);
        setUserEmail(session.user.email);
        return;
      }
      authorizeSession(session.user.email);
    });

    // Ongoing auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setIsAuthorized(null);
        setForcePasswordChange(false);
        setLoggedOut(true);
      } else if (
        (event === "SIGNED_IN" || event === "USER_UPDATED") &&
        session?.user?.email
      ) {
        if (session.user.user_metadata?.force_password_change) {
          setForcePasswordChange(true);
          setUserEmail(session.user.email);
          return;
        }
        setForcePasswordChange(false);
        setLoggedOut(false);
        authorizeSession(session.user.email);
      }
    });

    return () => subscription.unsubscribe();
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
