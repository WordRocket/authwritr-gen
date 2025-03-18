import { MODEL_MAX_TOKENS, MODELS } from "./config.ts";
import { PromptConfig, RequestParams } from "./types.ts";
import { createO1SystemPrompt, createO1UserPrompt } from "./prompts.ts";

/**
 * Determines the appropriate model to use based on request parameters
 */
export function determineModel(params: RequestParams): string {
  // If search term is provided, we use a search model
  if (params.searchTerm) {
    return MODELS.SEARCH;
  }
  
  // Otherwise, use the model specified or default to Claude 3.7 Sonnet
  return params.model || MODELS.DEFAULT;
}

/**
 * Gets the appropriate max tokens value based on the model
 */
export function getMaxTokens(model: string): number {
  if (model.includes("claude-3.7-sonnet")) {
    return MODEL_MAX_TOKENS.CLAUDE_SONNET;
  }
  
  return MODEL_MAX_TOKENS.DEFAULT;
}

/**
 * Makes a request to the OpenRouter API
 */
export async function callOpenRouterApi(model: string, systemPrompt: string, userPrompt: string, apiKey: string): Promise<string> {
  const maxTokens = getMaxTokens(model);
  
  console.log(`Calling OpenRouter API with model: ${model}, max_tokens: ${maxTokens}`);
  
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://contentgenius.app', 
      'X-Title': 'ContentGenius SEO Generator'
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  
  if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error("Invalid response structure from API");
  }
  
  return data.choices[0].message.content;
}

/**
 * Processes search results with the O1 model
 */
export async function processWithO1(params: RequestParams, searchResults: string, apiKey: string): Promise<string> {
  try {
    console.log("Processing search results with O1 model...");
    
    const o1SystemPrompt = createO1SystemPrompt(params);
    const o1UserPrompt = createO1UserPrompt(params, searchResults);
    
    return await callOpenRouterApi(MODELS.PROCESS, o1SystemPrompt, o1UserPrompt, apiKey);
  } catch (error) {
    console.error("Error during O1 processing:", error);
    console.log("Falling back to search results due to O1 error");
    return searchResults;
  }
}

/**
 * Main function to generate content based on search or direct model generation
 */
export async function generateContent(params: RequestParams, prompts: PromptConfig): Promise<string> {
  const { apiKey } = params;
  const { systemPrompt, userPrompt } = prompts;
  
  // Determine which model to use
  const requestedModel = determineModel(params);
  
  // If search term is provided, use the two-step process
  if (params.searchTerm) {
    console.log("Using search workflow with search model and O1 for final content");
    
    // Step 1: Get search results
    const searchResults = await callOpenRouterApi(MODELS.SEARCH, systemPrompt, userPrompt, apiKey);
    
    // Step 2: Process results with O1 model
    return await processWithO1(params, searchResults, apiKey);
  } 
  
  // For non-search requests, use the specified or default model directly
  return await callOpenRouterApi(requestedModel, systemPrompt, userPrompt, apiKey);
}
