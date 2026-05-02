import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { usePermission } from '../contexts/PermissionContext';
import { feedbackService, FeedbackItem } from '../services/feedbackService';
import { Flag, AlertCircle } from 'lucide-react';

const STATUS_COLORS: Record<FeedbackItem['status'], string> = {
  'Open': 'bg-blue-100 text-blue-700',
  'In Progress': 'bg-yellow-100 text-yellow-700',
  'Done': 'bg-green-100 text-green-700',
};

const PRIORITY_COLORS: Record<FeedbackItem['priority'], string> = {
  'Low': 'bg-gray-100 text-gray-600',
  'Medium': 'bg-orange-100 text-orange-700',
  'High': 'bg-red-100 text-red-700',
};

const TYPE_COLORS: Record<FeedbackItem['type'], string> = {
  'Bug': 'bg-red-100 text-red-700',
  'Idea': 'bg-purple-100 text-purple-700',
  'Other': 'bg-gray-100 text-gray-600',
};

const Feedback = () => {
  const { hasPermission } = usePermission();
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  useEffect(() => {
    if (!hasPermission('Developer')) return;
    feedbackService.findAll()
      .then(setItems)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [hasPermission]);

  if (!hasPermission('Developer')) {
    return <Navigate to="/" replace />;
  }

  const handleStatusChange = async (id: string, status: FeedbackItem['status']) => {
    try {
      await feedbackService.updateStatus(id, status);
      setItems(prev => prev.map(item => item.id === id ? { ...item, status } : item));
    } catch {
      alert('Failed to update status');
    }
  };

  const filtered = items.filter(item =>
    (typeFilter === 'All' || item.type === typeFilter) &&
    (statusFilter === 'All' || item.status === statusFilter)
  );

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
          <Flag className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[#1d1d1f]">Feedback</h1>
          <p className="text-sm text-[#1d1d1f]/50">{items.length} submission{items.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <TutorTooltip
          text="Use these filters to narrow down feedback items by their type (Bug, Idea, Other) or their current resolution status."
          position="bottom"
          componentName="Feedback.Filters"
        >
          <div className="p-4 border-b border-[#1d1d1f]/08 flex gap-3 flex-wrap">
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 bg-[#f5f5f7] border border-[#1d1d1f]/10 rounded-lg text-xs focus:outline-none"
            >
              <option value="All">All Types</option>
              <option value="Bug">Bug</option>
              <option value="Idea">Idea</option>
              <option value="Other">Other</option>
            </select>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-[#f5f5f7] border border-[#1d1d1f]/10 rounded-lg text-xs focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
            </select>
          </div>
        </TutorTooltip>

        {loading && (
          <div className="p-8 text-center text-sm text-[#1d1d1f]/40">Loading feedback…</div>
        )}

        {error && (
          <div className="p-4 flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="p-8 text-center text-sm text-[#1d1d1f]/40">No feedback found.</div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1d1d1f]/08">
                  <th className="text-left px-4 py-3 label-text">Date</th>
                  <th className="text-left px-4 py-3 label-text">Type</th>
                  <th className="text-left px-4 py-3 label-text">Priority</th>
                  <th className="text-left px-4 py-3 label-text">Component</th>
                  <th className="text-left px-4 py-3 label-text">Title</th>
                  <th className="text-left px-4 py-3 label-text">By</th>
                  <th className="text-left px-4 py-3 label-text">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item.id} className="border-b border-[#1d1d1f]/05 hover:bg-[#f5f5f7]/60 transition-colors">
                    <td className="px-4 py-3 text-[#1d1d1f]/50 text-xs whitespace-nowrap">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[item.type]}`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[item.priority]}`}>
                        {item.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#1d1d1f]/50 text-xs font-mono">
                      {item.component_name ?? '—'}
                    </td>
                    <td className="px-4 py-3 font-medium text-[#1d1d1f] max-w-xs">
                      <div className="truncate" title={item.title}>{item.title}</div>
                      {item.description && (
                        <div className="text-xs text-[#1d1d1f]/40 truncate mt-0.5">{item.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#1d1d1f]/50 text-xs">{item.submitted_by}</td>
                    <td className="px-4 py-3">
                      <select
                        value={item.status}
                        onChange={e => handleStatusChange(item.id, e.target.value as FeedbackItem['status'])}
                        className={`px-2 py-1 rounded-lg text-xs font-medium border-0 cursor-pointer focus:outline-none ${STATUS_COLORS[item.status]}`}
                      >
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Done">Done</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Feedback;
