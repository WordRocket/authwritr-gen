
import { supabase } from "@/integrations/supabase/client";

export interface SeoFormValues {
  topic: string;
  targetKeyword?: string;
  articleType?: "informational" | "listicle" | "how-to" | "anecdote" | "story";
  toneOfArticle?: "professional" | "conversational" | "friendly" | "authoritative" | "casual";
  intendedAudience?: string;
  additionalContext?: string;
  wordCount: number;
  includeFirstPerson: boolean;
  includeAnecdotes: boolean;
  includeHook: boolean;
  includeStories: boolean;
  includeHtmlElement: boolean;
}

export async function generateSeoContent(formData: SeoFormValues): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke("generate-seo-content", {
      body: formData,
    });

    if (error) {
      console.error("Error invoking generate-seo-content function:", error);
      throw new Error(`Failed to generate content: ${error.message}`);
    }

    if (!data || !data.success) {
      throw new Error("Failed to generate content");
    }

    return data.content;
  } catch (error) {
    console.error("Error in generateSeoContent:", error);
    throw error;
  }
}

export async function saveGeneratedContent(title: string, content: string, userId: string) {
  try {
    const { data, error } = await supabase
      .from('content')
      .insert([
        { 
          title, 
          content, 
          user_id: userId,
          created_at: new Date().toISOString()
        }
      ])
      .select();

    if (error) {
      console.error("Error saving content:", error);
      throw new Error(`Failed to save content: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error("Error in saveGeneratedContent:", error);
    throw error;
  }
}
