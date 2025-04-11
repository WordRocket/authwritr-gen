
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
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

export default function ProductRoundupTemplate() {
  const [includeInternalLinks, setIncludeInternalLinks] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customOutline, setCustomOutline] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);
  const [generatedHtml, setGeneratedHtml] = useState("");
  const [language, setLanguage] = useState("english");
  const [lastAttempt, setLastAttempt] = useState(Date.now());
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
    setLastAttempt(Date.now()); // Force re-render when an error occurs
    
    // Show toast notification for API errors
    toast({
      title: "API Error",
      description: "There was an error generating content. Please check the error details below.",
      variant: "destructive"
    });
  };
  
  const handleContentGenerated = (content: string) => {
    console.log("Content successfully generated, length:", content.length);
    setGeneratedHtml(content);
    
    // Show success toast
    toast({
      title: "Content Generated Successfully",
      description: "Your product roundup article has been created.",
    });
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    // Store language preference in localStorage for content generation service to use
    localStorage.setItem('contentLanguage', newLanguage);
  };

  // Reset any API error when component unmounts or user navigates
  useEffect(() => {
    return () => {
      setApiError(null);
    };
  }, []);
  
  // Force re-render when apiKey changes
  useEffect(() => {
    if (apiKey) {
      console.log("API key detected, ready for content generation");
    }
  }, [apiKey]);

  const handleRetry = () => {
    setApiError(null);
    toast({
      title: "Retrying",
      description: "Resetting API error state and preparing to retry.",
    });
    
    // Force a re-render of the form component by updating lastAttempt
    setLastAttempt(Date.now());
  };

  return (
    <div className="mx-auto container py-8 space-y-8">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight mb-2 bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
          Product Round-up Article Generator
        </h1>
        <p className="text-muted-foreground">
          Create comprehensive product comparison articles to help readers make informed purchasing decisions
        </p>
      </div>
      
      {!apiKey && (
        <Alert className="mt-4 border-destructive bg-destructive/10 rounded-lg">
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
        <Alert className="mt-4 border-destructive bg-destructive/10 rounded-lg">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive space-y-4">
            <p><strong>API Error:</strong> {apiError}</p>
            
            {apiError.toLowerCase().includes('api key') || 
             apiError.toLowerCase().includes('auth') || 
             apiError.toLowerCase().includes('401') ? (
              <div>
                <p className="font-medium">Authentication Error Detected</p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>Check that you have sufficient credits in your OpenRouter account</li>
                  <li>Verify your API key is valid and entered correctly</li>
                  <li>
                    Try creating a new API key in OpenRouter and updating it in your{" "}
                    <Link to="/settings" className="font-medium underline hover:text-destructive/80">
                      Settings
                    </Link>
                  </li>
                </ul>
              </div>
            ) : (
              <div>
                <p className="font-medium">Troubleshooting Steps:</p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>Try selecting a different AI model</li>
                  <li>Reduce the word count or complexity of your request</li>
                  <li>Check your internet connection and try again</li>
                  <li>Wait a few minutes and try again (service might be temporarily unavailable)</li>
                </ul>
              </div>
            )}
            
            <Button 
              onClick={handleRetry}
              variant="outline" 
              size="sm"
              className="mt-2"
            >
              Reset Error & Try Again
            </Button>
            
            <p className="mt-2 text-xs italic">
              Check the Edge Function logs in Supabase for more detailed error information.
            </p>
          </AlertDescription>
        </Alert>
      )}
      
      {isGenerating && (
        <Alert className="mt-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
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
      
      <Card className="p-6 mb-6 border hover:border-primary/10 transition-shadow hover:shadow-md">
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
        // Force re-render when apiKey changes, on errors, or when retry is clicked
        key={`${apiKey || 'no-api-key'}-${lastAttempt}`}
      />
      
      {generatedHtml && (
        <HtmlPreviewComponent htmlCode={generatedHtml} className="mt-8" />
      )}
    </div>
  );
}
