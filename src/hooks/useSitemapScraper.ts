
import { useState, useEffect } from "react";
import { scrapeSitemap, saveUrlsToLocalStorage, getUrlsFromLocalStorage, clearStoredUrls } from "@/services/sitemapService";
import { useToast } from "@/hooks/use-toast";

export interface UseSitemapScraperResult {
  sitemapUrl: string;
  setSitemapUrl: (url: string) => void;
  isLoading: boolean;
  error: string | null;
  success: string | null;
  storedUrls: string[];
  lastUpdatedDate: string | null;
  handleSitemapSubmit: (e: React.FormEvent) => Promise<void>;
  handleClearUrls: () => void;
  guessAndSetSitemapUrl: (url: string) => void;
  trySitemapIndex: () => void;
}

export function useSitemapScraper(onUrlsScraped?: (count: number) => void): UseSitemapScraperResult {
  const [sitemapUrl, setSitemapUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const { urls: initialUrls, lastUpdated } = getUrlsFromLocalStorage();
  const [storedUrls, setStoredUrls] = useState(initialUrls);
  const [lastUpdatedDate, setLastUpdatedDate] = useState<string | null>(lastUpdated);
  const { toast } = useToast();

  // Notify parent component of initial URL count on mount
  useEffect(() => {
    if (onUrlsScraped && initialUrls.length > 0) {
      onUrlsScraped(initialUrls.length);
    }
  }, []);

  const handleSitemapSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sitemapUrl) {
      setError("Please enter a sitemap URL");
      return;
    }
    
    // Check if URL contains sitemap.xml or sitemap_index.xml, if not, suggest adding it
    if (!sitemapUrl.includes("sitemap") && !sitemapUrl.includes(".xml")) {
      // Add trailing slash if needed
      const baseUrl = sitemapUrl.endsWith("/") ? sitemapUrl : `${sitemapUrl}/`;
      const newUrl = `${baseUrl}sitemap.xml`;
      setSitemapUrl(newUrl);
      toast({
        title: "URL Updated",
        description: "We've updated your URL to include sitemap.xml. Please try again if this looks correct.",
      });
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      toast({
        title: "Processing",
        description: "Scanning sitemap, please wait...",
      });
      
      const result = await scrapeSitemap(sitemapUrl);
      
      if (result.success && result.urls && result.urls.length > 0) {
        saveUrlsToLocalStorage(result.urls);
        setStoredUrls(result.urls);
        setLastUpdatedDate(new Date().toISOString());
        
        const successMessage = result.message 
          ? `${result.message}: Found ${result.urls.length} URLs` 
          : `Successfully scraped ${result.urls.length} URLs from sitemap`;
        
        setSuccess(successMessage);
        toast({
          title: "Sitemap Scraped",
          description: `Successfully retrieved ${result.urls.length} URLs from the sitemap.`,
        });
        
        if (onUrlsScraped) {
          onUrlsScraped(result.urls.length);
        }
      } else {
        setError(result.error || "No URLs found in the sitemap");
        toast({
          variant: "destructive",
          title: "Scraping Failed",
          description: result.error || "No URLs found in the sitemap",
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to scrape sitemap";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Scraping Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleClearUrls = () => {
    clearStoredUrls();
    setStoredUrls([]);
    setLastUpdatedDate(null);
    setSuccess("Stored URLs have been cleared");
    toast({
      title: "URLs Cleared",
      description: "All stored URLs have been removed.",
    });
    
    if (onUrlsScraped) {
      onUrlsScraped(0);
    }
  };
  
  const guessAndSetSitemapUrl = (url: string) => {
    // Try to guess the sitemap URL from the website URL
    if (!url) return;
    
    // Remove trailing slash if exists
    const baseUrl = url.endsWith("/") ? url.slice(0, -1) : url;
    
    // If URL already has protocol, use as is, otherwise add https://
    const normalizedUrl = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`;
    
    // Set the sitemap URL
    setSitemapUrl(`${normalizedUrl}/sitemap.xml`);
    toast({
      title: "URL Updated",
      description: "We've updated the URL to include sitemap.xml",
    });
  };
  
  const trySitemapIndex = () => {
    if (!sitemapUrl) return;
    
    // Replace sitemap.xml with sitemap_index.xml or vice versa
    let newUrl = sitemapUrl;
    if (sitemapUrl.includes('sitemap.xml')) {
      newUrl = sitemapUrl.replace('sitemap.xml', 'sitemap_index.xml');
    } else if (sitemapUrl.includes('sitemap_index.xml')) {
      newUrl = sitemapUrl.replace('sitemap_index.xml', 'sitemap.xml');
    } else if (sitemapUrl.endsWith('/')) {
      newUrl = `${sitemapUrl}sitemap_index.xml`;
    } else {
      newUrl = `${sitemapUrl}/sitemap_index.xml`;
    }
    
    setSitemapUrl(newUrl);
    toast({
      title: "Try Different Format",
      description: "Updated to try a different sitemap format",
    });
  };

  return {
    sitemapUrl,
    setSitemapUrl,
    isLoading,
    error,
    success,
    storedUrls,
    lastUpdatedDate,
    handleSitemapSubmit,
    handleClearUrls,
    guessAndSetSitemapUrl,
    trySitemapIndex
  };
}
