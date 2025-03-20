
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface SitemapStatusAlertsProps {
  error: string | null;
  success: string | null;
  lastUpdatedDate: string | null;
  storedUrls?: string[];
  onInternalLinksToggle?: (enabled: boolean) => void;
  includeInternalLinks?: boolean;
  sitemapUrl?: string;
  baseDomain?: string | null;
}

export function SitemapStatusAlerts({ 
  error, 
  success, 
  lastUpdatedDate, 
  storedUrls = [],
  onInternalLinksToggle,
  includeInternalLinks = false,
  sitemapUrl = "",
  baseDomain = null
}: SitemapStatusAlertsProps) {
  const formattedDate = lastUpdatedDate 
    ? formatDistanceToNow(new Date(lastUpdatedDate), { addSuffix: true })
    : null;
  
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  
  const handleToggleChange = (checked: boolean) => {
    if (onInternalLinksToggle) {
      onInternalLinksToggle(checked);
    }
  };

  return (
    <>
      {error && (
        <Alert variant="destructive" className="cursor-pointer" onClick={() => setErrorDialogOpen(true)}>
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>
            {error.length > 100 ? `${error.substring(0, 100)}...` : error}
            {error.length > 100 && <span className="underline ml-1">See details</span>}
          </AlertDescription>
        </Alert>
      )}

      <Dialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Scraping Failed</DialogTitle>
          </DialogHeader>
          <DialogDescription className="mt-2">
            {error}
          </DialogDescription>
          <div className="mt-4 text-sm">
            <p className="font-medium">Troubleshooting tips:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Try using the "Try Different Format" button to switch to a different sitemap format</li>
              <li>Check if the sitemap URL is correct</li>
              <li>The site might have a slow server or very large sitemap</li>
              <li>Some websites restrict access to their sitemaps</li>
            </ul>
          </div>
          <Button className="mt-2" onClick={() => setErrorDialogOpen(false)}>Close</Button>
        </DialogContent>
      </Dialog>

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      
      {formattedDate && !error && !success && (
        <Alert variant="default" className="bg-muted/50 text-muted-foreground border-muted">
          <Info className="h-4 w-4 mr-2" />
          <AlertDescription>
            URLs were last updated {formattedDate}
            {baseDomain && (
              <span className="ml-1 text-xs text-muted-foreground block">
                Source: {baseDomain}
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {storedUrls.length > 0 && (
        <div className="space-y-2">
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
