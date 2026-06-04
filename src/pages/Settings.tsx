import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { usePermission } from "../contexts/PermissionContext";
import {
  Activity,
  AlertCircle,
  Ban,
  CheckCircle2,
  Clock,
  Shield,
  User,
  Bell,
  Users,
  Settings as SettingsIcon,
  Database,
  Key,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Server,
  Lock,
  XCircle,
} from "lucide-react";
import { TutorTooltip } from "../components/TutorTooltip";
import {
  getAllUsers,
  updateUser,
  createUser,
  deleteUser,
  type SPUser,
  type UserRole,
  type UserStatus,
} from "../services/permissionService";
import { authService } from "../services/authService";
import {
  permissionRuleService,
  CreatePermissionRuleInput,
  PermissionAction,
  PermissionResourceType,
  PermissionRule,
} from "../services/permissionRuleService";
import { Trash2, Mail } from "lucide-react";

type PermissionRuleStatus =
  | "active"
  | "disabled"
  | "creating"
  | "pending-update"
  | "pending-disable"
  | "failed"
  | "create-failed";

type PermissionPendingAction = "create" | "update" | "disable";

type PermissionRuleRow = PermissionRule & {
  clientStatus?: PermissionRuleStatus;
  clientError?: string;
  previousRule?: PermissionRule;
  pendingPayload?: CreatePermissionRuleInput;
  pendingAction?: PermissionPendingAction;
};

type PermissionStatusFilter = PermissionRuleStatus | "all";

type PermissionRoleFilter = UserRole | "all";

type PermissionTypeFilter = PermissionResourceType | "all";

type PermissionActionFilter = PermissionAction | "all";

interface PermissionDefinition
  extends Pick<CreatePermissionRuleInput, "ResourceKey" | "Description"> {
  DisplayName: string;
  PermissionGroup: string;
  RoutePath?: string;
}

const permissionResourceTypes: PermissionResourceType[] = [
  "Page",
  "Button",
  "Field",
  "Function",
  "Section",
];

const permissionActions: PermissionAction[] = [
  "View",
  "Create",
  "Edit",
  "Delete",
  "Export",
  "Approve",
  "Click",
  "Use",
  "Manage",
];

const permissionRoles: UserRole[] = [
  "Developer",
  "Global Admin",
  "Admin",
  "User",
];

const defaultPermissionRoles: UserRole[] = ["Developer", "Global Admin"];

const pagePermissionDefinitions: PermissionDefinition[] = [
  {
    ResourceKey: "Dashboard",
    DisplayName: "Dashboard",
    PermissionGroup: "Pages",
    RoutePath: "/",
    Description: "View the dashboard overview.",
  },
  {
    ResourceKey: "Orders",
    DisplayName: "Orders",
    PermissionGroup: "Orders",
    RoutePath: "/orders",
    Description: "View the order registry list.",
  },
  {
    ResourceKey: "NewOrder",
    DisplayName: "New Order",
    PermissionGroup: "Orders",
    RoutePath: "/orders/new",
    Description: "Open the new order page.",
  },
  {
    ResourceKey: "OrderDetails",
    DisplayName: "Order Details",
    PermissionGroup: "Orders",
    RoutePath: "/orders/:id",
    Description: "View order detail records.",
  },
  {
    ResourceKey: "Customers",
    DisplayName: "Customers",
    PermissionGroup: "Customer Management",
    RoutePath: "/customers",
    Description: "View the customers page.",
  },
  {
    ResourceKey: "CustomerProfile",
    DisplayName: "Customer Profile",
    PermissionGroup: "Customer Management",
    RoutePath: "/customers/:id",
    Description: "View individual customer profiles.",
  },
  {
    ResourceKey: "ServiceCatalog",
    DisplayName: "Service Catalog",
    PermissionGroup: "Services",
    RoutePath: "/services",
    Description: "View the service catalog page.",
  },
  {
    ResourceKey: "ServiceDetails",
    DisplayName: "Service Details",
    PermissionGroup: "Services",
    RoutePath: "/services/:id",
    Description: "View individual service detail pages.",
  },
  {
    ResourceKey: "Reports",
    DisplayName: "Reports",
    PermissionGroup: "Reports",
    RoutePath: "/reports",
    Description: "View reports.",
  },
  {
    ResourceKey: "QuickLinks",
    DisplayName: "Quick Links",
    PermissionGroup: "Operations",
    RoutePath: "/quick-links",
    Description: "View quick links.",
  },
  {
    ResourceKey: "AuditLog",
    DisplayName: "Audit Log",
    PermissionGroup: "System",
    RoutePath: "/audit-log",
    Description: "View audit log records.",
  },
  {
    ResourceKey: "EmailTemplates",
    DisplayName: "Email Templates",
    PermissionGroup: "System",
    RoutePath: "/email-templates",
    Description: "View email template management.",
  },
  {
    ResourceKey: "Settings",
    DisplayName: "Settings",
    PermissionGroup: "Settings",
    RoutePath: "/settings",
    Description: "View the settings page.",
  },
  {
    ResourceKey: "Help",
    DisplayName: "Help",
    PermissionGroup: "Support",
    RoutePath: "/help",
    Description: "View help and support.",
  },
  {
    ResourceKey: "Feedback",
    DisplayName: "Feedback",
    PermissionGroup: "Support",
    RoutePath: "/feedback",
    Description: "View feedback records.",
  },
  {
    ResourceKey: "FeedbackNew",
    DisplayName: "New Feedback",
    PermissionGroup: "Support",
    RoutePath: "/feedback/new",
    Description: "Open the new feedback page.",
  },
];

const defaultGlobalAdminPermissionRules: CreatePermissionRuleInput[] = [
  ...pagePermissionDefinitions.map(
    ({ ResourceKey, Description, DisplayName, PermissionGroup }) => ({
    ResourceType: "Page" as const,
    ResourceKey,
    Action: "View" as const,
    AllowedRoles: defaultPermissionRoles,
    IsActive: true,
    Description,
    DisplayName,
    PermissionGroup,
  })),
  {
    ResourceType: "Function",
    ResourceKey: "Settings.Permissions",
    Action: "Manage",
    AllowedRoles: defaultPermissionRoles,
    IsActive: true,
    Description: "Manage permission rules in Settings.",
    DisplayName: "Permission Settings",
    PermissionGroup: "Settings",
  },
];

const permissionActionMeanings: Record<PermissionAction, string> = {
  View: "Can open or see the resource.",
  Create: "Can create a new record or item.",
  Edit: "Can change an existing record or item.",
  Delete: "Can remove or disable a record or item.",
  Export: "Can export data from the resource.",
  Approve: "Can approve a workflow or request.",
  Click: "Can use a specific button.",
  Use: "Can use a feature or tool.",
  Manage: "Can administer a function or settings area.",
};

const permissionResourceMeanings: Record<string, string> = {
  ...Object.fromEntries(
    pagePermissionDefinitions.map(({ ResourceKey, Description }) => [
      `Page.${ResourceKey}`,
      Description,
    ]),
  ),
  "Function.Settings.Permissions": "Manage the permission settings function.",
};

const permissionResourceDetails: Record<
  string,
  { displayName: string; group: string; whereUsed?: string }
> = {
  ...Object.fromEntries(
    pagePermissionDefinitions.map(
      ({ ResourceKey, DisplayName, PermissionGroup, RoutePath }) => [
        `Page.${ResourceKey}`,
        {
          displayName: DisplayName,
          group: PermissionGroup,
          whereUsed: RoutePath,
        },
      ],
    ),
  ),
  "Function.Settings.Permissions": {
    displayName: "Permission Settings",
    group: "Settings",
    whereUsed: "/settings/permissions",
  },
};

const roleChipClasses: Record<UserRole, string> = {
  User: "border-sky-100 bg-sky-50 text-sky-700",
  Admin: "border-teal-100 bg-teal-50 text-teal-700",
  "Global Admin": "border-amber-100 bg-amber-50 text-amber-700",
  Developer: "border-rose-100 bg-rose-50 text-rose-700",
};

const statusMeta: Record<
  PermissionRuleStatus,
  { label: string; classes: string; icon: typeof CheckCircle2 }
> = {
  active: {
    label: "Active",
    classes: "border-green-100 bg-green-50 text-green-700",
    icon: CheckCircle2,
  },
  disabled: {
    label: "Disabled",
    classes: "border-gray-200 bg-gray-50 text-gray-500",
    icon: Ban,
  },
  creating: {
    label: "Creating",
    classes: "border-blue-100 bg-blue-50 text-blue-700",
    icon: Clock,
  },
  "pending-update": {
    label: "Pending Update",
    classes: "border-amber-100 bg-amber-50 text-amber-700",
    icon: Clock,
  },
  "pending-disable": {
    label: "Pending Disable",
    classes: "border-orange-100 bg-orange-50 text-orange-700",
    icon: Clock,
  },
  failed: {
    label: "Failed",
    classes: "border-red-100 bg-red-50 text-red-700",
    icon: AlertCircle,
  },
  "create-failed": {
    label: "Pending Create Failed",
    classes: "border-red-100 bg-red-50 text-red-700",
    icon: XCircle,
  },
};

