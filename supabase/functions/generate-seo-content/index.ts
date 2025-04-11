
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContentRequest {
  topic: string;
  searchTerm?: string;
  manualInput?: string;
  inputMode?: string;
  targetKeyword?: string;
  articleType?: string;
  toneOfArticle?: string;
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
  internalLinks?: string[];
  model?: string;
  finalContentModel?: string;
  apiKey: string;
  customOutline?: string;
  backgroundGeneration?: boolean;
  enableThinking?: boolean;
  language?: string;
  temperature?: number;
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    console.log("Starting generate-seo-content edge function");
    const startTime = Date.now();

    // Parse request body
    const requestData: ContentRequest = await req.json();
    
    // Validate API key
    if (!requestData.apiKey) {
      console.error("API key missing in request");
      throw new Error("API key is required for authentication");
    }

    // Log request details (without exposing the API key)
    const { apiKey, ...logSafeRequest } = requestData;
    console.log("Request parameters:", JSON.stringify({
      ...logSafeRequest,
      apiKeyProvided: !!apiKey,
      apiKeyLength: apiKey?.length || 0,
      requestTime: new Date().toISOString(),
      edgeRuntime: Deno.env.get("EDGE_RUNTIME") || "unknown",
    }));
    
    // Default values
    const model = requestData.model || "anthropic/claude-3.7-sonnet";
    console.log(`Using model: ${model}`);

    // Determine if we need search-augmented generation or direct content generation
    const useSearch = requestData.inputMode === "webSearch" && requestData.searchTerm;
    
    // Generate the prompt
    const prompt = constructPrompt(requestData);
    console.log("Prompt constructed, length:", prompt.length);
    
    let finalContent = "";
    
    // If using search, we need to do a two-step process
    if (useSearch) {
      console.log("Using search-augmented generation");
      // Step 1: Use search to gather information
      const searchResponse = await fetchFromOpenRouter({
        model: "perplexity/sonar-reasoning-pro",
        prompt: `You are a helpful assistant that searches the web to find accurate information.
                
Search query: ${requestData.searchTerm}

Please search for up-to-date information about this topic and provide a thorough research summary that covers:
1. Key details about the topic
2. Important facts and data
3. Different perspectives or opinions
4. Any recent developments

Return ONLY the factual information you found, formatted as markdown. Do not add any personal comments or text that implies you're providing this information. Just the raw research data.`,
        apiKey: requestData.apiKey,
        temperature: 0.2,
      });
      
      console.log("Search completed successfully, response length:", searchResponse.length);
      
      // Step 2: Generate content based on search results
      const searchAugmentedPrompt = `
${prompt}

RESEARCH DATA TO USE:
${searchResponse}

Based on this research data, generate the article as requested, following all the instructions above.`;
      
      finalContent = await fetchFromOpenRouter({
        model: requestData.finalContentModel || "anthropic/claude-3.7-sonnet",
        prompt: searchAugmentedPrompt,
        apiKey: requestData.apiKey,
        temperature: requestData.temperature || 0.7,
      });
      
    } else {
      // Direct content generation
      console.log("Using direct content generation with model:", model);
      finalContent = await fetchFromOpenRouter({
        model,
        prompt,
        apiKey: requestData.apiKey,
        temperature: requestData.temperature || 0.7,
      });
    }
    
    const endTime = Date.now();
    console.log(`Content generation completed in ${(endTime - startTime)/1000} seconds. Content length: ${finalContent.length} characters`);
    
    // Return the generated content
    return new Response(JSON.stringify({
      content: finalContent,
      success: true,
      processTime: endTime - startTime
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
    
  } catch (error) {
    // Enhanced error handling
    console.error("Error in generate-seo-content edge function:", error);
    
    // Attempt to extract detailed error information
    let errorMessage = error.message || "Unknown error occurred";
    let statusCode = 500;
    let errorDetails = null;
    
    // Try to extract OpenRouter specific error information
    if (error.response) {
      try {
        const errorData = error.response;
        console.error("OpenRouter API error response:", JSON.stringify(errorData));
        
        if (errorData.status === 401) {
          errorMessage = "Authentication failed with AI provider. Please check your API key.";
          statusCode = 401;
        } else if (errorData.status === 429) {
          errorMessage = "Rate limit exceeded on AI provider. Please try again later.";
          statusCode = 429;
        } else if (errorData.body) {
          errorDetails = errorData.body;
          if (errorData.body.error) {
            errorMessage = `AI Provider error: ${errorData.body.error.message || errorData.body.error}`;
          }
        }
      } catch (parseError) {
        console.error("Failed to parse error response:", parseError);
      }
    }
    
    // Log detailed error information
    console.error("Error details:", {
      message: errorMessage,
      originalError: error.toString(),
      stack: error.stack,
      errorDetails: errorDetails,
    });
    
    // Return error response with detailed information
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
      errorCode: statusCode,
      debug: {
        message: error.toString(),
        time: new Date().toISOString(),
        details: errorDetails
      }
    }), {
      status: statusCode,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
});

// Function to construct the prompt based on the request data
function constructPrompt(requestData: ContentRequest): string {
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
    includeStories,
    includeHtmlElement,
    includeInternalLinks,
    internalLinks = [],
    customOutline,
    language = "english",
    inputMode,
    manualInput,
  } = requestData;
  
  // Base prompt with detailed instructions
  let prompt = `You are a professional content writer creating a high-quality SEO-optimized article.

TOPIC: ${topic}
`;

  // Add input from manual product details if provided
  if (inputMode === "manualInput" && manualInput) {
    prompt += `\nPRODUCT DETAILS:\n${manualInput}\n`;
  }
  
  // Add language instruction
  if (language && language !== "english") {
    prompt += `\nIMPORTANT: Write the entire article in ${language} language.\n`;
  }

  // Add target keyword if provided
  if (targetKeyword) {
    prompt += `\nTARGET KEYWORD: ${targetKeyword}
Include this keyword naturally throughout the article, especially in H1, meta description, and first paragraph.
`;
  }

  prompt += `\nARTICLE TYPE: ${articleType}
TONE: ${toneOfArticle}
WORD COUNT: Approximately ${wordCount} words
`;

  // Add audience information if provided
  if (intendedAudience) {
    prompt += `\nINTENDED AUDIENCE: ${intendedAudience}\n`;
  }

  // Add additional context if provided
  if (additionalContext) {
    prompt += `\nADDITIONAL CONTEXT:\n${additionalContext}\n`;
  }

  // Add custom outline if provided
  if (customOutline) {
    prompt += `\nFOLLOW THIS OUTLINE:\n${customOutline}\n`;
  }

  // Add internal links if required
  if (includeInternalLinks && internalLinks.length > 0) {
    prompt += `\nINTERNAL LINKS:
Include 3-5 of these internal links naturally within the article where relevant:
${internalLinks.slice(0, 10).join("\n")}
`;
  }

  // Add specific writing instructions
  prompt += `\nWRITING INSTRUCTIONS:
1. Create a compelling, SEO-optimized title (H1)
2. Write in ${includeFirstPerson ? "first person" : "third person"} perspective
${includeHook ? "3. Start with an engaging hook to capture reader attention\n" : ""}
${includeAnecdotes ? "4. Include relevant anecdotes or examples to illustrate points\n" : ""}
${includeStories ? "5. Incorporate storytelling elements to engage readers\n" : ""}
${includeHtmlElement ? "6. Include one interactive HTML element (comparison table, product cards, etc.)\n" : ""}
7. Structure the content with clear headings (H2, H3) and short paragraphs
8. Format using proper markdown: # for H1, ## for H2, ### for H3, etc.
9. Incorporate the target keyword naturally throughout the content
`;

  // Add product roundup specific instructions if applicable
  if (articleType === "product-roundup" || articleType === "comparison") {
    prompt += `\nPRODUCT ROUNDUP SPECIFIC INSTRUCTIONS:
1. Include a comprehensive comparison table with key features
2. For each product, include: key features, pros, cons, pricing info, use cases
3. Add a "verdict" or "recommendation" section at the end
4. Make clear recommendations for different user needs (best budget option, best premium option, etc.)
5. Ensure HTML table is properly formatted with <table>, <tr>, <th>, <td> tags
`;
  }
  
  // Final formatting instruction
  prompt += `\nOUTPUT FORMAT:
Return the article as properly formatted HTML, with all headings, paragraphs, lists, and tables properly marked up.
Use <h1> for main title, <h2> for main sections, <h3> for subsections, etc.
Include a meta description tag suitable for SEO.
`;

  return prompt;
}

