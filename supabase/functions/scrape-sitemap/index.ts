
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

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
    
    // Parse the XML content
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlContent, "text/xml");
    
    if (!doc) {
      const errorMessage = "Failed to parse XML content";
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

    // Extract URLs from the sitemap
    const urls = [];
    const locationNodes = doc.getElementsByTagName("loc");
    
    console.log(`Found ${locationNodes.length} URL nodes in the sitemap`);
    
    for (let i = 0; i < locationNodes.length; i++) {
      const url = locationNodes[i].textContent;
      if (url) {
        urls.push(url.trim());
      }
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
