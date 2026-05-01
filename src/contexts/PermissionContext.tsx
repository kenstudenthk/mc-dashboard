import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/authService";
import type { User } from "@supabase/supabase-js";

export type Role = "User" | "Admin" | "Global Admin" | "Developer";

const VALID_ROLES: Role[] = ["User", "Admin", "Global Admin", "Developer"];

const roleHierarchy: Record<Role, number> = {
  User: 1,
  Admin: 2,
  "Global Admin": 3,
  Developer: 4,
};

function roleFromUser(user: User): Role {
  const raw = user.user_metadata?.role as string | undefined;
  return VALID_ROLES.includes(raw as Role) ? (raw as Role) : "User";
}

interface PermissionContextType {
  currentRole: Role;
  userEmail: string;
  userId: string;
  isAuthorized: boolean | null; // null = checking, true = signed in, false = not signed in
  setCurrentRole: (role: Role) => void;
  hasPermission: (requiredRole: Role) => boolean;
  logout: () => void;
}

const PermissionContext = createContext<PermissionContextType | undefined>(
  undefined,
);

export const PermissionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [currentRole, setCurrentRole] = useState<Role>("User");
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  const applyIdentity = (
    identity: { email: string; user: User } | null,
  ) => {
    if (!identity) {
      setIsAuthorized(false);
      setUserEmail("");
      setUserId("");
      setCurrentRole("User");
      return;
    }
    setUserEmail(identity.email);
    setUserId(identity.user.id);
    setCurrentRole(roleFromUser(identity.user));
    setIsAuthorized(true);
  };

  useEffect(() => {
    // Hydrate from existing session on mount (handles page refresh).
    authService.getSession().then(applyIdentity);

    // Keep auth state in sync for sign-in, sign-out, and token refresh.
    const {
      data: { subscription },
    } = authService.onAuthStateChange(applyIdentity);

    return () => subscription.unsubscribe();
  }, []);

  const hasPermission = (requiredRole: Role) =>
    roleHierarchy[currentRole] >= roleHierarchy[requiredRole];

  return (
    <PermissionContext.Provider
      value={{
        currentRole,
        userEmail,
        userId,
        isAuthorized,
        setCurrentRole,
        hasPermission,
        logout: authService.signOut,
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermission = () => {
  const ctx = useContext(PermissionContext);
  if (!ctx)
    throw new Error("usePermission must be used within a PermissionProvider");
  return ctx;
};
