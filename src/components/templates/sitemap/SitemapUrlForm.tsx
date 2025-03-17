
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface SitemapUrlFormProps {
  sitemapUrl: string;
  onSitemapUrlChange: (url: string) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onUrlBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  isLoading: boolean;
}

export function SitemapUrlForm({ 
  sitemapUrl, 
  onSitemapUrlChange, 
  onSubmit, 
  onUrlBlur, 
  isLoading 
}: SitemapUrlFormProps) {
  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <Input
        type="url"
        placeholder="Enter sitemap URL (e.g., https://example.com/sitemap.xml)"
        value={sitemapUrl}
        onChange={(e) => onSitemapUrlChange(e.target.value)}
        onBlur={onUrlBlur}
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
  );
}
