
// CORS headers for all responses
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Default max tokens for different models
export const MODEL_MAX_TOKENS = {
  DEFAULT: 16000,
  CLAUDE_SONNET: 128000
};

// Model constants
export const MODELS = {
  SEARCH: "openai/gpt-4o-mini-search-preview",
  PROCESS: "openai/o1-mini-2024-09-12",
  DEFAULT: "anthropic/claude-3.7-sonnet"
};
