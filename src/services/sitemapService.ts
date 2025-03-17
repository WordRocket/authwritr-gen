
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
    const { data, error } = await supabase.functions.invoke("scrape-sitemap", {
      body: {
        sitemapUrl
      },
    });

    if (error) {
      console.error("Error invoking scrape-sitemap function:", error);
      throw new Error(`Failed to scrape sitemap: ${error.message}`);
    }

    if (!data || !data.success) {
      const errorMessage = data?.error || "Failed to scrape sitemap";
      throw new Error(errorMessage);
    }

    return data as SitemapResult;
  } catch (error) {
    console.error("Error in scrapeSitemap:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred"
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
