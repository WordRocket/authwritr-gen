
import { useState } from "react";
import { useSitemapScraper } from "@/hooks/useSitemapScraper";
import { SitemapInfoHeader } from "./sitemap/SitemapInfoHeader";
import { SitemapUrlForm } from "./sitemap/SitemapUrlForm";
import { SitemapStatusAlerts } from "./sitemap/SitemapStatusAlerts";
import { SitemapActionButtons } from "./sitemap/SitemapActionButtons";

interface SitemapUrlInputProps {
  onUrlsScraped?: (count: number) => void;
  onInternalLinksToggle?: (enabled: boolean) => void;
  includeInternalLinks?: boolean;
}

export function SitemapUrlInput({ 
  onUrlsScraped,
  onInternalLinksToggle,
  includeInternalLinks = false
}: SitemapUrlInputProps) {
  const {
    sitemapUrl,
    setSitemapUrl,
    isLoading,
    error,
    success,
    storedUrls,
    lastUpdatedDate,
    handleSitemapSubmit,
    handleClearUrls,
    guessAndSetSitemapUrl,
    trySitemapIndex,
    baseDomain
  } = useSitemapScraper(onUrlsScraped);

  const handleUrlBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value && !e.target.value.includes("sitemap") && !e.target.value.includes(".xml")) {
      guessAndSetSitemapUrl(e.target.value);
    }
  };

  return (
    <div className="space-y-4">
      <SitemapInfoHeader 
        storedUrls={storedUrls} 
        lastUpdatedDate={lastUpdatedDate} 
        baseDomain={baseDomain}
      />

      <SitemapUrlForm
        sitemapUrl={sitemapUrl}
        onSitemapUrlChange={setSitemapUrl}
        onSubmit={handleSitemapSubmit}
        onUrlBlur={handleUrlBlur}
        isLoading={isLoading}
      />

      <SitemapStatusAlerts 
        error={error} 
        success={success} 
        lastUpdatedDate={lastUpdatedDate}
        storedUrls={storedUrls}
        onInternalLinksToggle={onInternalLinksToggle}
        includeInternalLinks={includeInternalLinks}
        sitemapUrl={sitemapUrl}
        baseDomain={baseDomain}
      />

      <SitemapActionButtons
        sitemapUrl={sitemapUrl}
        storedUrlsCount={storedUrls.length}
        onTryDifferentFormat={trySitemapIndex}
        onClearUrls={handleClearUrls}
      />
    </div>
  );
}
