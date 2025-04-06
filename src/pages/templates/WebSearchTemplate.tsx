
import { useEffect, useState } from "react";
import { RealTimeBlogGeneratorForm } from "@/components/templates/RealTimeBlogGeneratorForm";
import { SitemapUrlInput } from "@/components/templates/SitemapUrlInput";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, Globe } from "lucide-react";

export default function WebSearchTemplate() {
  const [includeInternalLinks, setIncludeInternalLinks] = useState(false);
  const [includeCitations, setIncludeCitations] = useState(true); // Default to true for citations
  const [isGenerating, setIsGenerating] = useState(false);
  const [customOutline, setCustomOutline] = useState("");
  
  useEffect(() => {
    document.title = "Real-Time Web Search Article Generator | Content Genius";
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

  useEffect(() => {
    const savedPreference = localStorage.getItem('includeInternalLinks');
    if (savedPreference !== null) {
      setIncludeInternalLinks(savedPreference === 'true');
    }
    
    // Load citation preference if it exists
    const savedCitationPreference = localStorage.getItem('includeCitations');
    if (savedCitationPreference !== null) {
      setIncludeCitations(savedCitationPreference === 'true');
    }
    
    // Load custom outline if it exists
    const savedOutline = localStorage.getItem('customOutline');
    if (savedOutline !== null) {
      setCustomOutline(savedOutline);
    }
  }, []);
  
  const handleCitationsToggle = (enabled: boolean) => {
    setIncludeCitations(enabled);
    console.log(`Citations ${enabled ? 'enabled' : 'disabled'}`);
    
    // Store the preference in localStorage
    localStorage.setItem('includeCitations', enabled.toString());
  };
  
  const handleGeneratingState = (generating: boolean) => {
    setIsGenerating(generating);
  };
  
  const handleOutlineChange = (outline: string) => {
    setCustomOutline(outline);
    localStorage.setItem('customOutline', outline);
  };

  return (
    <div className="mx-auto container py-8">
      <h1 className="text-3xl font-bold tracking-tight">
        Real-Time Web Search Article Generator
      </h1>
      <p className="text-muted-foreground mt-2">
        Research topics online and generate comprehensive articles with real-time web search
      </p>
      
      {isGenerating && (
        <Alert className="mt-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <InfoIcon className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-800 dark:text-amber-300">
            Content is being generated. Please do not leave this page. It may take a few minutes to complete.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="mt-6 mb-8">
        <SitemapUrlInput 
          onUrlsScraped={handleUrlsScraped} 
          onInternalLinksToggle={handleInternalLinksToggle}
          includeInternalLinks={includeInternalLinks}
        />
      </div>
      
      <RealTimeBlogGeneratorForm 
        includeInternalLinks={includeInternalLinks} 
        includeCitations={includeCitations} 
        onCitationsToggle={handleCitationsToggle}
        customOutline={customOutline}
        onCustomOutlineChange={handleOutlineChange}
        forceWebSearch={true}
      />
    </div>
  );
}
