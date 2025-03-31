
import { useEffect, useState } from "react";
import { SeoGeneratorForm } from "@/components/templates/SeoGeneratorForm";
import { RealTimeBlogGeneratorForm } from "@/components/templates/RealTimeBlogGeneratorForm";
import { useLocation } from "react-router-dom";
import { SitemapUrlInput } from "@/components/templates/SitemapUrlInput";
import { DeepThinkingGeneratorForm } from "@/components/templates/DeepThinkingGeneratorForm";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { CustomOutlineSection } from "@/components/templates/CustomOutlineSection";

export default function SeoGeneratorTemplate() {
  const location = useLocation();
  const isArticleGenerator = location.pathname.includes("article-generator");
  const isDeepThinking = location.pathname.includes("deep-thinking");
  const [includeInternalLinks, setIncludeInternalLinks] = useState(false);
  const [includeCitations, setIncludeCitations] = useState(true); // Default to true for citations
  const [isGenerating, setIsGenerating] = useState(false);
  const [customOutline, setCustomOutline] = useState("");
  
  useEffect(() => {
    if (isArticleGenerator) {
      document.title = "AI Blog Generator With Web Research";
    } else if (isDeepThinking) {
      document.title = "Deep Thinking AI Blog Generator | Content Genius";
    } else {
      document.title = "All In One SEO Generator | Content Genius";
    }
  }, [isArticleGenerator, isDeepThinking]);

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
        {isArticleGenerator 
          ? "AI Blog Generator With Web Research" 
          : isDeepThinking
            ? "Deep Thinking AI Blog Generator"
            : "All In One SEO Generator"}
      </h1>
      <p className="text-muted-foreground mt-2">
        {isArticleGenerator 
          ? "Create high-quality blog posts with real-time web research using Perplexity, GPT, and Claude models"
          : isDeepThinking
            ? "Create content with visible AI thinking process for more transparent reasoning"
            : "Generate SEO-optimized content using AI with perfect formatting and structure"}
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
      
      {isArticleGenerator 
        ? <RealTimeBlogGeneratorForm 
            includeInternalLinks={includeInternalLinks} 
            includeCitations={includeCitations} 
            onCitationsToggle={handleCitationsToggle}
            customOutline={customOutline}
          />
        : isDeepThinking
          ? <DeepThinkingGeneratorForm 
              includeInternalLinks={includeInternalLinks} 
              onGeneratingStateChange={handleGeneratingState}
              hideBackgroundGeneration={true}
              customOutline={customOutline}
            />
          : <SeoGeneratorForm 
              includeInternalLinks={includeInternalLinks}
              hideBackgroundGeneration={true}
              customOutline={customOutline}
            />}
    </div>
  );
}
