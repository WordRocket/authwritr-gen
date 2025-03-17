
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
    const { sitemapUrl } = await req.json();
    
    if (!sitemapUrl) {
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
    
    // Fetch the sitemap XML
    const response = await fetch(normalizedUrl);
    
    if (!response.ok) {
      const errorMessage = `Failed to fetch sitemap: ${response.status} ${response.statusText}`;
      console.error(errorMessage);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: errorMessage 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const contentType = response.headers.get('content-type');
    
    // Check if the response is XML or a valid sitemap format
    if (!contentType || (!contentType.includes('xml') && !contentType.includes('text/plain'))) {
      const errorMessage = `Invalid sitemap format. Expected XML, got: ${contentType}. Make sure you're using a sitemap URL (typically ends with sitemap.xml)`;
      console.error(errorMessage);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: errorMessage 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const xmlContent = await response.text();
    console.log(`Received XML content of length: ${xmlContent.length}`);
    
    // Simple regex-based XML parsing instead of using DOMParser
    // Look for URLs within <loc> tags
    const urls = [];
    const locRegex = /<loc>(.*?)<\/loc>/g;
    let match;
    
    while ((match = locRegex.exec(xmlContent)) !== null) {
      if (match[1]) {
        urls.push(match[1].trim());
      }
    }
    
    console.log(`Found ${urls.length} URL nodes in the sitemap`);
    
    if (urls.length === 0) {
      // If no URLs found with regex, try backup method for differently formatted sitemaps
      const urlRegex = /<url>[\s\S]*?<loc>(.*?)<\/loc>[\s\S]*?<\/url>/g;
      while ((match = urlRegex.exec(xmlContent)) !== null) {
        if (match[1]) {
          urls.push(match[1].trim());
        }
      }
      console.log(`After backup parsing: Found ${urls.length} URL nodes in the sitemap`);
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
    console.error("Error processing sitemap:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "An unexpected error occurred" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
