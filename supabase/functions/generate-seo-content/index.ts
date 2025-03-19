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
      includeInternalLinks,
      internalLinks,
      apiKey,
      model,
      backgroundGeneration,
      placeholderId
    } = await req.json();

    // Log request parameters for debugging
    console.log("Function received params:", {
      topic,
      includeInternalLinks,
      internalLinksCount: internalLinks?.length || 0,
      backgroundGeneration: !!backgroundGeneration,
      placeholderId
    });

    if (includeInternalLinks && (!internalLinks || internalLinks.length === 0)) {
      console.warn("includeInternalLinks is true but no URLs were provided");
    }

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
    
    // Initialize model variables - using 'let' instead of 'const' since they might change
    let requestedModel = "openai/gpt-4o-mini-search-preview";
    
    // If no search term is provided, use the model specified or default to claude
    if (!searchTerm) {
      requestedModel = model || "anthropic/claude-3.7-sonnet";
    }
    
    console.log("Using model for initial phase:", requestedModel);
    console.log("Search term (if applicable):", searchTerm);
    console.log("Internal links:", includeInternalLinks ? "Enabled" : "Disabled");
    if (includeInternalLinks && internalLinks) {
      console.log(`${internalLinks.length} internal links provided`);
    }

    // Build the prompts for the OpenRouter API with the 3-part approach
    
    // System prompt
    let systemPrompt = "";
    
    if (searchTerm) {
      // Part 1: Deep research & information gathering focus
      systemPrompt = `You are an in-depth and extremely detailed researcher with access to real-time web search. 
      Your task has two parts:
      
      PART 1: Conduct deep research on "${searchTerm}" using web search. Gather at least 1000+ words of detailed information.
      Include tables, charts, up-to-date statistics, pricing if relevant, new techniques, recent findings, and as much relevant 
      information as possible that relates to the blog topic "${topic}". Focus on information from the last 1-2 years when possible.
      
      PART 2: Use this research to craft a comprehensive, SEO-optimized, human-sounding article with a readability 
      level of grade 8 on "${topic}" optimized for the keyword "${keyword}". The article should follow best SEO practices while 
      maintaining a natural, engaging flow. Write in the ${toneOfArticle || 'professional'} ${articleType || 'informational'} 
      style, aiming for approximately ${wordCount} words for the intended audience of ${intendedAudience || 'general readers'}.`;
    } else {
      systemPrompt = `You are an expert SEO content writer. Write an SEO-optimized in-depth blog post about ${topic} with a readability of grade 8.`;
    }
    
    systemPrompt += ` Include lists, tables, charts, pull quotes, and emojis when it makes sense in the article.`;
    systemPrompt += ` Aim for approximately ${wordCount} words.`;
    
    // Add internal links instruction if requested
    if (includeInternalLinks && internalLinks && internalLinks.length > 0) {
      console.log("Adding internal links instructions to system prompt");
      systemPrompt += ` Include relevant internal links from the provided list of URLs. Select 3-7 of the most relevant URLs based on the content and link to them naturally within the text using anchor text that is relevant to both the linked page and the context of your article. Distribute the links evenly throughout the article.`;
    }
    
    if (includeHtmlElement) {
      systemPrompt += ` Also create an interactive HTML element that will be useful and relevant to the blog post content.`;
      systemPrompt += ` The HTML element should be one of the following: interactive table, data visualization, comparison chart, timeline, infographic, calculator, quiz, or selector.`;
      systemPrompt += ` Start the HTML code with <!DOCTYPE HTML> and ensure it's completely self-contained and compatible with WordPress.`;
      systemPrompt += ` The HTML should include all necessary CSS within a <style> tag and JavaScript within a <script> tag.`;
      systemPrompt += ` Make sure all IDs, classes, and selectors in the HTML are unique and prefixed with a specific namespace to avoid conflicts with the WordPress theme.`;
      systemPrompt += ` The element should be responsive and not break the page layout when embedded in a WordPress post.`;
    }
    
    systemPrompt += ` When writing, follow the best SEO practices and include the target keyword "${keyword}" and variations of the keyword in the title, h1, h2, h3, etc. and the body of the article.`;
    systemPrompt += ` Always end the article with an SEO title and meta description.`;

    // User prompt
    let userPrompt = "";
    
    if (searchTerm) {
      userPrompt = `I need you to do deep, detailed research on "${searchTerm}" and provide me with at least 1000+ words of information on this topic.
      
      In your research, please include:
      - Tables and charts where relevant
      - Up-to-date and cutting-edge information (focus on the last 1-2 years)
      - Pricing information if relevant
      - New techniques and methodologies
      - Recent findings and studies
      - Expert opinions and quotes
      - Statistical data and trends
      - Comparative analyses
      
      Once you've gathered this comprehensive research, use it to write a ${wordCount}-word 
      SEO-optimized article about "${topic}" that's optimized for the keyword "${keyword}". 
      
      Make sure the article:
      - Has a readability level of grade 8
      - Sounds natural and human-written
      - Follows best SEO practices
      - Is written in a ${toneOfArticle || 'professional'} ${articleType || 'informational'} style`;
    } else {
      userPrompt = `Write a comprehensive, ${toneOfArticle || 'professional'} ${articleType || 'informational'} blog post about ${topic}`;
    }
    
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
    
    // Add internal links if requested
    if (includeInternalLinks && internalLinks && internalLinks.length > 0) {
      console.log("Adding internal links to user prompt");
      userPrompt += `
      
      Include 3-7 relevant internal links from this list of URLs. Choose the most appropriate URLs that relate to the content and incorporate them naturally in the article:
      
      ${internalLinks.join('\n')}
      
      For each link, use descriptive and contextually relevant anchor text that helps both users and search engines understand what the linked page is about. Distribute the links evenly throughout the article.`;
    }
    
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
      userPrompt += ` 
      
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

    // If background generation is requested, return immediately with a job ID
    if (backgroundGeneration) {
      // Generate a random job ID
      const jobId = crypto.randomUUID();
      
      // Define the background task that will run independently
      const generateInBackground = async () => {
        try {
          console.log("Starting background generation with job ID:", jobId);
          let generatedContent = "";
          
          // Call the OpenRouter API with the search model if search term is provided
          if (searchTerm) {
            // STEP 1: Use search-capable model to gather information
            let searchResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'https://contentgenius.app', 
                'X-Title': 'ContentGenius SEO Generator'
              },
              body: JSON.stringify({
                model: "openai/gpt-4o-mini-search-preview",
                messages: [
                  { role: "system", content: systemPrompt },
                  { role: "user", content: userPrompt }
                ],
                temperature: 0.7,
                max_tokens: 16000,
              }),
            });

            if (!searchResponse.ok) {
              const errorText = await searchResponse.text();
              console.error("Error response from API:", errorText);
              throw new Error(`Search API Error (${searchResponse.status}): ${errorText}`);
            }

            let searchData = await searchResponse.json();
            
            if (!searchData || !searchData.choices || !searchData.choices[0] || !searchData.choices[0].message) {
              console.error("Invalid response structure from search API:", searchData);
              throw new Error("Invalid response structure from search API");
            }
            
            let searchResults = searchData.choices[0].message.content;
            console.log("Search completed. Now processing with o1-mini...");
            
            // STEP 2: Use o1-mini to create the final content
            const o1SystemPrompt = `You are an expert SEO content writer. Your task is to create a high-quality, 
            SEO-optimized blog post based on the research information provided. The content should have a readability 
            level of grade 8, sound human-written, and follow best SEO practices to optimize for the keyword "${keyword}".
            
            The blog post should be written in a ${toneOfArticle || 'professional'} ${articleType || 'informational'} style, 
            aiming for approximately ${wordCount} words for ${intendedAudience || 'general readers'}.
            
            Include lists, tables, charts, pull quotes, and emojis when it makes sense. Always end with an SEO title and meta description.`;
            
            // Add internal links instruction if requested
            if (includeInternalLinks && internalLinks && internalLinks.length > 0) {
              o1SystemPrompt += ` Include relevant internal links from the provided list of URLs. Select 3-7 of the most relevant URLs based on the content and link to them naturally within the text using anchor text that is relevant to both the linked page and the context of your article.`;
            }
            
            const o1UserPrompt = `I have conducted extensive research on the topic "${topic}" optimized for the keyword "${keyword}". 
            Here is the research data:
            
            ${searchResults}
            
            Using this research, write a comprehensive ${wordCount}-word SEO-optimized blog post about "${topic}" that's optimized 
            for the keyword "${keyword}". Ensure the content:
            
            - Has a readability level of grade 8
            - Sounds natural and human-written
            - Follows best SEO practices
            - Is written in a ${toneOfArticle || 'professional'} ${articleType || 'informational'} style`;
            
            if (stylePreferences.length > 0) {
              o1UserPrompt += `\n- Uses ${stylePreferences.join(", ")} style`;
            }
            
            // Add internal links if requested
            if (includeInternalLinks && internalLinks && internalLinks.length > 0) {
              o1UserPrompt += `
              
              Include 3-7 relevant internal links from this list of URLs. Choose the most appropriate URLs that relate to the content and incorporate them naturally in the article:
              
              ${internalLinks.join('\n')}
              
              For each link, use descriptive and contextually relevant anchor text that helps both users and search engines understand what the linked page is about. Distribute the links evenly throughout the article.`;
            }
            
            if (includeHtmlElement) {
              o1UserPrompt += `
              
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
            
            try {
              // Call the o1-mini model
              let o1Response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${apiKey}`,
                  'HTTP-Referer': 'https://contentgenius.app', 
                  'X-Title': 'ContentGenius SEO Generator'
                },
                body: JSON.stringify({
                  model: "openai/o1-mini-2024-09-12",
                  messages: [
                    { role: "system", content: o1SystemPrompt },
                    { role: "user", content: o1UserPrompt }
                  ],
                  temperature: 0.7,
                  max_tokens: 16000,
                }),
              });

              if (!o1Response.ok) {
                const errorText = await o1Response.text();
                console.error("Error from o1-mini:", errorText);
                // Fall back to using the search results if o1-mini fails
                generatedContent = searchResults;
                console.log("Falling back to search results due to o1-mini failure");
              } else {
                let o1Data = await o1Response.json();
                
                if (!o1Data || !o1Data.choices || !o1Data.choices[0] || !o1Data.choices[0].message) {
                  console.error("Invalid response structure from o1-mini:", o1Data);
                  // Fall back to using the search results
                  generatedContent = searchResults;
                  console.log("Falling back to search results due to invalid o1-mini response");
                } else {
                  generatedContent = o1Data.choices[0].message.content;
                  console.log("Successfully generated content with o1-mini");
                }
              }
            } catch (o1Error) {
              console.error("Error during o1-mini call:", o1Error);
              // Fall back to using the search results if o1-mini call fails
              generatedContent = searchResults;
              console.log("Falling back to search results due to o1-mini call error:", o1Error.message);
            }
          } else {
            // For non-search requests, use the specified or default model directly
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'https://contentgenius.app', 
                'X-Title': 'ContentGenius SEO Generator'
              },
              body: JSON.stringify({
                model: requestedModel,
                messages: [
                  { role: "system", content: systemPrompt },
                  { role: "user", content: userPrompt }
                ],
                temperature: 0.7,
                max_tokens: requestedModel.includes("claude-3.7-sonnet") ? 128000 : 16000,
              }),
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.error("Error response from API:", errorText);
              throw new Error(`API Error (${response.status}): ${errorText}`);
            }

            const data = await response.json();
            
            if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
              console.error("Invalid response structure from API:", data);
              throw new Error("Invalid response structure from API");
            }
            
            generatedContent = data.choices[0].message.content;
          }
          
          // Extract title from the generated content
          const titleMatch = generatedContent.match(/^#\s*(.*?)(\n|$)/);
          const title = titleMatch ? titleMatch[1].trim() : topic;
          
          console.log("Generated content with title:", title);
          
          // Update existing placeholder content if provided
          if (placeholderId) {
            console.log("Updating placeholder content with ID:", placeholderId);
            
            // Get the URL of the Supabase REST API from the request URL
            const apiUrl = new URL(req.url);
            const baseUrl = `${apiUrl.protocol}//${apiUrl.hostname}`;
            
            // Copy relevant headers from the original request
            const authHeader = req.headers.get('authorization') || '';
            const apiKeyHeader = req.headers.get('apikey') || '';
            
            console.log("Using base URL for update:", baseUrl);
            console.log("Auth header present:", !!authHeader);
            console.log("API key header present:", !!apiKeyHeader);
            
            // Update the placeholder with the actual content
            const updateResult = await fetch(`${baseUrl}/rest/v1/content?id=eq.${placeholderId}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader,
                'apikey': apiKeyHeader,
                'Prefer': 'return=minimal'
              },
              body: JSON.stringify({
                title: title,
                content: generatedContent,
                status: 'completed',
                updated_at: new Date().toISOString()
              }),
            });
            
            const updateStatus = updateResult.status;
            console.log("Update response status:", updateStatus);
            
            if (updateStatus !== 204) {
              const errorText = await updateResult.text();
              console.error("Failed to update placeholder:", errorText);
              throw new Error(`Failed to update placeholder: ${updateStatus} - ${errorText}`);
            } else {
              console.log("Successfully updated placeholder content");
            }
          }
          // Save new content if no placeholder was provided
          else {
            // Get user_id from auth header
            let userId = req.headers.get('x-user-id');
            
            // If we don't have a user ID, try to extract it from the request parameters
            if (!userId && req.headers.get('authorization')) {
              try {
                // Extract JWT token
                const token = req.headers.get('authorization')?.split('Bearer ')[1];
                if (token) {
                  // This is a simplified example. In a real app, you'd properly decode and verify the JWT
                  const base64Url = token.split('.')[1];
                  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                  const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                  }).join(''));
                  const payload = JSON.parse(jsonPayload);
                  userId = payload.sub;
                }
              } catch (error) {
                console.error("Error extracting user ID from token:", error);
              }
            }
            
            if (!userId) {
              console.error("Could not determine user ID for background job");
              return;
            }
            
            // Get the URL of the Supabase REST API
            const apiUrl = new URL(req.url);
            const baseUrl = `${apiUrl.protocol}//${apiUrl.hostname}`;
            
            // Save content to database
            const contentResult = await fetch(`${baseUrl}/rest/v1/content`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': req.headers.get('authorization') || '',
                'apikey': req.headers.get('apikey') || '',
              },
              body: JSON.stringify({
                title: title,
                content: generatedContent,
                user_id: userId,
                created_at: new Date().toISOString(),
                status: 'completed'
              }),
            });
            
            if (!contentResult.ok) {
              console.error("Failed to save content:", await contentResult.text());
              throw new Error(`Failed to save content: ${contentResult.statusText}`);
            }
          }
          
          console.log("Background content generation complete and saved, job ID:", jobId);
          
        } catch (error) {
          console.error("Error in background generation task:", error);
          
          // If there was a placeholder and an error occurred, update it to show the error
          if (placeholderId) {
            try {
              // Get the URL of the Supabase REST API
              const apiUrl = new URL(req.url);
              const baseUrl = `${apiUrl.protocol}//${apiUrl.hostname}`;
              
              console.log("Updating placeholder with failure status:", placeholderId);
              
              // Update the placeholder to indicate failure
              const errorUpdateResult = await fetch(`${baseUrl}/rest/v1/content?id=eq.${placeholderId}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': req.headers.get('authorization') || '',
                  'apikey': req.headers.get('apikey') || '',
                  'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                  title: `${topic} (Failed)`,
                  content: `# Error Generating Content\n\nThere was an error generating content for "${topic}".\n\nError: ${error.message}\n\nPlease try again later.`,
                  status: 'failed',
                  updated_at: new Date().toISOString()
                }),
              });
              
              if (errorUpdateResult.status !== 204) {
                console.error("Failed to update placeholder with error:", await errorUpdateResult.text());
              } else {
                console.log("Successfully updated placeholder with failure status");
              }
            } catch (updateError) {
              console.error("Error updating placeholder with failure status:", updateError);
            }
          }
        }
      };
      
      // Use EdgeRuntime.waitUntil to ensure the function continues running in the background
      // This is a Supabase Edge Function feature that allows background processing
      EdgeRuntime.waitUntil(generateInBackground());
      
      // Return immediately with job ID
      return new Response(
        JSON.stringify({ 
          success: true, 
          backgroundGeneration: true,
          jobId: jobId,
          message: "Content generation started in background"
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // If not background generation, proceed with regular synchronous generation
    let generatedContent = "";
    
    // Call the OpenRouter API with the search model if search term is provided
    console.log("Calling OpenRouter API with initial model...");
    
    try {
      if (searchTerm) {
        // STEP 1: Use search-capable model to gather information
        let searchResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://contentgenius.app', 
            'X-Title': 'ContentGenius SEO Generator'
          },
          body: JSON.stringify({
            model: "openai/gpt-4o-mini-search-preview",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 16000,
          }),
        });

        if (!searchResponse.ok) {
          const errorText = await searchResponse.text();
          console.error("Error response from API:", errorText);
          throw new Error(`Search API Error (${searchResponse.status}): ${errorText}`);
        }

        let searchData = await searchResponse.json();
        
        if (!searchData || !searchData.choices || !searchData.choices[0] || !searchData.choices[0].message) {
          console.error("Invalid response structure from search API:", searchData);
          throw new Error("Invalid response structure from search API");
        }
        
        let searchResults = searchData.choices[0].message.content;
        console.log("Search completed. Now processing with o1-mini...");
        
        // STEP 2: Use o1-mini to create the final content
        const o1SystemPrompt = `You are an expert SEO content writer. Your task is to create a high-quality, 
        SEO-optimized blog post based on the research information provided. The content should have a readability 
        level of grade 8, sound human-written, and follow best SEO practices to optimize for the keyword "${keyword}".
        
        The blog post should be written in a ${toneOfArticle || 'professional'} ${articleType || 'informational'} style, 
        aiming for approximately ${wordCount} words for ${intendedAudience || 'general readers'}.
        
        Include lists, tables, charts, pull quotes, and emojis when it makes sense. Always end with an SEO title and meta description.`;
        
        // Add internal links instruction if requested
        if (includeInternalLinks && internalLinks && internalLinks.length > 0) {
          o1SystemPrompt += ` Include relevant internal links from the provided list of URLs. Select 3-7 of the most relevant URLs based on the content and link to them naturally within the text using anchor text that is relevant to both the linked page and the context of your article.`;
        }
        
        const o1UserPrompt = `I have conducted extensive research on the topic "${topic}" optimized for the keyword "${keyword}". 
        Here is the research data:
        
        ${searchResults}
        
        Using this research, write a comprehensive ${wordCount}-word SEO-optimized blog post about "${topic}" that's optimized 
        for the keyword "${keyword}". Ensure the content:
        
        - Has a readability level of grade 8
        - Sounds natural and human-written
        - Follows best SEO practices
        - Is written in a ${toneOfArticle || 'professional'} ${articleType || 'informational'} style`;
        
        if (stylePreferences.length > 0) {
          o1UserPrompt += `\n- Uses ${stylePreferences.join(", ")} style`;
        }
        
        // Add internal links if requested
        if (includeInternalLinks && internalLinks && internalLinks.length > 0) {
          o1UserPrompt += `
          
          Include 3-7 relevant internal links from this list of URLs. Choose the most appropriate URLs that relate to the content and incorporate them naturally in the article:
          
          ${internalLinks.join('\n')}
          
          For each link, use descriptive and contextually relevant anchor text that helps both users and search engines understand what the linked page is about. Distribute the links evenly throughout the article.`;
        }
        
        if (includeHtmlElement) {
          o1UserPrompt += `
          
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
        
        try {
          // Call the o1-mini model
          let o1Response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
              'HTTP-Referer': 'https://contentgenius.app', 
              'X-Title': 'ContentGenius SEO Generator'
            },
            body: JSON.stringify({
              model: "openai/o1-mini-2024-09-12",
              messages: [
                { role: "system", content: o1SystemPrompt },
                { role: "user", content: o1UserPrompt }
              ],
              temperature: 0.7,
              max_tokens: 16000,
            }),
          });

          if (!o1Response.ok) {
            const errorText = await o1Response.text();
            console.error("Error from o1-mini:", errorText);
            // Fall back to using the search results if o1-mini fails
            generatedContent = searchResults;
            console.log("Falling back to search results due to o1-mini failure");
          } else {
            let o1Data = await o1Response.json();
            
            if (!o1Data || !o1Data.choices || !o1Data.choices[0] || !o1Data.choices[0].message) {
              console.error("Invalid response structure from o1-mini:", o1Data);
              // Fall back to using the search results
              generatedContent = searchResults;
              console.log("Falling back to search results due to invalid o1-mini response");
            } else {
              generatedContent = o1Data.choices[0].message.content;
              console.log("Successfully generated content with o1-mini");
            }
          }
        } catch (o1Error) {
          console.error("Error during o1-mini call:", o1Error);
          // Fall back to using the search results if o1-mini call fails
          generatedContent = searchResults;
          console.log("Falling back to search results due to o1-mini call error:", o1Error.message);
        }
      } else {
        // For non-search requests, use the specified or default model directly
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://contentgenius.app', 
            'X-Title': 'ContentGenius SEO Generator'
          },
          body: JSON.stringify({
            model: requestedModel,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: requestedModel.includes("claude-3.7-sonnet") ? 128000 : 16000,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error response from API:", errorText);
          throw new Error(`API Error (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        
        if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
          console.error("Invalid response structure from API:", data);
          throw new Error("Invalid response structure from API");
        }
        
        generatedContent = data.choices[0].message.content;
      }
      
      // Extract title from the generated content
      const titleMatch = generatedContent.match(/^#\s*(.*?)(\n|$)/);
      const title = titleMatch ? titleMatch[1].trim() : topic;
      
      console.log("Generated content with title:", title);
      
      // Update existing placeholder content if provided
      if (placeholderId) {
        console.log("Updating placeholder content with ID:", placeholderId);
        
        // Get the URL of the Supabase REST API from the request URL
        const apiUrl = new URL(req.url);
        const baseUrl = `${apiUrl.protocol}//${apiUrl.hostname}`;
        
        // Copy relevant headers from the original request
        const authHeader = req.headers.get('authorization') || '';
        const apiKeyHeader = req.headers.get('apikey') || '';
        
        console.log("Using base URL for update:", baseUrl);
        console.log("Auth header present:", !!authHeader);
        console.log("API key header present:", !!apiKeyHeader);
        
        // Update the placeholder with the actual content
        const updateResult = await fetch(`${baseUrl}/rest/v1/content?id=eq.${placeholderId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
            'apikey': apiKeyHeader,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            title: title,
            content: generatedContent,
            status: 'completed',
            updated_at: new Date().toISOString()
          }),
        });
        
        const updateStatus = updateResult.status;
        console.log("Update response status:", updateStatus);
        
        if (updateStatus !== 204) {
          const errorText = await updateResult.text();
          console.error("Failed to update placeholder:", errorText);
          throw new Error(`Failed to update placeholder: ${updateStatus} - ${errorText}`);
        } else {
          console.log("Successfully updated placeholder content");
        }
      }
      // Save new content if no placeholder was provided
      else {
        // Get user_id from auth header
        let userId = req.headers.get('x-user-id');
        
        // If we don't have a user ID, try to extract it from the request parameters
        if (!userId && req.headers.get('authorization')) {
          try {
            // Extract JWT token
            const token = req.headers.get('authorization')?.split('Bearer ')[1];
            if (token) {
              // This is a simplified example. In a real app, you'd properly decode and verify the JWT
              const base64Url = token.split('.')[1];
              const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
              const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
              }).join(''));
              const payload = JSON.parse(jsonPayload);
              userId = payload.sub;
            }
          } catch (error) {
            console.error("Error extracting user ID from token:", error);
          }
        }
        
        if (!userId) {
          console.error("Could not determine user ID for background job");
          return;
        }
        
        // Get the URL of the Supabase REST API
        const apiUrl = new URL(req.url);
        const baseUrl = `${apiUrl.protocol}//${apiUrl.hostname}`;
        
        // Save content to database
        const contentResult = await fetch(`${baseUrl}/rest/v1/content`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': req.headers.get('authorization') || '',
            'apikey': req.headers.get('apikey') || '',
          },
          body: JSON.stringify({
            title: title,
            content: generatedContent,
            user_id: userId,
            created_at: new Date().toISOString(),
            status: 'completed'
          }),
        });
        
        if (!contentResult.ok) {
          console.error("Failed to save content:", await contentResult.text());
          throw new Error(`Failed to save content: ${contentResult.statusText}`);
        }
      }
    } catch (error) {
      console.error("Error in synchronous generation task:", error);
    }
  } catch (error) {
    console.error("Error in edge function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Server error: ${error.message}` 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