// Function to make a request to OpenRouter API
async function fetchFromOpenRouter({
  model,
  prompt,
  apiKey,
  temperature = 0.7,
}: {
  model: string;
  prompt: string;
  apiKey: string;
  temperature?: number;
}): Promise<string> {
  console.log(`Making request to OpenRouter with model: ${model}, temperature: ${temperature}`);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minute timeout
  
  try {
    // Setup headers with API key
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": "https://content-genius.lovable.dev", // Replace with your actual domain
    };
    
    // Prepare request body based on model
    const requestBody: any = {
      model: model,
      temperature: temperature,
    };
    
    // Add messages or prompt depending on the model
    if (model.includes('claude') || model.includes('gpt') || model.includes('gemini') || model.includes('mistral')) {
      requestBody.messages = [
        { role: "user", content: prompt }
      ];
      
      // Add system message for Claude and GPT models
      if (model.includes('claude') || model.includes('gpt')) {
        requestBody.messages.unshift({
          role: "system", 
          content: "You are an expert content writer specializing in SEO-optimized articles. You write detailed, engaging content that follows all provided instructions precisely."
        });
      }
    } else {
      // Fallback for other models
      requestBody.prompt = prompt;
    }

    // Set max tokens based on word count in prompt
    const wordCount = prompt.split(/\s+/).length;
    requestBody.max_tokens = Math.max(4000, Math.min(16000, wordCount * 3));
    
    console.log("Sending request to OpenRouter API", { 
      url: "https://openrouter.ai/api/v1/chat/completions",
      model: model,
      temperature: temperature,
      max_tokens: requestBody.max_tokens,
      timestamp: new Date().toISOString()
    });
    
    // Make the request with timeout
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: headers,
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });
    
    // Clear timeout since request completed
    clearTimeout(timeoutId);
    
    // Check for errors
    if (!response.ok) {
      const responseText = await response.text();
      console.error("OpenRouter API error:", responseText);
      let errorDetail = "Unknown error";
      
      try {
        const errorJson = JSON.parse(responseText);
        errorDetail = errorJson.error?.message || errorJson.error || responseText;
      } catch (e) {
        errorDetail = responseText || `HTTP error ${response.status}`;
      }
      
      throw new Error(`OpenRouter API error (${response.status}): ${errorDetail}`);
    }
    
    // Parse response
    const data = await response.json();
    console.log("OpenRouter API response received");
    
    // Extract content from response
    if (data.choices && data.choices.length > 0) {
      const content = data.choices[0].message?.content || data.choices[0].text || "";
      console.log(`Successfully received content from OpenRouter, length: ${content.length}`);
      return content;
    } else {
      console.error("Unexpected response format from OpenRouter:", data);
      throw new Error("Unexpected response format from OpenRouter");
    }
    
  } catch (error) {
    // Check if this was a timeout
    if (error.name === "AbortError") {
      console.error("Request to OpenRouter timed out after 3 minutes");
      throw new Error("The request to the AI provider timed out. Please try again with a simpler request or a different model.");
    }
    
    clearTimeout(timeoutId);
    console.error("Error in fetchFromOpenRouter:", error);
    throw error;
  }
}
