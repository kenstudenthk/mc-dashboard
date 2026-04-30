import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePermission } from '../contexts/PermissionContext';
import { feedbackService, CreateFeedbackInput } from '../services/feedbackService';
import { Flag, CheckCircle } from 'lucide-react';

const FeedbackNew = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { userEmail } = usePermission();

  const componentName = searchParams.get('component') ?? '';
  const contextText = searchParams.get('context') ? decodeURIComponent(searchParams.get('context')!) : '';

  const [form, setForm] = useState<Omit<CreateFeedbackInput, 'submitted_by'>>({
    type: 'Bug',
    title: componentName ? `[Issue] ${componentName}` : '',
    description: contextText ? `Context: ${contextText}\n\n` : '',
    priority: 'Medium',
    component_name: componentName || undefined,
    component_context: contextText || undefined,
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await feedbackService.create({
        ...form,
        submitted_by: userEmail ?? 'unknown',
      });
      setSuccess(true);
      setTimeout(() => {
        if (window.history.length > 1) {
          navigate(-1);
        } else {
          navigate('/');
        }
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <CheckCircle className="w-12 h-12 text-green-500" />
        <p className="text-lg font-semibold text-[#1d1d1f]">Feedback submitted!</p>
        <p className="text-sm text-[#1d1d1f]/50">Returning to previous page…</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
          <Flag className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[#1d1d1f]">Report Feedback</h1>
          {componentName && (
            <p className="text-xs text-[#1d1d1f]/50 font-mono mt-0.5">{componentName}</p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 flex flex-col gap-5">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="label-text block mb-1.5">Type</label>
            <select
              value={form.type}
              onChange={e => handleChange('type', e.target.value)}
              className="w-full px-3 py-2 bg-[#f5f5f7] border border-[#1d1d1f]/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]/25"
            >
              <option value="Bug">Bug</option>
              <option value="Idea">Idea</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="label-text block mb-1.5">Priority</label>
            <select
              value={form.priority}
              onChange={e => handleChange('priority', e.target.value)}
              className="w-full px-3 py-2 bg-[#f5f5f7] border border-[#1d1d1f]/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]/25"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label-text block mb-1.5">Title</label>
          <input
            type="text"
            required
            value={form.title}
            onChange={e => handleChange('title', e.target.value)}
            placeholder="One-line summary of the issue or idea"
            className="w-full px-3 py-2 bg-[#f5f5f7] border border-[#1d1d1f]/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]/25"
          />
        </div>

        <div>
          <label className="label-text block mb-1.5">Description</label>
          <textarea
            required
            rows={6}
            value={form.description}
            onChange={e => handleChange('description', e.target.value)}
            placeholder="Describe the issue or idea in detail…"
            className="w-full px-3 py-2 bg-[#f5f5f7] border border-[#1d1d1f]/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]/25 resize-none"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-sm font-medium text-[#1d1d1f]/60 hover:text-[#1d1d1f] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="gradient-cta px-5 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 transition-opacity"
          >
            {submitting ? 'Submitting…' : 'Submit Feedback'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FeedbackNew;
