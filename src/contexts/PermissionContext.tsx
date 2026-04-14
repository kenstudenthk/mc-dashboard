import React, { createContext, useContext, useState, useEffect } from "react";
import { getRole } from "../services/permissionService";
import { authService } from "../services/authService";

export type Role = "User" | "Admin" | "Global Admin" | "Developer";

const VALID_ROLES: Role[] = ["User", "Admin", "Global Admin", "Developer"];
const applyRole = (raw: string, set: (r: Role) => void) => {
  if (VALID_ROLES.includes(raw as Role)) set(raw as Role);
};

interface PermissionContextType {
  currentRole: Role;
  userEmail: string;
  isAuthorized: boolean | null; // null = still checking, true = authorized, false = not in permissions list
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
  // Default to Global Admin so the user can see most features initially
  const [currentRole, setCurrentRole] = useState<Role>("Global Admin");
  const [userEmail, setUserEmail] = useState<string>(
    () => localStorage.getItem("userEmail") ?? "",
  );
  // null = checking, true = found in SharePoint, false = not registered
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  // On mount: try Cloudflare Access identity first (production),
  // fall back to localStorage email (local development).
  useEffect(() => {
    authService.getIdentity().then((identity) => {
      if (identity?.email) {
        // Production: Cloudflare-verified identity — enforce SharePoint check
        const email = identity.email;
        setUserEmail(email);
        getRole(email)
          .then((role) => {
            if (VALID_ROLES.includes(role as Role)) {
              applyRole(role, setCurrentRole);
              setIsAuthorized(true);
            } else {
              // Email passed OTP but is not in the SharePoint permissions list
              setIsAuthorized(false);
            }
          })
          .catch(() => setIsAuthorized(false));
      } else {
        // Local development: no Cloudflare identity, skip authorization check
        const email = localStorage.getItem("userEmail") ?? "";
        if (email) {
          setUserEmail(email);
          getRole(email)
            .then((role) => applyRole(role, setCurrentRole))
            .catch(() => {/* keep default role */});
        }
        setIsAuthorized(true);
      }
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
        isAuthorized,
        setCurrentRole,
        setUserEmail: handleSetUserEmail,
        hasPermission,
        logout: authService.logout,
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
