import React, { useState, useEffect, useRef } from "react";
import DOMPurify from "dompurify";
import { X, Mail, ChevronLeft, Send, Loader2 } from "lucide-react";
import { Order } from "../services/orderService";
import { ServiceAccount } from "../services/serviceAccountService";
import { EmailTemplate, emailTemplateService } from "../services/emailTemplateService";
import { emailService } from "../services/emailService";
import { resolveTemplate } from "../utils/templateVars";
import { RichTextEditor } from "./RichTextEditor";
import { usePermission } from "../contexts/PermissionContext";

interface EmailComposePanelProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  serviceAccount?: ServiceAccount | null;
  onSent?: () => void;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  "Welcome Letter":      { bg: "#d1f4e0", text: "#02492a" },
  "Order Confirmation":  { bg: "#ddf4fd", text: "#0089ad" },
  "Account Created":     { bg: "#fef9c3", text: "#9d6a09" },
  "Closure Notice":      { bg: "#fde8e8", text: "#b0101a" },
  "Status Update":       { bg: "#ede9ff", text: "#43089f" },
  "General":             { bg: "#eee9df", text: "#55534e" },
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 14px",
  border: "1px solid #717989",
  borderRadius: 4,
  fontSize: 14,
  color: "#000",
  background: "#fff",
  outline: "none",
};

const StepDot = ({ n, active, done }: { n: number; active: boolean; done: boolean }) => (
  <div className="flex items-center gap-1.5">
    <div
      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-all"
      style={
        done
          ? { background: "#078a52", color: "#fff" }
          : active
          ? { background: "#fbbd41", color: "#000" }
          : { background: "#eee9df", color: "#9f9b93" }
      }
    >
      {done ? "✓" : n}
    </div>
    <span
      className="text-xs font-medium hidden sm:block"
      style={{ color: active ? "#000" : "#9f9b93" }}
    >
      {n === 1 ? "Template" : n === 2 ? "Compose" : "Preview"}
    </span>
  </div>
);

