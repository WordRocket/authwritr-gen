
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
    const { topic, targetKeyword, articleType, toneOfArticle, intendedAudience, additionalContext, wordCount, includeFirstPerson, includeAnecdotes, includeHook, includeStories, includeHtmlElement } = await req.json();

    // This is a mock implementation - replace with actual AI service call later
    console.log("Received request to generate SEO content:", { 
      topic, 
      targetKeyword, 
      articleType,
      wordCount
    });

    // Build a mock response based on the input parameters
    const keyword = targetKeyword || topic;
    
    let generatedContent = `# ${topic}\n\n`;
    
    if (includeHook) {
      generatedContent += `Did you know that understanding ${keyword} is crucial for success in today's competitive landscape? Let's dive deep into this topic.\n\n`;
    }
    
    generatedContent += `## Introduction to ${topic}\n\n`;
    generatedContent += `${topic} is an essential aspect of modern business strategy. This comprehensive guide explores everything you need to know about ${keyword}.\n\n`;
    
    generatedContent += `## Why ${topic} Matters\n\n`;
    generatedContent += `Understanding ${keyword} can dramatically improve your results. Here are some key points:\n\n`;
    generatedContent += `- Point 1 about ${keyword}\n`;
    generatedContent += `- Point 2 about ${keyword}\n`;
    generatedContent += `- Point 3 about ${keyword}\n\n`;
    
    if (includeAnecdotes || includeStories) {
      generatedContent += `## Real-World Example\n\n`;
      generatedContent += `One of our clients implemented a ${keyword} strategy and saw remarkable results. Their engagement increased by 240% in just three months.\n\n`;
    }
    
    generatedContent += `## Best Practices for ${topic}\n\n`;
    generatedContent += `1. Always research your ${keyword} thoroughly\n`;
    generatedContent += `2. Implement a structured approach to ${keyword}\n`;
    generatedContent += `3. Regularly update your ${keyword} strategy\n\n`;
    
    if (includeHtmlElement) {
      generatedContent += `## Interactive Element\n\n`;
      generatedContent += "```html\n";
      generatedContent += `<div class="interactive-element" style="border: 1px solid #ddd; padding: 20px; border-radius: 5px;">\n`;
      generatedContent += `  <h3>${topic} Checklist</h3>\n`;
      generatedContent += `  <ul class="checklist">\n`;
      generatedContent += `    <li><input type="checkbox" id="item1"> <label for="item1">Research ${keyword}</label></li>\n`;
      generatedContent += `    <li><input type="checkbox" id="item2"> <label for="item2">Create ${keyword} strategy</label></li>\n`;
      generatedContent += `    <li><input type="checkbox" id="item3"> <label for="item3">Implement ${keyword} best practices</label></li>\n`;
      generatedContent += `    <li><input type="checkbox" id="item4"> <label for="item4">Monitor ${keyword} performance</label></li>\n`;
      generatedContent += `  </ul>\n`;
      generatedContent += `</div>\n`;
      generatedContent += "```\n\n";
    }
    
    generatedContent += `## Conclusion\n\n`;
    generatedContent += `${topic} is a critical component of success in today's marketplace. By following the guidelines outlined in this article, you'll be well on your way to mastering ${keyword}.\n\n`;
    
    generatedContent += `## SEO Metadata\n\n`;
    generatedContent += `**Title:** Complete Guide to ${topic}: Master ${keyword} in ${new Date().getFullYear()}\n`;
    generatedContent += `**Meta Description:** Learn everything about ${topic} in our comprehensive guide. Includes tips, examples, and best practices for ${keyword}.`;
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
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
