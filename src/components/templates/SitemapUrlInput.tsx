
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Trash2, RefreshCw } from "lucide-react";
import { scrapeSitemap, saveUrlsToLocalStorage, getUrlsFromLocalStorage, clearStoredUrls } from "@/services/sitemapService";
import { Badge } from "@/components/ui/badge";

interface SitemapUrlInputProps {
  onUrlsScraped?: (count: number) => void;
}

export function SitemapUrlInput({ onUrlsScraped }: SitemapUrlInputProps) {
  const [sitemapUrl, setSitemapUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const { urls, lastUpdated } = getUrlsFromLocalStorage();
  const [storedUrls, setStoredUrls] = useState(urls);
  const [lastUpdatedDate, setLastUpdatedDate] = useState<string | null>(lastUpdated);

  const handleSitemapSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sitemapUrl) {
      setError("Please enter a sitemap URL");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const result = await scrapeSitemap(sitemapUrl);
      
      if (result.success && result.urls && result.urls.length > 0) {
        saveUrlsToLocalStorage(result.urls);
        setStoredUrls(result.urls);
        setLastUpdatedDate(new Date().toISOString());
        setSuccess(`Successfully scraped ${result.urls.length} URLs from sitemap`);
        
        if (onUrlsScraped) {
          onUrlsScraped(result.urls.length);
        }
      } else {
        setError(result.error || "No URLs found in the sitemap");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to scrape sitemap");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleClearUrls = () => {
    clearStoredUrls();
    setStoredUrls([]);
    setLastUpdatedDate(null);
    setSuccess("Stored URLs have been cleared");
    
    if (onUrlsScraped) {
      onUrlsScraped(0);
    }
  };
  
  const formatLastUpdated = () => {
    if (!lastUpdatedDate) return null;
    
    try {
      const date = new Date(lastUpdatedDate);
      return date.toLocaleString();
    } catch (e) {
      return lastUpdatedDate;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-medium">Internal Links from Sitemap</h3>
          {storedUrls.length > 0 && (
            <Badge variant="outline" className="ml-2">
              {storedUrls.length} URLs
            </Badge>
          )}
        </div>
        {lastUpdatedDate && (
          <p className="text-sm text-muted-foreground">
            Last updated: {formatLastUpdated()}
          </p>
        )}
      </div>

      <form onSubmit={handleSitemapSubmit} className="flex gap-2">
        <Input
          type="url"
          placeholder="Enter your sitemap URL (e.g., https://example.com/sitemap.xml)"
          value={sitemapUrl}
          onChange={(e) => setSitemapUrl(e.target.value)}
          className="flex-1"
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Scanning
            </>
          ) : (
            "Scan Sitemap"
          )}
        </Button>
      </form>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {storedUrls.length > 0 && (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSitemapUrl(storedUrls[0].replace("/sitemap.xml", "/sitemap_index.xml").replace("/sitemap_index.xml", "/sitemap.xml")}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Rescan
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearUrls}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear URLs
          </Button>
        </div>
      )}
    </div>
  );
}
