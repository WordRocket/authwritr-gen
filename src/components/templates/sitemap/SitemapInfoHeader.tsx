
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";

interface SitemapInfoHeaderProps {
  storedUrls: string[];
  lastUpdatedDate: string | null;
  baseDomain?: string | null;
}

export function SitemapInfoHeader({ storedUrls, lastUpdatedDate, baseDomain }: SitemapInfoHeaderProps) {
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
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-medium">Internal Links from Sitemap</h3>
        {storedUrls.length > 0 && (
          <Badge variant="outline" className="ml-2">
            {storedUrls.length} URLs
          </Badge>
        )}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="size-6">
                <Info className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-80">
              <p>Enter your sitemap URL (typically ends with sitemap.xml). Example: https://example.com/sitemap.xml</p>
              <p className="mt-2">Common sitemap locations:</p>
              <ul className="list-disc ml-5 mt-1">
                <li>https://example.com/sitemap.xml</li>
                <li>https://example.com/sitemap_index.xml</li>
                <li>https://example.com/wp-sitemap.xml (WordPress)</li>
              </ul>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      {lastUpdatedDate && (
        <p className="text-sm text-muted-foreground">
          Last updated: {formatLastUpdated()}
        </p>
      )}
      {baseDomain && (
        <p className="text-xs text-muted-foreground mt-1">
          Domain: {baseDomain}
        </p>
      )}
    </div>
  );
}
