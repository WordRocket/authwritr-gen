
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface SitemapStatusAlertsProps {
  error: string | null;
  success: string | null;
  lastUpdatedDate: string | null;
  storedUrls?: string[];
  onInternalLinksToggle?: (enabled: boolean) => void;
  includeInternalLinks?: boolean;
  sitemapUrl?: string;
}

export function SitemapStatusAlerts({ 
  error, 
  success, 
  lastUpdatedDate, 
  storedUrls = [],
  onInternalLinksToggle,
  includeInternalLinks = false,
  sitemapUrl = ""
}: SitemapStatusAlertsProps) {
  const formattedDate = lastUpdatedDate 
    ? formatDistanceToNow(new Date(lastUpdatedDate), { addSuffix: true })
    : null;
  
  const handleToggleChange = (checked: boolean) => {
    if (onInternalLinksToggle) {
      onInternalLinksToggle(checked);
    }
  };

  // Extract the base domain from the sitemap URL for display
  const getBaseDomain = (url: string) => {
    try {
      if (!url) return "";
      // Remove protocol and get domain
      const domainMatch = url.match(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)/i);
      return domainMatch ? domainMatch[1] : "";
    } catch (e) {
      return "";
    }
  };

  const baseDomain = getBaseDomain(sitemapUrl);

  return (
    <>
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
      
      {formattedDate && !error && !success && (
        <Alert variant="default" className="bg-muted/50 text-muted-foreground border-muted">
          <Info className="h-4 w-4 mr-2" />
          <AlertDescription>URLs were last updated {formattedDate}</AlertDescription>
        </Alert>
      )}

      {storedUrls.length > 0 && (
        <div className="space-y-2">
          {baseDomain && (
            <div className="text-xs text-muted-foreground ml-1">
              Scraped from: {baseDomain}
            </div>
          )}
          <div className="flex items-center space-x-2 py-2">
            <Switch 
              id="include-internal-links" 
              checked={includeInternalLinks}
              onCheckedChange={handleToggleChange}
            />
            <Label htmlFor="include-internal-links" className="text-sm font-medium">
              Include relevant internal links throughout the article
            </Label>
          </div>
        </div>
      )}
    </>
  );
}
