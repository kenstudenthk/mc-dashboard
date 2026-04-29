import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !key) {
  console.error('[feedbackService] VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env.local');
}

const supabase = url && key ? createClient(url, key) : null;

export interface FeedbackItem {
  id: string;
  type: 'Bug' | 'Idea' | 'Other';
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Open' | 'In Progress' | 'Done';
  component_name: string | null;
  component_context: string | null;
  submitted_by: string;
  created_at: string;
}

export interface CreateFeedbackInput {
  type: 'Bug' | 'Idea' | 'Other';
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High';
  component_name?: string;
  component_context?: string;
  submitted_by: string;
}

export const feedbackService = {
  async create(data: CreateFeedbackInput): Promise<void> {
    if (!supabase) throw new Error('[feedbackService] Supabase not configured');
    const { error } = await supabase.from('feedback').insert(data);
    if (error) throw new Error(error.message);
  },

  async findAll(): Promise<FeedbackItem[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async updateStatus(id: string, status: FeedbackItem['status']): Promise<void> {
    const { error } = await supabase
      .from('feedback')
      .update({ status })
      .eq('id', id);
    if (error) throw new Error(error.message);
  },
};
