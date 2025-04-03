
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface SeoFormValues {
  topic: string;
  searchTerm?: string;
  manualInput?: string;
  inputMode?: "webSearch" | "manualInput";
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
  includeCitations?: boolean;
  model?: string;
  finalContentModel?: string;
  backgroundGeneration?: boolean;
  enableThinking?: boolean;
  bulkGeneration?: boolean;
  useGeminiDirectly?: boolean;
  geminiApiKey?: string;
}

export async function generateSeoContent(formData: SeoFormValues, apiKey?: string, options?: Record<string, any>): Promise<string> {
  try {
    let modelId = formData.model || "anthropic/claude-3.7-sonnet";
    
    // Check if we should use Gemini directly
    if (formData.useGeminiDirectly && formData.geminiApiKey) {
      console.log("Using Gemini API directly");
      return await generateWithGemini(formData);
    }
    
    if (formData.searchTerm) {
      console.log(`Using search workflow with ${modelId} for search and Claude 3.7 Sonnet for final content`);
    }
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
    
    const finalContentModel = formData.searchTerm ? "anthropic/claude-3.7-sonnet" : undefined;
    
    console.log("Content generation request:", {
      includeInternalLinks: formData.includeInternalLinks,
      includeCitations: formData.includeCitations,
      internalLinksCount: internalLinks?.length || 0,
      topic: formData.topic,
      inputMode: formData.inputMode,
      manualInputLength: formData.manualInput ? formData.manualInput.split(/\s+/).length : 0,
      additionalContextLength: formData.additionalContext ? formData.additionalContext.split(/\s+/).length : 0,
      backgroundGeneration: formData.backgroundGeneration,
      enableThinking: formData.enableThinking,
      bulkGeneration: formData.bulkGeneration,
      searchModel: modelId,
      finalContentModel
    });

    const customOutline = options?.customOutline;
    
    const useBackgroundGeneration = 
      (window.location.pathname.includes('bulk-blog-generator')) ? false : formData.backgroundGeneration;
    
    console.log("Background generation setting:", 
      useBackgroundGeneration ? "enabled" : "disabled (forced foreground generation)");
    
    try {
      const { data, error } = await supabase.functions.invoke("generate-seo-content", {
        body: {
          ...formData,
          apiKey,
          model: modelId,
          finalContentModel,
          internalLinks: formData.includeInternalLinks ? internalLinks : [],
          customOutline,
          backgroundGeneration: useBackgroundGeneration,
          bulkGeneration: formData.bulkGeneration
        },
      });

      if (error) {
        console.error("Error invoking generate-seo-content function:", error);
        const errorMessage = error.message || "Failed to connect to the content generation service";
        console.log("Error details:", error);
        throw new Error(`Failed to generate content: ${errorMessage}`);
      }

      if (!data) {
        console.error("No data returned from content generation service");
        throw new Error("No data returned from content generation service");
      }
      
      if (!data.success) {
        const errorMessage = data.error || "Failed to generate content";
        console.error("Content generation returned error:", errorMessage, data);
        throw new Error(errorMessage);
      }

      if (data.backgroundGeneration) {
        toast({
          title: "Content Generation Started",
          description: "Your content is being generated in the background. You'll find it in 'My Content' when it's ready.",
        });
        
        return "BACKGROUND_GENERATION_STARTED";
      }

      if (data.content && !formData.bulkGeneration) {
        try {
          const titleMatch = data.content.match(/^#\s*(.*?)(\n|$)/);
          const title = titleMatch ? titleMatch[1].trim() : formData.topic;
          
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
            await saveGeneratedContent(title, data.content, user.id);
            toast({
              title: "Content Saved",
              description: "Your generated content has been automatically saved to 'My Content'.",
            });
          } else {
            console.warn("Content not auto-saved: No authenticated user found");
            throw new Error("Could not save content: User not authenticated");
          }
        } catch (saveError) {
          console.error("Error auto-saving content:", saveError);
          toast({
            title: "Auto-Save Failed",
            description: "We couldn't automatically save your content. You might need to save it manually.",
            variant: "destructive",
          });
          
          throw new Error(`Auto-save failed: ${saveError instanceof Error ? saveError.message : 'Unknown error'}`);
        }
      }

      return data.content;
    } catch (invokeError: any) {
      console.error("Error in supabase.functions.invoke:", invokeError);
      
      // Check for OpenRouter credit limit error
      if (invokeError.message && typeof invokeError.message === 'string') {
        if (invokeError.message.includes("requires more credits") || invokeError.message.includes("402")) {
          throw new Error(`Insufficient OpenRouter credits for this request. Please visit https://openrouter.ai/settings/credits to add more credits or try a different model.`);
        }
        if (invokeError.message.includes("API")) {
          if (modelId.includes("gemini") || modelId.includes("deepseek")) {
            throw new Error(`The selected model (${modelId.split('/')[1]}) may be temporarily unavailable. Please try a different model or try again later.`);
          } else {
            throw new Error(`Failed to communicate with content generation service: ${invokeError.message}`);
          }
        }
      }
      
      throw new Error(`Failed to communicate with content generation service: ${invokeError.message}`);
    }
  } catch (error: any) {
    console.error("Error in generateSeoContent:", error);
    throw error;
  }
}

