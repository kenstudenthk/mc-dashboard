import React, { createContext, useContext, useState, useEffect } from "react";
import { getRole } from "../services/permissionService";

export type Role = "User" | "Admin" | "Global Admin" | "Developer";

const VALID_ROLES: Role[] = ["User", "Admin", "Global Admin", "Developer"];
const applyRole = (raw: string, set: (r: Role) => void) => {
  if (VALID_ROLES.includes(raw as Role)) set(raw as Role);
};

interface PermissionContextType {
  currentRole: Role;
  userEmail: string;
  setCurrentRole: (role: Role) => void;
  setUserEmail: (email: string) => void;
  hasPermission: (requiredRole: Role) => boolean;
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
  // Default to Global Admin so the user can see most features initially
  const [currentRole, setCurrentRole] = useState<Role>("Global Admin");
  const [userEmail, setUserEmail] = useState<string>(
    () => localStorage.getItem("userEmail") ?? "",
  );

  // On mount, if an email is saved, fetch the real role from SharePoint
  useEffect(() => {
    const saved = localStorage.getItem("userEmail");
    if (!saved) return;
    setUserEmail(saved);
    getRole(saved)
      .then((role) => applyRole(role, setCurrentRole))
      .catch(() => {
        /* keep default role on failure */
      });
  }, []);

  // Persist email to localStorage whenever it changes
  useEffect(() => {
    if (userEmail) localStorage.setItem("userEmail", userEmail);
  }, [userEmail]);

  const handleSetUserEmail = (email: string) => {
    setUserEmail(email);
    if (email) {
      getRole(email)
        .then((role) => applyRole(role, setCurrentRole))
        .catch(() => {
          /* keep current role on failure */
        });
    }
  };

  const hasPermission = (requiredRole: Role) => {
    return roleHierarchy[currentRole] >= roleHierarchy[requiredRole];
  };

  return (
    <PermissionContext.Provider
      value={{
        currentRole,
        userEmail,
        setCurrentRole,
        setUserEmail: handleSetUserEmail,
        hasPermission,
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
