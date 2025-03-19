
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
    sitemapUrl,
    setSitemapUrl,
    isLoading,
    error,
    success,
    lastUpdatedDate,
    storedUrls,
    handleSitemapSubmit,
    handleClearUrls,
    guessAndSetSitemapUrl
  } = useSitemapScraper(onUrlsScraped);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await handleSitemapSubmit(e);
    setIsOpen(false);
  };

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="bg-muted/40 border rounded-lg overflow-hidden"
    >
      <div className="flex justify-between items-center p-4">
        <SitemapInfoHeader 
          storedUrls={storedUrls} 
          lastUpdatedDate={lastUpdatedDate} 
        />
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
            sitemapUrl={sitemapUrl} 
            onSitemapUrlChange={setSitemapUrl} 
            onSubmit={handleSubmit} 
            onUrlBlur={(e) => guessAndSetSitemapUrl(e.target.value)}
            isLoading={isLoading} 
          />
          
          <SitemapActionButtons 
            sitemapUrl={sitemapUrl}
            storedUrlsCount={storedUrls.length}
            onTryDifferentFormat={() => {/* Add implementation later */}}
            onClearUrls={handleClearUrls}
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
