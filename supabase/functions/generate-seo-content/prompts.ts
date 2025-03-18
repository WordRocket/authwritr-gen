
import { PromptConfig, RequestParams } from "./types.ts";

/**
 * Creates style preferences string based on user selections
 */
function createStylePreferencesString(params: RequestParams): string[] {
  const stylePreferences = [];
  if (params.includeFirstPerson) stylePreferences.push("first-person perspective");
  if (params.includeAnecdotes) stylePreferences.push("include anecdotes");
  if (params.includeHook) stylePreferences.push("start with an engaging hook");
  if (params.includeStories) stylePreferences.push("incorporate relevant stories");
  
  return stylePreferences;
}

/**
 * Creates HTML element instructions if enabled
 */
function createHtmlElementInstructions(): string {
  return ` 
  
  Additionally, create ONE highly relevant interactive HTML element that would significantly help readers understand or use the information in this article. The HTML element must:
  
  1. Start with <!DOCTYPE HTML> and be structured as a complete, self-contained document
  2. Choose the most appropriate format based on the article content:
     - Interactive table (for comparing options/data)
     - Data visualization (for statistics/trends)
     - Calculator (for financial/numeric concepts)
     - Quiz (for educational content)
     - Timeline (for historical/sequential information)
     - Selector/filtering tool (for decision-making assistance)
     - Infographic (for visual representation of complex concepts)
  
  3. Include all CSS within a <style> tag and all JavaScript within a <script> tag
  4. Use prefixed class names (like "cg-element-") to avoid conflicts with WordPress themes
  5. Be responsive and mobile-friendly
  6. Not rely on external libraries or dependencies
  7. Not affect the page layout or styling when embedded in a WordPress post
  8. Be actually useful to the reader, not just decorative
  
  Ensure the HTML is valid, clean, and follows best practices for embedding in WordPress without breaking the layout.`;
}

/**
 * Creates internal links instructions if enabled
 */
function createInternalLinksInstructions(params: RequestParams): string {
  if (params.includeInternalLinks && params.internalLinks && params.internalLinks.length > 0) {
    return `
    
    Include 3-7 relevant internal links from this list of URLs. Choose the most appropriate URLs that relate to the content and incorporate them naturally in the article:
    
    ${params.internalLinks.join('\n')}
    
    For each link, use descriptive and contextually relevant anchor text that helps both users and search engines understand what the linked page is about. Distribute the links evenly throughout the article.`;
  }
  
  return '';
}

/**
 * Creates the search model system prompt
 */
export function createSearchSystemPrompt(params: RequestParams): string {
  const keyword = params.targetKeyword || params.topic;
  let systemPrompt = '';
  
  if (params.searchTerm) {
    systemPrompt = `You are an in-depth and extremely detailed researcher with access to real-time web search. 
    Your task has two parts:
    
    PART 1: Conduct deep research on "${params.searchTerm}" using web search. Gather at least 1000+ words of detailed information.
    Include tables, charts, up-to-date statistics, pricing if relevant, new techniques, recent findings, and as much relevant 
    information as possible that relates to the blog topic "${params.topic}". Focus on information from the last 1-2 years when possible.
    
    PART 2: Use this research to craft a comprehensive, SEO-optimized, human-sounding article with a readability 
    level of grade 8 on "${params.topic}" optimized for the keyword "${keyword}". The article should follow best SEO practices while 
    maintaining a natural, engaging flow. Write in the ${params.toneOfArticle || 'professional'} ${params.articleType || 'informational'} 
    style, aiming for approximately ${params.wordCount} words for the intended audience of ${params.intendedAudience || 'general readers'}.`;
  } else {
    systemPrompt = `You are an expert SEO content writer. Write an SEO-optimized in-depth blog post about ${params.topic} with a readability of grade 8.`;
  }
  
  systemPrompt += ` Include lists, tables, charts, pull quotes, and emojis when it makes sense in the article.`;
  systemPrompt += ` Aim for approximately ${params.wordCount} words.`;
  
  // Add internal links instruction if requested
  if (params.includeInternalLinks && params.internalLinks && params.internalLinks.length > 0) {
    systemPrompt += ` Include relevant internal links from the provided list of URLs. Select 3-7 of the most relevant URLs based on the content and link to them naturally within the text using anchor text that is relevant to both the linked page and the context of your article. Distribute the links evenly throughout the article.`;
  }
  
  if (params.includeHtmlElement) {
    systemPrompt += ` Also create an interactive HTML element that will be useful and relevant to the blog post content.`;
    systemPrompt += ` The HTML element should be one of the following: interactive table, data visualization, comparison chart, timeline, infographic, calculator, quiz, or selector.`;
    systemPrompt += ` Start the HTML code with <!DOCTYPE HTML> and ensure it's completely self-contained and compatible with WordPress.`;
    systemPrompt += ` The HTML should include all necessary CSS within a <style> tag and JavaScript within a <script> tag.`;
    systemPrompt += ` Make sure all IDs, classes, and selectors in the HTML are unique and prefixed with a specific namespace to avoid conflicts with the WordPress theme.`;
    systemPrompt += ` The element should be responsive and not break the page layout when embedded in a WordPress post.`;
  }
  
  systemPrompt += ` When writing, follow the best SEO practices and include the target keyword "${keyword}" and variations of the keyword in the title, h1, h2, h3, etc. and the body of the article.`;
  systemPrompt += ` Always end the article with an SEO title and meta description.`;
  
  return systemPrompt;
}

