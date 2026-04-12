import React, { useState, useEffect } from "react";
import { usePermission } from "../contexts/PermissionContext";
import { ExternalLink, Plus, Edit2, Trash2, Cloud, X } from "lucide-react";
import { TutorTooltip } from "../components/TutorTooltip";
import { quickLinkService, QuickLink } from "../services/quickLinkService";

const QuickLinks = () => {
  const { hasPermission, userEmail } = usePermission();
  const canEdit = hasPermission("Global Admin");

  const [links, setLinks] = useState<QuickLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<QuickLink | null>(null);
  const [formData, setFormData] = useState({
    Title: "",
    URL: "",
    Description: "",
  });

  useEffect(() => {
    quickLinkService
      .findAll()
      .then((result) => setLinks(Array.isArray(result) ? result : []))
      .catch(() => setError("Failed to load quick links."))
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
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingLink(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLink) {
        const updated = await quickLinkService.update(editingLink.id, formData, userEmail);
        setLinks(links.map((l) => (l.id === editingLink.id ? updated : l)));
      } else {
        const created = await quickLinkService.create(formData, userEmail);
        setLinks([...links, created]);
      }
      handleCloseModal();
    } catch {
      setError("Failed to save quick link.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this quick link?")) return;
    try {
      await quickLinkService.delete(id, userEmail);
      setLinks(links.filter((l) => l.id !== id));
    } catch {
      setError("Failed to delete quick link.");
    }
  };

  const inputClass = "w-full px-4 py-2.5 bg-[#f5f5f7] border border-[#1d1d1f]/08 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 focus:border-[#0071e3] transition-all text-sm text-[#1d1d1f] placeholder:text-[#1d1d1f]/30";

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-[28px] font-semibold text-[#1d1d1f]"
            style={{ letterSpacing: "-0.28px", lineHeight: "1.1" }}
          >
            Quick Links
          </h1>
          <p className="text-sm text-[#1d1d1f]/50 mt-1">
            Access external service portals and management consoles.
          </p>
        </div>
        {canEdit && (
          <TutorTooltip text="Global Admins and Developers can add new quick links here." position="bottom">
            <button
              onClick={() => handleOpenModal()}
              className="gradient-cta px-5 py-2 rounded-lg font-medium text-sm shadow-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add New Link
            </button>
          </TutorTooltip>
        )}
      </div>

      {error && (
        <div className="px-4 py-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-24 text-center text-[#1d1d1f]/30 text-sm">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {links.map((link) => (
            <div
              key={link.id}
              className="card p-6 flex flex-col h-full group hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-lg bg-blue-50 text-[#0071e3] flex items-center justify-center shrink-0">
                  <Cloud className="w-5 h-5" />
                </div>
                {canEdit && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenModal(link)}
                      className="p-1.5 text-[#1d1d1f]/35 hover:text-[#0071e3] hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Link"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(link.id)}
                      className="p-1.5 text-[#1d1d1f]/35 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Link"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <h3 className="text-sm font-semibold text-[#1d1d1f] mb-1.5">{link.Title}</h3>
              <p className="text-xs text-[#1d1d1f]/50 flex-1 mb-5">{link.Description}</p>

              <TutorTooltip text={`Click here to open the ${link.Title} in a new tab.`} position="top">
                <a
                  href={link.URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 w-full py-2 bg-[#f5f5f7] hover:bg-[#ededf2] text-[#1d1d1f]/70 text-sm font-medium rounded-lg transition-colors border border-[#1d1d1f]/06"
                >
                  Open Portal
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </TutorTooltip>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-[#1d1d1f]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-[#1d1d1f]/06">
              <h2 className="text-[17px] font-semibold text-[#1d1d1f]">
                {editingLink ? "Edit Quick Link" : "Add Quick Link"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-[#1d1d1f]/35 hover:text-[#1d1d1f]/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#1d1d1f]/60">Portal Name</label>
                <input
                  type="text"
                  required
                  value={formData.Title}
                  onChange={(e) => setFormData({ ...formData, Title: e.target.value })}
                  placeholder="e.g. AWS Management Console"
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#1d1d1f]/60">URL</label>
                <input
                  type="url"
                  required
                  value={formData.URL}
                  onChange={(e) => setFormData({ ...formData, URL: e.target.value })}
                  placeholder="https://..."
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#1d1d1f]/60">Description</label>
                <textarea
                  required
                  value={formData.Description}
                  onChange={(e) => setFormData({ ...formData, Description: e.target.value })}
                  placeholder="Brief description of what this portal is used for..."
                  className={`${inputClass} min-h-[90px] resize-none`}
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-[#1d1d1f]/08 text-[#1d1d1f]/70 font-medium rounded-lg hover:bg-[#f5f5f7] transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#0071e3] text-white font-medium rounded-lg hover:bg-[#0071e3]/90 transition-colors text-sm"
                >
                  {editingLink ? "Save Changes" : "Add Link"}
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
