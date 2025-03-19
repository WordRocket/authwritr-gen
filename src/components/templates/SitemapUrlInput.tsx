
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Globe, RefreshCw } from "lucide-react";
import { SitemapStatusAlerts } from "./sitemap/SitemapStatusAlerts";
import { SitemapInfoHeader } from "./sitemap/SitemapInfoHeader";
import { SitemapActionButtons } from "./sitemap/SitemapActionButtons";
import { SitemapUrlForm } from "./sitemap/SitemapUrlForm";
import { useSitemapScraper } from "@/hooks/useSitemapScraper";
import { useToast } from "@/hooks/use-toast";

interface SitemapUrlInputProps {
  onUrlsScraped: (count: number) => void;
  onInternalLinksToggle?: (enabled: boolean) => void;
  includeInternalLinks?: boolean;
  backgroundGeneration?: boolean;
  onBackgroundGenerationToggle?: (enabled: boolean) => void;
}

export function SitemapUrlInput({ 
  onUrlsScraped, 
  onInternalLinksToggle,
  includeInternalLinks = false,
  backgroundGeneration = false,
  onBackgroundGenerationToggle
}: SitemapUrlInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  
  const { 
    url,
    setUrl,
    isLoading,
    error,
    success,
    lastUpdatedDate,
    storedUrls,
    scrapeSitemap,
    clearUrlData
  } = useSitemapScraper();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = await scrapeSitemap();
    if (result && result.urls.length > 0) {
      onUrlsScraped(result.urls.length);
      setIsOpen(false);
      
      toast({
        title: "Sitemap Scraped",
        description: `Successfully extracted ${result.urls.length} URLs from sitemap`,
      });
    }
  };

  const handleClear = () => {
    clearUrlData();
    toast({
      title: "Sitemap Data Cleared",
      description: "All scraped URLs have been removed",
    });
  };

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="bg-muted/40 border rounded-lg overflow-hidden"
    >
      <div className="flex justify-between items-center p-4">
        <SitemapInfoHeader storedUrls={storedUrls} isOpen={isOpen} />
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm">
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            <span className="sr-only">Toggle</span>
          </Button>
        </CollapsibleTrigger>
      </div>

      <CollapsibleContent>
        <div className="p-4 pt-0 space-y-4">
          <SitemapStatusAlerts 
            error={error} 
            success={success} 
            lastUpdatedDate={lastUpdatedDate}
            storedUrls={storedUrls}
            onInternalLinksToggle={onInternalLinksToggle}
            includeInternalLinks={includeInternalLinks}
            backgroundGeneration={backgroundGeneration}
            onBackgroundGenerationToggle={onBackgroundGenerationToggle}
          />
          
          <SitemapUrlForm 
            url={url} 
            setUrl={setUrl} 
            handleSubmit={handleSubmit} 
            isLoading={isLoading} 
          />
          
          <SitemapActionButtons 
            storedUrls={storedUrls}
            handleClear={handleClear}
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
