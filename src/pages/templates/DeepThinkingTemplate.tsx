
import { useEffect, useState } from "react";
import { DeepThinkingGeneratorForm } from "@/components/templates/DeepThinkingGeneratorForm";
import { SitemapUrlInput } from "@/components/templates/SitemapUrlInput";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { CustomOutlineSection } from "@/components/templates/CustomOutlineSection";

export default function DeepThinkingTemplate() {
  const [includeInternalLinks, setIncludeInternalLinks] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customOutline, setCustomOutline] = useState("");
  
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
    
    // Load custom outline if it exists
    const savedOutline = localStorage.getItem('customOutline');
    if (savedOutline !== null) {
      setCustomOutline(savedOutline);
    }
  }, []);
  
  // Handler for setting the generating state
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
        Deep Thinking Enabled Blog Generator
      </h1>
      <p className="text-muted-foreground mt-2">
        Create thoughtful, detailed content with AI models that explicitly show their reasoning process
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
      
      <CustomOutlineSection 
        outline={customOutline} 
        onChange={handleOutlineChange} 
      />
      
      <DeepThinkingGeneratorForm 
        includeInternalLinks={includeInternalLinks}
        onGeneratingStateChange={handleGeneratingState}
        hideBackgroundGeneration={true}
        customOutline={customOutline}
      />
    </div>
  );
}
