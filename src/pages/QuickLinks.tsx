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
      setFormData({
        Title: link.Title,
        URL: link.URL,
        Description: link.Description,
      });
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
        const updated = await quickLinkService.update(
          editingLink.id,
          formData,
          userEmail,
        );
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
    if (!window.confirm("Are you sure you want to delete this quick link?"))
      return;
    try {
      await quickLinkService.delete(id, userEmail);
      setLinks(links.filter((l) => l.id !== id));
    } catch {
      setError("Failed to delete quick link.");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900">
            Quick Links
          </h1>
          <p className="text-gray-500 mt-1">
            Access external service portals and management consoles.
          </p>
        </div>
        {canEdit && (
          <TutorTooltip
            text="Global Admins and Developers can add new quick links here."
            position="bottom"
          >
            <button
              onClick={() => handleOpenModal()}
              className="gradient-cta px-6 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-primary/20 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add New Link
            </button>
          </TutorTooltip>
        )}
      </div>

      {error && (
        <div className="px-4 py-3 text-sm text-red-600 bg-red-50 rounded-xl border border-red-100">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-24 text-center text-gray-400">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {links.map((link) => (
            <div
              key={link.id}
              className="card p-6 flex flex-col h-full hover:border-primary/30 transition-colors group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Cloud className="w-6 h-6" />
                </div>
                {canEdit && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenModal(link)}
                      className="p-2 text-gray-400 hover:text-primary hover:bg-primary-light rounded-lg transition-colors"
                      title="Edit Link"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(link.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Link"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {link.Title}
              </h3>
              <p className="text-sm text-gray-500 flex-1 mb-6">
                {link.Description}
              </p>

              <TutorTooltip
                text={`Click here to open the ${link.Title} in a new tab.`}
                position="top"
              >
                <a
                  href={link.URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded-lg transition-colors border border-gray-200"
                >
                  Open Portal
                  <ExternalLink className="w-4 h-4" />
                </a>
              </TutorTooltip>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-serif font-bold text-gray-900">
                {editingLink ? "Edit Quick Link" : "Add Quick Link"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Portal Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.Title}
                  onChange={(e) =>
                    setFormData({ ...formData, Title: e.target.value })
                  }
                  placeholder="e.g. AWS Management Console"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">URL</label>
                <input
                  type="url"
                  required
                  value={formData.URL}
                  onChange={(e) =>
                    setFormData({ ...formData, URL: e.target.value })
                  }
                  placeholder="https://..."
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  required
                  value={formData.Description}
                  onChange={(e) =>
                    setFormData({ ...formData, Description: e.target.value })
                  }
                  placeholder="Brief description of what this portal is used for..."
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[100px]"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors"
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
