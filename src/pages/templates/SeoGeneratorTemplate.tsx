
import { useEffect, useState } from "react";
import { SeoGeneratorForm } from "@/components/templates/SeoGeneratorForm";
import { RealTimeBlogGeneratorForm } from "@/components/templates/RealTimeBlogGeneratorForm";
import { useLocation } from "react-router-dom";
import { SitemapUrlInput } from "@/components/templates/SitemapUrlInput";

export default function SeoGeneratorTemplate() {
  const location = useLocation();
  const isArticleGenerator = location.pathname.includes("article-generator");
  const isBulkBlogPost = location.pathname.includes("bulk-blog-post");
  const [includeInternalLinks, setIncludeInternalLinks] = useState(false);
  
  useEffect(() => {
    if (isArticleGenerator) {
      document.title = "AI Blog Generator With Web Research";
    } else if (isBulkBlogPost) {
      document.title = "Bulk Blog Post Generator | Content Genius";
    } else {
      document.title = "All In One SEO Generator | Content Genius";
    }
  }, [isArticleGenerator, isBulkBlogPost]);

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
        {isArticleGenerator 
          ? "AI Blog Generator With Web Research" 
          : isBulkBlogPost
            ? "Bulk Blog Post Generator"
            : "All In One SEO Generator"}
      </h1>
      <p className="text-muted-foreground mt-2">
        {isArticleGenerator 
          ? "Create high-quality blog posts with real-time web research using Perplexity, GPT, and Claude models"
          : isBulkBlogPost
            ? "Generate multiple blog posts with consistent formatting and structure"
            : "Generate SEO-optimized content using AI with perfect formatting and structure"}
      </p>
      
      <div className="mt-6 mb-8">
        <SitemapUrlInput 
          onUrlsScraped={handleUrlsScraped} 
          onInternalLinksToggle={handleInternalLinksToggle}
          includeInternalLinks={includeInternalLinks}
        />
      </div>
      
      {isArticleGenerator 
        ? <RealTimeBlogGeneratorForm includeInternalLinks={includeInternalLinks} /> 
        : <SeoGeneratorForm includeInternalLinks={includeInternalLinks} />}
    </div>
  );
}
