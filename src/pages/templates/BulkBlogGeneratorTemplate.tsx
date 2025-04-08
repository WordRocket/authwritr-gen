
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { SitemapUrlInput } from "@/components/templates/SitemapUrlInput";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { BulkBlogGeneratorForm } from "@/components/templates/BulkBlogGeneratorForm";
import { LanguageSelector } from "@/components/templates/LanguageSelector";
import { Card } from "@/components/ui/card";

export default function BulkBlogGeneratorTemplate() {
  const location = useLocation();
  const [includeInternalLinks, setIncludeInternalLinks] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customOutline, setCustomOutline] = useState("");
  const [language, setLanguage] = useState("english");
  
  useEffect(() => {
    document.title = "Bulk Blog Generator | Content Genius";
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
    const savedOutline = localStorage.getItem('customOutline');
    if (savedOutline !== null) {
      setCustomOutline(savedOutline);
    }
  }, []);
  
  const handleGeneratingState = (generating: boolean) => {
    setIsGenerating(generating);
  };
  
  const handleOutlineChange = (outline: string) => {
    setCustomOutline(outline);
    localStorage.setItem('customOutline', outline);
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    // Store language preference in localStorage for content generation service to use
    localStorage.setItem('contentLanguage', newLanguage);
  };

  return (
    <div className="mx-auto container py-8">
      <h1 className="text-3xl font-bold tracking-tight">
        Bulk Blog Post Generator
      </h1>
      <p className="text-muted-foreground mt-2">
        Generate multiple SEO-optimized blog posts in the background with shared settings
      </p>
      
      {isGenerating && (
        <Alert className="mt-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <InfoIcon className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-800 dark:text-amber-300">
            Content generation has started in the background. You can view progress in the "My Content" section.
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
      
      <BulkBlogGeneratorForm 
        includeInternalLinks={includeInternalLinks}
        customOutline={customOutline}
        onCustomOutlineChange={handleOutlineChange}
        onGeneratingStateChange={handleGeneratingState}
      />
    </div>
  );
}
