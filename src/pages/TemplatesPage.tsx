
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
    { value: "seo", label: "SEO Content" },
    { value: "blog", label: "Blog Content" },
    { value: "article", label: "Article Content" },
  ];

  // Templates data - updated to only include long-form generators
  const templatesData = [
    {
      id: "all-in-one-seo",
      title: "All In One SEO Generator",
      description: "Complete SEO-optimized content with keywords, meta descriptions, and structured sections",
      icon: Search,
      category: "seo",
      route: "/templates/all-in-one-seo"
    },
    {
      id: "bulk-blog-post",
      title: "Bulk Blog Post Generator",
      description: "Generate multiple blog posts with consistent formatting and structure",
      icon: FileStack,
      category: "blog",
      route: "/templates/bulk-blog-post"
    },
    {
      id: "article-generator",
      title: "Up To Date Article Generator",
      description: "Create current, well-researched articles with product comparisons and analytics",
      icon: FileEdit,
      category: "article",
      route: "/templates/article-generator"
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
        <h1>Long-Form Content Templates</h1>
        <p className="text-muted-foreground">
          Choose a template to start creating professional long-form content
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
            className="template-card cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(template.route)}
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
