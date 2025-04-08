import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface SeoFormValues {
  topic: string;
  searchTerm?: string;
  manualInput?: string;
  inputMode?: "webSearch" | "manualInput";
  targetKeyword?: string;
  articleType?: "informational" | "listicle" | "how-to" | "anecdote" | "story" | "product-roundup" | "comparison";
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
  language?: string;
}

export async function generateSeoContent(formData: SeoFormValues, apiKey?: string | null, options?: Record<string, any>): Promise<string> {
  try {
    // Validate API key first
    if (!apiKey) {
      console.error("API key is missing");
      throw new Error("Authentication error with the AI provider. Please check your API key in settings.");
    }
    
    let modelId = formData.model || "anthropic/claude-3.7-sonnet";
    
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
    
    // Get language preference from localStorage if not provided
    let contentLanguage = formData.language || localStorage.getItem('contentLanguage') || 'english';
    console.log("Content language:", contentLanguage);
    
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
      finalContentModel,
      hasApiKey: !!apiKey,
      language: contentLanguage
    });

    const customOutline = options?.customOutline;
    
    const useBackgroundGeneration = 
      (window.location.pathname.includes('bulk-blog-generator')) ? false : formData.backgroundGeneration;
    
    console.log("Background generation setting:", 
      useBackgroundGeneration ? "enabled" : "disabled (forced foreground generation)");
    
    try {
      // Add API key validation before sending the request
      if (!apiKey || apiKey.trim() === '') {
        throw new Error("API key is missing or invalid. Please check your API key in settings.");
      }
      
      // Log that we're about to make the request
      console.log("Sending request to Supabase Edge Function: generate-seo-content");
      
      const { data, error } = await supabase.functions.invoke("generate-seo-content", {
        body: {
          ...formData,
          apiKey,
          model: modelId,
          finalContentModel,
          internalLinks: formData.includeInternalLinks ? internalLinks : [],
          customOutline,
          backgroundGeneration: useBackgroundGeneration,
          bulkGeneration: formData.bulkGeneration,
          language: contentLanguage
        },
      });

      if (error) {
        console.error("Error invoking generate-seo-content function:", error);
        const errorMessage = error.message || "Failed to connect to the content generation service";
        console.log("Error details:", error);
        
        if (error.message?.includes("401") || error.message?.includes("auth")) {
          throw new Error(`OpenRouter authentication error (401): Please check that your API key is valid and that you have sufficient credits. You may need to create a new API key in your OpenRouter account.`);
        }
        
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
      
      if (invokeError.message && typeof invokeError.message === 'string') {
        const errorMsg = invokeError.message.toLowerCase();
        
        if (errorMsg.includes("no auth") || errorMsg.includes("401") || 
            errorMsg.includes("authentication") || errorMsg.includes("credentials")) {
          throw new Error(
            `OpenRouter authentication failed (401): Please verify your API key is valid and has sufficient credits. Try creating a new API key in your OpenRouter account settings.`
          );
        }
        
        if (errorMsg.includes("model") && (errorMsg.includes("unavailable") || errorMsg.includes("not found") || errorMsg.includes("not available"))) {
          throw new Error(`The selected model (${modelId.split('/')[1]}) is currently unavailable. Please try a different model or try again later.`);
        }
        
        if (errorMsg.includes("token") || errorMsg.includes("context") || errorMsg.includes("length")) {
          throw new Error(`Your content request is too long for the selected model. Try reducing the word count or using a model with larger context window.`);
        }
        
        if (errorMsg.includes("rate") && errorMsg.includes("limit")) {
          throw new Error(`Rate limit exceeded. Please wait a few minutes before trying again.`);
        }
        
        if (errorMsg.includes("api key") || errorMsg.includes("authentication") || errorMsg.includes("auth")) {
          throw new Error(`Authentication error with the AI provider. Please check your API key in settings.`);
        }

        if (errorMsg.includes("edge") && (errorMsg.includes("function") || errorMsg.includes("failed"))) {
          throw new Error(`Failed to communicate with the Edge Function. Please check your network connection and try again later.`);
        }

        if (errorMsg.includes("network") || errorMsg.includes("timeout") || errorMsg.includes("timed out") || 
            errorMsg.includes("connection") || errorMsg.includes("econnrefused")) {
          throw new Error(`Network error or timeout when connecting to AI provider. Please check your internet connection and try again.`);
        }

        if (modelId.includes("gemini") || modelId.includes("google")) {
          if (errorMsg.includes("api") || errorMsg.includes("error") || errorMsg.includes("invalid")) {
            throw new Error(`Gemini API error: ${invokeError.message}. Try using a different model.`);
          }
        } else if (modelId.includes("anthropic") || modelId.includes("claude")) {
          if (errorMsg.includes("api") || errorMsg.includes("error") || errorMsg.includes("invalid")) {
            throw new Error(`Claude API error: ${invokeError.message}. Try using a different model.`);
          }
        } else if (modelId.includes("openai") || modelId.includes("gpt")) {
          if (errorMsg.includes("api") || errorMsg.includes("error") || errorMsg.includes("invalid")) {
            throw new Error(`OpenAI API error: ${invokeError.message}. Try using a different model.`);
          }
        } else if (modelId.includes("deepseek")) {
          if (errorMsg.includes("api") || errorMsg.includes("error") || errorMsg.includes("invalid")) {
            throw new Error(`DeepSeek API error: ${invokeError.message}. Try using a different model.`);
          }
        } else if (modelId.includes("mistral")) {
          if (errorMsg.includes("api") || errorMsg.includes("error") || errorMsg.includes("invalid")) {
            throw new Error(`Mistral API error: ${invokeError.message}. Try using a different model.`);
          }
        }
        
        if (errorMsg.includes("api")) {
          throw new Error(`The AI service returned an error: ${invokeError.message}. Please try a different model or try again later.`);
        }
      }
      
      throw new Error(`Failed to communicate with content generation service: ${invokeError.message || "Unknown error"}`);
    }
  } catch (error: any) {
    console.error("Error in generateSeoContent:", error);
    throw error;
  }
}

async function generateWithGemini(formData: SeoFormValues): Promise<string> {
  try {
    console.log("Generating content with Gemini API directly");
    
    if (!formData.geminiApiKey) {
      throw new Error("Gemini API key is required");
    }
    
    const prompt = constructGeminiPrompt(formData);
    
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
    }
    
    return generatedContent;
  } catch (error) {
    console.error("Error generating content with Gemini:", error);
    throw error;
  }
}

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
    includeAnecdotes,
    includeHook,
    includeHtmlElement,
    language
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
  
  if (language && language !== "english") {
    prompt += ` Write the entire content in ${language} language.`;
  }
  
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
  
  if (includeAnecdotes) {
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
