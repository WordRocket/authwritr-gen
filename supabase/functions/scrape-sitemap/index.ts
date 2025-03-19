
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log("Received request to scrape-sitemap function");
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error("Error parsing request body:", e);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid request body: " + (e instanceof Error ? e.message : String(e))
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const { sitemapUrl } = body;
    
    if (!sitemapUrl) {
      console.error("Missing sitemap URL in request");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Sitemap URL is required" 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Fetching sitemap from: ${sitemapUrl}`);
    
    // Normalize URL - ensure it has a protocol
    const normalizedUrl = sitemapUrl.startsWith('http') 
      ? sitemapUrl 
      : `https://${sitemapUrl}`;
    
    // Fetch the sitemap XML with a longer timeout
    let response;
    try {
      response = await fetch(normalizedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ContentGeniusBot/1.0; +https://contentgenius.com)'
        },
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });
    } catch (error) {
      console.error("Fetch error:", error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to fetch sitemap: ${error instanceof Error ? error.message : String(error)}` 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    if (!response.ok) {
      const errorMessage = `Failed to fetch sitemap: ${response.status} ${response.statusText}`;
      console.error(errorMessage);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: errorMessage 
        }),
        { 
          status: 200,  // Always return 200 to handle errors in client
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const contentType = response.headers.get('content-type');
    console.log(`Content-Type: ${contentType}`);
    
    // More lenient content type checking
    if (contentType && 
        !contentType.includes('xml') && 
        !contentType.includes('text/plain') && 
        !contentType.includes('text/html') && 
        !contentType.includes('application/xml') &&
        !contentType.includes('application/xhtml+xml')) {
      console.log(`Unexpected content type: ${contentType}`);
    }

    let xmlContent;
    try {
      xmlContent = await response.text();
      console.log(`Received content of length: ${xmlContent.length}`);
      
      if (xmlContent.length === 0) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Received empty response from the server" 
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    } catch (error) {
      console.error("Error reading response:", error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Error reading sitemap content: ${error instanceof Error ? error.message : String(error)}` 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // First, check if it's a sitemap index (contains other sitemaps)
    if (xmlContent.includes('<sitemapindex') || xmlContent.includes('<sitemap>')) {
      console.log("Detected sitemap index, extracting sitemap URLs");
      const sitemapUrls = [];
      
      // Extract sitemap URLs
      const sitemapLocRegex = /<sitemap>[\s\S]*?<loc>(.*?)<\/loc>[\s\S]*?<\/sitemap>/g;
      let match;
      
      while ((match = sitemapLocRegex.exec(xmlContent)) !== null) {
        if (match[1]) {
          sitemapUrls.push(match[1].trim());
        }
      }
      
      // If no sitemaps found with the complex pattern, try a simpler one
      if (sitemapUrls.length === 0) {
        const simpleSitemapLocRegex = /<loc>(.*?)<\/loc>/g;
        while ((match = simpleSitemapLocRegex.exec(xmlContent)) !== null) {
          if (match[1] && match[1].includes('.xml')) {
            sitemapUrls.push(match[1].trim());
          }
        }
      }
      
      console.log(`Found ${sitemapUrls.length} sitemaps in the index`);
      
      if (sitemapUrls.length > 0) {
        // Fetch first sitemap from the index
        const firstSitemapUrl = sitemapUrls[0];
        console.log(`Fetching first sitemap from index: ${firstSitemapUrl}`);
        
        let sitemapResponse;
        try {
          sitemapResponse = await fetch(firstSitemapUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; ContentGeniusBot/1.0; +https://contentgenius.com)'
            },
            signal: AbortSignal.timeout(30000) // 30 second timeout
          });
        } catch (error) {
          console.error("Error fetching sitemap from index:", error);
          // Return the original sitemap index URLs instead
          return new Response(
            JSON.stringify({ 
              success: true, 
              urls: sitemapUrls,
              count: sitemapUrls.length,
              message: "Retrieved URLs from sitemap index"
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
        
        if (!sitemapResponse.ok) {
          console.log(`Failed to fetch sitemap from index: ${sitemapResponse.status}`);
          // Return the original sitemap index URLs instead
          return new Response(
            JSON.stringify({ 
              success: true, 
              urls: sitemapUrls,
              count: sitemapUrls.length,
              message: "Retrieved URLs from sitemap index"
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
        
        const sitemapContent = await sitemapResponse.text();
        return extractUrlsFromSitemap(sitemapContent, corsHeaders);
      }
    }
    
    // Regular sitemap processing
    return extractUrlsFromSitemap(xmlContent, corsHeaders);
    
  } catch (error) {
    console.error("Error processing sitemap:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "An unexpected error occurred" 
      }),
      { 
        status: 200, // Always return 200 to handle errors in client
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function extractUrlsFromSitemap(xmlContent, corsHeaders) {
  // Try multiple regex patterns to extract URLs
  let urls = [];
  
  try {
    // Pattern 1: Standard <url><loc> format
    const urlLocRegex = /<url>[\s\S]*?<loc>(.*?)<\/loc>[\s\S]*?<\/url>/g;
    let match;
    
    while ((match = urlLocRegex.exec(xmlContent)) !== null) {
      if (match[1]) {
        urls.push(match[1].trim());
      }
    }
    
    console.log(`Pattern 1 found ${urls.length} URLs`);
    
    // Pattern 2: Simple <loc> tags (if Pattern 1 fails)
    if (urls.length === 0) {
      const simpleLocRegex = /<loc>(.*?)<\/loc>/g;
      while ((match = simpleLocRegex.exec(xmlContent)) !== null) {
        if (match[1]) {
          // Filter out sitemap.xml URLs to avoid confusion
          if (!match[1].endsWith('sitemap.xml') && !match[1].includes('sitemap_')) {
            urls.push(match[1].trim());
          }
        }
      }
      console.log(`Pattern 2 found ${urls.length} URLs`);
    }
    
    // Pattern 3: HTML links (for non-standard sitemaps)
    if (urls.length === 0 && xmlContent.includes('<a href=')) {
      const hrefRegex = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>/g;
      while ((match = hrefRegex.exec(xmlContent)) !== null) {
        if (match[1] && !match[1].startsWith('#') && !match[1].includes('javascript:')) {
          urls.push(match[1].trim());
        }
      }
      console.log(`Pattern 3 found ${urls.length} URLs`);
    }
    
    // If we still have no URLs, try looking for any http/https links in the content
    if (urls.length === 0) {
      const rawUrlRegex = /(https?:\/\/[^\s"'<>()]+)/g;
      while ((match = rawUrlRegex.exec(xmlContent)) !== null) {
        if (match[1]) {
          urls.push(match[1].trim());
        }
      }
      console.log(`Pattern 4 found ${urls.length} URLs`);
    }
    
    // Filter out any duplicate URLs
    urls = [...new Set(urls)];
    
    // Filter out non-webpage URLs (common resource files)
    urls = urls.filter(url => {
      const lowerUrl = url.toLowerCase();
      return !lowerUrl.endsWith('.css') && 
             !lowerUrl.endsWith('.js') && 
             !lowerUrl.endsWith('.png') && 
             !lowerUrl.endsWith('.jpg') && 
             !lowerUrl.endsWith('.jpeg') && 
             !lowerUrl.endsWith('.gif') && 
             !lowerUrl.endsWith('.svg') && 
             !lowerUrl.endsWith('.ico') && 
             !lowerUrl.endsWith('.woff') && 
             !lowerUrl.endsWith('.woff2') && 
             !lowerUrl.endsWith('.ttf') && 
             !lowerUrl.endsWith('.pdf');
    });
    
    console.log(`After filtering, found ${urls.length} valid URLs`);
    
    if (urls.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "No valid URLs found in the sitemap. The sitemap may be empty or in an unsupported format."
        }),
        { 
          status: 200, // Always return 200 to handle errors in client
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        urls: urls,
        count: urls.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error("Error extracting URLs:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Error extracting URLs from sitemap: ${error instanceof Error ? error.message : String(error)}`
      }),
      { 
        status: 200, // Always return 200 to handle errors in client
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}
