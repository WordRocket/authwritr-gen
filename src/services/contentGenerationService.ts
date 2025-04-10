
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Define interfaces and types needed by the components
export interface SeoFormValues {
  topic: string;
  wordCount: number;
  includeFirstPerson: boolean;
  includeAnecdotes: boolean;
  includeHook: boolean;
  includeStories: boolean;
  includeHtmlElement: boolean;
  searchTerm?: string;
  manualInput?: string;
  inputMode: "webSearch" | "manualInput";
  targetKeyword?: string;
  articleType: "informational" | "listicle" | "how-to" | "product-roundup" | "comparison" | "anecdote" | "story";
  toneOfArticle: "professional" | "conversational" | "friendly" | "authoritative" | "casual";
  intendedAudience?: string;
  additionalContext?: string;
  includeInternalLinks?: boolean;
  includeCitations?: boolean;
  model: string;
  finalContentModel?: string;
  language?: string;
  backgroundGeneration?: boolean;
  bulkGeneration?: boolean;
  enableThinking?: boolean;
}

// Define recommended models for the UI to use
export const recommendedModels = [
  {
    id: "anthropic/claude-3.7-sonnet",
    name: "Claude 3.7 Sonnet",
    description: "Most advanced model with exceptional reasoning",
    recommended: true
  },
  {
    id: "anthropic/claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet",
    description: "Fast and high quality model with great reasoning",
    recommended: true
  },
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    description: "Advanced model with strong capabilities",
    recommended: true
  }
];

// Add free models
export const freeModels = [
  {
    id: "meta-llama/llama-3-8b-instruct:free",
    name: "Llama 3 8B (Free)",
    description: "Free 8B parameter model for general content generation",
    recommended: true,
    free: true
  },
  {
    id: "mistralai/mistral-small:free",
    name: "Mistral Small (Free)",
    description: "Free model with good performance for basic content",
    recommended: true,
    free: true
  }
];

// Add thinking models
export const thinkingModels = [
  {
    id: "anthropic/claude-3.7-sonnet",
    name: "Claude 3.7 Sonnet",
    description: "Excellent at step-by-step reasoning and explanation",
    recommended: true
  },
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    description: "Strong reasoning capabilities with detailed thinking",
    recommended: true
  }
];

export const generateContent = async (
  apiKey: string,
  modelName: string,
  prompt: string,
  trackedFields: string[],
  usePremium: {
    trackContentUsage: () => Promise<boolean>,
    isPremium: boolean
  },
  token?: AbortSignal
): Promise<string> => {
  try {
    // First, check if the user can generate content based on their usage
    console.log("Checking if user can generate content...");
    const canGenerate = await usePremium.trackContentUsage();
    
    if (!canGenerate) {
      console.error("Daily content generation limit reached");
      toast.error("Daily limit reached. Upgrade to premium for unlimited content.");
      throw new Error("Daily limit reached");
    }
    
    console.log("User can generate content, proceeding...");
    
    // Prepare headers for OpenRouter API
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": window.location.href,
      "X-Title": "WordRocket"
    };

    // Prepare request body
    const body = JSON.stringify({
      model: modelName,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 3500
    });

    // Make API call to OpenRouter
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers,
      body,
      signal: token
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to generate content");
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.log("Content generation was aborted");
      return "Generation cancelled by user.";
    }
    
    console.error("Error generating content:", error);
    
    if (error.message === "Daily limit reached") {
      throw error;
    }
    
    throw new Error(`Failed to generate content: ${error.message}`);
  }
};

// Add function to generate SEO content
export const generateSeoContent = async (
  formValues: SeoFormValues,
  apiKey: string,
  options?: { 
    customOutline?: string
  },
  token?: AbortSignal
): Promise<string> => {
  try {
    console.log("Generating SEO content with model:", formValues.model);
    
    // Construct the prompt based on the form values
    const prompt = constructSeoPrompt(formValues, options?.customOutline);
    
    // Use the usePremium context via a dummy object since we're just passing it through
    const usePremiumDummy = {
      trackContentUsage: async () => true,
      isPremium: true
    };
    
    // Track fields that will contribute to usage metrics
    const trackedFields = ["wordCount"];
    
    // Call the generateContent function
    return await generateContent(
      apiKey,
      formValues.model,
      prompt,
      trackedFields,
      usePremiumDummy,
      token
    );
  } catch (error: any) {
    console.error("Error generating SEO content:", error);
    throw error;
  }
};

