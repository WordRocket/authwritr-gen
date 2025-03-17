
import { Button } from "@/components/ui/button";
import { RefreshCw, Trash2 } from "lucide-react";

interface SitemapActionButtonsProps {
  sitemapUrl: string;
  storedUrlsCount: number;
  onTryDifferentFormat: () => void;
  onClearUrls: () => void;
}

export function SitemapActionButtons({
  sitemapUrl,
  storedUrlsCount,
  onTryDifferentFormat,
  onClearUrls
}: SitemapActionButtonsProps) {
  return (
    <div className="flex justify-end gap-2">
      {sitemapUrl && (
        <Button
          variant="outline"
          size="sm"
          onClick={onTryDifferentFormat}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Different Format
        </Button>
      )}
      
      {storedUrlsCount > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={onClearUrls}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Clear URLs
        </Button>
      )}
    </div>
  );
}
