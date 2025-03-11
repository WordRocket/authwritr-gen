
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

    const keyword = targetKeyword || topic;

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
    console.log("Calling OpenRouter API with model:", model);
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://contentgenius.app', // Replace with your actual domain
        'X-Title': 'ContentGenius SEO Generator'
      },
      body: JSON.stringify({
        model: model || "anthropic/claude-3-5-sonnet",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: Math.min(4000, wordCount * 2), // Estimate tokens needed based on word count
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("OpenRouter API error:", data);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: data.error?.message || "Failed to generate content" 
        }),
        { 
          status: response.status, 
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
