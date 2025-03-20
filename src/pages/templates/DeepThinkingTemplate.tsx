
import { useEffect, useState } from "react";
import { DeepThinkingGeneratorForm } from "@/components/templates/DeepThinkingGeneratorForm";
import { SitemapUrlInput } from "@/components/templates/SitemapUrlInput";

export default function DeepThinkingTemplate() {
  const [includeInternalLinks, setIncludeInternalLinks] = useState(false);
  
  useEffect(() => {
    document.title = "Deep Thinking Enabled Blog Generator | Content Genius";
  }, []);

  const handleUrlsScraped = (count: number) => {
    console.log(`Successfully scraped ${count} URLs`);
  };

  const handleInternalLinksToggle = (enabled: boolean) => {
    setIncludeInternalLinks(enabled);
    console.log(`Internal links ${enabled ? 'enabled' : 'disabled'}`);
    
    // Store the preference in localStorage
    localStorage.setItem('includeInternalLinks', enabled.toString());
  };

  // Load the preference from localStorage on component mount
  useEffect(() => {
    const savedPreference = localStorage.getItem('includeInternalLinks');
    if (savedPreference !== null) {
      setIncludeInternalLinks(savedPreference === 'true');
    }
  }, []);

  return (
    <div className="mx-auto container py-8">
      <h1 className="text-3xl font-bold tracking-tight">
        Deep Thinking Enabled Blog Generator
      </h1>
      <p className="text-muted-foreground mt-2">
        Create thoughtful, detailed content with AI models that explicitly show their reasoning process
      </p>
      
      <div className="mt-6 mb-8">
        <SitemapUrlInput 
          onUrlsScraped={handleUrlsScraped} 
          onInternalLinksToggle={handleInternalLinksToggle}
          includeInternalLinks={includeInternalLinks}
        />
      </div>
      
      <DeepThinkingGeneratorForm includeInternalLinks={includeInternalLinks} />
    </div>
  );
}
