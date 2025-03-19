
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

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
  includeInternalLinks: boolean;
  model?: string;
  backgroundGeneration?: boolean;
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
    
    // Get internal links if needed
    let internalLinks: string[] = [];
    if (formData.includeInternalLinks) {
      try {
        const storedUrls = localStorage.getItem('sitemapUrls');
        if (storedUrls) {
          internalLinks = JSON.parse(storedUrls);
          console.log(`Including ${internalLinks.length} internal links in content generation`);
        } else {
          console.warn("includeInternalLinks is true but no URLs found in localStorage");
        }
      } catch (error) {
        console.error("Error getting internal links:", error);
      }
    }
    
    // Log the full request body for debugging
    console.log("Content generation request:", {
      includeInternalLinks: formData.includeInternalLinks,
      internalLinksCount: internalLinks.length,
      topic: formData.topic,
      backgroundGeneration: formData.backgroundGeneration
    });
    
    // Create a placeholder in "My Content" section if this is background generation
    let placeholderId = null;
    
    if (formData.backgroundGeneration) {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Create a placeholder entry
        const { data: placeholder, error: placeholderError } = await supabase
          .from('content')
          .insert([
            { 
              title: `${formData.topic} (Generating...)`, 
              content: `# Content for "${formData.topic}" is being generated\n\nYour content is currently being generated in the background. This placeholder will be automatically updated when the generation is complete. Please check back in a few minutes.`, 
              user_id: user.id,
              created_at: new Date().toISOString(),
              status: 'generating'
            }
          ])
          .select();
          
        if (placeholderError) {
          console.error("Error creating placeholder:", placeholderError);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to create content placeholder: " + placeholderError.message,
          });
        } else if (placeholder && placeholder.length > 0) {
          placeholderId = placeholder[0].id;
          console.log("Created placeholder content with ID:", placeholderId);
        }
      } else {
        console.error("No authenticated user found");
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "You must be logged in to generate content in the background.",
        });
        throw new Error("No authenticated user found");
      }
    }
    
    const { data, error } = await supabase.functions.invoke("generate-seo-content", {
      body: {
        ...formData,
        apiKey,
        model: modelId,
        internalLinks: formData.includeInternalLinks ? internalLinks : [],
        placeholderId: placeholderId
      },
    });

    if (error) {
      console.error("Error invoking generate-seo-content function:", error);
      // If there was a placeholder, update it to show the error
      if (placeholderId) {
        await supabase
          .from('content')
          .update({
            title: `${formData.topic} (Failed)`,
            content: `# Error Generating Content\n\nThere was an error generating content for "${formData.topic}".\n\nError: ${error.message}\n\nPlease try again.`,
            status: 'failed'
          })
          .eq('id', placeholderId);
      }
      throw new Error(`Failed to generate content: ${error.message}`);
    }

    if (!data || !data.success) {
      const errorMessage = data?.error || "Failed to generate content";
      // If there was a placeholder, update it to show the error
      if (placeholderId) {
        await supabase
          .from('content')
          .update({
            title: `${formData.topic} (Failed)`,
            content: `# Error Generating Content\n\nThere was an error generating content for "${formData.topic}".\n\nError: ${errorMessage}\n\nPlease try again.`,
            status: 'failed'
          })
          .eq('id', placeholderId);
      }
      throw new Error(errorMessage);
    }

    // Handle background generation
    if (formData.backgroundGeneration) {
      toast({
        title: "Content Generation Started",
        description: "Your content is being generated in the background. You'll find it in 'My Content' when it's ready.",
      });
      
      return "BACKGROUND_GENERATION_STARTED";
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
          created_at: new Date().toISOString(),
          status: 'completed'
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