const Settings = () => {
  const location = useLocation();
  const {
    currentRole,
    userEmail,
    setUserEmail,
    hasPermission,
    can,
    refreshPermissionRules,
  } =
    usePermission();
  const [activeTab, setActiveTab] = useState(
    location.pathname === "/settings/permissions" ? "permissions" : "profile",
  );
  const [profileEmail, setProfileEmail] = useState(userEmail || "");
  const [profileName, setProfileName] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("User");
  const [newStatus, setNewStatus] = useState<UserStatus>("Active");
  const [addingUser, setAddingUser] = useState(false);
  const [editingTeamIndex, setEditingTeamIndex] = useState<number | null>(null);
  const [teamStatusEdits, setTeamStatusEdits] = useState<
    Record<number, UserStatus>
  >({});
  const [roleEdits, setRoleEdits] = useState<Record<number, UserRole>>({});
  const [roleSavedIndex, setRoleSavedIndex] = useState<number | null>(null);
  const [users, setUsers] = useState<SPUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const [resetSentIndex, setResetSentIndex] = useState<number | null>(null);
  const [permissionAdminRules, setPermissionAdminRules] = useState<
    PermissionRuleRow[]
  >([]);
  const [permissionAdminLoading, setPermissionAdminLoading] = useState(false);
  const [permissionAdminError, setPermissionAdminError] = useState<
    string | null
  >(null);
  const [showAddPermission, setShowAddPermission] = useState(false);
  const [permissionSaving, setPermissionSaving] = useState(false);
  const [permissionSeedLoading, setPermissionSeedLoading] = useState(false);
  const [permissionSeedStatus, setPermissionSeedStatus] = useState<string | null>(
    null,
  );
  const [editingPermissionRuleId, setEditingPermissionRuleId] = useState<
    number | null
  >(null);
  const [permissionSearch, setPermissionSearch] = useState("");
  const [permissionRoleFilter, setPermissionRoleFilter] =
    useState<PermissionRoleFilter>("all");
  const [permissionTypeFilter, setPermissionTypeFilter] =
    useState<PermissionTypeFilter>("all");
  const [permissionActionFilter, setPermissionActionFilter] =
    useState<PermissionActionFilter>("all");
  const [permissionStatusFilter, setPermissionStatusFilter] =
    useState<PermissionStatusFilter>("all");
  const [permissionForm, setPermissionForm] = useState({
    ResourceType: "Page" as PermissionResourceType,
    ResourceKey: "",
    Action: "View" as PermissionAction,
    AllowedRoles: ["Developer", "Global Admin"] as UserRole[],
    IsActive: true,
    Description: "",
    SortOrder: "",
    PermissionGroup: "",
    DisplayName: "",
  });

  const resetPermissionForm = () => {
    setPermissionForm({
      ResourceType: "Page",
      ResourceKey: "",
      Action: "View",
      AllowedRoles: ["Developer", "Global Admin"],
      IsActive: true,
      Description: "",
      SortOrder: "",
      PermissionGroup: "",
      DisplayName: "",
    });
    setEditingPermissionRuleId(null);
  };

  useEffect(() => {
    if (activeTab === "team" || activeTab === "roles") {
      setUsersLoading(true);
      setUsersError(null);
      getAllUsers()
        .then(setUsers)
        .catch(() => setUsersError("Failed to load users. Please try again."))
        .finally(() => setUsersLoading(false));
    }
  }, [activeTab]);

  useEffect(() => {
    if (location.pathname === "/settings/permissions") {
      setActiveTab("permissions");
    }
  }, [location.pathname]);

  const loadPermissionAdminRules = async (
    options: { silent?: boolean } = {},
  ) => {
    if (!options.silent) setPermissionAdminLoading(true);
    if (!options.silent) setPermissionAdminError(null);
    try {
      const rules = await permissionRuleService.findAll({
        includeInactive: true,
      });
      setPermissionAdminRules(rules);
    } catch (err: any) {
      if (!options.silent) {
        setPermissionAdminError(
          err.message || "Failed to load permission rules.",
        );
      }
    } finally {
      if (!options.silent) setPermissionAdminLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "permissions") {
      void loadPermissionAdminRules();
    }
  }, [activeTab]);

  const buildRuleKey = (
    rule: Pick<PermissionRule, "ResourceType" | "ResourceKey" | "Action">,
  ) => `${rule.ResourceType}.${rule.ResourceKey}.${rule.Action}`;

  const getRuleStatus = (rule: PermissionRuleRow): PermissionRuleStatus =>
    rule.clientStatus ?? (rule.IsActive ? "active" : "disabled");

  const isRulePending = (rule: PermissionRuleRow) =>
    ["creating", "pending-update", "pending-disable"].includes(
      getRuleStatus(rule),
    );

  const getRuleDetails = (rule: PermissionRuleRow) => {
    const details =
      permissionResourceDetails[`${rule.ResourceType}.${rule.ResourceKey}`];

    return {
      displayName: rule.DisplayName || details?.displayName || rule.ResourceKey,
      group: rule.PermissionGroup || details?.group || rule.ResourceType,
      whereUsed: details?.whereUsed,
      description:
        rule.Description ||
        permissionResourceMeanings[`${rule.ResourceType}.${rule.ResourceKey}`] ||
        "Custom permission resource.",
    };
  };

  const buildPermissionPayload = (): CreatePermissionRuleInput => ({
    ResourceType: permissionForm.ResourceType,
    ResourceKey: permissionForm.ResourceKey.trim(),
    Action: permissionForm.Action,
    AllowedRoles: permissionForm.AllowedRoles,
    IsActive: permissionForm.IsActive,
    Description: permissionForm.Description.trim() || undefined,
    SortOrder: permissionForm.SortOrder
      ? Number(permissionForm.SortOrder)
      : undefined,
    PermissionGroup: permissionForm.PermissionGroup.trim() || undefined,
    DisplayName: permissionForm.DisplayName.trim() || undefined,
  });

  const toRuleRow = (
    data: CreatePermissionRuleInput,
    id: number,
    status: PermissionRuleStatus,
  ): PermissionRuleRow => ({
    id,
    Title: data.Title ?? buildRuleKey(data),
    ResourceType: data.ResourceType,
    ResourceKey: data.ResourceKey,
    Action: data.Action,
    AllowedRoles: data.AllowedRoles,
    IsActive: data.IsActive,
    Description: data.Description,
    SortOrder: data.SortOrder,
    PermissionGroup: data.PermissionGroup,
    DisplayName: data.DisplayName,
    UpdatedByEmail: userEmail,
    UpdatedAt: new Date().toISOString(),
    clientStatus: status,
  });

  const replacePermissionRule = (id: number, nextRule: PermissionRuleRow) => {
    setPermissionAdminRules((prev) =>
      prev.map((rule) => (rule.id === id ? nextRule : rule)),
    );
  };

  const syncPermissionRulesInBackground = () => {
    void refreshPermissionRules();
    void loadPermissionAdminRules({ silent: true });
  };

  const handleChangePassword = async () => {
    setPasswordError(null);
    if (!currentPassword) { setPasswordError("Current password is required."); return; }
    if (newPassword.length < 8) { setPasswordError("New password must be at least 8 characters."); return; }
    if (newPassword !== confirmPassword) { setPasswordError("Passwords do not match."); return; }
    setPasswordSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setPasswordSaving(false);
    setPasswordSaved(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setPasswordSaved(false), 3000);
  };

  const handleSaveProfile = () => {
    if (!profileEmail) return;
    setUserEmail(profileEmail);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const handleAddUser = async () => {
    if (!newEmail || !newName) return;
    setAddingUser(true);
    setUsersError(null);
    try {
      await createUser(newEmail, newName, newRole, newStatus);
      
      // Send invitation email via Supabase Admin API
      const { error } = await authService.inviteUser(newEmail, {
        role: newRole,
        displayName: newName
      });
      
      if (error) {
        console.error("Failed to send invitation email:", error);
        setUsersError(`User created in SharePoint, but invitation email failed: ${error.message || "Unknown error"}`);
        // We don't return here so the user can see the new record in the table
      }

      const updated = await getAllUsers();
      setUsers(updated);
      
      if (!error) {
        setNewName("");
        setNewEmail("");
        setNewRole("User");
        setNewStatus("Active");
        setShowAddUser(false);
      }
    } catch (err: any) {
      setUsersError(err.message || "Failed to add user. Please try again.");
    } finally {
      setAddingUser(false);
    }
  };

  const handleSaveTeamStatus = async (index: number, user: SPUser) => {
    const newStatus = teamStatusEdits[index];
    if (!newStatus) return;
    setSavingIndex(index);
    try {
      await updateUser(user.id, user.email, { status: newStatus });
      setUsers((prev) =>
        prev.map((u, i) => (i === index ? { ...u, status: newStatus } : u)),
      );
      setEditingTeamIndex(null);
    } catch {
      setUsersError("Failed to save. Please try again.");
    } finally {
      setSavingIndex(null);
    }
  };

  const handleSaveRole = async (index: number, user: SPUser) => {
    const newRole = roleEdits[index];
    if (!newRole) return;
    setSavingIndex(index);
    try {
      await updateUser(user.id, user.email, { role: newRole });
      setUsers((prev) =>
        prev.map((u, i) => (i === index ? { ...u, role: newRole } : u)),
      );
      setRoleSavedIndex(index);
      setTimeout(() => setRoleSavedIndex(null), 2000);
    } catch {
      setUsersError("Failed to save role. Please try again.");
    } finally {
      setSavingIndex(null);
    }
  };

  const handleResetPassword = async (index: number, email: string) => {
    setSavingIndex(index);
    try {
      const { error } = await authService.sendPasswordResetEmail(email);
      if (error) throw error;
      setResetSentIndex(index);
      setTimeout(() => setResetSentIndex(null), 3000);
    } catch {
      setUsersError("Failed to send reset link. Please try again.");
    } finally {
      setSavingIndex(null);
    }
  };

  const handleDeleteUser = async (index: number, user: SPUser) => {
    if (currentRole !== "Developer" && currentRole !== "Global Admin") {
      alert("You don't have permission. Please notice Global Admin to delete.");
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to delete ${user.displayName || user.email}? This action cannot be undone.`
      )
    ) {
      return;
    }

    setSavingIndex(index);
    setUsersError(null);
    try {
      await deleteUser(user.id);
      
      // Attempt to delete from Supabase Auth as well
      const { error: sbError } = await authService.deleteUser(user.email);
      if (sbError) {
        console.error("Failed to delete user from Supabase:", sbError);
        // We log the error but don't fail the overall operation if SharePoint deletion succeeded
        // The user won't be able to log in to the dashboard anyway if their PA record is gone
      }
      
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (err: any) {
      console.error("Delete user failed:", err);
      setUsersError(`Failed to delete user: ${err.message || "Please try again."}`);
    } finally {
      setSavingIndex(null);
    }
  };

  const handleResendInvitation = async (index: number, user: SPUser) => {
    setSavingIndex(index);
    setUsersError(null);
    try {
      // If user is pending, send another invitation. Otherwise send password reset.
      const { error } = user.status === "Pending" 
        ? await authService.inviteUser(user.email, { role: user.role, displayName: user.displayName })
        : await authService.sendPasswordResetEmail(user.email);
        
      if (error) throw error;
      setResetSentIndex(index);
      setTimeout(() => setResetSentIndex(null), 3000);
    } catch (err: any) {
      setUsersError(`Failed to resend: ${err.message || "Please try again."}`);
    } finally {
      setSavingIndex(null);
    }
  };

  const togglePermissionRole = (role: UserRole) => {
    setPermissionForm((prev) => ({
      ...prev,
      AllowedRoles: prev.AllowedRoles.includes(role)
        ? prev.AllowedRoles.filter((r) => r !== role)
        : [...prev.AllowedRoles, role],
    }));
  };

  const handleSavePermissionRule = async () => {
    if (!permissionForm.ResourceKey || permissionForm.AllowedRoles.length === 0)
      return;

    const payload = buildPermissionPayload();
    const duplicate = permissionAdminRules.some(
      (rule) =>
        rule.id !== editingPermissionRuleId &&
        rule.IsActive &&
        !isRulePending(rule) &&
        rule.ResourceType === payload.ResourceType &&
        rule.ResourceKey === payload.ResourceKey &&
        rule.Action === payload.Action,
    );
    if (duplicate) {
      setPermissionAdminError(
        "An active rule already exists for this resource and action.",
      );
      return;
    }

    setPermissionSaving(true);
    setPermissionAdminError(null);
    try {
      if (editingPermissionRuleId != null) {
        const previousRule = permissionAdminRules.find(
          (rule) => rule.id === editingPermissionRuleId,
        );
        if (!previousRule) return;

        if (
          editingPermissionRuleId < 0 ||
          previousRule.pendingAction === "create"
        ) {
          replacePermissionRule(editingPermissionRuleId, {
            ...toRuleRow(payload, editingPermissionRuleId, "creating"),
            pendingPayload: payload,
            pendingAction: "create",
          });
          resetPermissionForm();
          setShowAddPermission(false);
          setPermissionSaving(false);

          try {
            const savedRule = await permissionRuleService.create(
              payload,
              userEmail,
            );
            replacePermissionRule(editingPermissionRuleId, savedRule);
            syncPermissionRulesInBackground();
          } catch (err: any) {
            replacePermissionRule(editingPermissionRuleId, {
              ...toRuleRow(payload, editingPermissionRuleId, "create-failed"),
              clientError: err.message || "Failed to create permission rule.",
              pendingPayload: payload,
              pendingAction: "create",
            });
            setPermissionAdminError(
              err.message || "Failed to create permission rule.",
            );
          }
          return;
        }

        replacePermissionRule(editingPermissionRuleId, {
          ...previousRule,
          ...payload,
          clientStatus: "pending-update",
          previousRule,
          pendingPayload: payload,
          pendingAction: "update",
          UpdatedByEmail: userEmail,
          UpdatedAt: new Date().toISOString(),
        });
        resetPermissionForm();
        setShowAddPermission(false);
        setPermissionSaving(false);

        try {
          const savedRule = await permissionRuleService.update(
            editingPermissionRuleId,
            payload,
            userEmail,
          );
          replacePermissionRule(editingPermissionRuleId, savedRule);
          syncPermissionRulesInBackground();
        } catch (err: any) {
          replacePermissionRule(editingPermissionRuleId, {
            ...previousRule,
            clientStatus: "failed",
            clientError: err.message || "Failed to update permission rule.",
            pendingPayload: payload,
            pendingAction: "update",
          });
          setPermissionAdminError(
            err.message || "Failed to update permission rule.",
          );
        }
      } else {
        const tempId = -Date.now();
        setPermissionAdminRules((prev) => [
          toRuleRow(payload, tempId, "creating"),
          ...prev,
        ]);
        resetPermissionForm();
        setShowAddPermission(false);
        setPermissionSaving(false);

        try {
          const savedRule = await permissionRuleService.create(
            payload,
            userEmail,
          );
          replacePermissionRule(tempId, savedRule);
          syncPermissionRulesInBackground();
        } catch (err: any) {
          replacePermissionRule(tempId, {
            ...toRuleRow(payload, tempId, "create-failed"),
            clientError: err.message || "Failed to create permission rule.",
            pendingPayload: payload,
            pendingAction: "create",
          });
          setPermissionAdminError(
            err.message || "Failed to create permission rule.",
          );
        }
      }
    } catch (err: any) {
      setPermissionAdminError(
        err.message || "Failed to save permission rule.",
      );
    } finally {
      setPermissionSaving(false);
    }
  };

  const handleEditPermissionRule = (rule: PermissionRule) => {
    setPermissionForm({
      ResourceType: rule.ResourceType,
      ResourceKey: rule.ResourceKey,
      Action: rule.Action,
      AllowedRoles: rule.AllowedRoles,
      IsActive: rule.IsActive,
      Description: rule.Description ?? "",
      SortOrder: rule.SortOrder == null ? "" : String(rule.SortOrder),
      PermissionGroup: rule.PermissionGroup ?? getRuleDetails(rule).group,
      DisplayName: rule.DisplayName ?? getRuleDetails(rule).displayName,
    });
    setEditingPermissionRuleId(rule.id);
    setShowAddPermission(true);
    setPermissionAdminError(null);
    setPermissionSeedStatus(null);
  };

  const handleSeedGlobalAdminPermissions = async () => {
    if (
      !window.confirm(
        "Create missing default permission rules for Developer and Global Admin?",
      )
    ) {
      return;
    }

    setPermissionSeedLoading(true);
    setPermissionAdminError(null);
    setPermissionSeedStatus(null);
    try {
      const activeKeys = new Set(
        permissionAdminRules
          .filter((rule) => rule.IsActive)
          .map(
            (rule) =>
              `${rule.ResourceType}.${rule.ResourceKey}.${rule.Action}`,
          ),
      );
      const missingRules = defaultGlobalAdminPermissionRules.filter(
        (rule) =>
          !activeKeys.has(
            `${rule.ResourceType}.${rule.ResourceKey}.${rule.Action}`,
          ),
      );

      if (missingRules.length === 0) {
        setPermissionSeedStatus("Default permissions already exist.");
        return;
      }

      const tempRows = missingRules.map((rule, index) =>
        toRuleRow(rule, -(Date.now() + index), "creating"),
      );
      setPermissionAdminRules((prev) => [...tempRows, ...prev]);
      setPermissionSeedStatus(
        `Creating ${missingRules.length} default permission rules.`,
      );

      const results = await Promise.allSettled(
        tempRows.map((tempRule, index) =>
          permissionRuleService.create(missingRules[index], userEmail).then(
            (savedRule) => ({ tempRule, savedRule }),
          ),
        ),
      );
      let successCount = 0;

      results.forEach((result, index) => {
        const tempRule = tempRows[index];
        if (result.status === "fulfilled") {
          successCount += 1;
          replacePermissionRule(tempRule.id, result.value.savedRule);
        } else {
          replacePermissionRule(tempRule.id, {
            ...tempRule,
            clientStatus: "create-failed",
            clientError:
              result.reason?.message || "Failed to create permission rule.",
            pendingPayload: missingRules[index],
            pendingAction: "create",
          });
        }
      });

      setPermissionSeedStatus(
        `Created ${successCount} of ${missingRules.length} default permission rules.`,
      );
      syncPermissionRulesInBackground();
    } catch (err: any) {
      setPermissionAdminError(
        err.message || "Failed to seed default permission rules.",
      );
    } finally {
      setPermissionSeedLoading(false);
    }
  };

  const handleDisablePermissionRule = async (rule: PermissionRule) => {
    if (
      rule.ResourceType === "Function" &&
      rule.ResourceKey === "Settings.Permissions" &&
      rule.Action === "Manage"
    ) {
      const activeManagers = permissionAdminRules.filter(
        (item) =>
          item.IsActive &&
          item.ResourceType === "Function" &&
          item.ResourceKey === "Settings.Permissions" &&
          item.Action === "Manage",
      );
      if (activeManagers.length <= 1) {
        setPermissionAdminError(
          "Cannot disable the last active permission-management rule.",
        );
        return;
      }
    }

    if (
      !window.confirm(
        `Disable ${rule.Title || `${rule.ResourceType}.${rule.ResourceKey}.${rule.Action}`}?`,
      )
    ) {
      return;
    }

    setPermissionSaving(true);
    setPermissionAdminError(null);
    try {
      replacePermissionRule(rule.id, {
        ...rule,
        IsActive: false,
        clientStatus: "pending-disable",
        previousRule: rule,
        pendingPayload: {
          ResourceType: rule.ResourceType,
          ResourceKey: rule.ResourceKey,
          Action: rule.Action,
          AllowedRoles: rule.AllowedRoles,
          IsActive: false,
          Description: rule.Description,
          SortOrder: rule.SortOrder,
          PermissionGroup: rule.PermissionGroup,
          DisplayName: rule.DisplayName,
        },
        pendingAction: "disable",
        UpdatedByEmail: userEmail,
        UpdatedAt: new Date().toISOString(),
      });
      setPermissionSaving(false);

      try {
        const disabledRule = await permissionRuleService.disable(
          rule.id,
          userEmail,
        );
        replacePermissionRule(rule.id, disabledRule);
        syncPermissionRulesInBackground();
      } catch (err: any) {
        replacePermissionRule(rule.id, {
          ...rule,
          clientStatus: "failed",
          clientError: err.message || "Failed to disable permission rule.",
          pendingPayload: {
            ResourceType: rule.ResourceType,
            ResourceKey: rule.ResourceKey,
            Action: rule.Action,
            AllowedRoles: rule.AllowedRoles,
            IsActive: false,
            Description: rule.Description,
            SortOrder: rule.SortOrder,
            PermissionGroup: rule.PermissionGroup,
            DisplayName: rule.DisplayName,
          },
          pendingAction: "disable",
        });
        setPermissionAdminError(
          err.message || "Failed to disable permission rule.",
        );
      }
    } catch (err: any) {
      setPermissionAdminError(
        err.message || "Failed to disable permission rule.",
      );
    } finally {
      setPermissionSaving(false);
    }
  };

  const handleRetryPermissionRule = async (rule: PermissionRuleRow) => {
    if (!rule.pendingAction || !rule.pendingPayload) return;

    setPermissionAdminError(null);

    if (rule.pendingAction === "create") {
      replacePermissionRule(rule.id, {
        ...rule,
        clientStatus: "creating",
        clientError: undefined,
      });
      try {
        const savedRule = await permissionRuleService.create(
          rule.pendingPayload,
          userEmail,
        );
        replacePermissionRule(rule.id, savedRule);
        syncPermissionRulesInBackground();
      } catch (err: any) {
        replacePermissionRule(rule.id, {
          ...rule,
          clientStatus: "create-failed",
          clientError: err.message || "Failed to create permission rule.",
        });
        setPermissionAdminError(
          err.message || "Failed to create permission rule.",
        );
      }
      return;
    }

    if (rule.pendingAction === "disable") {
      replacePermissionRule(rule.id, {
        ...rule,
        IsActive: false,
        clientStatus: "pending-disable",
        clientError: undefined,
      });
      try {
        const disabledRule = await permissionRuleService.disable(
          rule.id,
          userEmail,
        );
        replacePermissionRule(rule.id, disabledRule);
        syncPermissionRulesInBackground();
      } catch (err: any) {
        replacePermissionRule(rule.id, {
          ...(rule.previousRule ?? rule),
          clientStatus: "failed",
          clientError: err.message || "Failed to disable permission rule.",
          pendingPayload: rule.pendingPayload,
          pendingAction: "disable",
        });
        setPermissionAdminError(
          err.message || "Failed to disable permission rule.",
        );
      }
      return;
    }

    replacePermissionRule(rule.id, {
      ...rule,
      ...rule.pendingPayload,
      clientStatus: "pending-update",
      clientError: undefined,
    });
    try {
      const savedRule = await permissionRuleService.update(
        rule.id,
        rule.pendingPayload,
        userEmail,
      );
      replacePermissionRule(rule.id, savedRule);
      syncPermissionRulesInBackground();
    } catch (err: any) {
      replacePermissionRule(rule.id, {
        ...(rule.previousRule ?? rule),
        clientStatus: "failed",
        clientError: err.message || "Failed to update permission rule.",
        pendingPayload: rule.pendingPayload,
        pendingAction: "update",
      });
      setPermissionAdminError(
        err.message || "Failed to update permission rule.",
      );
    }
  };

  const handleDiscardPermissionRule = (rule: PermissionRuleRow) => {
    if (rule.id >= 0 || getRuleStatus(rule) !== "create-failed") return;
    setPermissionAdminRules((prev) =>
      prev.filter((item) => item.id !== rule.id),
    );
  };

  const displayUsers = userEmail
    ? [
        ...users
          .filter((u) => u.email === userEmail)
          .map((u) => ({ ...u, isMe: true })),
        ...users
          .filter((u) => u.email !== userEmail)
          .map((u) => ({ ...u, isMe: false })),
      ]
    : users.map((u) => ({ ...u, isMe: false }));

  const tabs = [
    {
      id: "profile",
      label: "My Profile",
      icon: User,
      requiredRole: "User" as const,
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
      requiredRole: "User" as const,
    },
    {
      id: "team",
      label: "Team Management",
      icon: Users,
      requiredRole: "Admin" as const,
    },
    {
      id: "roles",
      label: "Role Management",
      icon: Shield,
      requiredRole: "Global Admin" as const,
    },
    {
      id: "permissions",
      label: "Permissions",
      icon: Lock,
      requiredRole: "Global Admin" as const,
      requiredPermission: {
        resourceType: "Function" as const,
        resourceKey: "Settings.Permissions",
        action: "Manage" as const,
      },
    },
    {
      id: "system",
      label: "System Config",
      icon: SettingsIcon,
      requiredRole: "Developer" as const,
    },
  ];

  const visibleTabs = tabs.filter((tab) =>
    "requiredPermission" in tab
      ? can(
          tab.requiredPermission.resourceType,
          tab.requiredPermission.resourceKey,
          tab.requiredPermission.action,
        )
      : hasPermission(tab.requiredRole),
  );

  const effectiveTab = visibleTabs.find((t) => t.id === activeTab)
    ? activeTab
    : "profile";

  const filteredPermissionRules = permissionAdminRules.filter((rule) => {
    const status = getRuleStatus(rule);
    const details = getRuleDetails(rule);
    const searchText = [
      rule.Title,
      rule.ResourceType,
      rule.ResourceKey,
      rule.Action,
      rule.Description,
      details.displayName,
      details.group,
      details.whereUsed,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const query = permissionSearch.trim().toLowerCase();

    return (
      (!query || searchText.includes(query)) &&
      (permissionTypeFilter === "all" ||
        rule.ResourceType === permissionTypeFilter) &&
      (permissionActionFilter === "all" ||
        rule.Action === permissionActionFilter) &&
      (permissionRoleFilter === "all" ||
        rule.AllowedRoles.includes(permissionRoleFilter)) &&
      (permissionStatusFilter === "all" || status === permissionStatusFilter)
    );
  });

  const groupedPermissionAdminRules = filteredPermissionRules.reduce(
    (groups, rule) => {
      const typeGroup = groups[rule.ResourceType] ?? {};
      const resourceGroup = typeGroup[rule.ResourceKey] ?? [];
      groups[rule.ResourceType] = {
        ...typeGroup,
        [rule.ResourceKey]: [...resourceGroup, rule],
      };
      return groups;
    },
    {} as Record<PermissionResourceType, Record<string, PermissionRuleRow[]>>,
  );

  const activePermissionRules = permissionAdminRules.filter(
    (rule) => rule.IsActive && !["pending-disable"].includes(getRuleStatus(rule)),
  );

  const pendingPermissionCount = permissionAdminRules.filter(isRulePending).length;

  const failedPermissionCount = permissionAdminRules.filter((rule) =>
    ["failed", "create-failed"].includes(getRuleStatus(rule)),
  ).length;

  const roleAccessSummary = permissionRoles.map((role) => {
    const roleRules = activePermissionRules.filter((rule) =>
      rule.AllowedRoles.includes(role),
    );
    const pageCount = roleRules.filter(
      (rule) => rule.ResourceType === "Page",
    ).length;
    const functionCount = roleRules.filter(
      (rule) => rule.ResourceType === "Function",
    ).length;
    const allowedLabels = roleRules
      .slice(0, 5)
      .map((rule) => getRuleDetails(rule).displayName);

    return {
      role,
      pageCount,
      functionCount,
      ruleCount: roleRules.length,
      allowedLabels,
    };
  });

  const permissionSummaryCards = [
    {
      label: "Active Rules",
      value: permissionAdminRules.filter((rule) => getRuleStatus(rule) === "active")
        .length,
    },
    {
      label: "Disabled",
      value: permissionAdminRules.filter(
        (rule) => getRuleStatus(rule) === "disabled",
      ).length,
    },
    {
      label: "Pending",
      value: pendingPermissionCount,
    },
    {
      label: "Failed",
      value: failedPermissionCount,
    },
  ];

  const formatPermissionUpdatedAt = (value?: string) => {
    if (!value) return "Not returned";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
  };

  const renderStatusChip = (rule: PermissionRuleRow) => {
    const status = getRuleStatus(rule);
    const meta = statusMeta[status];
    const Icon = meta.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${meta.classes}`}
      >
        <Icon className="h-3 w-3" />
        {meta.label}
      </span>
    );
  };

  const renderRoleChip = (role: UserRole) => (
    <span
      key={role}
      className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${roleChipClasses[role]}`}
    >
      {role}
    </span>
  );

  const renderRoleAccessCell = (rule: PermissionRuleRow, role: UserRole) => {
    const allowed = rule.IsActive && rule.AllowedRoles.includes(role);
    return (
      <td className="px-2 py-2 text-center">
        <span
          className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full border text-[11px] font-semibold ${
            allowed
              ? roleChipClasses[role]
              : "border-gray-100 bg-gray-50 text-gray-300"
          }`}
          title={allowed ? `${role} allowed` : `${role} blocked`}
        >
          {allowed ? "On" : "-"}
        </span>
      </td>
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Page header */}
      <div>
        <h1
          className="text-[28px] font-semibold text-[#1d1d1f]"
          style={{ letterSpacing: "-0.28px", lineHeight: "1.1" }}
        >
          Settings
        </h1>
        <p
          className="text-sm text-[#1d1d1f]/50 mt-1"
          style={{ letterSpacing: "-0.224px" }}
        >
          Manage your account and system preferences.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Settings Navigation */}
        <div className="w-full md:w-56 shrink-0 space-y-3">
          <TutorTooltip
            text="Navigate between different settings categories. The available categories depend on your current role."
            position="right"
            componentName="Settings.Navigation"
          >
            <div className="card p-1.5 flex flex-col gap-0.5">
              {visibleTabs.map((tab) => (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg transition-all text-[13px] font-medium ${
                    effectiveTab === tab.id
                      ? "bg-[#0071e3] text-white"
                      : "text-[#1d1d1f]/60 hover:bg-[#f5f5f7] hover:text-[#1d1d1f]"
                  }`}
                  style={{ letterSpacing: "-0.12px" }}
                >
                  <tab.icon className="w-3.5 h-3.5 shrink-0" />
                  {tab.label}
                </button>
              ))}
            </div>
          </TutorTooltip>

          {/* Current role badge */}
          <div className="card p-4">
            <div
              className="flex items-center gap-1.5 text-[#0071e3] font-semibold text-[11px] mb-1"
              style={{ letterSpacing: "0.04em", textTransform: "uppercase" }}
            >
              <Shield className="w-3 h-3" />
              Current Role
            </div>
            <p
              className="text-[13px] text-[#1d1d1f]/60"
              style={{ letterSpacing: "-0.12px" }}
            >
              Signed in as{" "}
              <span className="font-semibold text-[#1d1d1f]">{currentRole}</span>
            </p>
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1 min-w-0">
          {/* Profile */}
          {effectiveTab === "profile" && (
            <div className="space-y-6">
            <div className="card p-7 space-y-6">
              <h2
                className="text-[17px] font-semibold text-[#1d1d1f] border-b border-[#1d1d1f]/06 pb-4"
                style={{ letterSpacing: "-0.374px" }}
              >
                My Profile
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label
                    className="text-[11px] font-semibold text-[#1d1d1f]/45 uppercase"
                    style={{ letterSpacing: "0.04em" }}
                  >
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full px-3.5 py-2.5 bg-[#fafafc] border border-[rgba(0,0,0,0.08)] rounded-[11px] text-[14px] text-[#1d1d1f] placeholder-[#1d1d1f]/30 focus:outline-none focus:border-[#0071e3]/40 focus:ring-2 focus:ring-[#0071e3]/10 transition-all"
                    style={{ letterSpacing: "-0.224px" }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    className="text-[11px] font-semibold text-[#1d1d1f]/45 uppercase"
                    style={{ letterSpacing: "0.04em" }}
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-3.5 py-2.5 bg-[#fafafc] border border-[rgba(0,0,0,0.08)] rounded-[11px] text-[14px] text-[#1d1d1f] placeholder-[#1d1d1f]/30 focus:outline-none focus:border-[#0071e3]/40 focus:ring-2 focus:ring-[#0071e3]/10 transition-all"
                    style={{ letterSpacing: "-0.224px" }}
                  />
                  <p
                    className="text-[11px] text-[#1d1d1f]/35"
                    style={{ letterSpacing: "-0.12px" }}
                  >
                    Used to load your role from SharePoint.
                  </p>
                </div>
              </div>
              <div className="pt-2 flex items-center gap-4">
                <TutorTooltip
                  text="Save the email used to resolve your SharePoint role and refresh your current access level."
                  position="top"
                  wrapperClass="w-auto"
                  componentName="Settings.Profile.SaveChanges"
                >
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    className="px-5 py-2 bg-[#0071e3] text-white rounded-lg text-[14px] font-medium hover:bg-[#0077ed] transition-colors"
                    style={{ letterSpacing: "-0.224px" }}
                  >
                    Save Changes
                  </button>
                </TutorTooltip>
                {profileSaved && (
                  <span
                    className="text-[13px] text-green-600 font-medium"
                    style={{ letterSpacing: "-0.12px" }}
                  >
                    Saved! Role updated.
                  </span>
                )}
              </div>
            </div>

            {/* Change Password */}
            <div className="card p-7 space-y-6">
              <h2
                className="text-[17px] font-semibold text-[#1d1d1f] border-b border-[#1d1d1f]/06 pb-4 flex items-center gap-2"
                style={{ letterSpacing: "-0.374px" }}
              >
                <Lock className="w-4 h-4 text-[#0071e3]" />
                Change Password
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5 md:col-span-2">
                  <label
                    className="text-[11px] font-semibold text-[#1d1d1f]/45 uppercase"
                    style={{ letterSpacing: "0.04em" }}
                  >
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-3.5 py-2.5 bg-[#fafafc] border border-[rgba(0,0,0,0.08)] rounded-[11px] text-[14px] text-[#1d1d1f] placeholder-[#1d1d1f]/30 focus:outline-none focus:border-[#0071e3]/40 focus:ring-2 focus:ring-[#0071e3]/10 transition-all"
                    style={{ letterSpacing: "-0.224px" }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    className="text-[11px] font-semibold text-[#1d1d1f]/45 uppercase"
                    style={{ letterSpacing: "0.04em" }}
                  >
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full px-3.5 py-2.5 bg-[#fafafc] border border-[rgba(0,0,0,0.08)] rounded-[11px] text-[14px] text-[#1d1d1f] placeholder-[#1d1d1f]/30 focus:outline-none focus:border-[#0071e3]/40 focus:ring-2 focus:ring-[#0071e3]/10 transition-all"
                    style={{ letterSpacing: "-0.224px" }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    className="text-[11px] font-semibold text-[#1d1d1f]/45 uppercase"
                    style={{ letterSpacing: "0.04em" }}
                  >
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className={`w-full px-3.5 py-2.5 bg-[#fafafc] border rounded-[11px] text-[14px] text-[#1d1d1f] placeholder-[#1d1d1f]/30 focus:outline-none focus:ring-2 transition-all ${
                      confirmPassword && confirmPassword !== newPassword
                        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                        : "border-[rgba(0,0,0,0.08)] focus:border-[#0071e3]/40 focus:ring-[#0071e3]/10"
                    }`}
                    style={{ letterSpacing: "-0.224px" }}
                  />
                </div>
              </div>
              {passwordError && (
                <p className="text-[13px] text-red-600" style={{ letterSpacing: "-0.12px" }}>
                  {passwordError}
                </p>
              )}
              <div className="pt-2 flex items-center gap-4">
                <TutorTooltip
                  text="Update your account password after entering the current password and matching new password fields."
                  position="top"
                  wrapperClass="w-auto"
                  componentName="Settings.Profile.UpdatePassword"
                >
                  <button
                    type="button"
                    onClick={handleChangePassword}
                    disabled={passwordSaving || !currentPassword || !newPassword || !confirmPassword}
                    className="px-5 py-2 bg-[#0071e3] text-white rounded-lg text-[14px] font-medium hover:bg-[#0077ed] transition-colors disabled:opacity-50"
                    style={{ letterSpacing: "-0.224px" }}
                  >
                    {passwordSaving ? "Updating…" : "Update Password"}
                  </button>
                </TutorTooltip>
                {passwordSaved && (
                  <span className="text-[13px] text-green-600 font-medium" style={{ letterSpacing: "-0.12px" }}>
                    Password updated successfully.
                  </span>
                )}
              </div>
            </div>
            </div>
          )}

          {/* Notifications */}
          {effectiveTab === "notifications" && (
            <div className="card p-7 space-y-6">
              <h2
                className="text-[17px] font-semibold text-[#1d1d1f] border-b border-[#1d1d1f]/06 pb-4"
                style={{ letterSpacing: "-0.374px" }}
              >
                Notification Preferences
              </h2>
              <div className="space-y-0 divide-y divide-[#1d1d1f]/06">
                {[
                  {
                    title: "New Order Assignments",
                    desc: "Receive an email when a new order is assigned to you.",
                  },
                  {
                    title: "Order Status Changes",
                    desc: "Get notified when an order status changes to Completed or Cancelled.",
                  },
                  {
                    title: "System Alerts",
                    desc: "Important system maintenance and downtime alerts.",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                  >
                    <div>
                      <div
                        className="text-[14px] font-medium text-[#1d1d1f]"
                        style={{ letterSpacing: "-0.224px" }}
                      >
                        {item.title}
                      </div>
                      <div
                        className="text-[12px] text-[#1d1d1f]/45 mt-0.5"
                        style={{ letterSpacing: "-0.12px" }}
                      >
                        {item.desc}
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-6 shrink-0">
                      <input
                        type="checkbox"
                        defaultChecked={i !== 2}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-6 bg-[#1d1d1f]/15 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0071e3]"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Team Management */}
          {effectiveTab === "team" && (
            <div className="card p-7 space-y-5">
              <div className="flex items-center justify-between border-b border-[#1d1d1f]/06 pb-4">
                <h2
                  className="text-[17px] font-semibold text-[#1d1d1f]"
                  style={{ letterSpacing: "-0.374px" }}
                >
                  Team Management
                </h2>
                <TutorTooltip
                  text="Open or close the form for creating a team member with an initial role and account status."
                  position="left"
                  wrapperClass="w-auto"
                  componentName="Settings.Team.AddUserToggle"
                >
                  <button
                    type="button"
                    onClick={() => setShowAddUser((v) => !v)}
                    className="px-4 py-1.5 bg-[#0071e3] text-white rounded-lg text-[13px] font-medium hover:bg-[#0077ed] transition-colors"
                    style={{ letterSpacing: "-0.12px" }}
                  >
                    {showAddUser ? "Cancel" : "+ Add User"}
                  </button>
                </TutorTooltip>
              </div>
              <p
                className="text-[13px] text-[#1d1d1f]/45"
                style={{ letterSpacing: "-0.12px" }}
              >
                As an Admin, you can manage your team members and their basic
                access.
              </p>

              {showAddUser && (
                <div className="p-5 bg-[#f5f5f7] rounded-xl space-y-4">
                  <p className="text-[13px] font-semibold text-[#1d1d1f]" style={{ letterSpacing: "-0.12px" }}>
                    New User
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-[#1d1d1f]/45 uppercase" style={{ letterSpacing: "0.04em" }}>
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="e.g. John Smith"
                        className="w-full px-3.5 py-2.5 bg-white border border-[rgba(0,0,0,0.08)] rounded-[11px] text-[14px] text-[#1d1d1f] placeholder-[#1d1d1f]/30 focus:outline-none focus:border-[#0071e3]/40 focus:ring-2 focus:ring-[#0071e3]/10 transition-all"
                        style={{ letterSpacing: "-0.224px" }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-[#1d1d1f]/45 uppercase" style={{ letterSpacing: "0.04em" }}>
                        Email
                      </label>
                      <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="user@example.com"
                        className="w-full px-3.5 py-2.5 bg-white border border-[rgba(0,0,0,0.08)] rounded-[11px] text-[14px] text-[#1d1d1f] placeholder-[#1d1d1f]/30 focus:outline-none focus:border-[#0071e3]/40 focus:ring-2 focus:ring-[#0071e3]/10 transition-all"
                        style={{ letterSpacing: "-0.224px" }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-[#1d1d1f]/45 uppercase" style={{ letterSpacing: "0.04em" }}>
                        Role
                      </label>
                      <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value as UserRole)}
                        className="w-full px-3.5 py-2.5 bg-white border border-[rgba(0,0,0,0.08)] rounded-[11px] text-[14px] text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]/40 focus:ring-2 focus:ring-[#0071e3]/10 transition-all"
                      >
                        <option value="User">User</option>
                        <option value="Admin">Admin</option>
                        <option value="Global Admin">Global Admin</option>
                        <option value="Developer">Developer</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-[#1d1d1f]/45 uppercase" style={{ letterSpacing: "0.04em" }}>
                        Status
                      </label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value as UserStatus)}
                        className="w-full px-3.5 py-2.5 bg-white border border-[rgba(0,0,0,0.08)] rounded-[11px] text-[14px] text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]/40 focus:ring-2 focus:ring-[#0071e3]/10 transition-all"
                      >
                        <option value="Active">Active</option>
                        <option value="Pending">Pending</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-1">
                    <TutorTooltip
                      text="Create the user record and send an invitation email when the name and email are complete."
                      position="top"
                      wrapperClass="w-auto"
                      componentName="Settings.Team.AddUserSubmit"
                    >
                      <button
                        type="button"
                        onClick={handleAddUser}
                        disabled={addingUser || !newEmail || !newName}
                        className="px-5 py-2 bg-[#0071e3] text-white rounded-lg text-[14px] font-medium hover:bg-[#0077ed] transition-colors disabled:opacity-50"
                        style={{ letterSpacing: "-0.224px" }}
                      >
                        {addingUser ? "Adding…" : "Add User"}
                      </button>
                    </TutorTooltip>
                    <TutorTooltip
                      text="Discard the new user form and reset the entered name, email, role, and status."
                      position="top"
                      wrapperClass="w-auto"
                      componentName="Settings.Team.AddUserCancel"
                    >
                      <button
                        type="button"
                        onClick={() => { setShowAddUser(false); setNewName(""); setNewEmail(""); setNewRole("User"); setNewStatus("Active"); }}
                        className="text-[13px] text-[#1d1d1f]/45 hover:text-[#1d1d1f] transition-colors"
                      >
                        Cancel
                      </button>
                    </TutorTooltip>
                  </div>
                </div>
              )}

              {usersError && (
                <p className="text-[13px] text-red-600">{usersError}</p>
              )}

              {usersLoading ? (
                <p
                  className="text-[13px] text-[#1d1d1f]/30 py-4"
                  style={{ letterSpacing: "-0.12px" }}
                >
                  Loading users…
                </p>
              ) : (
                <div className="overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-[#1d1d1f]/06">
                        <th className="pb-2.5 label-text text-[#1d1d1f]/35">Name</th>
                        <th className="pb-2.5 label-text text-[#1d1d1f]/35">Email</th>
                        <th className="pb-2.5 label-text text-[#1d1d1f]/35">Role</th>
                        <th className="pb-2.5 label-text text-[#1d1d1f]/35">Status</th>
                        <th className="pb-2.5 label-text text-[#1d1d1f]/35 text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayUsers.map((user, i) => (
                        <tr
                          key={user.email}
                          className={`border-b border-[#1d1d1f]/04 last:border-0 transition-colors ${user.isMe ? "bg-[#0071e3]/03" : "hover:bg-[#f5f5f7]"}`}
                        >
                          <td className="py-3 text-[13px] font-medium text-[#1d1d1f]">
                            <span className="flex items-center gap-2">
                              {user.displayName || user.email}
                              {user.isMe && (
                                <span className="px-1.5 py-0.5 bg-[#0071e3] text-white rounded text-[10px] font-semibold">
                                  You
                                </span>
                              )}
                            </span>
                          </td>
                          <td
                            className="py-3 text-[12px] text-[#1d1d1f]/45"
                            style={{ letterSpacing: "-0.12px" }}
                          >
                            {user.email}
                          </td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 bg-[#f5f5f7] text-[#1d1d1f]/60 rounded-md text-[11px] font-medium">
                              {user.role}
                            </span>
                          </td>
                          <td className="py-3">
                            {editingTeamIndex === i ? (
                              <TutorTooltip
                                text="Choose whether this team member is active, pending invitation, or inactive."
                                position="top"
                                wrapperClass="w-auto"
                                componentName="Settings.Team.StatusSelect"
                              >
                                <select
                                  value={teamStatusEdits[i] ?? user.status}
                                  onChange={(e) =>
                                    setTeamStatusEdits({
                                      ...teamStatusEdits,
                                      [i]: e.target.value as UserStatus,
                                    })
                                  }
                                  className="bg-[#fafafc] border border-[rgba(0,0,0,0.08)] rounded-lg px-2 py-1 text-[12px] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20"
                                >
                                  <option value="Active">Active</option>
                                  <option value="Pending">Pending</option>
                                  <option value="Inactive">Inactive</option>
                                </select>
                              </TutorTooltip>
                            ) : (
                              <span
                                className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                  user.status === "Active"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-yellow-100 text-yellow-700"
                                }`}
                              >
                                {user.status}
                              </span>
                            )}
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-3">
                              {editingTeamIndex === i ? (
                                <>
                                  <TutorTooltip
                                    text="Stop editing this member's status without saving changes."
                                    position="top"
                                    wrapperClass="w-auto"
                                    componentName="Settings.Team.CancelStatusEdit"
                                  >
                                    <button
                                      type="button"
                                      onClick={() => setEditingTeamIndex(null)}
                                      className="text-[12px] text-[#1d1d1f]/45 hover:text-[#1d1d1f] transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  </TutorTooltip>
                                  <TutorTooltip
                                    text="Save the selected status for this team member."
                                    position="top"
                                    wrapperClass="w-auto"
                                    componentName="Settings.Team.SaveStatus"
                                  >
                                    <button
                                      type="button"
                                      disabled={savingIndex === i}
                                      onClick={() => handleSaveTeamStatus(i, user)}
                                      className="text-[12px] text-[#0071e3] font-medium hover:underline disabled:opacity-50"
                                    >
                                      {savingIndex === i ? "Saving…" : "Save"}
                                    </button>
                                  </TutorTooltip>
                                </>
                              ) : (
                                <>
                                  <TutorTooltip
                                    text="Edit this team member's status."
                                    position="top"
                                    wrapperClass="w-auto"
                                    componentName="Settings.Team.EditStatus"
                                  >
                                    <button
                                      type="button"
                                      onClick={() => setEditingTeamIndex(i)}
                                      className="text-[12px] text-[#0071e3] hover:underline font-medium"
                                    >
                                      Edit
                                    </button>
                                  </TutorTooltip>
                                  <TutorTooltip
                                    text="Send another invitation for pending users, or a password reset email for active users."
                                    position="top"
                                    wrapperClass="w-auto"
                                    componentName="Settings.Team.ResendInvitation"
                                  >
                                    <button
                                      type="button"
                                      onClick={() => handleResendInvitation(i, user)}
                                      disabled={savingIndex === i}
                                      className="text-[12px] text-[#0071e3] hover:underline font-medium flex items-center gap-1"
                                    >
                                      <Mail className="w-3 h-3 text-[#0071e3]/60" />
                                      {resetSentIndex === i ? (
                                        <span className="text-green-600">Sent!</span>
                                      ) : (
                                        "Re-send"
                                      )}
                                    </button>
                                  </TutorTooltip>
                                  <TutorTooltip
                                    text="Delete this user record after confirming the action. This is limited to Global Admins and Developers."
                                    position="top"
                                    wrapperClass="w-auto"
                                    componentName="Settings.Team.DeleteUser"
                                  >
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteUser(i, user)}
                                      className="text-[12px] text-red-600 hover:underline font-medium flex items-center gap-1"
                                    >
                                      <Trash2 className="w-3 h-3 text-red-600/60" />
                                      Delete
                                    </button>
                                  </TutorTooltip>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Role Management */}
          {effectiveTab === "roles" && (
            <div className="card p-7 space-y-5">
              <div className="flex items-center justify-between border-b border-[#1d1d1f]/06 pb-4">
                <h2
                  className="text-[17px] font-semibold text-[#1d1d1f]"
                  style={{ letterSpacing: "-0.374px" }}
                >
                  Global Role Management
                </h2>
              </div>
              <p
                className="text-[13px] text-[#1d1d1f]/45"
                style={{ letterSpacing: "-0.12px" }}
              >
                As a Global Admin, you can assign system-wide roles to users.
              </p>

              {usersError && (
                <p className="text-[13px] text-red-600">{usersError}</p>
              )}

              {usersLoading ? (
                <p
                  className="text-[13px] text-[#1d1d1f]/30 py-4"
                  style={{ letterSpacing: "-0.12px" }}
                >
                  Loading users…
                </p>
              ) : (
                <div className="overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-[#1d1d1f]/06">
                        <th className="pb-2.5 label-text text-[#1d1d1f]/35">User</th>
                        <th className="pb-2.5 label-text text-[#1d1d1f]/35">
                          Current Role
                        </th>
                        <th className="pb-2.5 label-text text-[#1d1d1f]/35">
                          Assign New Role
                        </th>
                        <th className="pb-2.5 label-text text-[#1d1d1f]/35 text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayUsers.map((user, i) => (
                        <tr
                          key={user.email}
                          className={`border-b border-[#1d1d1f]/04 last:border-0 transition-colors ${user.isMe ? "bg-[#0071e3]/03" : "hover:bg-[#f5f5f7]"}`}
                        >
                          <td className="py-3 text-[13px] font-medium text-[#1d1d1f]">
                            <span className="flex items-center gap-2">
                              {user.displayName || user.email}
                              {user.isMe && (
                                <span className="px-1.5 py-0.5 bg-[#0071e3] text-white rounded text-[10px] font-semibold">
                                  You
                                </span>
                              )}
                            </span>
                          </td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 bg-[#f5f5f7] text-[#1d1d1f]/60 rounded-md text-[11px] font-medium">
                              {user.role}
                            </span>
                          </td>
                          <td className="py-3">
                            <TutorTooltip
                              text="Select a system-wide role to stage for this user before saving."
                              position="top"
                              wrapperClass="w-auto"
                              componentName="Settings.Roles.RoleSelect"
                            >
                              <select
                                value={roleEdits[i] ?? user.role}
                                onChange={(e) =>
                                  setRoleEdits({
                                    ...roleEdits,
                                    [i]: e.target.value as UserRole,
                                  })
                                }
                                className="bg-[#fafafc] border border-[rgba(0,0,0,0.08)] rounded-lg px-2.5 py-1.5 text-[13px] text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20"
                              >
                                <option value="User">User</option>
                                <option value="Admin">Admin</option>
                                <option value="Global Admin">Global Admin</option>
                                <option value="Developer">Developer</option>
                              </select>
                            </TutorTooltip>
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex flex-col items-end gap-2">
                              {roleEdits[i] && roleEdits[i] !== user.role && (
                                <TutorTooltip
                                  text="Apply the selected system role to this user."
                                  position="left"
                                  wrapperClass="w-auto"
                                  componentName="Settings.Roles.SaveRole"
                                >
                                  <button
                                    type="button"
                                    disabled={savingIndex === i}
                                    onClick={() => handleSaveRole(i, user)}
                                    className="text-[12px] bg-[#0071e3] text-white px-3 py-1 rounded-lg font-medium hover:bg-[#0077ed] transition-colors disabled:opacity-50"
                                  >
                                    {roleSavedIndex === i
                                      ? "Saved!"
                                      : savingIndex === i
                                        ? "Saving…"
                                        : "Save Role"}
                                  </button>
                                </TutorTooltip>
                              )}
                              <TutorTooltip
                                text="Send this user a password reset email without changing their role."
                                position="left"
                                wrapperClass="w-auto"
                                componentName="Settings.Roles.ResetPassword"
                              >
                                <button
                                  type="button"
                                  disabled={savingIndex === i}
                                  onClick={() =>
                                    handleResetPassword(i, user.email)
                                  }
                                  className="text-[12px] text-[#0071e3] hover:underline font-medium flex items-center gap-1.5 disabled:opacity-50"
                                >
                                  {resetSentIndex === i ? (
                                    <span className="text-green-600 font-semibold">Email Sent!</span>
                                  ) : (
                                    <>
                                      <Key className="w-3 h-3" />
                                      {savingIndex === i ? "Sending..." : "Reset Password"}
                                    </>
                                  )}
                                </button>
                              </TutorTooltip>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Permissions */}
          {effectiveTab === "permissions" && (
            <div className="space-y-5">
              <div className="card p-7 space-y-5">
                <div className="flex flex-col gap-4 border-b border-[#1d1d1f]/06 pb-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2
                      className="text-[17px] font-semibold text-[#1d1d1f]"
                      style={{ letterSpacing: "-0.374px" }}
                    >
                      Permissions
                    </h2>
                    <p className="mt-1 text-[13px] text-[#1d1d1f]/45">
                      Control role access to dashboard pages, buttons, fields,
                      functions, and sections.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleSeedGlobalAdminPermissions}
                      disabled={permissionSeedLoading}
                      className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-[#0071e3]/25 bg-white px-4 py-2 text-[13px] font-medium text-[#0071e3] transition-colors hover:bg-blue-50 disabled:opacity-50"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      {permissionSeedLoading
                        ? "Adding..."
                        : "Add Global Admin Defaults"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        resetPermissionForm();
                        setShowAddPermission((value) => !value);
                      }}
                      className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-[#0071e3] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#0077ed]"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {showAddPermission ? "Cancel" : "Add Rule"}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {permissionSummaryCards.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl bg-[#f5f5f7] p-4"
                    >
                      <div className="text-[11px] font-semibold uppercase text-[#1d1d1f]/40">
                        {item.label}
                      </div>
                      <div className="mt-1 text-2xl font-semibold text-[#1d1d1f]">
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
                  {roleAccessSummary.map((item) => (
                    <div
                      key={item.role}
                      className="rounded-xl border border-[#1d1d1f]/06 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-3">
                        {renderRoleChip(item.role)}
                        <span className="text-[11px] font-semibold text-[#1d1d1f]/35">
                          {item.ruleCount} rules
                        </span>
                      </div>
                      <div className="mt-3 text-[13px] font-medium text-[#1d1d1f]">
                        {item.pageCount} pages / {item.functionCount} functions
                      </div>
                      <p className="mt-1 line-clamp-2 text-[11px] text-[#1d1d1f]/45">
                        {item.allowedLabels.length > 0
                          ? item.allowedLabels.join(", ")
                          : "No active rules for this role."}
                      </p>
                    </div>
                  ))}
                </div>

                {permissionAdminError && (
                  <p className="rounded-lg bg-red-50 px-4 py-3 text-[13px] text-red-700">
                    {permissionAdminError}
                  </p>
                )}

                {permissionSeedStatus && (
                  <p className="rounded-lg bg-green-50 px-4 py-3 text-[13px] text-green-700">
                    {permissionSeedStatus}
                  </p>
                )}

                <div className="grid grid-cols-1 gap-3 rounded-xl bg-[#f5f5f7] p-4 md:grid-cols-5">
                  <label className="relative md:col-span-2">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1d1d1f]/30" />
                    <input
                      value={permissionSearch}
                      onChange={(e) => setPermissionSearch(e.target.value)}
                      placeholder="Search resource, route, description"
                      className="w-full rounded-[11px] border border-[rgba(0,0,0,0.08)] bg-white py-2.5 pl-9 pr-3 text-[13px] text-[#1d1d1f] outline-none transition-all focus:border-[#0071e3]/40 focus:ring-2 focus:ring-[#0071e3]/10"
                    />
                  </label>
                  <select
                    value={permissionTypeFilter}
                    onChange={(e) =>
                      setPermissionTypeFilter(
                        e.target.value as PermissionTypeFilter,
                      )
                    }
                    className="rounded-[11px] border border-[rgba(0,0,0,0.08)] bg-white px-3 py-2.5 text-[13px]"
                  >
                    <option value="all">All resource types</option>
                    {permissionResourceTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <select
                    value={permissionRoleFilter}
                    onChange={(e) =>
                      setPermissionRoleFilter(
                        e.target.value as PermissionRoleFilter,
                      )
                    }
                    className="rounded-[11px] border border-[rgba(0,0,0,0.08)] bg-white px-3 py-2.5 text-[13px]"
                  >
                    <option value="all">All roles</option>
                    {permissionRoles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                  <select
                    value={permissionStatusFilter}
                    onChange={(e) =>
                      setPermissionStatusFilter(
                        e.target.value as PermissionStatusFilter,
                      )
                    }
                    className="rounded-[11px] border border-[rgba(0,0,0,0.08)] bg-white px-3 py-2.5 text-[13px]"
                  >
                    <option value="all">All statuses</option>
                    {Object.entries(statusMeta).map(([status, meta]) => (
                      <option key={status} value={status}>
                        {meta.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={permissionActionFilter}
                    onChange={(e) =>
                      setPermissionActionFilter(
                        e.target.value as PermissionActionFilter,
                      )
                    }
                    className="rounded-[11px] border border-[rgba(0,0,0,0.08)] bg-white px-3 py-2.5 text-[13px] md:col-span-5 lg:col-span-1"
                  >
                    <option value="all">All actions</option>
                    {permissionActions.map((action) => (
                      <option key={action} value={action}>
                        {action}
                      </option>
                    ))}
                  </select>
                </div>

                {showAddPermission && (
                  <div className="rounded-xl bg-[#f5f5f7] p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[13px] font-semibold text-[#1d1d1f]">
                          {editingPermissionRuleId == null
                            ? "New Permission Rule"
                            : "Edit Permission Rule"}
                        </p>
                        <p className="mt-0.5 text-[12px] text-[#1d1d1f]/45">
                          {editingPermissionRuleId == null
                            ? "Create a SharePoint rule for one resource action."
                            : "Update roles, status, description, or sort order."}
                        </p>
                      </div>
                      {editingPermissionRuleId != null && (
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-[#094cb2]">
                          Editing ID {editingPermissionRuleId}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold uppercase text-[#1d1d1f]/45">
                          Resource Type
                        </label>
                        <select
                          value={permissionForm.ResourceType}
                          onChange={(e) =>
                            setPermissionForm((prev) => ({
                              ...prev,
                              ResourceType: e.target
                                .value as PermissionResourceType,
                            }))
                          }
                          className="w-full rounded-[11px] border border-[rgba(0,0,0,0.08)] bg-white px-3.5 py-2.5 text-[14px]"
                        >
                          {permissionResourceTypes.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold uppercase text-[#1d1d1f]/45">
                          Resource Key
                        </label>
                        <input
                          value={permissionForm.ResourceKey}
                          onChange={(e) =>
                            setPermissionForm((prev) => ({
                              ...prev,
                              ResourceKey: e.target.value,
                            }))
                          }
                          placeholder="e.g. Reports"
                          className="w-full rounded-[11px] border border-[rgba(0,0,0,0.08)] bg-white px-3.5 py-2.5 text-[14px]"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold uppercase text-[#1d1d1f]/45">
                          Display Name
                        </label>
                        <input
                          value={permissionForm.DisplayName}
                          onChange={(e) =>
                            setPermissionForm((prev) => ({
                              ...prev,
                              DisplayName: e.target.value,
                            }))
                          }
                          placeholder="e.g. Reports"
                          className="w-full rounded-[11px] border border-[rgba(0,0,0,0.08)] bg-white px-3.5 py-2.5 text-[14px]"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold uppercase text-[#1d1d1f]/45">
                          Group
                        </label>
                        <input
                          value={permissionForm.PermissionGroup}
                          onChange={(e) =>
                            setPermissionForm((prev) => ({
                              ...prev,
                              PermissionGroup: e.target.value,
                            }))
                          }
                          placeholder="e.g. Reports"
                          className="w-full rounded-[11px] border border-[rgba(0,0,0,0.08)] bg-white px-3.5 py-2.5 text-[14px]"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold uppercase text-[#1d1d1f]/45">
                          Action
                        </label>
                        <select
                          value={permissionForm.Action}
                          onChange={(e) =>
                            setPermissionForm((prev) => ({
                              ...prev,
                              Action: e.target.value as PermissionAction,
                            }))
                          }
                          className="w-full rounded-[11px] border border-[rgba(0,0,0,0.08)] bg-white px-3.5 py-2.5 text-[14px]"
                        >
                          {permissionActions.map((action) => (
                            <option key={action} value={action}>
                              {action}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5 md:col-span-3">
                        <label className="text-[11px] font-semibold uppercase text-[#1d1d1f]/45">
                          Allowed Roles
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {permissionRoles.map((role) => (
                            <label
                              key={role}
                              className={`cursor-pointer rounded-lg border px-3 py-2 text-[13px] font-medium ${
                                permissionForm.AllowedRoles.includes(role)
                                  ? roleChipClasses[role]
                                  : "border-[#1d1d1f]/10 bg-white text-[#1d1d1f]/55"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={permissionForm.AllowedRoles.includes(
                                  role,
                                )}
                                onChange={() => togglePermissionRole(role)}
                                className="sr-only"
                              />
                              {role}
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[11px] font-semibold uppercase text-[#1d1d1f]/45">
                          Description
                        </label>
                        <input
                          value={permissionForm.Description}
                          onChange={(e) =>
                            setPermissionForm((prev) => ({
                              ...prev,
                              Description: e.target.value,
                            }))
                          }
                          placeholder="Explain why this rule exists"
                          className="w-full rounded-[11px] border border-[rgba(0,0,0,0.08)] bg-white px-3.5 py-2.5 text-[14px]"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold uppercase text-[#1d1d1f]/45">
                          Sort Order
                        </label>
                        <input
                          type="number"
                          value={permissionForm.SortOrder}
                          onChange={(e) =>
                            setPermissionForm((prev) => ({
                              ...prev,
                              SortOrder: e.target.value,
                            }))
                          }
                          placeholder="10"
                          className="w-full rounded-[11px] border border-[rgba(0,0,0,0.08)] bg-white px-3.5 py-2.5 text-[14px]"
                        />
                      </div>
                      <label className="flex items-center gap-2 text-[13px] font-medium text-[#1d1d1f]/65 md:col-span-3">
                        <input
                          type="checkbox"
                          checked={permissionForm.IsActive}
                          onChange={(e) =>
                            setPermissionForm((prev) => ({
                              ...prev,
                              IsActive: e.target.checked,
                            }))
                          }
                          className="h-4 w-4 rounded border-[#1d1d1f]/20 text-[#0071e3]"
                        />
                        Active rule
                      </label>
                    </div>
                    <div className="mt-4 rounded-lg bg-white px-4 py-3 text-[13px] text-[#1d1d1f]/60">
                      {permissionForm.AllowedRoles.join(", ") || "No roles"} can{" "}
                      {permissionForm.Action.toLowerCase()}{" "}
                      {permissionForm.ResourceKey || "this resource"}.
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleSavePermissionRule}
                        disabled={
                          permissionSaving ||
                          !permissionForm.ResourceKey ||
                          permissionForm.AllowedRoles.length === 0
                        }
                        className="rounded-lg bg-[#0071e3] px-5 py-2 text-[14px] font-medium text-white transition-colors hover:bg-[#0077ed] disabled:opacity-50"
                      >
                        {permissionSaving
                          ? "Saving..."
                          : editingPermissionRuleId == null
                            ? "Save Rule"
                            : "Update Rule"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          resetPermissionForm();
                          setShowAddPermission(false);
                        }}
                        className="text-[13px] font-medium text-[#1d1d1f]/45 transition-colors hover:text-[#1d1d1f]"
                      >
                        Cancel
                      </button>
                      <span className="font-mono text-[12px] text-[#1d1d1f]/40">
                        {permissionForm.ResourceType}.
                        {permissionForm.ResourceKey || "ResourceKey"}.
                        {permissionForm.Action}
                      </span>
                    </div>
                  </div>
                )}

                {permissionAdminLoading ? (
                  <p className="py-5 text-[13px] text-[#1d1d1f]/40">
                    Loading permission rules...
                  </p>
                ) : filteredPermissionRules.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#1d1d1f]/12 bg-[#fafafc] px-5 py-8 text-center">
                    <Search className="mx-auto h-5 w-5 text-[#1d1d1f]/25" />
                    <p className="mt-2 text-[13px] font-medium text-[#1d1d1f]">
                      No permission rules match these filters.
                    </p>
                    <p className="mt-1 text-[12px] text-[#1d1d1f]/45">
                      Clear search or select all statuses, roles, and actions.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(groupedPermissionAdminRules).map(
                      ([resourceType, resourceGroups]) => (
                        <div key={resourceType} className="space-y-3">
                          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase text-[#1d1d1f]/45">
                            <Activity className="h-3.5 w-3.5 text-[#0071e3]" />
                            {resourceType}
                          </div>
                          {Object.entries(resourceGroups).map(
                            ([resourceKey, rules]) => {
                              const firstRule = rules[0];
                              const details = getRuleDetails(firstRule);

                              return (
                                <div
                                  key={`${resourceType}.${resourceKey}`}
                                  className="rounded-xl border border-[#1d1d1f]/08 bg-white p-4 shadow-sm"
                                >
                                  <div className="flex flex-col gap-3 border-b border-[#1d1d1f]/06 pb-3 md:flex-row md:items-start md:justify-between">
                                    <div>
                                      <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="text-[14px] font-semibold text-[#1d1d1f]">
                                          {details.displayName}
                                        </h3>
                                        <span className="rounded-full bg-[#f5f5f7] px-2 py-0.5 text-[11px] font-semibold text-[#1d1d1f]/45">
                                          {details.group}
                                        </span>
                                      </div>
                                      <p className="mt-1 max-w-2xl text-[12px] text-[#1d1d1f]/45">
                                        {details.description}
                                      </p>
                                      <div className="mt-2 flex flex-wrap gap-2 font-mono text-[11px] text-[#1d1d1f]/35">
                                        <span>
                                          {resourceType}.{resourceKey}
                                        </span>
                                        {details.whereUsed && (
                                          <span>Used at {details.whereUsed}</span>
                                        )}
                                      </div>
                                    </div>
                                    <span className="text-[12px] font-medium text-[#1d1d1f]/40">
                                      {rules.length} rule
                                      {rules.length === 1 ? "" : "s"}
                                    </span>
                                  </div>
                                  <div className="mt-3 overflow-x-auto">
                                    <table className="w-full min-w-[760px] text-left">
                                      <thead>
                                        <tr className="text-[11px] font-semibold uppercase text-[#1d1d1f]/35">
                                          <th className="w-44 px-2 py-2">
                                            Action
                                          </th>
                                          {permissionRoles.map((role) => (
                                            <th
                                              key={role}
                                              className="px-2 py-2 text-center"
                                            >
                                              {role}
                                            </th>
                                          ))}
                                          <th className="w-44 px-2 py-2">
                                            Status
                                          </th>
                                          <th className="w-40 px-2 py-2">
                                            Updated
                                          </th>
                                          <th className="w-32 px-2 py-2 text-right">
                                            Actions
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {rules.map((rule) => (
                                          <tr
                                            key={rule.id || rule.Title}
                                            className="border-t border-[#1d1d1f]/05"
                                          >
                                            <td className="px-2 py-3 align-top">
                                              <div className="text-[13px] font-medium text-[#1d1d1f]">
                                                {rule.Action}
                                              </div>
                                              <div className="mt-0.5 text-[11px] text-[#1d1d1f]/35">
                                                {
                                                  permissionActionMeanings[
                                                    rule.Action
                                                  ]
                                                }
                                              </div>
                                            </td>
                                            {permissionRoles.map((role) =>
                                              renderRoleAccessCell(rule, role),
                                            )}
                                            <td className="px-2 py-3 align-top">
                                              {renderStatusChip(rule)}
                                              {rule.clientError && (
                                                <p className="mt-1 text-[11px] text-red-600">
                                                  {rule.clientError}
                                                </p>
                                              )}
                                            </td>
                                            <td className="px-2 py-3 align-top text-[11px] text-[#1d1d1f]/40">
                                              <div>
                                                {formatPermissionUpdatedAt(
                                                  rule.UpdatedAt,
                                                )}
                                              </div>
                                              {rule.UpdatedByEmail && (
                                                <div className="mt-0.5 truncate">
                                                  {rule.UpdatedByEmail}
                                                </div>
                                              )}
                                            </td>
                                            <td className="px-2 py-3 text-right align-top">
                                              <div className="flex justify-end gap-2">
                                                {["failed", "create-failed"].includes(
                                                  getRuleStatus(rule),
                                                ) && (
                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      handleRetryPermissionRule(
                                                        rule,
                                                      )
                                                    }
                                                    className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-[12px] font-medium text-red-700 hover:bg-red-100"
                                                  >
                                                    <RefreshCw className="h-3 w-3" />
                                                    Retry
                                                  </button>
                                                )}
                                                {getRuleStatus(rule) ===
                                                  "create-failed" &&
                                                  rule.id < 0 && (
                                                    <button
                                                      type="button"
                                                      onClick={() =>
                                                        handleDiscardPermissionRule(
                                                          rule,
                                                        )
                                                      }
                                                      className="inline-flex items-center gap-1 rounded-md bg-gray-50 px-2 py-1 text-[12px] font-medium text-[#1d1d1f]/50 hover:bg-gray-100"
                                                    >
                                                      <XCircle className="h-3 w-3" />
                                                      Discard
                                                    </button>
                                                  )}
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    handleEditPermissionRule(
                                                      rule,
                                                    )
                                                  }
                                                  disabled={isRulePending(rule)}
                                                  className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-[12px] font-medium text-[#0071e3] hover:bg-blue-100 disabled:opacity-50"
                                                >
                                                  <Pencil className="h-3 w-3" />
                                                  Edit
                                                </button>
                                                {rule.IsActive ? (
                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      handleDisablePermissionRule(
                                                        rule,
                                                      )
                                                    }
                                                    disabled={isRulePending(rule)}
                                                    className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-[12px] font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
                                                  >
                                                    <Ban className="h-3 w-3" />
                                                    Disable
                                                  </button>
                                                ) : (
                                                  <span className="rounded-md bg-gray-50 px-2 py-1 text-[12px] text-[#1d1d1f]/30">
                                                    Disabled
                                                  </span>
                                                )}
                                              </div>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              );
                            },
                          )}
                        </div>
                      ),
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="rounded-xl bg-[#f5f5f7] p-4">
                    <h3 className="text-[13px] font-semibold text-[#1d1d1f]">
                      Current App Resources
                    </h3>
                    <p className="mt-1 text-[12px] text-[#1d1d1f]/45">
                      Add a definition here in code when a new page or function
                      needs permission control.
                    </p>
                    <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
                      {defaultGlobalAdminPermissionRules.map((rule) => (
                        <div
                          key={`${rule.ResourceType}.${rule.ResourceKey}.${rule.Action}`}
                          className="rounded-lg bg-white px-3 py-2"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[12px] font-semibold text-[#1d1d1f]/70">
                              {rule.DisplayName ?? rule.ResourceKey}
                            </span>
                            <span className="rounded-full bg-[#f5f5f7] px-2 py-0.5 text-[10px] font-semibold text-[#1d1d1f]/40">
                              {rule.PermissionGroup ?? rule.ResourceType}
                            </span>
                          </div>
                          <div className="mt-1 font-mono text-[11px] text-[#1d1d1f]/45">
                            {rule.ResourceType}.{rule.ResourceKey}.{rule.Action}
                          </div>
                          <div className="mt-0.5 text-[11px] text-[#1d1d1f]/45">
                            {rule.Description}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <details className="rounded-xl bg-[#f5f5f7] p-4" open>
                    <summary className="cursor-pointer text-[13px] font-semibold text-[#1d1d1f]">
                      Action Meanings
                    </summary>
                    <div className="mt-3 space-y-2">
                      {permissionActions.map((action) => (
                        <div
                          key={action}
                          className="flex gap-3 rounded-lg bg-white px-3 py-2"
                        >
                          <span className="w-16 shrink-0 text-[12px] font-semibold text-[#1d1d1f]/70">
                            {action}
                          </span>
                          <span className="text-[12px] text-[#1d1d1f]/45">
                            {permissionActionMeanings[action]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              </div>
            </div>
          )}

          {/* System Config */}
          {effectiveTab === "system" && (
            <div className="card p-7 space-y-6">
              <div className="flex items-center justify-between border-b border-[#1d1d1f]/06 pb-4">
                <h2
                  className="text-[17px] font-semibold text-[#1d1d1f]"
                  style={{ letterSpacing: "-0.374px" }}
                >
                  System Configuration
                </h2>
                <span
                  className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-[10px] font-bold uppercase"
                  style={{ letterSpacing: "0.04em" }}
                >
                  Developer Only
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    icon: Database,
                    label: "Database Connection",
                    desc: "Manage connection strings and database pooling settings.",
                    action: "Configure Database",
                    danger: false,
                  },
                  {
                    icon: Key,
                    label: "API Keys & Secrets",
                    desc: "Manage third-party API keys (AWS, Azure, etc.)",
                    action: "Manage Keys",
                    danger: false,
                  },
                  {
                    icon: Server,
                    label: "Webhooks",
                    desc: "Configure outgoing webhooks for order status changes.",
                    action: "View Webhooks",
                    danger: false,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="p-5 bg-[#f5f5f7] rounded-xl space-y-2"
                  >
                    <div className="flex items-center gap-2 text-[#1d1d1f] font-semibold text-[14px]">
                      <item.icon className="w-4 h-4 text-[#0071e3]" />
                      {item.label}
                    </div>
                    <p
                      className="text-[12px] text-[#1d1d1f]/45"
                      style={{ letterSpacing: "-0.12px" }}
                    >
                      {item.desc}
                    </p>
                    <button
                      type="button"
                      className="text-[13px] font-medium text-[#0071e3] hover:underline"
                    >
                      {item.action} &rarr;
                    </button>
                  </div>
                ))}

                {/* Danger zone */}
                <div className="p-5 bg-red-50 rounded-xl space-y-2 border border-red-100">
                  <div className="flex items-center gap-2 text-red-700 font-semibold text-[14px]">
                    <Lock className="w-4 h-4 text-red-600" />
                    Maintenance Mode
                  </div>
                  <p
                    className="text-[12px] text-red-500"
                    style={{ letterSpacing: "-0.12px" }}
                  >
                    Lock the system for all users except Developers.
                  </p>
                  <button
                    type="button"
                    className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-[13px] font-medium hover:bg-red-700 transition-colors"
                  >
                    Enable Maintenance
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
