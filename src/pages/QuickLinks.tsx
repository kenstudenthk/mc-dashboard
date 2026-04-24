import React, { useState, useEffect } from "react";
import { usePermission } from "../contexts/PermissionContext";
import {
  ExternalLink,
  Plus,
  Edit2,
  Trash2,
  X,
  Link2,
  AlertCircle,
  ArrowUpRight,
} from "lucide-react";
import { TutorTooltip } from "../components/TutorTooltip";
import { quickLinkService, QuickLink } from "../services/quickLinkService";

// Cycles through Clay palette accent colors per card index
const CARD_ACCENTS = [
  "#078a52", // matcha
  "#3bd3fd", // slushie
  "#fbbd41", // lemon
  "#fc7981", // pomegranate
  "#43089f", // ube
];

function getAccent(index: number): string {
  return CARD_ACCENTS[index % CARD_ACCENTS.length];
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

const INPUT_CLASS =
  "w-full px-4 py-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all text-sm text-[var(--color-text-main)] placeholder:text-[var(--color-text-muted)]";

// ── Loading skeleton ──────────────────────────────────────────────────────────
const SkeletonCard = ({ accent }: { accent: string }) => (
  <div className="bg-[var(--color-surface-elevated)] border border-[var(--color-border-light)] rounded-2xl overflow-hidden">
    <div className="h-1" style={{ backgroundColor: accent, opacity: 0.3 }} />
    <div className="p-5 space-y-3">
      <div className="h-4 w-3/5 rounded-md bg-[var(--color-border-light)] animate-pulse" />
      <div className="h-3 w-full rounded-md bg-[var(--color-border-light)] animate-pulse" />
      <div className="h-3 w-4/5 rounded-md bg-[var(--color-border-light)] animate-pulse" />
      <div className="pt-2 h-9 rounded-xl bg-[var(--color-border-light)] animate-pulse" />
    </div>
  </div>
);

// ── Link card ─────────────────────────────────────────────────────────────────
interface LinkCardProps {
  link: QuickLink;
  index: number;
  canEdit: boolean;
  onEdit: (link: QuickLink) => void;
  onDelete: (id: number) => void;
}

const LinkCard = ({ link, index, canEdit, onEdit, onDelete }: LinkCardProps) => {
  const accent = getAccent(index);
  const domain = getDomain(link.URL);

  return (
    <div className="group bg-[var(--color-surface-elevated)] border border-[var(--color-border-light)] rounded-2xl overflow-hidden flex flex-col hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      {/* Accent bar */}
      <div className="h-1 shrink-0" style={{ backgroundColor: accent }} />

      <div className="p-5 flex flex-col flex-1">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="w-2 h-2 rounded-full shrink-0 mt-0.5"
              style={{ backgroundColor: accent }}
            />
            <h3 className="text-sm font-semibold text-[var(--color-text-main)] leading-snug truncate">
              {link.Title}
            </h3>
          </div>

          {canEdit && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                onClick={() => onEdit(link)}
                className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-border-light)] transition-colors"
                title="Edit link"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDelete(link.id)}
                className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[#fc7981] hover:bg-red-50 transition-colors"
                title="Delete link"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed flex-1 mb-4 line-clamp-3">
          {link.Description}
        </p>

        {/* Footer: domain + visit button */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-[var(--color-text-muted)] truncate font-mono">
            {domain}
          </span>
          <TutorTooltip
            text={`Open ${link.Title} in a new tab.`}
            position="top"
            componentName="UsefulLinks.LinkCard"
          >
            <a
              href={link.URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-black text-white hover:bg-black/80 transition-colors shrink-0"
            >
              Visit
              <ArrowUpRight className="w-3 h-3" />
            </a>
          </TutorTooltip>
        </div>
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const QuickLinks = () => {
  const { hasPermission, userEmail } = usePermission();
  // Admin (2) and above: Admin, Global Admin, Developer
  const canEdit = hasPermission("Admin");

  const [links, setLinks] = useState<QuickLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUnconfigured, setIsUnconfigured] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<QuickLink | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ Title: "", URL: "", Description: "" });

  useEffect(() => {
    quickLinkService
      .findAll()
      .then((result) => setLinks(Array.isArray(result) ? result : []))
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Failed to load links.";
        if (msg.toLowerCase().includes("not configured")) {
          setIsUnconfigured(true);
        } else {
          setError(msg);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleOpenModal = (link?: QuickLink) => {
    if (link) {
      setEditingLink(link);
      setFormData({ Title: link.Title, URL: link.URL, Description: link.Description });
    } else {
      setEditingLink(null);
      setFormData({ Title: "", URL: "", Description: "" });
    }
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingLink(null);
    setModalError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setModalError(null);
    try {
      if (editingLink) {
        const updated = await quickLinkService.update(editingLink.id, formData, userEmail);
        setLinks((prev) => prev.map((l) => (l.id === editingLink.id ? updated : l)));
      } else {
        const created = await quickLinkService.create(formData, userEmail);
        setLinks((prev) => [...prev, created]);
      }
      handleCloseModal();
    } catch {
      setModalError("Failed to save. Please check the Power Automate flow and try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this link?")) return;
    try {
      await quickLinkService.delete(id, userEmail);
      setLinks((prev) => prev.filter((l) => l.id !== id));
    } catch {
      setError("Failed to delete the link. Please try again.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-8">
      {/* ── Page header ── */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="label-text text-[var(--color-text-muted)] mb-2">Resources</p>
          <h1 className="text-[32px] font-semibold text-[var(--color-text-main)] tracking-tight leading-none">
            Useful Links
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Quick access to external portals and management consoles.
          </p>
        </div>

        {canEdit && !isUnconfigured && !loading && (
          <TutorTooltip
            text="Admins and above can add new useful links here."
            position="bottom"
            componentName="UsefulLinks.AddButton"
          >
            <button
              onClick={() => handleOpenModal()}
              className="gradient-cta inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Link
            </button>
          </TutorTooltip>
        )}
      </div>

      {/* ── General error banner ── */}
      {error && (
        <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Unconfigured state ── */}
      {isUnconfigured && (
        <div className="py-24 flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[var(--color-border-light)] flex items-center justify-center">
            <Link2 className="w-6 h-6 text-[var(--color-text-muted)]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--color-text-main)]">
              API not connected
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1.5 max-w-xs leading-relaxed">
              Set{" "}
              <code className="font-mono bg-[var(--color-border-light)] px-1 py-0.5 rounded text-[10px]">
                VITE_API_QUICK_LINKS_URL
              </code>{" "}
              in{" "}
              <code className="font-mono bg-[var(--color-border-light)] px-1 py-0.5 rounded text-[10px]">
                .env.local
              </code>{" "}
              and add the secret to{" "}
              <code className="font-mono bg-[var(--color-border-light)] px-1 py-0.5 rounded text-[10px]">
                deploy.yml
              </code>
              .
            </p>
          </div>
        </div>
      )}

      {/* ── Loading skeletons ── */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} accent={getAccent(i)} />
          ))}
        </div>
      )}

      {/* ── Links grid ── */}
      {!loading && !isUnconfigured && (
        <>
          {links.length === 0 ? (
            <div className="py-24 flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[var(--color-border-light)] flex items-center justify-center">
                <ExternalLink className="w-6 h-6 text-[var(--color-text-muted)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-text-main)]">
                  No links yet
                </p>
                {canEdit ? (
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    Click <strong>Add Link</strong> to add your first useful link.
                  </p>
                ) : (
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    No links have been added yet.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {links.map((link, i) => (
                <LinkCard
                  key={link.id}
                  link={link}
                  index={i}
                  canEdit={canEdit}
                  onEdit={handleOpenModal}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Add / Edit modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--color-surface-elevated)] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-[var(--color-border-light)]">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-border-light)]">
              <h2 className="text-base font-semibold text-[var(--color-text-main)]">
                {editingLink ? "Edit Link" : "Add Useful Link"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-border-light)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
              {modalError && (
                <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-700">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="label-text text-[var(--color-text-muted)]">Name</label>
                <input
                  type="text"
                  required
                  value={formData.Title}
                  onChange={(e) => setFormData({ ...formData, Title: e.target.value })}
                  placeholder="e.g. AWS Management Console"
                  className={INPUT_CLASS}
                />
              </div>

              <div className="space-y-1.5">
                <label className="label-text text-[var(--color-text-muted)]">URL</label>
                <input
                  type="url"
                  required
                  value={formData.URL}
                  onChange={(e) => setFormData({ ...formData, URL: e.target.value })}
                  placeholder="https://…"
                  className={INPUT_CLASS}
                />
              </div>

              <div className="space-y-1.5">
                <label className="label-text text-[var(--color-text-muted)]">Description</label>
                <textarea
                  required
                  rows={3}
                  value={formData.Description}
                  onChange={(e) => setFormData({ ...formData, Description: e.target.value })}
                  placeholder="Brief description of what this link is used for…"
                  className={`${INPUT_CLASS} resize-none`}
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2.5 border border-[var(--color-border)] text-[var(--color-text-secondary)] font-medium rounded-xl hover:bg-[var(--color-surface)] transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-black text-white font-semibold rounded-xl hover:bg-black/80 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Saving…" : editingLink ? "Save Changes" : "Add Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickLinks;
