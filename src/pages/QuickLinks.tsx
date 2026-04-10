import React, { useState } from 'react';
import { usePermission } from '../contexts/PermissionContext';
import { ExternalLink, Plus, Edit2, Trash2, Cloud, X } from 'lucide-react';
import { TutorTooltip } from '../components/TutorTooltip';

interface QuickLink {
  id: number;
  title: string;
  url: string;
  description: string;
}

const initialLinks: QuickLink[] = [
  { id: 1, title: 'AWS Management Console', url: 'https://aws.amazon.com/console/', description: 'Amazon Web Services portal for managing cloud resources and billing.' },
  { id: 2, title: 'Microsoft Azure Portal', url: 'https://portal.azure.com/', description: 'Azure portal for managing Microsoft cloud services and active directories.' },
  { id: 3, title: 'Huawei Cloud Console', url: 'https://console.huaweicloud.com/', description: 'Huawei Cloud management, provisioning, and monitoring.' },
  { id: 4, title: 'Google Cloud Console', url: 'https://console.cloud.google.com/', description: 'GCP management interface for projects and billing.' },
  { id: 5, title: 'Alibaba Cloud Console', url: 'https://home.console.aliyun.com/', description: 'AliCloud portal for resource management and security.' }
];

const QuickLinks = () => {
  const { hasPermission } = usePermission();
  // Global Admin and Developer can edit
  const canEdit = hasPermission('Global Admin'); 
  
  const [links, setLinks] = useState<QuickLink[]>(initialLinks);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<QuickLink | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({ title: '', url: '', description: '' });

  const handleOpenModal = (link?: QuickLink) => {
    if (link) {
      setEditingLink(link);
      setFormData({ title: link.title, url: link.url, description: link.description });
    } else {
      setEditingLink(null);
      setFormData({ title: '', url: '', description: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingLink(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLink) {
      setLinks(links.map(l => l.id === editingLink.id ? { ...formData, id: l.id } : l));
    } else {
      setLinks([...links, { ...formData, id: Date.now() }]);
    }
    handleCloseModal();
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this quick link?')) {
      setLinks(links.filter(l => l.id !== id));
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900">Quick Links</h1>
          <p className="text-gray-500 mt-1">Access external service portals and management consoles.</p>
        </div>
        {canEdit && (
          <TutorTooltip text="Global Admins and Developers can add new quick links here." position="bottom">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {links.map((link) => (
          <div key={link.id} className="card p-6 flex flex-col h-full hover:border-primary/30 transition-colors group">
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
            
            <h3 className="text-lg font-bold text-gray-900 mb-2">{link.title}</h3>
            <p className="text-sm text-gray-500 flex-1 mb-6">{link.description}</p>
            
            <TutorTooltip text={`Click here to open the ${link.title} in a new tab.`} position="top">
              <a 
                href={link.url} 
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

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-serif font-bold text-gray-900">
                {editingLink ? 'Edit Quick Link' : 'Add Quick Link'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Portal Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g. AWS Management Console"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">URL</label>
                <input 
                  type="url" 
                  required
                  value={formData.url}
                  onChange={(e) => setFormData({...formData, url: e.target.value})}
                  placeholder="https://..."
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Description</label>
                <textarea 
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
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
                  {editingLink ? 'Save Changes' : 'Add Link'}
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
