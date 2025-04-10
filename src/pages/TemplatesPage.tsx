
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Search, 
  ShoppingBag,
  BookOpen,
  FileEdit,
  FileStack,
  PanelLeft,
  BrainCircuit,
  FilesIcon,
  Globe,
  Sparkles,
  UserRound,
  BadgeDollarSign
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { usePremium } from "@/context/PremiumContext";

export default function TemplatesPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("all");
  const { isPremium } = usePremium();

  // Template categories
  const categories = [
    { value: "all", label: "All Templates" },
    { value: "seo", label: "SEO Content" },
    { value: "blog", label: "Blog Content" },
    { value: "article", label: "Article Content" },
    { value: "thinking", label: "Deep Thinking" },
    { value: "bulk", label: "Bulk Generation" },
    { value: "free", label: "Free Models" },
    { value: "product", label: "Product Content" },
  ];

  // Templates data - added premium flags for templates
  const templatesData = [
    {
      id: "all-in-one-seo",
      title: "All In One SEO Generator",
      description: "Complete SEO-optimized content with keywords, meta descriptions, and structured sections. Add custom outlines to guide the AI.",
      icon: Search,
      category: "seo",
      route: "/templates/all-in-one-seo",
      isPremium: false
    },
    {
      id: "low-ai-humanized",
      title: "Low AI Humanized Blog Posts",
      description: "Generate natural-sounding blog posts that don't feel AI-written. Uses Gemini 2.5 Pro with specialized settings for human-like content.",
      icon: UserRound,
      category: "blog",
      route: "/templates/low-ai-humanized",
      isPremium: true
    },
    {
      id: "free-seo-generator",
      title: "Free SEO Blog Post Generator",
      description: "Generate SEO-optimized content using free AI models like Gemini. No paid API keys required.",
      icon: Sparkles,
      category: "free",
      route: "/templates/free-seo-generator",
      isPremium: false
    },
    {
      id: "article-generator",
      title: "Real-Time Blog Generator With Web Search",
      description: "Create current, well-researched articles with live web search integration and custom outline guidance.",
      icon: FileEdit,
      category: "article",
      route: "/templates/article-generator",
      isPremium: false
    },
    {
      id: "web-search",
      title: "Real-Time Web Search Article Generator",
      description: "Research topics online and generate comprehensive articles with real-time web search. Perfect for current events and trending topics.",
      icon: Globe,
      category: "article",
      route: "/templates/web-search",
      isPremium: false
    },
    {
      id: "product-roundup",
      title: "Product Round-up Generator",
      description: "Create comprehensive product comparison articles with detailed reviews, comparison tables, and buyer's guides to help readers make informed purchasing decisions.",
      icon: ShoppingBag,
      category: "product",
      route: "/templates/product-roundup",
      isPremium: false
    },
    {
      id: "deep-thinking",
      title: "Deep Thinking Enabled Blog Generator",
      description: "Create thoughtful, detailed content using AI models that explicitly show their reasoning process. Supports custom outlines.",
      icon: BrainCircuit,
      category: "thinking",
      route: "/templates/deep-thinking",
      isPremium: false
    },
    {
      id: "bulk-blog-generator",
      title: "Bulk Blog Post Generator",
      description: "Generate multiple blog posts at once with shared settings. Perfect for content batching and topic clusters.",
      icon: FilesIcon,
      category: "bulk",
      route: "/templates/bulk-blog-generator",
      isPremium: true
    },
  ];

  // Filter templates based on search and category
  const filteredTemplates = templatesData.filter((template) => {
    const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || template.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight mb-2 bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
          Long-Form Content Templates
        </h1>
        <p className="text-muted-foreground">
          Choose a template to start creating professional long-form content
        </p>
      </div>

      <div className="flex flex-col gap-4 md:flex-row">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select
          value={categoryFilter}
          onValueChange={setCategoryFilter}
        >
          <SelectTrigger className="w-full md:w-[200px]">
            <PanelLeft className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.map((template) => (
          <Card
            key={template.id}
            className={`cursor-pointer border hover:border-primary/30 transition-all hover:shadow-md hover:-translate-y-1 ${
              template.isPremium && !isPremium ? 'border-amber-300 dark:border-amber-700' : ''
            }`}
            onClick={() => navigate(template.route)}
          >
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <div className="mr-4 rounded-full bg-primary/10 p-3">
                <template.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-base flex items-center gap-2">
                  {template.title}
                  {template.isPremium && (
                    <Badge variant={isPremium ? "default" : "outline"} className={isPremium ? "bg-primary" : "border-amber-500 text-amber-500"}>
                      <BadgeDollarSign className="h-3 w-3 mr-1" />
                      Premium
                    </Badge>
                  )}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="line-clamp-2">{template.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <Card className="p-8 text-center bg-muted/30">
          <CardContent>
            <p className="text-muted-foreground mb-4">No templates found matching your criteria</p>
            <Button 
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setCategoryFilter("all");
              }}
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}

      {!isPremium && (
        <Card className="bg-primary/5 border-primary/20 p-6">
          <CardContent className="p-0 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Upgrade to WordRocket Premium</h3>
              <p className="text-muted-foreground mb-0">Get full access to all premium templates</p>
            </div>
            <Button onClick={() => navigate('/pricing')} className="whitespace-nowrap">
              <BadgeDollarSign className="mr-2 h-4 w-4" />
              View Pricing
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
