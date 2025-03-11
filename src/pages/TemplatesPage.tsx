
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Search, 
  ShoppingBag, 
  MessageCircle, 
  Mail, 
  Instagram,
  CheckCircle, 
  TrendingUp, 
  BookOpen, 
  Newspaper,
  Users,
  BriefcaseBusiness,
  PanelLeft
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

export default function TemplatesPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("all");

  // Template categories
  const categories = [
    { value: "all", label: "All Templates" },
    { value: "blog", label: "Blog Content" },
    { value: "social", label: "Social Media" },
    { value: "marketing", label: "Marketing" },
    { value: "email", label: "Email" },
    { value: "seo", label: "SEO" },
  ];

  // Templates data
  const templatesData = [
    {
      id: "blog-post",
      title: "Blog Post",
      description: "Create a full blog post with intro, sections, and conclusion",
      icon: FileText,
      category: "blog",
    },
    {
      id: "seo-article",
      title: "SEO Article",
      description: "SEO-optimized article with targeted keywords",
      icon: Search,
      category: "seo",
    },
    {
      id: "product-description",
      title: "Product Description",
      description: "Compelling product descriptions for e-commerce",
      icon: ShoppingBag,
      category: "marketing",
    },
    {
      id: "social-post",
      title: "Social Media Post",
      description: "Engaging content for social media platforms",
      icon: MessageCircle,
      category: "social",
    },
    {
      id: "email-newsletter",
      title: "Email Newsletter",
      description: "Professional email newsletter with sections",
      icon: Mail,
      category: "email",
    },
    {
      id: "instagram-caption",
      title: "Instagram Caption",
      description: "Catchy captions for Instagram posts",
      icon: Instagram,
      category: "social",
    },
    {
      id: "landing-page",
      title: "Landing Page Copy",
      description: "Persuasive copy for landing pages that convert",
      icon: CheckCircle,
      category: "marketing",
    },
    {
      id: "meta-description",
      title: "Meta Description",
      description: "SEO-friendly meta descriptions for your web pages",
      icon: TrendingUp,
      category: "seo",
    },
    {
      id: "ebook-outline",
      title: "Ebook Outline",
      description: "Structured outline for an ebook or guide",
      icon: BookOpen,
      category: "blog",
    },
    {
      id: "press-release",
      title: "Press Release",
      description: "Professional press release for announcements",
      icon: Newspaper,
      category: "marketing",
    },
    {
      id: "about-us-page",
      title: "About Us Page",
      description: "Compelling about us page content",
      icon: Users,
      category: "marketing",
    },
    {
      id: "case-study",
      title: "Case Study",
      description: "Structured case study with problem, solution, results",
      icon: BriefcaseBusiness,
      category: "blog",
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
    <div className="space-y-6">
      <div>
        <h1>Content Templates</h1>
        <p className="text-muted-foreground">
          Choose a template to start creating your content
        </p>
      </div>

      <div className="flex flex-col gap-4 md:flex-row">
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            className="pl-9"
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
            className="template-card"
            onClick={() => navigate(`/create/${template.id}`)}
          >
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <div className="mr-4 rounded-full bg-primary/10 p-2">
                <template.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">{template.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>{template.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <Card className="p-8 text-center">
          <CardContent>
            <p className="text-muted-foreground mb-4">No templates found matching your criteria</p>
            <Button onClick={() => {
              setSearchQuery("");
              setCategoryFilter("all");
            }}>
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
