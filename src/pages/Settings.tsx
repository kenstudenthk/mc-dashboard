import React, { useState } from "react";
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

// Shared mock users for Team Management and Role Management tabs
const MOCK_USERS = [
  {
    name: "Eleanor Pena",
    email: "eleanor@example.com",
    role: "Global Admin",
    status: "Active",
  },
  {
    name: "Michael Realman",
    email: "michael@example.com",
    role: "Admin",
    status: "Active",
  },
  {
    name: "Janet Huang",
    email: "janet@example.com",
    role: "Developer",
    status: "Active",
  },
  {
    name: "Jason Mendoza",
    email: "jason@example.com",
    role: "User",
    status: "Active",
  },
  {
    name: "Chidi Anagonye",
    email: "chidi@example.com",
    role: "User",
    status: "Pending",
  },
];

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
    Record<number, string>
  >({});
  const [roleEdits, setRoleEdits] = useState<Record<number, string>>({});
  const [roleSavedIndex, setRoleSavedIndex] = useState<number | null>(null);

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

  // Build the user list: put the logged-in user at the top (if email is set),
  // then append mock users whose email doesn't match the logged-in user.
  const displayUsers = userEmail
    ? [
        {
          name: userEmail,
          email: userEmail,
          role: currentRole,
          status: "Active",
          isMe: true,
        },
        ...MOCK_USERS.filter((u) => u.email !== userEmail).map((u) => ({
          ...u,
          isMe: false,
        })),
      ]
    : MOCK_USERS.map((u) => ({ ...u, isMe: false }));

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
      <div>
        <h1 className="text-3xl font-serif font-bold text-gray-900">
          Settings
        </h1>
        <p className="text-gray-500 mt-1">
          Manage your account and system preferences.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Settings Navigation */}
        <div className="w-full md:w-64 shrink-0">
          <TutorTooltip
            text="Navigate between different settings categories. The available categories depend on your current role."
            position="right"
          >
            <div className="card p-2 flex flex-col gap-1">
              {visibleTabs.map((tab) => (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                    effectiveTab === tab.id
                      ? "bg-primary-light text-primary"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </TutorTooltip>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <div className="flex items-center gap-2 text-blue-800 font-medium mb-1">
              <Shield className="w-4 h-4" />
              Current Role
            </div>
            <p className="text-sm text-blue-600">
              You are currently viewing the system as a{" "}
              <strong>{currentRole}</strong>.
            </p>
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1">
          {effectiveTab === "profile" && (
            <div className="card p-8 space-y-6">
              <h2 className="text-xl font-serif font-bold text-gray-900 border-b border-gray-100 pb-4">
                My Profile
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <p className="text-xs text-gray-400">
                    Used to load your role from SharePoint.
                  </p>
                </div>
              </div>
              <div className="pt-4 flex items-center gap-4">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  Save Changes
                </button>
                {profileSaved && (
                  <span className="text-sm text-green-600 font-medium">
                    Saved! Role updated.
                  </span>
                )}
              </div>
            </div>
          )}

          {effectiveTab === "notifications" && (
            <div className="card p-8 space-y-6">
              <h2 className="text-xl font-serif font-bold text-gray-900 border-b border-gray-100 pb-4">
                Notification Preferences
              </h2>
              <div className="space-y-4">
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
                    className="flex items-start justify-between p-4 border border-gray-100 rounded-xl"
                  >
                    <div>
                      <div className="font-medium text-gray-900">
                        {item.title}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {item.desc}
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked={i !== 2}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {effectiveTab === "team" && (
            <div className="card p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <h2 className="text-xl font-serif font-bold text-gray-900">
                  Team Management
                </h2>
                <div className="flex items-center gap-3">
                  {inviteSent && (
                    <span className="text-sm text-green-600 font-medium">
                      Invite sent!
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleInviteMember}
                    className="px-4 py-2 bg-primary-light text-primary rounded-lg font-medium text-sm hover:bg-primary/20 transition-colors"
                  >
                    Invite Member
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                As an Admin, you can manage your team members and their basic
                access.
              </p>

              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3 font-medium text-gray-500">
                        Name
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-500">
                        Email
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-500">
                        Role
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-500">
                        Status
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-500 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {displayUsers.map((user, i) => (
                      <tr key={i} className={user.isMe ? "bg-blue-50/40" : ""}>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          <span className="flex items-center gap-2">
                            {user.name}
                            {user.isMe && (
                              <span className="px-1.5 py-0.5 bg-primary text-white rounded text-xs font-medium">
                                You
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {user.email}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {editingTeamIndex === i ? (
                            <select
                              value={teamStatusEdits[i] ?? user.status}
                              onChange={(e) =>
                                setTeamStatusEdits({
                                  ...teamStatusEdits,
                                  [i]: e.target.value,
                                })
                              }
                              className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                            >
                              <option value="Active">Active</option>
                              <option value="Pending">Pending</option>
                              <option value="Inactive">Inactive</option>
                            </select>
                          ) : (
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${(teamStatusEdits[i] ?? user.status) === "Active" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}
                            >
                              {teamStatusEdits[i] ?? user.status}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {editingTeamIndex === i ? (
                            <div className="flex items-center justify-end gap-3">
                              <button
                                type="button"
                                onClick={() => setEditingTeamIndex(null)}
                                className="text-xs text-gray-500 hover:underline"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingTeamIndex(null)}
                                className="text-xs text-green-600 font-medium hover:underline"
                              >
                                Save
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setEditingTeamIndex(i)}
                              className="text-primary hover:underline"
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
            </div>
          )}

          {effectiveTab === "roles" && (
            <div className="card p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <h2 className="text-xl font-serif font-bold text-gray-900">
                  Global Role Management
                </h2>
              </div>
              <p className="text-sm text-gray-500">
                As a Global Admin, you can assign system-wide roles to users.
              </p>

              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3 font-medium text-gray-500">
                        User
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-500">
                        Current Role
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-500">
                        Assign New Role
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-500 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {displayUsers.map((user, i) => (
                      <tr key={i} className={user.isMe ? "bg-blue-50/40" : ""}>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          <span className="flex items-center gap-2">
                            {user.name}
                            {user.isMe && (
                              <span className="px-1.5 py-0.5 bg-primary text-white rounded text-xs font-medium">
                                You
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={roleEdits[i] ?? user.role}
                            onChange={(e) =>
                              setRoleEdits({
                                ...roleEdits,
                                [i]: e.target.value,
                              })
                            }
                            className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                          >
                            <option value="User">User</option>
                            <option value="Admin">Admin</option>
                            <option value="Global Admin">Global Admin</option>
                            <option value="Developer">Developer</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex flex-col items-end gap-2">
                            {roleEdits[i] && roleEdits[i] !== user.role && (
                              <button
                                type="button"
                                onClick={() => {
                                  setRoleSavedIndex(i);
                                  setTimeout(
                                    () => setRoleSavedIndex(null),
                                    2000,
                                  );
                                }}
                                className="text-xs bg-primary text-white px-3 py-1 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                              >
                                {roleSavedIndex === i ? "Saved!" : "Save Role"}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                alert(
                                  `Password reset link sent to ${user.email}`,
                                )
                              }
                              className="text-sm text-primary hover:text-primary/80 font-medium flex items-center justify-end gap-1.5"
                            >
                              <Key className="w-3.5 h-3.5" />
                              Reset Password
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {effectiveTab === "system" && (
            <div className="card p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <h2 className="text-xl font-serif font-bold text-gray-900">
                  System Configuration
                </h2>
                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold uppercase tracking-wider">
                  Developer Only
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 border border-gray-200 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-gray-900 font-medium">
                    <Database className="w-5 h-5 text-primary" />
                    Database Connection
                  </div>
                  <p className="text-sm text-gray-500">
                    Manage connection strings and database pooling settings.
                  </p>
                  <button
                    type="button"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Configure Database &rarr;
                  </button>
                </div>

                <div className="p-5 border border-gray-200 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-gray-900 font-medium">
                    <Key className="w-5 h-5 text-primary" />
                    API Keys & Secrets
                  </div>
                  <p className="text-sm text-gray-500">
                    Manage third-party API keys (AWS, Azure, etc.)
                  </p>
                  <button
                    type="button"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Manage Keys &rarr;
                  </button>
                </div>

                <div className="p-5 border border-gray-200 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-gray-900 font-medium">
                    <Server className="w-5 h-5 text-primary" />
                    Webhooks
                  </div>
                  <p className="text-sm text-gray-500">
                    Configure outgoing webhooks for order status changes.
                  </p>
                  <button
                    type="button"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    View Webhooks &rarr;
                  </button>
                </div>

                <div className="p-5 border border-red-200 bg-red-50/30 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-red-700 font-medium">
                    <Lock className="w-5 h-5 text-red-600" />
                    Maintenance Mode
                  </div>
                  <p className="text-sm text-red-600/80">
                    Lock the system for all users except Developers.
                  </p>
                  <button
                    type="button"
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
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
