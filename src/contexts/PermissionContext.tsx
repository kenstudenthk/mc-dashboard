import React, { createContext, useContext, useState } from 'react';

export type Role = 'User' | 'Admin' | 'Global Admin' | 'Developer';

interface PermissionContextType {
  currentRole: Role;
  setCurrentRole: (role: Role) => void;
  hasPermission: (requiredRole: Role) => boolean;
}

const roleHierarchy: Record<Role, number> = {
  'User': 1,
  'Admin': 2,
  'Global Admin': 3,
  'Developer': 4
};

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export const PermissionProvider = ({ children }: { children: React.ReactNode }) => {
  // Default to Global Admin so the user can see most features initially
  const [currentRole, setCurrentRole] = useState<Role>('Global Admin'); 

  const hasPermission = (requiredRole: Role) => {
    return roleHierarchy[currentRole] >= roleHierarchy[requiredRole];
  };

  return (
    <PermissionContext.Provider value={{ currentRole, setCurrentRole, hasPermission }}>
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermission = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermission must be used within a PermissionProvider');
  }
  return context;
};
