
export interface RequestParams {
  topic: string; 
  searchTerm?: string;
  targetKeyword?: string; 
  articleType?: string; 
  toneOfArticle?: string; 
  intendedAudience?: string; 
  additionalContext?: string; 
  wordCount: number; 
  includeFirstPerson?: boolean; 
  includeAnecdotes?: boolean; 
  includeHook?: boolean; 
  includeStories?: boolean; 
  includeHtmlElement?: boolean;
  includeInternalLinks?: boolean;
  internalLinks?: string[];
  apiKey: string;
  model?: string;
  saveOnComplete?: boolean;
  userId?: string;
  title?: string;
}

export interface PromptConfig {
  systemPrompt: string;
  userPrompt: string;
}

export interface ApiResponse {
  success: boolean;
  content?: string;
  error?: string;
}
