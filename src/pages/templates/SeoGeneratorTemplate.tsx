
import { useEffect } from "react";
import { SeoGeneratorForm } from "@/components/templates/SeoGeneratorForm";
import { RealTimeBlogGeneratorForm } from "@/components/templates/RealTimeBlogGeneratorForm";
import { useLocation } from "react-router-dom";
import { SitemapUrlInput } from "@/components/templates/SitemapUrlInput";

export default function SeoGeneratorTemplate() {
  const location = useLocation();
  const isArticleGenerator = location.pathname.includes("article-generator");
  const isBulkBlogPost = location.pathname.includes("bulk-blog-post");
  
  useEffect(() => {
    if (isArticleGenerator) {
      document.title = "Real-Time Blog Generator With Web Search";
    } else if (isBulkBlogPost) {
      document.title = "Bulk Blog Post Generator | Content Genius";
    } else {
      document.title = "All In One SEO Generator | Content Genius";
    }
  }, [isArticleGenerator, isBulkBlogPost]);

  const handleUrlsScraped = (count: number) => {
    console.log(`Successfully scraped ${count} URLs`);
  };

  return (
    <div className="mx-auto container py-8">
      <h1 className="text-3xl font-bold tracking-tight">
        {isArticleGenerator 
          ? "Real-Time Blog Generator With Web Search" 
          : isBulkBlogPost
            ? "Bulk Blog Post Generator"
            : "All In One SEO Generator"}
      </h1>
      <p className="text-muted-foreground mt-2">
        {isArticleGenerator 
          ? "Create up-to-date blog posts with real-time web research"
          : isBulkBlogPost
            ? "Generate multiple blog posts with consistent formatting and structure"
            : "Generate SEO-optimized content using AI with perfect formatting and structure"}
      </p>
      
      <div className="mt-6 mb-8">
        <SitemapUrlInput onUrlsScraped={handleUrlsScraped} />
      </div>
      
      {isArticleGenerator 
        ? <RealTimeBlogGeneratorForm /> 
        : <SeoGeneratorForm />}
    </div>
  );
}
