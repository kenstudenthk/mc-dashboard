import React, { useState, useEffect } from "react";
import { Role, usePermission } from "../contexts/PermissionContext";
import {
  ExternalLink,
  Plus,
  Edit2,
  Trash2,
  Ban,
  X,
  Link2,
  AlertCircle,
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

const ROLE_OPTIONS: Role[] = ["User", "Admin", "Global Admin", "Developer"];

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
  onDisable: (link: QuickLink) => void;
  onDelete: (id: number) => void;
}

const LinkCard = ({
  link,
  index,
  canEdit,
  onEdit,
  onDisable,
  onDelete,
}: LinkCardProps) => {
  const accent = getAccent(index);
  const domain = getDomain(link.URL);

  return (
    <div className="group relative overflow-hidden rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border-light)]">
      {/* Expanding circle from top-right (simulates ::before pseudo-element) */}
      <div
        className="absolute -top-4 -right-4 w-8 h-8 rounded-full scale-100 group-hover:scale-[21] transition-transform duration-300 ease-out z-0 pointer-events-none"
        style={{ backgroundColor: accent }}
      />

      {/* Go-corner arrow */}
      <div
        className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center z-20 pointer-events-none"
        style={{ backgroundColor: accent, borderRadius: "0 4px 0 32px" }}
      >
        <span className="-mt-1 -mr-1 text-white text-base leading-none">→</span>
      </div>

      {/* Admin edit/delete buttons */}
      {canEdit && (
        <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-30">
          <TutorTooltip
            text={`Edit the saved details for ${link.Title}.`}
            position="bottom"
            wrapperClass="w-auto"
            componentName="UsefulLinks.EditButton"
          >
            <button
              onClick={() => onEdit(link)}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-colors"
              title="Edit link"
              aria-label={`Edit ${link.Title}`}
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </TutorTooltip>
          <TutorTooltip
            text={`Disable ${link.Title} so it no longer appears for users.`}
            position="bottom"
            wrapperClass="w-auto"
            componentName="UsefulLinks.DisableButton"
          >
            <button
              onClick={() => onDisable(link)}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-colors"
              title="Disable link"
              aria-label={`Disable ${link.Title}`}
            >
              <Ban className="w-3.5 h-3.5" />
            </button>
          </TutorTooltip>
          <TutorTooltip
            text={`Delete ${link.Title} from useful links.`}
            position="bottom"
            wrapperClass="w-auto"
            componentName="UsefulLinks.DeleteButton"
          >
            <button
              onClick={() => onDelete(link.id)}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-colors"
              title="Delete link"
              aria-label={`Delete ${link.Title}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </TutorTooltip>
        </div>
      )}

      {/* Card content */}
      <TutorTooltip
        text={`Open ${link.Title} in a new tab.`}
        position="top"
        componentName="UsefulLinks.LinkCard"
      >
        <a
          href={link.URL}
          target="_blank"
          rel="noopener noreferrer"
          className="block relative z-10 px-6 py-8 no-underline"
        >
          <p className="text-base font-semibold text-[var(--color-text-main)] group-hover:text-white transition-colors duration-300 leading-snug mb-2">
            {link.Title}
          </p>
          <p className="text-sm text-[var(--color-text-muted)] group-hover:text-white/80 transition-colors duration-300 leading-relaxed line-clamp-3 mb-4">
            {link.Description}
          </p>
          <p className="text-[10px] font-mono text-[var(--color-text-muted)] group-hover:text-white/60 transition-colors duration-300 truncate">
            {domain}
          </p>
        </a>
      </TutorTooltip>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const QuickLinks = () => {
  const { currentRole, hasPermission, userEmail } = usePermission();
  const canManage = hasPermission("Global Admin");

  const [links, setLinks] = useState<QuickLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUnconfigured, setIsUnconfigured] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<QuickLink | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    Title: "",
    URL: "",
    Description: "",
    VisibleRoles: ROLE_OPTIONS,
  });

  useEffect(() => {
    quickLinkService
      .findAll()
      .then((result) => setLinks(Array.isArray(result) ? result : []))
      .catch((err: unknown) => {
        const msg =
          err instanceof Error ? err.message : "Failed to load links.";
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
      setFormData({
        Title: link.Title,
        URL: link.URL,
        Description: link.Description,
        VisibleRoles:
          link.VisibleRoles && link.VisibleRoles.length > 0
            ? link.VisibleRoles
            : ROLE_OPTIONS,
      });
    } else {
      setEditingLink(null);
      setFormData({
        Title: "",
        URL: "",
        Description: "",
        VisibleRoles: ROLE_OPTIONS,
      });
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
        const updated = await quickLinkService.update(
          editingLink.id,
          formData,
          userEmail,
        );
        setLinks((prev) =>
          prev.map((l) => (l.id === editingLink.id ? updated : l)),
        );
      } else {
        const created = await quickLinkService.create(formData, userEmail);
        setLinks((prev) => [...prev, created]);
      }
      handleCloseModal();
    } catch {
      setModalError(
        "Failed to save. Please check the Power Automate flow and try again.",
      );
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

  const toggleVisibleRole = (role: Role) => {
    setFormData((prev) => {
      const hasRole = prev.VisibleRoles.includes(role);
      const nextRoles = hasRole
        ? prev.VisibleRoles.filter((item) => item !== role)
        : [...prev.VisibleRoles, role];
      return {
        ...prev,
        VisibleRoles: nextRoles.length > 0 ? nextRoles : [role],
      };
    });
  };

  const handleDisable = async (link: QuickLink) => {
    if (!window.confirm("Disable this link?")) return;
    try {
      await quickLinkService.update(link.id, { IsActive: false }, userEmail);
      setLinks((prev) => prev.filter((item) => item.id !== link.id));
    } catch {
      setError("Failed to disable the link. Please try again.");
    }
  };

  const visibleLinks = canManage
    ? links
    : links.filter(
        (link) =>
          link.IsActive !== false &&
          (!link.VisibleRoles ||
            link.VisibleRoles.length === 0 ||
            link.VisibleRoles.includes(currentRole)),
      );

  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-8">
      {/* ── Page header ── */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="label-text text-[var(--color-text-muted)] mb-2">
            Resources
          </p>
          <h1 className="text-[32px] font-semibold text-[var(--color-text-main)] tracking-tight leading-none">
            Useful Links
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Quick access to external portals and management consoles.
          </p>
        </div>

        {canManage && !isUnconfigured && !loading && (
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
              The environment variable{" "}
              <code className="font-mono bg-[var(--color-border-light)] px-1 py-0.5 rounded text-[10px]">
                VITE_API_QUICK_LINKS_URL
              </code>{" "}
              is missing.
              <br />
              Check{" "}
              <code className="font-mono bg-[var(--color-border-light)] px-1 py-0.5 rounded text-[10px]">
                .env.local
              </code>{" "}
              for development or <strong>GitHub Secrets</strong> for production.
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
          {visibleLinks.length === 0 ? (
            <div className="py-24 flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[var(--color-border-light)] flex items-center justify-center">
                <ExternalLink className="w-6 h-6 text-[var(--color-text-muted)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-text-main)]">
                  No links yet
                </p>
                {canManage ? (
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    Click <strong>Add Link</strong> to add your first useful
                    link.
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
              {visibleLinks.map((link, i) => (
                <LinkCard
                  key={link.id}
                  link={link}
                  index={i}
                  canEdit={canManage}
                  onEdit={handleOpenModal}
                  onDisable={handleDisable}
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
              <TutorTooltip
                text="Close this form without saving changes."
                position="left"
                wrapperClass="w-auto"
                componentName="UsefulLinks.ModalCloseButton"
              >
                <button
                  onClick={handleCloseModal}
                  className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-border-light)] transition-colors"
                  aria-label="Close link form"
                >
                  <X className="w-4 h-4" />
                </button>
              </TutorTooltip>
            </div>

            <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
              {modalError && (
                <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-700">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="label-text text-[var(--color-text-muted)]">
                  Name
                </label>
                <TutorTooltip
                  text="Enter the display name users will see on the link card."
                  position="top"
                  componentName="UsefulLinks.NameInput"
                >
                  <input
                    type="text"
                    required
                    value={formData.Title}
                    onChange={(e) =>
                      setFormData({ ...formData, Title: e.target.value })
                    }
                    placeholder="e.g. AWS Management Console"
                    className={INPUT_CLASS}
                  />
                </TutorTooltip>
              </div>

              <div className="space-y-1.5">
                <label className="label-text text-[var(--color-text-muted)]">
                  URL
                </label>
                <TutorTooltip
                  text="Enter the full external URL this card should open."
                  position="top"
                  componentName="UsefulLinks.UrlInput"
                >
                  <input
                    type="url"
                    required
                    value={formData.URL}
                    onChange={(e) =>
                      setFormData({ ...formData, URL: e.target.value })
                    }
                    placeholder="https://…"
                    className={INPUT_CLASS}
                  />
                </TutorTooltip>
              </div>

              <div className="space-y-1.5">
                <label className="label-text text-[var(--color-text-muted)]">
                  Description
                </label>
                <TutorTooltip
                  text="Add a short description so users know when to use this link."
                  position="top"
                  componentName="UsefulLinks.DescriptionInput"
                >
                  <textarea
                    required
                    rows={3}
                    value={formData.Description}
                    onChange={(e) =>
                      setFormData({ ...formData, Description: e.target.value })
                    }
                    placeholder="Brief description of what this link is used for…"
                    className={`${INPUT_CLASS} resize-none`}
                  />
                </TutorTooltip>
              </div>

              <div className="space-y-2">
                <label className="label-text text-[var(--color-text-muted)]">
                  Visible to
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLE_OPTIONS.map((role) => (
                    <label
                      key={role}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-secondary)]"
                    >
                      <input
                        type="checkbox"
                        checked={formData.VisibleRoles.includes(role)}
                        onChange={() => toggleVisibleRole(role)}
                        className="h-4 w-4 rounded border-[var(--color-border)]"
                      />
                      <span>{role}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <TutorTooltip
                  text="Cancel and return to the links list without saving."
                  position="top"
                  wrapperClass="flex-1"
                  componentName="UsefulLinks.CancelButton"
                >
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="w-full px-4 py-2.5 border border-[var(--color-border)] text-[var(--color-text-secondary)] font-medium rounded-xl hover:bg-[var(--color-surface)] transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </TutorTooltip>
                <TutorTooltip
                  text={
                    editingLink
                      ? "Save updates to this useful link."
                      : "Create this useful link for users."
                  }
                  position="top"
                  wrapperClass="flex-1"
                  componentName="UsefulLinks.SaveButton"
                >
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full px-4 py-2.5 bg-black text-white font-semibold rounded-xl hover:bg-black/80 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving
                      ? "Saving…"
                      : editingLink
                        ? "Save Changes"
                        : "Add Link"}
                  </button>
                </TutorTooltip>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickLinks;
