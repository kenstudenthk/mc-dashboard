import { ArrowLeft, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { usePermission } from "../contexts/PermissionContext";

interface NoPermissionProps {
  resourceName: string;
  permissionKey: string;
}

export const NoPermission = ({
  resourceName,
  permissionKey,
}: NoPermissionProps) => {
  const { currentRole, userEmail } = usePermission();

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-xl rounded-2xl border border-[#1d1d1f]/10 bg-white p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-red-50 p-3 text-red-600">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold text-[#1d1d1f]">
              You do not have access to {resourceName}.
            </h1>
            <p className="mt-2 text-sm text-[#1d1d1f]/60">
              Contact an administrator if this access is needed for your role.
            </p>
            <dl className="mt-5 grid gap-3 rounded-xl bg-[#f5f5f7] p-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-[#1d1d1f]/45">Current role</dt>
                <dd className="font-medium text-[#1d1d1f]">{currentRole}</dd>
              </div>
              {userEmail && (
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[#1d1d1f]/45">Signed in as</dt>
                  <dd className="truncate font-medium text-[#1d1d1f]">
                    {userEmail}
                  </dd>
                </div>
              )}
              <div className="flex items-center justify-between gap-3">
                <dt className="text-[#1d1d1f]/45">Missing permission</dt>
                <dd className="text-right font-mono text-xs text-[#1d1d1f]">
                  {permissionKey}
                </dd>
              </div>
            </dl>
            <div className="mt-6">
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-lg bg-[#094cb2] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0a3d8f]"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
