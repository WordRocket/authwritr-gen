
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SitemapStatusAlertsProps {
  error: string | null;
  success: string | null;
}

export function SitemapStatusAlerts({ error, success }: SitemapStatusAlertsProps) {
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
    </>
  );
}