/**
 * Creates the search model user prompt
 */
export function createSearchUserPrompt(params: RequestParams): string {
  const keyword = params.targetKeyword || params.topic;
  let userPrompt = '';
  
  if (params.searchTerm) {
    userPrompt = `I need you to do deep, detailed research on "${params.searchTerm}" and provide me with at least 1000+ words of information on this topic.
    
    In your research, please include:
    - Tables and charts where relevant
    - Up-to-date and cutting-edge information (focus on the last 1-2 years)
    - Pricing information if relevant
    - New techniques and methodologies
    - Recent findings and studies
    - Expert opinions and quotes
    - Statistical data and trends
    - Comparative analyses
    
    Once you've gathered this comprehensive research, use it to write a ${params.wordCount}-word 
    SEO-optimized article about "${params.topic}" that's optimized for the keyword "${keyword}". 
    
    Make sure the article:
    - Has a readability level of grade 8
    - Sounds natural and human-written
    - Follows best SEO practices
    - Is written in a ${params.toneOfArticle || 'professional'} ${params.articleType || 'informational'} style`;
  } else {
    userPrompt = `Write a comprehensive, ${params.toneOfArticle || 'professional'} ${params.articleType || 'informational'} blog post about ${params.topic}`;
  }
  
  if (params.targetKeyword) {
    userPrompt += ` optimized for the keyword "${params.targetKeyword}"`;
  }
  
  if (params.intendedAudience) {
    userPrompt += ` for an audience of ${params.intendedAudience}`;
  }
  
  if (params.additionalContext) {
    userPrompt += `. Additional context: ${params.additionalContext}`;
  }
  
  userPrompt += `. Make it approximately ${params.wordCount} words.`;
  
  // Add internal links if requested
  userPrompt += createInternalLinksInstructions(params);
  
  // Add style preferences
  const stylePreferences = createStylePreferencesString(params);
  if (stylePreferences.length > 0) {
    userPrompt += ` Please write in ${stylePreferences.join(", ")} style.`;
  }
  
  // Add HTML element instructions if requested
  if (params.includeHtmlElement) {
    userPrompt += createHtmlElementInstructions();
  }
  
  return userPrompt;
}

/**
 * Creates the O1 model system prompt using search results
 */
export function createO1SystemPrompt(params: RequestParams): string {
  const keyword = params.targetKeyword || params.topic;
  
  let o1SystemPrompt = `You are an expert SEO content writer. Your task is to create a high-quality, 
  SEO-optimized blog post based on the research information provided. The content should have a readability 
  level of grade 8, sound human-written, and follow best SEO practices to optimize for the keyword "${keyword}".
  
  The blog post should be written in a ${params.toneOfArticle || 'professional'} ${params.articleType || 'informational'} style, 
  aiming for approximately ${params.wordCount} words for ${params.intendedAudience || 'general readers'}.
  
  Include lists, tables, charts, pull quotes, and emojis when it makes sense. Always end with an SEO title and meta description.`;
  
  // Add internal links instruction if requested
  if (params.includeInternalLinks && params.internalLinks && params.internalLinks.length > 0) {
    o1SystemPrompt += ` Include relevant internal links from the provided list of URLs. Select 3-7 of the most relevant URLs based on the content and link to them naturally within the text using anchor text that is relevant to both the linked page and the context of your article.`;
  }
  
  return o1SystemPrompt;
}

/**
 * Creates the O1 model user prompt using search results
 */
export function createO1UserPrompt(params: RequestParams, searchResults: string): string {
  const keyword = params.targetKeyword || params.topic;
  const stylePreferences = createStylePreferencesString(params);
  
  let o1UserPrompt = `I have conducted extensive research on the topic "${params.topic}" optimized for the keyword "${keyword}". 
  Here is the research data:
  
  ${searchResults}
  
  Using this research, write a comprehensive ${params.wordCount}-word SEO-optimized blog post about "${params.topic}" that's optimized 
  for the keyword "${keyword}". Ensure the content:
  
  - Has a readability level of grade 8
  - Sounds natural and human-written
  - Follows best SEO practices
  - Is written in a ${params.toneOfArticle || 'professional'} ${params.articleType || 'informational'} style`;
  
  if (stylePreferences.length > 0) {
    o1UserPrompt += `\n- Uses ${stylePreferences.join(", ")} style`;
  }
  
  // Add internal links if requested
  o1UserPrompt += createInternalLinksInstructions(params);
  
  // Add HTML element instructions if requested
  if (params.includeHtmlElement) {
    o1UserPrompt += createHtmlElementInstructions();
  }
  
  return o1UserPrompt;
}

/**
 * Creates all necessary prompts based on request parameters
 */
export function createPrompts(params: RequestParams): PromptConfig {
  return {
    systemPrompt: createSearchSystemPrompt(params),
    userPrompt: createSearchUserPrompt(params),
  };
}
