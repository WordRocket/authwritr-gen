
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface SitemapStatusAlertsProps {
  error: string | null;
  success: string | null;
  lastUpdatedDate: string | null;
}

export function SitemapStatusAlerts({ error, success, lastUpdatedDate }: SitemapStatusAlertsProps) {
  const formattedDate = lastUpdatedDate 
    ? formatDistanceToNow(new Date(lastUpdatedDate), { addSuffix: true })
    : null;

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
    </>
  );
}
