
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
  backgroundGeneration?: boolean;
  onBackgroundGenerationToggle?: (enabled: boolean) => void;
}

export function SitemapStatusAlerts({ 
  error, 
  success, 
  lastUpdatedDate, 
  storedUrls = [],
  onInternalLinksToggle,
  includeInternalLinks = false,
  backgroundGeneration = false,
  onBackgroundGenerationToggle
}: SitemapStatusAlertsProps) {
  const formattedDate = lastUpdatedDate 
    ? formatDistanceToNow(new Date(lastUpdatedDate), { addSuffix: true })
    : null;
  
  const handleToggleChange = (checked: boolean) => {
    if (onInternalLinksToggle) {
      onInternalLinksToggle(checked);
    }
  };

  const handleBackgroundToggleChange = (checked: boolean) => {
    if (onBackgroundGenerationToggle) {
      onBackgroundGenerationToggle(checked);
    }
  };

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
        <div className="flex items-center space-x-2 py-2 mt-2">
          <Switch 
            id="include-internal-links" 
            checked={includeInternalLinks}
            onCheckedChange={handleToggleChange}
          />
          <Label htmlFor="include-internal-links" className="text-sm font-medium">
            Include {storedUrls.length} URLs as internal links in generated content
          </Label>
        </div>
      )}

      {onBackgroundGenerationToggle && (
        <div className="flex items-center space-x-2 py-2 mt-2">
          <Switch 
            id="background-generation" 
            checked={backgroundGeneration}
            onCheckedChange={handleBackgroundToggleChange}
          />
          <Label htmlFor="background-generation" className="text-sm font-medium">
            Generate in background and save automatically to My Content
          </Label>
        </div>
      )}
    </>
  );
}
