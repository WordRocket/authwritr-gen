
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "./config.ts";
import { createPrompts } from "./prompts.ts";
import { generateContent } from "./api.ts";
import { createErrorResponse, createSuccessResponse, validateApiKey } from "./utils.ts";
import { RequestParams } from "./types.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const params = await req.json() as RequestParams;

    // Log for debugging
    console.log("Function received params:", {
      topic: params.topic,
      includeInternalLinks: params.includeInternalLinks,
      internalLinksCount: params.internalLinks?.length || 0,
      model: params.model,
      searchTerm: params.searchTerm || "None"
    });

    if (params.includeInternalLinks && (!params.internalLinks || params.internalLinks.length === 0)) {
      console.warn("includeInternalLinks is true but no URLs were provided");
    }

    // Validate API key
    const keyError = validateApiKey(params);
    if (keyError) {
      return createErrorResponse(keyError, 400);
    }

    // Create prompts
    const prompts = createPrompts(params);
    
    // Generate content
    const generatedContent = await generateContent(params, prompts);
    
    // Return the result
    return createSuccessResponse(generatedContent);
  } catch (error) {
    console.error("Error in generate-seo-content function:", error);
    return createErrorResponse(error.message);
  }
});
