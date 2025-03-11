
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
  model?: string;
}

export async function generateSeoContent(formData: SeoFormValues, apiKey?: string): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke("generate-seo-content", {
      body: {
        ...formData,
        apiKey,
        model: formData.model || "anthropic/claude-3-5-sonnet"
      },
    });

    if (error) {
      console.error("Error invoking generate-seo-content function:", error);
      throw new Error(`Failed to generate content: ${error.message}`);
    }

    if (!data || !data.success) {
      const errorMessage = data?.error || "Failed to generate content";
      throw new Error(errorMessage);
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

export const recommendedModels = [
  { 
    id: "anthropic/claude-3-5-sonnet", 
    name: "Claude 3.5 Sonnet", 
    description: "Best overall quality for SEO content",
    recommended: true
  },
  { 
    id: "anthropic/claude-3-opus", 
    name: "Claude 3 Opus", 
    description: "Highest quality for premium content",
    recommended: true
  },
  { 
    id: "anthropic/claude-3-haiku", 
    name: "Claude 3 Haiku", 
    description: "Fast and cost-effective",
    recommended: true
  },
  { 
    id: "openai/gpt-4o", 
    name: "GPT-4o", 
    description: "Excellent for creative content",
    recommended: true
  },
  { 
    id: "mistralai/mistral-large", 
    name: "Mistral Large", 
    description: "Good balance of quality and cost",
    recommended: false
  },
  { 
    id: "google/gemini-1.5-pro", 
    name: "Gemini 1.5 Pro", 
    description: "Strong general knowledge",
    recommended: false
  }
];
