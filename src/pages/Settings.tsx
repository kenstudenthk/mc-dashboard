import React, { useState, useEffect } from "react";
import { usePermission } from "../contexts/PermissionContext";
import {
  Shield,
  User,
  Bell,
  Users,
  Settings as SettingsIcon,
  Database,
  Key,
  Server,
  Lock,
} from "lucide-react";
import { TutorTooltip } from "../components/TutorTooltip";
import {
  getAllUsers,
  updateUser,
  type SPUser,
  type UserRole,
  type UserStatus,
} from "../services/permissionService";

const Settings = () => {
  const { currentRole, userEmail, setUserEmail, hasPermission } =
    usePermission();
  const [activeTab, setActiveTab] = useState("profile");
  const [profileEmail, setProfileEmail] = useState(userEmail || "");
  const [profileName, setProfileName] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
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

  const handleSaveProfile = () => {
    if (!profileEmail) return;
    setUserEmail(profileEmail);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const handleInviteMember = () => {
    setInviteSent(true);
    setTimeout(() => setInviteSent(false), 3000);
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
      id: "system",
      label: "System Config",
      icon: SettingsIcon,
      requiredRole: "Developer" as const,
    },
  ];

  const visibleTabs = tabs.filter((tab) => hasPermission(tab.requiredRole));

  const effectiveTab = visibleTabs.find((t) => t.id === activeTab)
    ? activeTab
    : "profile";

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
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="px-5 py-2 bg-[#0071e3] text-white rounded-lg text-[14px] font-medium hover:bg-[#0077ed] transition-colors"
                  style={{ letterSpacing: "-0.224px" }}
                >
                  Save Changes
                </button>
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
                <div className="flex items-center gap-3">
                  {inviteSent && (
                    <span
                      className="text-[12px] text-green-600 font-medium"
                      style={{ letterSpacing: "-0.12px" }}
                    >
                      Invite sent!
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleInviteMember}
                    className="px-4 py-1.5 bg-[#f5f5f7] text-[#1d1d1f] rounded-lg text-[13px] font-medium hover:bg-[#ededf2] transition-colors border border-[rgba(0,0,0,0.04)]"
                    style={{ letterSpacing: "-0.12px" }}
                  >
                    Invite Member
                  </button>
                </div>
              </div>
              <p
                className="text-[13px] text-[#1d1d1f]/45"
                style={{ letterSpacing: "-0.12px" }}
              >
                As an Admin, you can manage your team members and their basic
                access.
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
                            {editingTeamIndex === i ? (
                              <div className="flex items-center justify-end gap-3">
                                <button
                                  type="button"
                                  onClick={() => setEditingTeamIndex(null)}
                                  className="text-[12px] text-[#1d1d1f]/45 hover:text-[#1d1d1f] transition-colors"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  disabled={savingIndex === i}
                                  onClick={() => handleSaveTeamStatus(i, user)}
                                  className="text-[12px] text-[#0071e3] font-medium hover:underline disabled:opacity-50"
                                >
                                  {savingIndex === i ? "Saving…" : "Save"}
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setEditingTeamIndex(i)}
                                className="text-[13px] text-[#0071e3] hover:underline font-medium"
                              >
                                Edit
                              </button>
                            )}
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
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex flex-col items-end gap-2">
                              {roleEdits[i] && roleEdits[i] !== user.role && (
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
                              )}
                              <button
                                type="button"
                                onClick={() =>
                                  alert(
                                    `Password reset link sent to ${user.email}`,
                                  )
                                }
                                className="text-[12px] text-[#0071e3] hover:underline font-medium flex items-center gap-1.5"
                              >
                                <Key className="w-3 h-3" />
                                Reset Password
                              </button>
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
