import React, { useState, useEffect } from "react";
import { Mail, Plus, Edit2, Eye, EyeOff, AlertTriangle } from "lucide-react";
import {
  EmailTemplate,
  emailTemplateService,
  SERVICE_TYPE_OPTIONS,
  TEMPLATE_CATEGORY_OPTIONS,
} from "../services/emailTemplateService";
import { EmailTemplateEditPanel } from "../components/EmailTemplateEditPanel";
import { usePermission } from "../contexts/PermissionContext";

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  "Welcome Letter":      { bg: "#d1f4e0", text: "#02492a" },
  "Order Confirmation":  { bg: "#ddf4fd", text: "#0089ad" },
  "Account Created":     { bg: "#fef9c3", text: "#9d6a09" },
  "Closure Notice":      { bg: "#fde8e8", text: "#b0101a" },
  "Status Update":       { bg: "#ede9ff", text: "#43089f" },
  "General":             { bg: "#eee9df", text: "#55534e" },
};

const SERVICE_COLORS: Record<string, { bg: string; text: string }> = {
  AWS:      { bg: "#fef9c3", text: "#9d6a09" },
  Azure:    { bg: "#ddf4fd", text: "#0089ad" },
  GCP:      { bg: "#d1f4e0", text: "#02492a" },
  Alibaba:  { bg: "#fde8e8", text: "#b0101a" },
  Huawei:   { bg: "#ede9ff", text: "#43089f" },
  Tencent:  { bg: "#ddf4fd", text: "#01418d" },
  General:  { bg: "#eee9df", text: "#55534e" },
};

const FILTER_TABS = ["All", ...SERVICE_TYPE_OPTIONS] as const;
type FilterTab = (typeof FILTER_TABS)[number];

const formatModified = (iso?: string): string => {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
};

