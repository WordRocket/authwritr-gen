
import { ApiResponse, RequestParams } from "./types.ts";
import { corsHeaders } from "./config.ts";

/**
 * Creates a successful response with the generated content
 */
export function createSuccessResponse(content: string): Response {
  const responseData: ApiResponse = { 
    success: true, 
    content 
  };
  
  return new Response(
    JSON.stringify(responseData),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

/**
 * Creates an error response with the specified message and status code
 */
export function createErrorResponse(message: string, status = 500): Response {
  const responseData: ApiResponse = { 
    success: false, 
    error: message 
  };
  
  return new Response(
    JSON.stringify(responseData),
    { 
      status, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

/**
 * Validates the API key from the request parameters
 */
export function validateApiKey(params: RequestParams): string | null {
  if (!params.apiKey) {
    return "API key is required";
  }

  // Check if apiKey contains HTML content (which would be invalid)
  if (params.apiKey.includes('<') || params.apiKey.includes('>')) {
    return "Invalid API key format";
  }

  return null;
}
