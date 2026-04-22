import React, { useState, useEffect, useRef } from "react";
import { X, Loader2 } from "lucide-react";
import {
  EmailTemplate,
  CreateEmailTemplateInput,
  emailTemplateService,
  SERVICE_TYPE_OPTIONS,
  TEMPLATE_CATEGORY_OPTIONS,
} from "../services/emailTemplateService";
import { RichTextEditor, RichTextEditorHandle } from "./RichTextEditor";
import { usePermission } from "../contexts/PermissionContext";
import { TutorTooltip } from "./TutorTooltip";

interface EmailTemplateEditPanelProps {
  isOpen: boolean;
  onClose: () => void;
  template?: EmailTemplate | null;
  onSaved: () => void;
}

const KNOWN_VARS = [
  "CustomerName", "OrderTitle", "SubName", "CloudProvider", "ServiceType",
  "ContactPerson", "ContactEmail", "SRD", "Amount", "OasisNumber",
  "AccountName", "BillingAddress", "AccountID", "LoginEmail",
  "TenantID", "MicrosoftID", "AzureSubscriptionID",
  "AMEmail", "ASMEmail", "AdminEmail",
  "ServiceNumber", "ServiceDeskNo", "InvitationURL",
];

const inputClass =
  "w-full px-3.5 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/10 transition-all";
const inputStyle: React.CSSProperties = {
  border: "1px solid #717989",
  color: "#000",
  background: "#fff",
};

const LabelRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1">
    <label className="text-xs font-medium block" style={{ color: "#9f9b93" }}>
      {label}
    </label>
    {children}
  </div>
);

const EMPTY_FORM: CreateEmailTemplateInput = {
  Title: "",
  ServiceType: "General",
  TemplateCategory: "General",
  Subject: "",
  BodyHTML: "<p></p>",
  VariableList: "",
  Description: "",
  SortOrder: 1,
  IsActive: true,
  ToRecipients: "",
  CcRecipients: "",
  BccRecipients: "",
};

