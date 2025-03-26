
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  PanelLeft,
  FileEdit,
  BrainCircuit,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Template categories
  const categories = [
    { value: "all", label: "All Templates" },
    { value: "seo", label: "SEO Content" },
    { value: "blog", label: "Blog Content" },
    { value: "article", label: "Article Content" },
    { value: "thinking", label: "Deep Thinking" },
  ];

  // Templates data - updated to include deep thinking template but remove bulk blog post
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
      id: "article-generator",
      title: "Real-Time Blog Generator With Web Search",
      description: "Create current, well-researched articles with live web search integration",
      icon: FileEdit,
      category: "article",
      route: "/templates/article-generator"
    },
    {
      id: "deep-thinking",
      title: "Deep Thinking Enabled Blog Generator",
      description: "Create thoughtful, detailed content using AI models that explicitly show their reasoning process",
      icon: BrainCircuit,
      category: "thinking",
      route: "/templates/deep-thinking"
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
        <h1>ContentGenius Dashboard</h1>
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
