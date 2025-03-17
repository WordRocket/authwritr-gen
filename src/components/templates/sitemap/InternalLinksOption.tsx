
import { Checkbox } from "@/components/ui/checkbox";
import { FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { getUrlsFromLocalStorage } from "@/services/sitemapService";
import { useEffect, useState } from "react";
import { Control } from "react-hook-form";

interface InternalLinksOptionProps {
  control: Control<any>;
  name: string;
  description?: string;
}

export function InternalLinksOption({ control, name, description }: InternalLinksOptionProps) {
  const [hasUrls, setHasUrls] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const { urls } = getUrlsFromLocalStorage();
    setHasUrls(urls.length > 0);
  }, []);
  
  const handleClick = () => {
    if (!hasUrls) {
      toast({
        title: "No URLs Available",
        description: "Please scan a sitemap first to use internal linking",
        variant: "destructive"
      });
    }
  };

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
          <div className="space-y-0.5">
            <FormLabel>Include Internal Links</FormLabel>
            <FormDescription>
              {description || "Add relevant internal links from your sitemap"}
            </FormDescription>
          </div>
          <FormControl>
            <Switch
              checked={field.value}
              onCheckedChange={(checked) => {
                if (!hasUrls && checked) {
                  toast({
                    title: "No URLs Available",
                    description: "Please scan a sitemap first to use internal linking",
                    variant: "destructive"
                  });
                  return;
                }
                field.onChange(checked);
              }}
              onClick={handleClick}
              disabled={!hasUrls}
            />
          </FormControl>
        </FormItem>
      )}
    />
  );
}
