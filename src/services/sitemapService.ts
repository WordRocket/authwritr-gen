
import { supabase } from "@/integrations/supabase/client";

export interface SitemapResult {
  success: boolean;
  urls?: string[];
  count?: number;
  error?: string;
  message?: string;
}

export const scrapeSitemap = async (sitemapUrl: string): Promise<SitemapResult> => {
  try {
    console.log("Scraping sitemap:", sitemapUrl);
    
    // Normalize URL if it doesn't have a protocol
    const normalizedUrl = sitemapUrl.startsWith("http") ? sitemapUrl : `https://${sitemapUrl}`;
    
    const { data, error } = await supabase.functions.invoke("scrape-sitemap", {
      body: {
        sitemapUrl: normalizedUrl
      },
    });

    if (error) {
      console.error("Error invoking scrape-sitemap function:", error);
      return {
        success: false,
        error: `Failed to scrape sitemap: ${error.message}`
      };
    }

    if (!data) {
      return {
        success: false,
        error: "No response received from the sitemap scraper"
      };
    }

    if (!data.success) {
      return {
        success: false,
        error: data.error || "Failed to scrape sitemap"
      };
    }

    return data as SitemapResult;
  } catch (error) {
    console.error("Error in scrapeSitemap:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return {
      success: false,
      error: errorMessage
    };
  }
};

export const saveUrlsToLocalStorage = (urls: string[]): void => {
  try {
    localStorage.setItem('sitemapUrls', JSON.stringify(urls));
    localStorage.setItem('sitemapLastUpdated', new Date().toISOString());
  } catch (error) {
    console.error("Error saving URLs to localStorage:", error);
  }
};

export const getUrlsFromLocalStorage = (): { urls: string[], lastUpdated: string | null } => {
  try {
    const urlsJson = localStorage.getItem('sitemapUrls');
    const lastUpdated = localStorage.getItem('sitemapLastUpdated');
    
    if (!urlsJson) {
      return { urls: [], lastUpdated: null };
    }
    
    return { 
      urls: JSON.parse(urlsJson), 
      lastUpdated 
    };
  } catch (error) {
    console.error("Error retrieving URLs from localStorage:", error);
    return { urls: [], lastUpdated: null };
  }
};

export const clearStoredUrls = (): void => {
  try {
    localStorage.removeItem('sitemapUrls');
    localStorage.removeItem('sitemapLastUpdated');
  } catch (error) {
    console.error("Error clearing stored URLs:", error);
  }
};
