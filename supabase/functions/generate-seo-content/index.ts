
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      topic, 
      targetKeyword, 
      articleType, 
      toneOfArticle, 
      intendedAudience, 
      additionalContext, 
      wordCount, 
      includeFirstPerson, 
      includeAnecdotes, 
      includeHook, 
      includeStories, 
      includeHtmlElement,
      apiKey,
      model
    } = await req.json();

    // Validate API key
    if (!apiKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "API key is required" 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if apiKey contains HTML content (which would be invalid)
    if (apiKey.includes('<') || apiKey.includes('>')) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid API key format" 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const keyword = targetKeyword || topic;

    // OpenRouter model ID - according to OpenRouter docs
    // For example: "openai/gpt-4o" instead of "anthropic/claude-3-5-sonnet"
    let openRouterModelId;
    
    // Map the simplified model IDs to correct OpenRouter model IDs
    // Based on OpenRouter documentation format
    const modelIdMap = {
      "claude-3-5-sonnet": "anthropic/claude-3-5-sonnet-20240307",
      "claude-3-opus": "anthropic/claude-3-opus-20240229",
      "claude-3-haiku": "anthropic/claude-3-haiku-20240307",
      "gpt-4o": "openai/gpt-4o",
      "mistral-large": "mistralai/mistral-large-latest",
      "gemini-1.5-pro": "google/gemini-1.5-pro-latest"
    };
    
    // Check if we have a model provided
    if (model) {
      // Check if it's a simplified model ID that needs mapping
      if (modelIdMap[model]) {
        openRouterModelId = modelIdMap[model];
      } else {
        // If it already has a provider prefix, use it as is
        openRouterModelId = model;
      }
    } else {
      // Default model if none provided
      openRouterModelId = "anthropic/claude-3-5-sonnet-20240307";
    }
    
    console.log("Original model requested:", model);
    console.log("Using OpenRouter model ID:", openRouterModelId);

    // Build the prompt for the OpenRouter API
    let systemPrompt = `You are an expert SEO content writer. Write an SEO-optimized in-depth blog post about ${topic}.`;
    systemPrompt += ` Include lists, tables, charts, pull quotes, and emojis when it makes sense in the article.`;
    systemPrompt += ` Aim for approximately ${wordCount} words.`;
    
    if (includeHtmlElement) {
      systemPrompt += ` Also create a simple HTML element that represents the information in this article.`;
      systemPrompt += ` Write the code in a way that can be embedded on WordPress and most sites.`;
      systemPrompt += ` Make the code clean and ensure it would not affect the layout of the page or the website.`;
    }
    
    systemPrompt += ` When writing, follow the best SEO practices and include the target keyword "${keyword}" and variations of the keyword in the title, h1, h2, h3, etc. and the body of the article.`;
    systemPrompt += ` Always end the article with an SEO title and meta description.`;

    let userPrompt = `Write a comprehensive, ${toneOfArticle || 'professional'} ${articleType || 'informational'} blog post about ${topic}`;
    
    if (targetKeyword) {
      userPrompt += ` optimized for the keyword "${targetKeyword}"`;
    }
    
    if (intendedAudience) {
      userPrompt += ` for an audience of ${intendedAudience}`;
    }
    
    if (additionalContext) {
      userPrompt += `. Additional context: ${additionalContext}`;
    }
    
    userPrompt += `. Make it approximately ${wordCount} words.`;
    
    // Add style preferences
    const stylePreferences = [];
    if (includeFirstPerson) stylePreferences.push("first-person perspective");
    if (includeAnecdotes) stylePreferences.push("include anecdotes");
    if (includeHook) stylePreferences.push("start with an engaging hook");
    if (includeStories) stylePreferences.push("incorporate relevant stories");
    
    if (stylePreferences.length > 0) {
      userPrompt += ` Please write in ${stylePreferences.join(", ")} style.`;
    }
    
    if (includeHtmlElement) {
      userPrompt += ` Also create an interactive HTML element that represents the main information from this article. The code should be clean, responsive, and ready to be embedded in WordPress or other websites without affecting the page layout.`;
    }

    // Call the OpenRouter API
    console.log("Calling OpenRouter API with model:", openRouterModelId);
    
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://contentgenius.app', // Replace with your actual domain
          'X-Title': 'ContentGenius SEO Generator'
        },
        body: JSON.stringify({
          model: openRouterModelId,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: Math.min(4000, wordCount * 2), // Estimate tokens needed based on word count
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("OpenRouter API error response:", errorData);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: errorData.error?.message || `Failed to generate content: ${response.status} ${response.statusText}` 
          }),
          { 
            status: response.status, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const data = await response.json();
      const generatedContent = data.choices[0].message.content;
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          content: generatedContent 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } catch (fetchError) {
      console.error("Fetch error:", fetchError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Error calling OpenRouter API: ${fetchError.message}` 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
  } catch (error) {
    console.error("Error in generate-seo-content function:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
