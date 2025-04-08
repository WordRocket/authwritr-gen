
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, AlertCircle } from "lucide-react";
import { ProductRoundupGeneratorForm } from "@/components/templates/ProductRoundupGeneratorForm";
import { SitemapUrlInput } from "@/components/templates/SitemapUrlInput";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";
import { HtmlPreviewComponent } from "@/components/templates/HtmlPreviewComponent";
import { LanguageSelector } from "@/components/templates/LanguageSelector";
import { Card } from "@/components/ui/card";

export default function ProductRoundupTemplate() {
  const [includeInternalLinks, setIncludeInternalLinks] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customOutline, setCustomOutline] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);
  const [generatedHtml, setGeneratedHtml] = useState("");
  const [language, setLanguage] = useState("english");
  const { apiKey } = useAuth();
  
  useEffect(() => {
    document.title = "Product Round-up Article Generator | Content Genius";
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
    const savedOutline = localStorage.getItem('productRoundupCustomOutline');
    if (savedOutline !== null) {
      setCustomOutline(savedOutline);
    }
  }, []);
  
  const handleGeneratingState = (generating: boolean) => {
    setIsGenerating(generating);
    if (generating) {
      setApiError(null);
    }
    
    // Add this console log to track state changes
    console.log(`Content generation state changed to: ${generating ? 'generating' : 'not generating'}`);
  };
  
  const handleOutlineChange = (outline: string) => {
    setCustomOutline(outline);
    localStorage.setItem('productRoundupCustomOutline', outline);
  };

  const handleApiError = (error: string) => {
    console.error("API Error in ProductRoundupTemplate:", error);
    setApiError(error);
    setIsGenerating(false);
  };
  
  const handleContentGenerated = (content: string) => {
    console.log("Content successfully generated, length:", content.length);
    setGeneratedHtml(content);
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
  };

  return (
    <div className="mx-auto container py-8">
      <h1 className="text-3xl font-bold tracking-tight">
        Product Round-up Article Generator
      </h1>
      <p className="text-muted-foreground mt-2">
        Create comprehensive product comparison articles to help readers make informed purchasing decisions
      </p>
      
      {!apiKey && (
        <Alert className="mt-4 border-destructive bg-destructive/10">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive">
            API key is missing. Please add your OpenRouter API key in{" "}
            <Link to="/settings" className="font-medium underline hover:text-destructive/80">
              Settings
            </Link>{" "}
            to use content generation features.
          </AlertDescription>
        </Alert>
      )}
      
      {apiError && (
        <Alert className="mt-4 border-destructive bg-destructive/10">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive">
            <p><strong>API Error:</strong> {apiError}</p>
            <p className="mt-2">
              If this is an authentication error (401), please check:
            </p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>That you have sufficient credits in your OpenRouter account</li>
              <li>Your API key is valid and entered correctly</li>
              <li>
                Try creating a new API key in OpenRouter and updating it in your{" "}
                <Link to="/settings" className="font-medium underline hover:text-destructive/80">
                  Settings
                </Link>
              </li>
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
      
      <Card className="p-6 mb-6">
        <LanguageSelector
          selectedLanguage={language}
          onLanguageChange={handleLanguageChange}
        />
      </Card>
      
      <ProductRoundupGeneratorForm 
        includeInternalLinks={includeInternalLinks}
        customOutline={customOutline}
        onCustomOutlineChange={handleOutlineChange}
        onGeneratingStateChange={handleGeneratingState}
        onApiError={handleApiError}
        apiKey={apiKey}
        onContentGenerated={handleContentGenerated}
        key={apiKey || 'no-api-key'} // Force re-render when API key changes
        contentLanguage={language}
      />
      
      {generatedHtml && (
        <HtmlPreviewComponent htmlCode={generatedHtml} className="mt-8" />
      )}
    </div>
  );
}