// New function to generate content using the Gemini API directly
async function generateWithGemini(formData: SeoFormValues): Promise<string> {
  try {
    console.log("Generating content with Gemini API directly");
    
    if (!formData.geminiApiKey) {
      throw new Error("Gemini API key is required");
    }
    
    // Construct the prompt for Gemini
    const prompt = constructGeminiPrompt(formData);
    
    // Call the Gemini API
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": formData.geminiApiKey
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API error:", errorData);
      throw new Error(`Gemini API error: ${errorData.error?.message || "Unknown error"}`);
    }
    
    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error("No content generated by Gemini");
    }
    
    const generatedContent = data.candidates[0].content.parts[0].text;
    
    if (!generatedContent) {
      throw new Error("Empty content returned by Gemini");
    }
    
    // Save the content to the database if user is logged in
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const titleMatch = generatedContent.match(/^#\s*(.*?)(\n|$)/);
        const title = titleMatch ? titleMatch[1].trim() : formData.topic;
        
        await saveGeneratedContent(title, generatedContent, user.id);
        toast({
          title: "Content Saved",
          description: "Your generated content has been automatically saved to 'My Content'.",
        });
      }
    } catch (saveError) {
      console.error("Error saving Gemini-generated content:", saveError);
      // Don't throw here - we still want to return the content even if saving fails
    }
    
    return generatedContent;
  } catch (error) {
    console.error("Error generating content with Gemini:", error);
    throw error;
  }
}

// Helper function to construct the prompt for Gemini
function constructGeminiPrompt(formData: SeoFormValues): string {
  const {
    topic,
    targetKeyword,
    articleType = "informational",
    toneOfArticle = "professional",
    intendedAudience,
    additionalContext,
    wordCount,
    includeFirstPerson,
    includeAnecdotes, // Changed from includeStoriesExamples to includeAnecdotes
    includeHook,
    includeHtmlElement
  } = formData;
  
  let internalLinks: string[] = [];
  if (formData.includeInternalLinks) {
    try {
      const storedUrls = localStorage.getItem('sitemapUrls');
      if (storedUrls) {
        internalLinks = JSON.parse(storedUrls);
      }
    } catch (error) {
      console.error("Error getting internal links:", error);
    }
  }
  
  let prompt = `Generate a comprehensive, SEO-optimized blog post about: "${topic}"`;
  
  if (targetKeyword) {
    prompt += `\nTarget keyword: "${targetKeyword}"`;
  }
  
  prompt += `\n\nArticle type: ${articleType}`;
  prompt += `\nTone: ${toneOfArticle}`;
  prompt += `\nWord count: at least ${wordCount} words`;
  
  if (intendedAudience) {
    prompt += `\nIntended audience: ${intendedAudience}`;
  }
  
  if (additionalContext) {
    prompt += `\n\nAdditional context: ${additionalContext}`;
  }
  
  prompt += `\n\nRequirements:`;
  prompt += `\n- Write at least ${wordCount} words or more`;
  prompt += `\n- Include a catchy headline`;
  prompt += `\n- Structure the content with clear headings (use # for main heading, ## for subheadings)`;
  prompt += `\n- Write in ${includeFirstPerson ? "first person" : "third person"}`;
  
  if (includeHook) {
    prompt += `\n- Start with an engaging hook`;
  }
  
  if (includeAnecdotes) { // Changed from includeStoriesExamples to includeAnecdotes
    prompt += `\n- Include relevant stories, examples, or case studies`;
  }
  
  if (includeHtmlElement) {
    prompt += `\n- Include one interactive HTML element (like a quiz, calculator, or table) that would be helpful for the reader`;
  }
  
  if (internalLinks.length > 0) {
    prompt += `\n- Include 2-3 of the following internal links where relevant:`;
    internalLinks.slice(0, 5).forEach(link => {
      prompt += `\n  * ${link}`;
    });
  }
  
  prompt += `\n\nFormat your output as Markdown. Start with a main heading (#) followed by an introduction. Use subheadings (##) to organize the content.`;
  
  return prompt;
}

export async function saveGeneratedContent(title: string, content: string, userId: string) {
  try {
    console.log(`Saving content "${title}" to database for user ${userId}`);
    
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

    console.log("Content saved successfully:", data);
    return data;
  } catch (error) {
    console.error("Error in saveGeneratedContent:", error);
    throw error;
  }
}

export const recommendedModels = [
  { 
    id: "google/gemini-2.5-pro-exp-03-25:free", 
    name: "Gemini Pro 2.5 Experimental", 
    description: "Google's state-of-the-art AI model (free)",
    recommended: true
  },
  { 
    id: "deepseek/deepseek-chat-v3-0324:free", 
    name: "DeepSeek V3 0324", 
    description: "685B-parameter model for advanced content creation (free)",
    recommended: true
  },
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
    id: "perplexity/sonar-reasoning-pro", 
    name: "Perplexity Sonar Reasoning Pro", 
    description: "Advanced reasoning with comprehensive citations",
    recommended: true
  },
  { 
    id: "perplexity/sonar-pro", 
    name: "Perplexity Sonar Pro", 
    description: "Handles complex queries with extensive citations",
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
    recommended: false
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

export const freeModels = [
  { 
    id: "google/gemini-2.5-pro-exp-03-25:free", 
    name: "Gemini Pro 2.5 Experimental", 
    description: "Google's state-of-the-art AI model (free)",
    recommended: true
  },
  { 
    id: "google/gemini-2.0-flash:free", 
    name: "Gemini 2.0 Flash", 
    description: "Fastest Gemini model for quick content (free)",
    recommended: true
  },
  { 
    id: "google/gemini-2.0-pro:free", 
    name: "Gemini 2.0 Pro", 
    description: "More capable content generation model (free)",
    recommended: true
  }
];

export const thinkingModels = [
  { 
    id: "anthropic/claude-3.7-sonnet:thinking", 
    name: "Claude 3.7 Sonnet (Thinking)", 
    description: "High quality with visible reasoning process",
    recommended: true
  },
  { 
    id: "google/gemini-2.0-flash-thinking-exp:free", 
    name: "Gemini 2.0 Flash (Thinking)", 
    description: "Fast thinking model with visible reasoning",
    recommended: true
  }
];