const EmailTemplates: React.FC = () => {
  const { hasPermission, userEmail } = usePermission();
  const canManage = hasPermission("Admin");
  const canDelete = hasPermission("Global Admin");

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterTab>("All");
  const [editTarget, setEditTarget] = useState<EmailTemplate | null | undefined>(undefined);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState<EmailTemplate | null>(null);
  const [deactivating, setDeactivating] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    emailTemplateService
      .findAll()
      .then(setTemplates)
      .catch(() => setError("Failed to load templates."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered =
    filter === "All"
      ? templates
      : templates.filter((t) => t.ServiceType === filter);

  const handleNew = () => {
    setEditTarget(null);
    setIsPanelOpen(true);
  };

  const handleEdit = (tmpl: EmailTemplate) => {
    setEditTarget(tmpl);
    setIsPanelOpen(true);
  };

  const handleDeactivate = async (tmpl: EmailTemplate) => {
    setDeactivating(true);
    try {
      await emailTemplateService.deactivate(tmpl.id, userEmail ?? "");
      load();
    } catch {
      setError("Failed to deactivate template.");
    } finally {
      setDeactivating(false);
      setConfirmDeactivate(null);
    }
  };

  return (
    <div className="p-6 space-y-6" style={{ background: "#faf9f7", minHeight: "100%" }}>
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "#ddf4fd" }}
            >
              <Mail className="w-4 h-4" style={{ color: "#0089ad" }} />
            </div>
            <h1 className="text-2xl font-semibold" style={{ color: "#000", letterSpacing: "-0.48px" }}>
              Email Templates
            </h1>
          </div>
          <p className="text-sm" style={{ color: "#9f9b93" }}>
            Manage reusable templates for sending emails from Order Details.
          </p>
        </div>
        {canManage && (
          <button
            onClick={handleNew}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{ background: "#000", color: "#fff" }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.transform = "rotateZ(-5deg) translateY(-3px)";
              el.style.boxShadow = "rgb(0,0,0) -5px 5px";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.transform = "";
              el.style.boxShadow = "";
            }}
          >
            <Plus className="w-4 h-4" />
            New Template
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTER_TABS.map((tab) => {
          const active = filter === tab;
          return (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className="px-4 py-1.5 text-sm font-medium transition-all"
              style={{
                borderRadius: 1584,
                background: active ? "#ede9ff" : "#eee9df",
                color: active ? "#43089f" : "#55534e",
                border: active ? "1px solid #c1b0ff" : "1px solid #dad4c8",
              }}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div
          className="rounded-xl px-4 py-3 text-sm flex items-center gap-2"
          style={{ background: "#fde8e8", color: "#b0101a" }}
        >
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-sm" style={{ color: "#9f9b93" }}>
          Loading templates…
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div
          className="rounded-2xl p-10 text-center"
          style={{ border: "1px dashed #dad4c8" }}
        >
          <Mail className="w-8 h-8 mx-auto mb-3" style={{ color: "#dad4c8" }} />
          <p className="text-sm font-medium" style={{ color: "#9f9b93" }}>
            No templates {filter !== "All" ? `for ${filter}` : ""} yet.
          </p>
          {canManage && (
            <button
              onClick={handleNew}
              className="mt-4 px-4 py-2 rounded-xl text-sm font-medium"
              style={{ background: "#000", color: "#fff" }}
            >
              Create the first one
            </button>
          )}
        </div>
      )}

      {/* Template Cards Grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((tmpl) => {
            const cs = CATEGORY_COLORS[tmpl.TemplateCategory] ?? CATEGORY_COLORS["General"];
            const ss = SERVICE_COLORS[tmpl.ServiceType] ?? SERVICE_COLORS["General"];
            return (
              <div
                key={tmpl.id}
                className="bg-white rounded-2xl p-4 flex flex-col gap-3"
                style={{
                  border: "1px solid #dad4c8",
                  boxShadow:
                    "rgba(0,0,0,0.06) 0px 1px 1px, rgba(0,0,0,0.03) 0px -1px 1px inset",
                }}
              >
                {/* Card header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                      <span
                        className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{ background: ss.bg, color: ss.text }}
                      >
                        {tmpl.ServiceType}
                      </span>
                      <span
                        className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{ background: cs.bg, color: cs.text }}
                      >
                        {tmpl.TemplateCategory}
                      </span>
                      {!tmpl.IsActive && (
                        <span
                          className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                          style={{ background: "#eee9df", color: "#9f9b93" }}
                        >
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold leading-tight" style={{ color: "#000" }}>
                      {tmpl.Title}
                    </p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: "#9f9b93" }}>
                      {tmpl.Subject}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      title="Preview"
                      onClick={() => setPreviewTemplate(previewTemplate?.id === tmpl.id ? null : tmpl)}
                      className="p-1.5 rounded-lg transition-colors hover:bg-[#faf9f7]"
                    >
                      <Eye className="w-3.5 h-3.5" style={{ color: "#9f9b93" }} />
                    </button>
                    {canManage && (
                      <button
                        title="Edit"
                        onClick={() => handleEdit(tmpl)}
                        className="p-1.5 rounded-lg transition-colors hover:bg-[#faf9f7]"
                      >
                        <Edit2 className="w-3.5 h-3.5" style={{ color: "#9f9b93" }} />
                      </button>
                    )}
                    {canDelete && tmpl.IsActive && (
                      <button
                        title="Deactivate"
                        onClick={() => setConfirmDeactivate(tmpl)}
                        className="p-1.5 rounded-lg transition-colors hover:bg-[#fde8e8]"
                      >
                        <EyeOff className="w-3.5 h-3.5" style={{ color: "#9f9b93" }} />
                      </button>
                    )}
                  </div>
                </div>

                {tmpl.Description && (
                  <p className="text-xs" style={{ color: "#55534e" }}>
                    {tmpl.Description}
                  </p>
                )}

                {/* Body Preview */}
                {previewTemplate?.id === tmpl.id && (
                  <div
                    className="rounded-xl p-3 text-xs"
                    style={{ border: "1px dashed #dad4c8", background: "#faf9f7" }}
                  >
                    <p className="font-medium mb-2" style={{ color: "#9f9b93" }}>
                      Subject: {tmpl.Subject}
                    </p>
                    <div
                      className="prose prose-sm max-w-none"
                      style={{ color: "#000", fontSize: 12 }}
                      dangerouslySetInnerHTML={{ __html: tmpl.BodyHTML }}
                    />
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-1" style={{ borderTop: "1px solid #eee9df" }}>
                  <span className="text-[11px]" style={{ color: "#9f9b93" }}>
                    {tmpl.VariableList
                      ? `Variables: ${tmpl.VariableList}`
                      : "No declared variables"}
                  </span>
                  <span className="text-[11px]" style={{ color: "#9f9b93" }}>
                    Order {tmpl.SortOrder ?? "—"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Deactivate Confirm */}
      {confirmDeactivate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full"
            style={{ boxShadow: "rgba(0,0,0,0.15) 0px 8px 32px" }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "#fde8e8" }}
              >
                <EyeOff className="w-4 h-4" style={{ color: "#b0101a" }} />
              </div>
              <p className="text-sm font-semibold" style={{ color: "#000" }}>
                Deactivate template?
              </p>
            </div>
            <p className="text-sm mb-5" style={{ color: "#55534e" }}>
              <strong>{confirmDeactivate.Title}</strong> will be hidden from the compose panel. It remains in SharePoint and can be reactivated.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmDeactivate(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium"
                style={{ background: "#faf9f7", border: "1px solid #dad4c8", color: "#55534e" }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeactivate(confirmDeactivate)}
                disabled={deactivating}
                className="px-4 py-2 rounded-xl text-sm font-medium"
                style={{ background: "#b0101a", color: "#fff" }}
              >
                {deactivating ? "Deactivating…" : "Deactivate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Panel */}
      <EmailTemplateEditPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        template={editTarget}
        onSaved={load}
      />
    </div>
  );
};

export default EmailTemplates;
