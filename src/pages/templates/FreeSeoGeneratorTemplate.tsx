
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, Sparkles, AlertCircle } from "lucide-react";
import { SeoGeneratorForm } from "@/components/templates/SeoGeneratorForm";
import { SitemapUrlInput } from "@/components/templates/SitemapUrlInput";
import { Link } from "react-router-dom";

export default function FreeSeoGeneratorTemplate() {
  const [includeInternalLinks, setIncludeInternalLinks] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customOutline, setCustomOutline] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);
  const [geminiApiKey, setGeminiApiKey] = useState<string | null>(null);
  
  useEffect(() => {
    document.title = "Free SEO Blog Post Generator | Content Genius";
    
    // Load Gemini API key if exists
    const savedApiKey = localStorage.getItem('gemini_api_key');
    if (savedApiKey) {
      setGeminiApiKey(savedApiKey);
    }
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
    
    // Load custom outline if it exists
    const savedOutline = localStorage.getItem('freeSeoCustomOutline');
    if (savedOutline !== null) {
      setCustomOutline(savedOutline);
    }
  }, []);
  
  const handleGeneratingState = (generating: boolean) => {
    setIsGenerating(generating);
    if (generating) {
      setApiError(null);
    }
  };
  
  const handleOutlineChange = (outline: string) => {
    setCustomOutline(outline);
    localStorage.setItem('freeSeoCustomOutline', outline);
  };

  const handleApiError = (error: string) => {
    setApiError(error);
    setIsGenerating(false);
  };

  const handleGeminiApiKeyChange = (apiKey: string) => {
    setGeminiApiKey(apiKey);
    localStorage.setItem('gemini_api_key', apiKey);
  };

  return (
    <div className="mx-auto container py-8">
      <h1 className="text-3xl font-bold tracking-tight">
        Free SEO Blog Post Generator
      </h1>
      <p className="text-muted-foreground mt-2">
        Create SEO-optimized content using free AI models like Gemini. No paid API keys required.
      </p>
      
      {apiError && (
        <Alert className="mt-4 border-destructive bg-destructive/10">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive">
            <p><strong>API Error:</strong> {apiError}</p>
            <p className="mt-2">
              If this is an authentication error, please check:
            </p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>Your Gemini API key is valid and entered correctly</li>
              <li>Your Gemini API key has not expired</li>
              <li>Try creating a new API key in Google AI Studio</li>
            </ul>
          </AlertDescription>
        </Alert>
      )}
      
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
      
      <SeoGeneratorForm 
        includeInternalLinks={includeInternalLinks}
        customOutline={customOutline}
        onCustomOutlineChange={handleOutlineChange}
        onGeneratingStateChange={handleGeneratingState}
        onApiError={handleApiError}
        useFreeModels={true}
        geminiApiKey={geminiApiKey}
        onGeminiApiKeyChange={handleGeminiApiKeyChange}
      />
    </div>
  );
}
