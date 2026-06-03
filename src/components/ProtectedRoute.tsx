import { ReactNode } from "react";
import {
  PermissionAction,
  PermissionResourceType,
} from "../services/permissionRuleService";
import { usePermission } from "../contexts/PermissionContext";
import { NoPermission } from "./NoPermission";

interface ProtectedRouteProps {
  action?: PermissionAction;
  children: ReactNode;
  resourceKey: string;
  resourceName: string;
  resourceType?: PermissionResourceType;
}

export const ProtectedRoute = ({
  action = "View",
  children,
  resourceKey,
  resourceName,
  resourceType = "Page",
}: ProtectedRouteProps) => {
  const { can, permissionLoading } = usePermission();

  if (permissionLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-sm text-[#1d1d1f]/50">
        Loading permissions...
      </div>
    );
  }

  if (!can(resourceType, resourceKey, action)) {
    return (
      <NoPermission
        resourceName={resourceName}
        permissionKey={`${resourceType} / ${resourceKey} / ${action}`}
      />
    );
  }

  return <>{children}</>;
};
