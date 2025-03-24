
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
      manualInput,
      inputMode,
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
      finalContentModel,
      backgroundGeneration,
      enableThinking
    } = await req.json();

    // Log for debugging
    console.log("Function received params:", {
      topic,
      inputMode,
      hasSearchTerm: !!searchTerm,
      hasManualInput: !!manualInput,
      includeInternalLinks,
      internalLinksCount: internalLinks?.length || 0,
      backgroundGeneration: !!backgroundGeneration,
      hasAdditionalContext: !!additionalContext,
      model,
      finalContentModel
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
          status: 200, // Always return 200 to client but with error in body
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
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const keyword = targetKeyword || topic;
    
    // Initialize model variables - using 'let' instead of 'const' since they might change
    let requestedModel = model || "openai/gpt-4o-mini-search-preview";
    // For final content model, also use let instead of const
    let finalContentModelToUse = finalContentModel || "anthropic/claude-3.7-sonnet";
    
    console.log("Using model for initial phase:", requestedModel);
    console.log("Final content model:", finalContentModelToUse);
    console.log("Input mode:", inputMode);
    if (inputMode === "webSearch") {
      console.log("Search term:", searchTerm);
    } else {
      console.log("Manual input length:", manualInput?.length || 0);
    }
    console.log("Internal links:", includeInternalLinks ? "Enabled" : "Disabled");
    if (includeInternalLinks && internalLinks) {
      console.log(`${internalLinks.length} internal links provided`);
    }

    // Build the prompts for the OpenRouter API with the 3-part approach
    
    // System prompt for web search
    let systemPrompt = "";
    
    if (inputMode === "webSearch" && searchTerm) {
      // For web search: Focus on deep research and information gathering
      systemPrompt = `You are an in-depth and extremely detailed researcher with access to web search. 
      Your task is to research "${searchTerm}" extensively and gather the most relevant information related to the blog post topic "${topic}".
      
      Focus on collecting:
      - Relevant data, statistics, and facts
      - Relevant expert opinions and insights
      - Relevant sources (academic studies, industry reports, expert articles)
      - Recent developments and trends
      - Different perspectives on the topic
      - Case studies or examples that illustrate key points
      - Specific details that would make the blog post more authoritative and comprehensive
      
      Always include the sources of your information. Be thorough and comprehensive in your research.
      The information you gather will be used to write an in-depth blog post on "${topic}" optimized for the keyword "${keyword}".`;
    } else if (inputMode === "manualInput" && manualInput) {
      systemPrompt = `You are an expert SEO content writer. Your task is to create a high-quality, SEO-optimized blog post based
      on the research information provided by the user. The content should have a readability level of grade 8, sound human-written,
      and follow best SEO practices to optimize for the keyword "${keyword}".
      
      You'll be given research content that you should use as the primary source of information for the article.
      Write a comprehensive article about ${topic} with a readability of grade 8, optimized for the keyword "${keyword}".
      Write in the ${toneOfArticle || 'professional'} ${articleType || 'informational'} style, 
      aiming for approximately ${wordCount} words for the intended audience of ${intendedAudience || 'general readers'}.`;
    } else {
      systemPrompt = `You are an expert SEO content writer. Write an SEO-optimized in-depth blog post about ${topic} with a readability of grade 8.`;
    }
    
    // Only add these for direct content generation (not for search)
    if (inputMode !== "webSearch" || !searchTerm) {
      systemPrompt += ` Include lists, tables, charts, pull quotes, and emojis when it makes sense in the article.`;
      systemPrompt += ` Aim for approximately ${wordCount} words.`;
    }
    
    // Add additional context instructions if provided
    if (additionalContext) {
      systemPrompt += ` I've provided you with additional context information. If it contains business or company information, use it sparingly and only when it makes sense in the flow of the article. If appropriate, include subtle calls-to-action that feel natural within the content. Don't just dump all the information in one place - integrate it naturally throughout the article where relevant to the surrounding content.`;
    }
    
    // Add internal links instruction if requested
    if (includeInternalLinks && internalLinks && internalLinks.length > 0) {
      console.log("Adding internal links instructions to system prompt");
      systemPrompt += ` Include relevant internal links from the provided list of URLs. Select 3-7 of the most relevant URLs based on the content and link to them naturally within the text using anchor text that is relevant to both the linked page and the context of your article. Distribute the links evenly throughout the article.`;
    }
    
    // Only add these for direct content generation (not for search)
    if (inputMode !== "webSearch" || !searchTerm) {
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
    }

    // User prompt
    let userPrompt = "";
    
    if (inputMode === "webSearch" && searchTerm) {
      userPrompt = `I need you to do deep, detailed research on "${searchTerm}" and gather the most relevant information related to the blog post topic "${topic}".
      
      In your research, please focus on collecting:
      - Relevant data, statistics, and facts
      - Relevant expert opinions and insights
      - Relevant sources (academic studies, industry reports, expert articles)
      - Recent developments and trends
      - Different perspectives on the topic
      - Case studies or examples that illustrate key points
      - Specific details that would make the blog post more authoritative
      
      Be thorough and comprehensive in your research. Include the sources for all information you provide.
      This research will be used to write an in-depth blog post on "${topic}" optimized for the keyword "${keyword}".`;
    } else if (inputMode === "manualInput" && manualInput) {
      userPrompt = `I've conducted research on the topic "${topic}" and I'd like you to use this research to write a comprehensive, ${toneOfArticle || 'professional'} ${articleType || 'informational'} blog post.
      
      Here is my research information:
      
      ${manualInput}
      
      Using this research information, write a ${wordCount}-word SEO-optimized article about "${topic}" that's optimized for the keyword "${keyword}".
      
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
    
    // Add additional context with clear instructions on how to use it
    if (additionalContext) {
      userPrompt += `. Here is additional context information for you to incorporate throughout the article where relevant:
      
      ${additionalContext}
      
      Please weave this information naturally into the article where it makes sense. If it contains business or company information, use it sparingly and only when relevant. If appropriate, include subtle calls-to-action that feel natural within the content. Don't just dump all this information in one place - integrate it thoughtfully throughout the article.`;
    }
    
    if (inputMode !== "webSearch" || !searchTerm) {
      userPrompt += `. Make it approximately ${wordCount} words.`;
    }
    
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
    
    if (inputMode !== "webSearch" || !searchTerm) {
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
    }

    // If background generation is requested, return immediately with a job ID
    if (backgroundGeneration) {
      // Generate a random job ID
      const jobId = crypto.randomUUID();
      
      // Start background job
      const generateInBackground = async () => {
        try {
          let generatedContent = "";
          
          // Call the OpenRouter API with the search model if search term is provided
          console.log("Starting background generation with job ID:", jobId);
          
          if (inputMode === "webSearch" && searchTerm) {
            // STEP 1: Use the selected model to gather research information
            let searchResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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
                max_tokens: 16000,
              }),
            });

            if (!searchResponse.ok) {
              const errorText = await searchResponse.text();
              throw new Error(`Search API Error (${searchResponse.status}): ${errorText}`);
            }

            let searchData = await searchResponse.json();
            
            if (!searchData || !searchData.choices || !searchData.choices[0] || !searchData.choices[0].message) {
              throw new Error("Invalid response structure from search API");
            }
            
            let searchResults = searchData.choices[0].message.content;
            console.log("Search completed. Now processing with Claude 3.7 Sonnet...");
            
            // STEP 2: Use Claude 3.7 Sonnet to create the final content
            const claudeSystemPrompt = `You are an expert SEO content writer. Your task is to create a high-quality, 
            SEO-optimized blog post based on the research information provided. The content should have a readability 
            level of grade 8, sound human-written, and follow best SEO practices to optimize for the keyword "${keyword}".
            
            The blog post should be written in a ${toneOfArticle || 'professional'} ${articleType || 'informational'} style, 
            aiming for approximately ${wordCount} words for ${intendedAudience || 'general readers'}.
            
            Include lists, tables, charts, pull quotes, and emojis when it makes sense. Always end with an SEO title and meta description.
            
            Your writing should be in-depth, comprehensive, and extremely detailed, using all the relevant information from the research provided.`;
            
            // Add internal links instruction if requested
            if (includeInternalLinks && internalLinks && internalLinks.length > 0) {
              claudeSystemPrompt += ` Include relevant internal links from the provided list of URLs. Select 3-7 of the most relevant URLs based on the content and link to them naturally within the text using anchor text that is relevant to both the linked page and the context of your article.`;
            }
            
            const claudeUserPrompt = `I have conducted extensive research on the topic "${topic}" optimized for the keyword "${keyword}". 
            Here is the research data:
            
            ${searchResults}
            
            Using this research, write a comprehensive ${wordCount}-word SEO-optimized blog post about "${topic}" that's optimized 
            for the keyword "${keyword}". Make sure to include relevant sources from the research.
            
            Ensure the content:
            - Has a readability level of grade 8
            - Sounds natural and human-written
            - Follows best SEO practices
            - Is written in a ${toneOfArticle || 'professional'} ${articleType || 'informational'} style
            - Includes all relevant information from the research
            - Includes lists, tables, charts, and bold text where appropriate
            - Cites sources from the research where appropriate`;
            
            if (stylePreferences.length > 0) {
              claudeUserPrompt += `\n- Uses ${stylePreferences.join(", ")} style`;
            }
            
            // Add internal links if requested
            if (includeInternalLinks && internalLinks && internalLinks.length > 0) {
              claudeUserPrompt += `
              
              Include 3-7 relevant internal links from this list of URLs. Choose the most appropriate URLs that relate to the content and incorporate them naturally in the article:
              
              ${internalLinks.join('\n')}
              
              For each link, use descriptive and contextually relevant anchor text that helps both users and search engines understand what the linked page is about. Distribute the links evenly throughout the article.`;
            }
            
            if (includeHtmlElement) {
              claudeUserPrompt += `
              
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
              // Call the Claude 3.7 Sonnet model
              let claudeResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${apiKey}`,
                  'HTTP-Referer': 'https://contentgenius.app', 
                  'X-Title': 'ContentGenius SEO Generator'
                },
                body: JSON.stringify({
                  model: "anthropic/claude-3.7-sonnet",
                  messages: [
                    { role: "system", content: claudeSystemPrompt },
                    { role: "user", content: claudeUserPrompt }
                  ],
                  temperature: 0.7,
                  max_tokens: 128000,
                }),
              });

              if (!claudeResponse.ok) {
                const errorText = await claudeResponse.text();
                console.error("Error from Claude 3.7 Sonnet:", errorText);
                // Fall back to using the search results if Claude fails
                generatedContent = searchResults;
                console.log("Falling back to search results due to Claude 3.7 Sonnet failure");
              } else {
                let claudeData = await claudeResponse.json();
                
                if (!claudeData || !claudeData.choices || !claudeData.choices[0] || !claudeData.choices[0].message) {
                  console.error("Invalid response structure from Claude 3.7 Sonnet:", claudeData);
                  // Fall back to using the search results
                  generatedContent = searchResults;
                  console.log("Falling back to search results due to invalid Claude 3.7 Sonnet response");
                } else {
                  generatedContent = claudeData.choices[0].message.content;
                  console.log("Successfully generated content with Claude 3.7 Sonnet");
                }
              }
            } catch (claudeError) {
              console.error("Error during Claude 3.7 Sonnet call:", claudeError);
              // Fall back to using the search results if Claude call fails
              generatedContent = searchResults;
              console.log("Falling back to search results due to Claude 3.7 Sonnet call error:", claudeError.message);
            }
          } else {
            // For manual input or non-search requests, use the specified or default model directly
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
                // Set max_tokens to 128000 specifically for Claude 3.7 Sonnet
                max_tokens: requestedModel.includes("claude-3.7-sonnet") ? 128000 : 16000,
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
            
            generatedContent = data.choices[0].message.content;
          }
          
          // Save completed content to content table
          const titleMatch = generatedContent.match(/^#\s*(.*?)(\n|$)/);
          const title = titleMatch ? titleMatch[1].trim() : topic;
          
          // Get user_id from auth header
          // In a real app, you'd extract the user ID from auth. For now, let's use a placeholder
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
          
          // Save content to database
          const contentResult = await fetch(`${req.url.split('/functions/')[0]}/rest/v1/content`, {
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
              created_at: new Date().toISOString()
            }),
          });
          
          if (!contentResult.ok) {
            console.error("Failed to save content:", await contentResult.text());
          } else {
            console.log("Background content generation complete and saved, job ID:", jobId);
          }
          
        } catch (error) {
          console.error("Error in background generation task:", error);
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
    
    // Call the OpenRouter API with the selected model for search if search term is provided
    console.log("Calling OpenRouter API with initial model...");
    
    try {
      if (inputMode === "webSearch" && searchTerm) {
        // STEP 1: Use selected model to gather research information
        let searchResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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
            max_tokens: 16000,
          }),
        });

        // Improved error handling for search request
        if (!searchResponse.ok) {
          const errorText = await searchResponse.text();
          console.error(`Search API Error (${searchResponse.status}): ${errorText}`);
          
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: `Error with web search: ${errorText || `Status code ${searchResponse.status}`}` 
            }),
            { 
              status: 200, // Always return 200 but with error in body
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        let searchData = await searchResponse.json();
        
        if (!searchData || !searchData.choices || !searchData.choices[0] || !searchData.choices[0].message) {
          console.error("Invalid response structure from search API:", searchData);
          
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: "Invalid response from search API. Please try again or use manual input mode." 
            }),
            { 
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
        
        let searchResults = searchData.choices[0].message.content;
        console.log("Search completed. Now processing with Claude 3.7 Sonnet...");
        
        // STEP 2: Use Claude 3.7 Sonnet to create the final content
        const claudeSystemPrompt = `You are an expert SEO content writer. Your task is to create a high-quality, 
        SEO-optimized blog post based on the research information provided. The content should have a readability 
        level of grade 8, sound human-written, and follow best SEO practices to optimize for the keyword "${keyword}".
        
        The blog post should be written in a ${toneOfArticle || 'professional'} ${articleType || 'informational'} style, 
        aiming for approximately ${wordCount} words for ${intendedAudience || 'general readers'}.
        
        Include lists, tables, charts, pull quotes, and emojis when it makes sense. Always end with an SEO title and meta description.
        
        Your writing should be in-depth, comprehensive, and extremely detailed, using all the relevant information from the research provided.`;
        
        // Add additional context instructions if provided
        if (additionalContext) {
          claudeSystemPrompt += ` I've provided you with additional context information. If it contains business or company information, use it sparingly and only when it makes sense in the flow of the article. If appropriate, include subtle calls-to-action that feel natural within the content. Don't just dump all the information in one place - integrate it naturally throughout the article where relevant to the surrounding content.`;
        }
        
        // Add internal links instruction if requested
        if (includeInternalLinks && internalLinks && internalLinks.length > 0) {
          claudeSystemPrompt += ` Include relevant internal links from the provided list of URLs. Select 3-7 of the most relevant URLs based on the content and link to them naturally within the text using anchor text that is relevant to both the linked page and the context of your article.`;
        }
        
        let claudeUserPrompt = `I have conducted extensive research on the topic "${topic}" optimized for the keyword "${keyword}". 
        Here is the research data:
        
        ${searchResults}
        
        Using this research, write a comprehensive ${wordCount}-word SEO-optimized blog post about "${topic}" that's optimized 
        for the keyword "${keyword}". Make sure to include relevant sources from the research.
        
        Ensure the content:
        - Has a readability level of grade 8
        - Sounds natural and human-written
        - Follows best SEO practices
        - Is written in a ${toneOfArticle || 'professional'} ${articleType || 'informational'} style
        - Includes all relevant information from the research
        - Includes lists, tables, charts, and bold text where appropriate
        - Cites sources from the research where appropriate`;
        
        if (stylePreferences.length > 0) {
          claudeUserPrompt += `\n- Uses ${stylePreferences.join(", ")} style`;
        }
        
        // Add additional context with clear instructions
        if (additionalContext) {
          claudeUserPrompt += `
          
          Here is additional context information to incorporate throughout your article where relevant:
          
          ${additionalContext}
          
          Please weave this information naturally into the article where it makes sense. If it contains business or company information, use it sparingly and only when relevant. If appropriate, include subtle calls-to-action that feel natural within the content. Don't just dump all this information in one place - integrate it thoughtfully throughout the article.`;
        }
        
        // Add internal links if requested
        if (includeInternalLinks && internalLinks && internalLinks.length > 0) {
          claudeUserPrompt += `
          
          Include 3-7 relevant internal links from this list of URLs. Choose the most appropriate URLs that relate to the content and incorporate them naturally in the article:
          
          ${internalLinks.join('\n')}
          
          For each link, use descriptive and contextually relevant anchor text that helps both users and search engines understand what the linked page is about. Distribute the links evenly throughout the article.`;
        }
        
        if (includeHtmlElement) {
          claudeUserPrompt += `
          
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
          // Call the Claude 3.7 Sonnet model for final content generation
          let claudeResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
              'HTTP-Referer': 'https://contentgenius.app', 
              'X-Title': 'ContentGenius SEO Generator'
            },
            body: JSON.stringify({
              model: "anthropic/claude-3.7-sonnet",
              messages: [
                { role: "system", content: claudeSystemPrompt },
                { role: "user", content: claudeUserPrompt }
              ],
              temperature: 0.7,
              max_tokens: 128000,
            }),
          });

          if (!claudeResponse.ok) {
            const errorText = await claudeResponse.text();
            console.error("Error from Claude 3.7 Sonnet:", errorText);
            
            // Fall back to using the search results if Claude fails
            generatedContent = searchResults;
            console.log("Falling back to search results due to Claude 3.7 Sonnet failure");
            
            // Send a more detailed error message including the fallback
            return new Response(
              JSON.stringify({ 
                success: true, 
                content: generatedContent,
                warning: "Used search results directly due to error generating final content with Claude 3.7 Sonnet."
              }),
              { 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            );
          } else {
            let claudeData = await claudeResponse.json();
            
            if (!claudeData || !claudeData.choices || !claudeData.choices[0] || !claudeData.choices[0].message) {
              console.error("Invalid response structure from Claude 3.7 Sonnet:", claudeData);
              
              // Fall back to using the search results
              generatedContent = searchResults;
              console.log("Falling back to search results due to invalid Claude 3.7 Sonnet response");
              
              return new Response(
                JSON.stringify({ 
                  success: true, 
                  content: generatedContent,
                  warning: "Used search results directly due to error formatting final content with Claude 3.7 Sonnet."
                }),
                { 
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                }
              );
            } else {
              generatedContent = claudeData.choices[0].message.content;
              console.log("Successfully generated content with Claude 3.7 Sonnet");
            }
          }
        } catch (claudeError) {
          console.error("Error during Claude 3.7 Sonnet call:", claudeError);
          
          // Fall back to using the search results if Claude call fails
          generatedContent = searchResults;
          console.log("Falling back to search results due to Claude 3.7 Sonnet call error:", claudeError.message);
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              content: generatedContent,
              warning: "Used search results directly due to processing error with Claude 3.7 Sonnet."
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
      } else {
        // For manual input or non-search requests, use the specified or default model directly
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
            // Set max_tokens to 128000 specifically for Claude 3.7 Sonnet
            max_tokens: requestedModel.includes("claude-3.7-sonnet") ? 128000 : 16000,
          }),
        });

        // Improved error handling for model request
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`API Error (${response.status}): ${errorText}`);
          
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: `Error generating content: ${errorText || `Status code ${response.status}`}` 
            }),
            { 
              status: 200, // Always return 200 but with error in body
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        const data = await response.json();
        
        if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
          console.error("Invalid response structure from API:", data);
          
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: "Invalid response from content generation API. Please try again." 
            }),
            { 
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
        
        generatedContent = data.choices[0].message.content;
      }
      
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
          status: 200, // Always return 200 with error in body
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
  } catch (error) {
    console.error("Error in generate-seo-content function:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "An unexpected error occurred"
      }),
      { 
        status: 200, // Always return 200 with error in body
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
