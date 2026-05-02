import { supabase } from "../lib/supabase";

export interface FeedbackItem {
  id: string;
  type: "Bug" | "Idea" | "Other";
  title: string;
  description: string;
  priority: "Low" | "Medium" | "High";
  status: "Open" | "In Progress" | "Done";
  component_name: string | null;
  component_context: string | null;
  submitted_by: string;
  created_at: string;
}

export interface CreateFeedbackInput {
  type: "Bug" | "Idea" | "Other";
  title: string;
  description: string;
  priority: "Low" | "Medium" | "High";
  component_name?: string;
  component_context?: string;
  submitted_by: string;
}

export const feedbackService = {
  async create(data: CreateFeedbackInput): Promise<void> {
    const { error } = await supabase.from("feedback").insert(data);
    if (error) throw new Error(error.message);
  },

  async findAll(): Promise<FeedbackItem[]> {
    const { data, error } = await supabase
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async updateStatus(
    id: string,
    status: FeedbackItem["status"],
  ): Promise<void> {
    const { error } = await supabase
      .from("feedback")
      .update({ status })
      .eq("id", id);
    if (error) throw new Error(error.message);
  },
};
