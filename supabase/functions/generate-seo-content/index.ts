
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
      searchTerm,
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
    
    // Default to search model if searchTerm is provided, otherwise use the specified model
    const requestedModel = searchTerm ? "openai/gpt-4o-mini-search-preview" : (model || "anthropic/claude-3.7-sonnet");
    
    console.log("Using model:", requestedModel);
    console.log("Search term (if applicable):", searchTerm);

    // Build the prompt for the OpenRouter API
    // System prompt
    let systemPrompt = searchTerm 
      ? `You are an expert SEO content writer with access to real-time web search. Search for "${searchTerm}" to gather current, accurate information related to "${topic}".`
      : `You are an expert SEO content writer. Write an SEO-optimized in-depth blog post about ${topic}.`;
    
    systemPrompt += ` Include lists, tables, charts, pull quotes, and emojis when it makes sense in the article.`;
    systemPrompt += ` Aim for approximately ${wordCount} words.`;
    
    if (includeHtmlElement) {
      systemPrompt += ` Also create a simple HTML element that represents the information in this article, when creating the html element create it in a way that is simple clean html code and can be embedded on wordpress sites easily and does not mess up the page formatting.`;
      systemPrompt += ` Write the code in a way that can be embedded on WordPress and most sites.`;
      systemPrompt += ` Make the code clean and ensure it would not affect the layout of the page or the website.`;
    }
    
    systemPrompt += ` When writing, follow the best SEO practices and include the target keyword "${keyword}" and variations of the keyword in the title, h1, h2, h3, etc. and the body of the article.`;
    systemPrompt += ` Always end the article with an SEO title and meta description.`;

    // User prompt
    let userPrompt = searchTerm
      ? `I want you to do a web search on "${searchTerm}" and extract current, up-to-date information that would be relevant to the topic "${topic}". Then, write a comprehensive, ${toneOfArticle || 'professional'} ${articleType || 'informational'} blog post about ${topic} using the information you found.`
      : `Write a comprehensive, ${toneOfArticle || 'professional'} ${articleType || 'informational'} blog post about ${topic}`;
    
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
    console.log("Calling OpenRouter API...");
    
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
          model: requestedModel,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 16000, // Increased to the maximum to prevent content cutoff
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `API Error (${response.status}): `;
        
        try {
          // Try to parse error as JSON
          const errorData = JSON.parse(errorText);
          errorMessage += errorData.error?.message || errorData.error || errorText;
          console.error("OpenRouter API error:", errorData);
        } catch (e) {
          // If not JSON, use the text directly
          errorMessage += errorText;
          console.error("OpenRouter API error (raw):", errorText);
        }
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: errorMessage
          }),
          { 
            status: response.status, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const data = await response.json();
      console.log("OpenRouter API response received successfully");
      
      if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error("Invalid response structure from OpenRouter API:", data);
        return new Response(
          JSON.stringify({
            success: false,
            error: "Invalid response structure from OpenRouter API"
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
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
