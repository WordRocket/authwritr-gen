
import { useEffect, useState } from "react";
import { SeoGeneratorForm } from "@/components/templates/SeoGeneratorForm";
import { RealTimeBlogGeneratorForm } from "@/components/templates/RealTimeBlogGeneratorForm";
import { useLocation } from "react-router-dom";
import { SitemapUrlInput } from "@/components/templates/SitemapUrlInput";
import { DeepThinkingGeneratorForm } from "@/components/templates/DeepThinkingGeneratorForm";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { LanguageSelector } from "@/components/templates/LanguageSelector";
import { Card } from "@/components/ui/card";

// Custom model ordering for the All in One SEO Generator
const customSeoModels = [
  { 
    id: "google/gemini-2.5-pro-preview-03-25", 
    name: "Gemini 2.5 Pro", 
    description: "Best, lower cost",
    recommended: true
  },
  { 
    id: "anthropic/claude-3.7-sonnet", 
    name: "Claude 3.7 Sonnet", 
    description: "Best, higher cost",
    recommended: true
  },
  { 
    id: "openai/o1-pro", 
    name: "O1 Pro", 
    description: "Advanced reasoning capabilities",
    recommended: false
  },
  { 
    id: "x-ai/grok-3-beta", 
    name: "Grok 3 Beta", 
    description: "Powerful model with up-to-date knowledge",
    recommended: false
  },
  { 
    id: "deepseek/deepseek-v3-base:free", 
    name: "DeepSeek V3 Base", 
    description: "High-quality free model option",
    recommended: false,
    free: true
  }
];

export default function SeoGeneratorTemplate() {
  const location = useLocation();
  const isArticleGenerator = location.pathname.includes("article-generator");
  const isDeepThinking = location.pathname.includes("deep-thinking");
  const [includeInternalLinks, setIncludeInternalLinks] = useState(false);
  const [includeCitations, setIncludeCitations] = useState(true); // Default to true for citations
  const [isGenerating, setIsGenerating] = useState(false);
  const [customOutline, setCustomOutline] = useState("");
  const [language, setLanguage] = useState("english");
  
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

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    // Store language preference in localStorage for content generation service to use
    localStorage.setItem('contentLanguage', newLanguage);
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
      
      <Card className="p-6 mb-6">
        <LanguageSelector
          selectedLanguage={language}
          onLanguageChange={handleLanguageChange}
        />
      </Card>
      
      {isArticleGenerator 
        ? <RealTimeBlogGeneratorForm 
            includeInternalLinks={includeInternalLinks} 
            includeCitations={includeCitations} 
            onCitationsToggle={handleCitationsToggle}
            customOutline={customOutline}
            onCustomOutlineChange={handleOutlineChange}
          />
        : isDeepThinking
          ? <DeepThinkingGeneratorForm 
              includeInternalLinks={includeInternalLinks} 
              onGeneratingStateChange={handleGeneratingState}
              hideBackgroundGeneration={true}
              customOutline={customOutline}
              onCustomOutlineChange={handleOutlineChange}
            />
          : <SeoGeneratorForm 
              includeInternalLinks={includeInternalLinks}
              hideBackgroundGeneration={true}
              customOutline={customOutline}
              onCustomOutlineChange={handleOutlineChange}
              showGeminiKeyInput={false}
              onGeneratingStateChange={handleGeneratingState}
              customModels={customSeoModels}
            />}
    </div>
  );
}
