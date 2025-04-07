
import { useEffect, useState } from "react";
import { SeoGeneratorForm } from "@/components/templates/SeoGeneratorForm";
import { useLocation } from "react-router-dom";
import { SitemapUrlInput } from "@/components/templates/SitemapUrlInput";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

// Define free models to be used in this template
const additionalFreeModels = [
  {
    id: "deepseek/deepseek-v3-base:free",
    name: "DeepSeek V3 Base (free)",
    description: "671B parameter open MoE model with 37B active parameters and 128K context",
    recommended: true,
    free: true
  },
  {
    id: "meta-llama/llama-4-maverick:free",
    name: "Llama 4 Maverick (free)",
    description: "17B multimodal model with 256K context for text and image processing",
    recommended: true,
    free: true
  },
  {
    id: "qwen/qwen2.5-vl-32b-instruct:free",
    name: "Qwen2.5 VL 32B Instruct (free)",
    description: "Multimodal vision-language model with enhanced reasoning capabilities",
    recommended: true,
    free: true
  }
];

export default function FreeSeoGeneratorTemplate() {
  const location = useLocation();
  const [includeInternalLinks, setIncludeInternalLinks] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customOutline, setCustomOutline] = useState("");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  
  useEffect(() => {
    document.title = "Free SEO Blog Post Generator | Content Genius";
    
    // Load Gemini API key if it exists
    const savedGeminiKey = localStorage.getItem('geminiApiKey');
    if (savedGeminiKey) {
      setGeminiApiKey(savedGeminiKey);
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
  
  const handleGeminiApiKeyChange = (apiKey: string) => {
    setGeminiApiKey(apiKey);
    localStorage.setItem('geminiApiKey', apiKey);
  };

  return (
    <div className="mx-auto container py-8">
      <h1 className="text-3xl font-bold tracking-tight">
        Free SEO Blog Post Generator
      </h1>
      <p className="text-muted-foreground mt-2">
        Generate SEO-optimized content using free AI models with perfect formatting and structure
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
      
      <SeoGeneratorForm 
        includeInternalLinks={includeInternalLinks}
        hideBackgroundGeneration={true}
        customOutline={customOutline}
        onCustomOutlineChange={handleOutlineChange}
        onlyShowFreeModels={true}
        savedGeminiApiKey={geminiApiKey}
        onGeminiApiKeyChange={handleGeminiApiKeyChange}
        onGeneratingStateChange={handleGeneratingState}
        showGeminiKeyInput={true}
        additionalFreeModels={additionalFreeModels}
      />
    </div>
  );
}
