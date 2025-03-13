
import { supabase } from "@/integrations/supabase/client";

export interface SeoFormValues {
  topic: string;
  searchTerm?: string;
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
    // Map the simplified model IDs to the OpenRouter format
    let modelId = formData.model || "anthropic/claude-3.7-sonnet";
    
    // If search term is provided, models don't matter as we use gpt-4o-mini-search-preview for search and o1-mini for final content
    if (formData.searchTerm) {
      // We'll handle the search model in the edge function automatically
      console.log("Using search workflow with search model and o1-mini for final content");
    }
    // For models that need provider prefix, add it if missing
    else if (modelId && !modelId.includes('/')) {
      const modelMap: Record<string, string> = {
        "claude-3.7-sonnet": "anthropic/claude-3.7-sonnet",
        "claude-3-opus": "anthropic/claude-3-opus",
        "claude-3-haiku": "anthropic/claude-3-haiku",
        "gpt-4o": "openai/gpt-4o",
        "gpt-4o-mini-search-preview": "openai/gpt-4o-mini-search-preview",
        "mistral-large": "mistralai/mistral-large",
        "gemini-1.5-pro": "google/gemini-1.5-pro",
        "o1-mini-2024-09-12": "openai/o1-mini-2024-09-12"
      };
      
      modelId = modelMap[modelId] || modelId;
    }
    
    console.log("Using model ID:", modelId);
    
    const { data, error } = await supabase.functions.invoke("generate-seo-content", {
      body: {
        ...formData,
        apiKey,
        model: modelId
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
    id: "openai/o1-mini-2024-09-12", 
    name: "O1 Mini", 
    description: "Best for high-quality content generation",
    recommended: true
  },
  { 
    id: "openai/gpt-4o-mini-search-preview", 
    name: "GPT-4o mini Search Preview", 
    description: "Best for real-time web search integration",
    recommended: true
  },
  { 
    id: "anthropic/claude-3.7-sonnet", 
    name: "Claude 3.7 Sonnet", 
    description: "High quality for SEO content",
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
    recommended: false
  },
  { 
    id: "openai/gpt-4o", 
    name: "GPT-4o", 
    description: "Excellent for creative content",
    recommended: false
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