export const EmailTemplateEditPanel: React.FC<EmailTemplateEditPanelProps> = ({
  isOpen,
  onClose,
  template,
  onSaved,
}) => {
  const { userEmail } = usePermission();
  const [form, setForm] = useState<CreateEmailTemplateInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = !!template;
  const subjectRef = useRef<HTMLInputElement>(null);
  const bodyEditorRef = useRef<RichTextEditorHandle>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (template) {
      setForm({
        Title: template.Title,
        ServiceType: template.ServiceType,
        TemplateCategory: template.TemplateCategory,
        Subject: template.Subject,
        BodyHTML: template.BodyHTML,
        VariableList: template.VariableList ?? "",
        Description: template.Description ?? "",
        SortOrder: template.SortOrder ?? 1,
        IsActive: template.IsActive ?? true,
        ToRecipients: template.ToRecipients ?? "",
        CcRecipients: template.CcRecipients ?? "",
        BccRecipients: template.BccRecipients ?? "",
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [isOpen, template]);

  const set = <K extends keyof CreateEmailTemplateInput>(
    key: K,
    val: CreateEmailTemplateInput[K],
  ) => setForm((f) => ({ ...f, [key]: val }));

  const insertVar = (field: "Subject" | "Body", varName: string) => {
    const token = `{{${varName}}}`;
    if (field === "Subject") {
      const el = subjectRef.current;
      if (el) {
        const start = el.selectionStart ?? form.Subject.length;
        const end = el.selectionEnd ?? form.Subject.length;
        const newVal = form.Subject.slice(0, start) + token + form.Subject.slice(end);
        set("Subject", newVal);
        requestAnimationFrame(() => {
          el.focus();
          el.selectionStart = el.selectionEnd = start + token.length;
        });
      } else {
        set("Subject", form.Subject + token);
      }
    } else {
      bodyEditorRef.current?.insertText(token);
    }
  };

  const handleSave = async () => {
    if (!form.Title || !form.Subject) {
      setError("Template name and subject are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (isEdit && template) {
        await emailTemplateService.update(template.id, form, userEmail ?? "");
      } else {
        await emailTemplateService.create(form, userEmail ?? "");
      }
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />
      <div
        className={`fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: "1px solid #eee9df" }}
        >
          <p className="text-sm font-semibold" style={{ color: "#000" }}>
            {isEdit ? "Edit Template" : "New Template"}
          </p>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#faf9f7] transition-colors"
          >
            <X className="w-4 h-4" style={{ color: "#9f9b93" }} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {error && (
            <div
              className="rounded-xl px-3.5 py-2.5 text-sm"
              style={{ background: "#fde8e8", color: "#b0101a" }}
            >
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <LabelRow label="Template Name *">
              <input
                className={inputClass}
                style={inputStyle}
                value={form.Title}
                onChange={(e) => set("Title", e.target.value)}
                placeholder="e.g. AWS Welcome Letter"
              />
            </LabelRow>
            <LabelRow label="Sort Order">
              <input
                className={inputClass}
                style={inputStyle}
                type="number"
                min={1}
                value={form.SortOrder ?? 1}
                onChange={(e) => set("SortOrder", Number(e.target.value))}
              />
            </LabelRow>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <LabelRow label="Service Type">
              <select
                className={inputClass}
                style={inputStyle}
                value={form.ServiceType}
                onChange={(e) => set("ServiceType", e.target.value)}
              >
                {SERVICE_TYPE_OPTIONS.map((opt) => (
                  <option key={opt}>{opt}</option>
                ))}
              </select>
            </LabelRow>
            <LabelRow label="Category">
              <select
                className={inputClass}
                style={inputStyle}
                value={form.TemplateCategory}
                onChange={(e) => set("TemplateCategory", e.target.value)}
              >
                {TEMPLATE_CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt}>{opt}</option>
                ))}
              </select>
            </LabelRow>
          </div>

          <LabelRow label="Description (admin notes)">
            <textarea
              className={inputClass}
              style={{ ...inputStyle, resize: "vertical" }}
              rows={2}
              value={form.Description}
              onChange={(e) => set("Description", e.target.value)}
              placeholder="Briefly describe when to use this template"
            />
          </LabelRow>

          {/* Variable hint bar */}
          <TutorTooltip
            text="Click S to drop a {{Variable}} token into the Subject at the cursor, or B to drop it into the Body. Tokens get replaced with real order data when the email is composed."
            position="top"
          >
            <div
              className="rounded-xl p-3"
              style={{ border: "1px dashed #dad4c8", background: "#faf9f7" }}
            >
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "#9f9b93" }}>
                Insert variable
              </p>
              <div className="flex flex-wrap gap-1.5">
                {KNOWN_VARS.map((v) => (
                  <div key={v} className="flex gap-0.5">
                    <button
                      type="button"
                      onClick={() => insertVar("Subject", v)}
                      className="px-2 py-0.5 rounded text-[11px] font-mono transition-colors hover:bg-black hover:text-white"
                      style={{ background: "#eee9df", color: "#55534e" }}
                      title={`Insert {{${v}}} into Subject`}
                    >
                      S
                    </button>
                    <button
                      type="button"
                      onClick={() => insertVar("Body", v)}
                      className="px-2 py-0.5 rounded text-[11px] font-mono transition-colors hover:bg-black hover:text-white"
                      style={{ background: "#eee9df", color: "#55534e" }}
                      title={`Insert {{${v}}} into Body`}
                    >
                      B
                    </button>
                    <span
                      className="px-2 py-0.5 rounded text-[11px] font-mono"
                      style={{ background: "#eee9df", color: "#000" }}
                    >
                      {`{{${v}}}`}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] mt-2" style={{ color: "#9f9b93" }}>
                Click S to insert into Subject · B to insert into Body
              </p>
            </div>
          </TutorTooltip>

          <div className="grid grid-cols-3 gap-3">
            <LabelRow label="Default To">
              <input
                className={inputClass}
                style={inputStyle}
                value={form.ToRecipients ?? ""}
                onChange={(e) => set("ToRecipients", e.target.value)}
                placeholder="{{ContactEmail}}"
              />
            </LabelRow>
            <LabelRow label="Default CC">
              <input
                className={inputClass}
                style={inputStyle}
                value={form.CcRecipients ?? ""}
                onChange={(e) => set("CcRecipients", e.target.value)}
                placeholder="{{AMEmail}}; {{ASMEmail}}"
              />
            </LabelRow>
            <LabelRow label="Default BCC">
              <input
                className={inputClass}
                style={inputStyle}
                value={form.BccRecipients ?? ""}
                onChange={(e) => set("BccRecipients", e.target.value)}
                placeholder="bcc@example.com"
              />
            </LabelRow>
          </div>

          <LabelRow label="Subject *">
            <input
              ref={subjectRef}
              className={inputClass}
              style={inputStyle}
              value={form.Subject}
              onChange={(e) => set("Subject", e.target.value)}
              placeholder="e.g. Your {{CloudProvider}} account is ready — {{CustomerName}}"
            />
          </LabelRow>

          <LabelRow label="Body">
            <RichTextEditor
              ref={bodyEditorRef}
              value={form.BodyHTML}
              onChange={(html) => set("BodyHTML", html)}
              minHeight={240}
              placeholder="Email body…"
            />
          </LabelRow>

          <div className="flex items-center gap-2">
            <input
              id="isActive"
              type="checkbox"
              checked={form.IsActive ?? true}
              onChange={(e) => set("IsActive", e.target.checked)}
              className="rounded"
            />
            <label htmlFor="isActive" className="text-sm" style={{ color: "#55534e" }}>
              Active (visible to users when composing emails)
            </label>
          </div>

          {isEdit && template?.LastUpdatedBy && (
            <p className="text-xs" style={{ color: "#9f9b93" }}>
              Last updated by{" "}
              <span style={{ color: "#55534e" }}>{template.LastUpdatedBy}</span>
              {template.LastUpdatedDate && (
                <>
                  {" "}at{" "}
                  <span style={{ color: "#55534e" }}>
                    {new Date(template.LastUpdatedDate).toLocaleString("en-GB")}
                  </span>
                </>
              )}
            </p>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-5 py-4 flex items-center justify-between shrink-0"
          style={{ borderTop: "1px solid #eee9df" }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{ background: "#faf9f7", border: "1px solid #dad4c8", color: "#55534e" }}
          >
            Cancel
          </button>
          <TutorTooltip
            text={isEdit ? "Save your changes. Last updated by / at is shown above and will refresh after save." : "Create this template. It will immediately show up in the Email Templates list and in the compose picker (if Active)."}
            position="top"
          >
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all"
              style={{ background: "#000", color: "#fff" }}
              onMouseEnter={(e) => {
                if (saving) return;
                const el = e.currentTarget;
                el.style.transform = "rotateZ(-3deg) translateY(-2px)";
                el.style.boxShadow = "rgb(0,0,0) -5px 5px";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.transform = "";
                el.style.boxShadow = "";
              }}
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Template"}
            </button>
          </TutorTooltip>
        </div>
      </div>
    </>
  );
};

export default EmailTemplateEditPanel;