export const EmailComposePanel: React.FC<EmailComposePanelProps> = ({
  isOpen,
  onClose,
  order,
  serviceAccount,
  onSent,
}) => {
  const { userEmail } = usePermission();
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selected, setSelected] = useState<EmailTemplate | null>(null);
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
    setSelected(null);
    setError(null);
    setSuccess(false);
    setLoadingTemplates(true);
    emailTemplateService
      .findByService(order.CloudProvider)
      .then(setTemplates)
      .catch(() => setTemplates([]))
      .finally(() => setLoadingTemplates(false));
  }, [isOpen, order.CloudProvider]);

  const handleSelectTemplate = (tmpl: EmailTemplate) => {
    setSelected(tmpl);
    setTo(order.ContactEmail ?? "");
    setCc("");
    setSubject(resolveTemplate(tmpl.Subject, order, serviceAccount));
    setBody(resolveTemplate(tmpl.BodyHTML, order, serviceAccount));
    setStep(2);
  };

  const handleSend = async () => {
    if (!selected) return;
    const trimmedTo = to.trim();
    if (!trimmedTo) {
      setError("Recipient email address is required.");
      return;
    }
    setSending(true);
    setError(null);
    try {
      await emailService.send({
        to: trimmedTo,
        cc: cc.trim() || undefined,
        subject,
        body,
        orderId: order.id,
        orderTitle: order.Title,
        templateName: selected.Title,
        userEmail: userEmail ?? "",
      });
      setSuccess(true);
      onSent?.();
      closeTimerRef.current = setTimeout(onClose, 1800);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send email.");
    } finally {
      setSending(false);
    }
  };

  const categoryStyle = selected
    ? CATEGORY_COLORS[selected.TemplateCategory] ?? CATEGORY_COLORS["General"]
    : CATEGORY_COLORS["General"];

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Slide Panel */}
      <div
        className={`fixed inset-y-0 right-0 w-full max-w-xl bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: "1px solid #eee9df" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "#ddf4fd" }}
            >
              <Mail className="w-4 h-4" style={{ color: "#0089ad" }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "#000" }}>
                Send Email
              </p>
              <p className="text-xs" style={{ color: "#9f9b93" }}>
                {order.Title}
              </p>
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-3">
            <StepDot n={1} active={step === 1} done={step > 1} />
            <div className="w-6 h-px" style={{ background: "#dad4c8" }} />
            <StepDot n={2} active={step === 2} done={step > 2} />
            <div className="w-6 h-px" style={{ background: "#dad4c8" }} />
            <StepDot n={3} active={step === 3} done={false} />
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors hover:bg-[#faf9f7]"
          >
            <X className="w-4 h-4" style={{ color: "#9f9b93" }} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Step 1 — Template Selection */}
          {step === 1 && (
            <>
              <p className="text-sm" style={{ color: "#55534e" }}>
                Select a template for{" "}
                <span className="font-semibold" style={{ color: "#000" }}>
                  {order.CloudProvider}
                </span>{" "}
                — variables will be filled automatically.
              </p>
              {loadingTemplates ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#dad4c8" }} />
                </div>
              ) : templates.length === 0 ? (
                <div
                  className="rounded-2xl p-6 text-center"
                  style={{ border: "1px dashed #dad4c8" }}
                >
                  <p className="text-sm" style={{ color: "#9f9b93" }}>
                    No templates found for {order.CloudProvider}. Ask an admin to create one.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {templates.map((tmpl) => {
                    const cs =
                      CATEGORY_COLORS[tmpl.TemplateCategory] ??
                      CATEGORY_COLORS["General"];
                    return (
                      <div
                        key={tmpl.id}
                        className="rounded-2xl p-4 transition-all cursor-pointer group"
                        style={{
                          border: "1px solid #dad4c8",
                          background: "#fff",
                          boxShadow:
                            "rgba(0,0,0,0.06) 0px 1px 1px, rgba(0,0,0,0.03) 0px -1px 1px inset",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLDivElement).style.borderColor = "#3bd3fd";
                          (e.currentTarget as HTMLDivElement).style.background = "#f0faff";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLDivElement).style.borderColor = "#dad4c8";
                          (e.currentTarget as HTMLDivElement).style.background = "#fff";
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                                style={{ background: cs.bg, color: cs.text }}
                              >
                                {tmpl.TemplateCategory}
                              </span>
                            </div>
                            <p className="text-sm font-semibold" style={{ color: "#000" }}>
                              {tmpl.Title}
                            </p>
                            <p
                              className="text-xs mt-0.5 truncate"
                              style={{ color: "#9f9b93" }}
                            >
                              {tmpl.Subject}
                            </p>
                            {tmpl.Description && (
                              <p className="text-xs mt-1" style={{ color: "#55534e" }}>
                                {tmpl.Description}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleSelectTemplate(tmpl)}
                            className="shrink-0 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all"
                            style={{
                              background: "#000",
                              color: "#fff",
                            }}
                            onMouseEnter={(e) => {
                              const el = e.currentTarget;
                              el.style.transform = "rotateZ(-8deg) translateY(-4px)";
                              el.style.boxShadow = "rgb(0,0,0) -5px 5px";
                            }}
                            onMouseLeave={(e) => {
                              const el = e.currentTarget;
                              el.style.transform = "";
                              el.style.boxShadow = "";
                            }}
                          >
                            Use
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Step 2 — Compose */}
          {step === 2 && (
            <>
              <div
                className="rounded-xl px-3.5 py-2.5 text-sm flex items-start gap-2"
                style={{ background: "#fef9c3", border: "1px solid #f8cc65" }}
              >
                <span style={{ color: "#9d6a09" }}>
                  Variables auto-filled from order data. Review before sending.
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: "#9f9b93" }}>
                    To <span style={{ color: "#cc0000" }}>*</span>
                  </label>
                  <input
                    style={inputStyle}
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    placeholder="recipient@example.com"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: "#9f9b93" }}>
                    CC
                  </label>
                  <input
                    style={inputStyle}
                    value={cc}
                    onChange={(e) => setCc(e.target.value)}
                    placeholder="cc@example.com (optional)"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: "#9f9b93" }}>
                    Subject <span style={{ color: "#cc0000" }}>*</span>
                  </label>
                  <input
                    style={inputStyle}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Email subject"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: "#9f9b93" }}>
                    Body
                  </label>
                  <RichTextEditor
                    value={body}
                    onChange={setBody}
                    minHeight={220}
                    placeholder="Email body…"
                  />
                </div>
              </div>
            </>
          )}

          {/* Step 3 — Preview */}
          {step === 3 && (
            <>
              {success ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center"
                    style={{ background: "#d1f4e0" }}
                  >
                    <span className="text-2xl">✓</span>
                  </div>
                  <p className="text-base font-semibold" style={{ color: "#02492a" }}>
                    Email sent successfully!
                  </p>
                </div>
              ) : (
                <>
                  <div
                    className="rounded-2xl p-4 text-sm space-y-1"
                    style={{ border: "1px dashed #dad4c8", background: "#faf9f7" }}
                  >
                    <p style={{ color: "#9f9b93" }}>
                      <span className="font-medium" style={{ color: "#55534e" }}>From: </span>
                      Shared Mailbox (via Power Automate)
                    </p>
                    <p style={{ color: "#9f9b93" }}>
                      <span className="font-medium" style={{ color: "#55534e" }}>To: </span>
                      {to}
                    </p>
                    {cc && (
                      <p style={{ color: "#9f9b93" }}>
                        <span className="font-medium" style={{ color: "#55534e" }}>CC: </span>
                        {cc}
                      </p>
                    )}
                    <p style={{ color: "#9f9b93" }}>
                      <span className="font-medium" style={{ color: "#55534e" }}>Subject: </span>
                      {subject}
                    </p>
                    <div
                      className="mt-3 pt-3"
                      style={{ borderTop: "1px solid #dad4c8" }}
                    >
                      <div
                        className="prose prose-sm max-w-none text-sm"
                        style={{ color: "#000" }}
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(body) }}
                      />
                    </div>
                  </div>

                  <div
                    className="rounded-xl px-3.5 py-2.5 text-xs"
                    style={{ background: "#eee9df", color: "#55534e" }}
                  >
                    Email will be sent from the shared mailbox configured in Power Automate.
                  </div>

                  {error && (
                    <div
                      className="rounded-xl px-3.5 py-2.5 text-sm"
                      style={{ background: "#fde8e8", color: "#b0101a" }}
                    >
                      {error}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div
            className="px-5 py-4 flex items-center justify-between shrink-0"
            style={{ borderTop: "1px solid #eee9df" }}
          >
            <button
              onClick={() => (step === 2 ? setStep(1) : step === 3 ? setStep(2) : onClose())}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{ background: "#faf9f7", border: "1px solid #dad4c8", color: "#55534e" }}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              {step === 1 ? "Cancel" : "Back"}
            </button>

            {step === 1 && (
              <p className="text-xs" style={{ color: "#9f9b93" }}>
                Select a template above
              </p>
            )}

            {step === 2 && (
              <button
                onClick={() => setStep(3)}
                disabled={!to || !subject}
                className="px-5 py-2 rounded-xl text-sm font-medium transition-all"
                style={
                  to && subject
                    ? { background: "#000", color: "#fff" }
                    : { background: "#eee9df", color: "#9f9b93", cursor: "not-allowed" }
                }
              >
                Preview →
              </button>
            )}

            {step === 3 && (
              <button
                onClick={handleSend}
                disabled={sending}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all"
                style={{ background: "#078a52", color: "#fff" }}
                onMouseEnter={(e) => {
                  if (sending) return;
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
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {sending ? "Sending…" : "Send Email"}
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default EmailComposePanel;