// Function to save generated content to the database
export const saveGeneratedContent = async (
  userId: string,
  title: string,
  content: string
): Promise<string> => {
  try {
    console.log("Saving content to database...");
    
    if (!userId) {
      console.error("No user ID provided for saving content");
      toast.error("Authentication error. Please log in again.");
      throw new Error("No user ID provided");
    }

    if (!title || !content) {
      console.error("Missing title or content");
      toast.error("Cannot save: Missing title or content");
      throw new Error("Missing title or content");
    }
    
    // Ensure title is not used as a UUID
    const titleForSaving = title.trim().substring(0, 200); // Limit title length
    
    console.log(`Saving content with title: ${titleForSaving}`);
    
    // Save the content to the database
    const { data, error } = await supabase
      .from("content")
      .insert({
        user_id: userId,
        title: titleForSaving,
        content: content
      })
      .select();

    if (error) {
      console.error("Supabase error:", error);
      
      // More specific error messages based on Supabase error codes
      if (error.code === '23505') {
        toast.error("Content with this title already exists");
        throw new Error("Content with this title already exists");
      } else if (error.code === '42501') {
        toast.error("Permission denied. Please check your account permissions");
        throw new Error("Permission denied. Please check your account permissions");
      } else {
        toast.error(`Failed to save: ${error.message}`);
        throw new Error(`Database error: ${error.message}`);
      }
    }

    if (!data || data.length === 0) {
      toast.error("No data returned from database");
      throw new Error("No data returned from database");
    }
    
    console.log("Content saved successfully with ID:", data[0].id);
    toast.success("Content saved successfully!");
    return data[0].id;
  } catch (error: any) {
    console.error("Error in saveGeneratedContent:", error);
    toast.error(`Failed to save: ${error.message || "Unknown error"}`);
    throw error; // Propagate the error to be handled by the caller
  }
};

// Helper function to construct an SEO prompt based on form values
function constructSeoPrompt(formValues: SeoFormValues, customOutline?: string): string {
  // This is a simplified version - in production this would be more complex
  let prompt = `Generate a ${formValues.articleType} article about "${formValues.topic}" with approximately ${formValues.wordCount} words.`;
  
  if (formValues.targetKeyword) {
    prompt += `\nTarget keyword: ${formValues.targetKeyword}`;
  }
  
  prompt += `\nTone: ${formValues.toneOfArticle}`;
  
  if (formValues.intendedAudience) {
    prompt += `\nIntended audience: ${formValues.intendedAudience}`;
  }
  
  if (formValues.additionalContext) {
    prompt += `\nAdditional context: ${formValues.additionalContext}`;
  }
  
  if (customOutline) {
    prompt += `\nCustom outline to follow:\n${customOutline}`;
  }
  
  // Include style preferences
  prompt += `\nStyle preferences:`;
  if (formValues.includeFirstPerson) prompt += `\n- Use first-person perspective`;
  if (formValues.includeAnecdotes) prompt += `\n- Include relevant anecdotes`;
  if (formValues.includeHook) prompt += `\n- Start with an engaging hook`;
  if (formValues.includeStories) prompt += `\n- Include relevant stories`;
  if (formValues.includeHtmlElement) prompt += `\n- Format using HTML elements for better readability`;
  
  if (formValues.includeInternalLinks) {
    prompt += `\n- Include internal links to relevant content`;
  }
  
  if (formValues.includeCitations) {
    prompt += `\n- Include proper citations for any facts or statistics`;
  }
  
  // Include language preference
  if (formValues.language && formValues.language !== "english") {
    prompt += `\n\nPlease write this article in ${formValues.language}.`;
  }
  
  return prompt;
}

export const saveContentToDatabase = async (
  userId: string,
  title: string,
  content: string
): Promise<string> => {
  try {
    console.log(`Saving content for user ${userId} with title: ${title.substring(0, 30)}...`);
    
    // Additional validation
    if (!userId.trim()) {
      throw new Error("Invalid user ID");
    }
    
    if (!title.trim()) {
      throw new Error("Title cannot be empty");
    }
    
    if (!content.trim()) {
      throw new Error("Content cannot be empty");
    }
    
    // Fix: Ensure we're not using the title as a UUID
    const { data, error } = await supabase
      .from("content")
      .insert({
        user_id: userId,
        title: title.trim(),
        content: content
      })
      .select();

    if (error) {
      console.error("Supabase error:", error);
      
      // More specific error messages based on Supabase error codes
      if (error.code === '23505') {
        throw new Error("Content with this title already exists");
      } else if (error.code === '42501') {
        throw new Error("Permission denied. Please check your account permissions");
      } else {
        throw new Error(`Database error: ${error.message}`);
      }
    }

    if (!data || data.length === 0) {
      throw new Error("No data returned from database");
    }
    
    console.log("Content saved successfully with ID:", data[0].id);
    return data[0].id;
  } catch (error: any) {
    console.error("Error in saveContentToDatabase:", error);
    throw error; // Propagate the error to be handled by the caller
  }
};
