import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  FileText, 
  Search, 
  FileStack,
  FileEdit,
  BrainCircuit,
  Plus
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  // Templates that match the ones in our app - Removed bulk blog post generator
  const quickTemplates = [
    {
      id: "all-in-one-seo",
      title: "All In One SEO Generator",
      description: "Complete SEO-optimized content with keywords, meta descriptions, and structured sections",
      icon: Search,
      route: "/templates/all-in-one-seo"
    },
    {
      id: "article-generator",
      title: "Real-Time Blog Generator",
      description: "Create current, well-researched articles with live web search integration",
      icon: FileEdit,
      route: "/templates/article-generator"
    },
    {
      id: "deep-thinking",
      title: "Deep Thinking Blog Generator",
      description: "Create thoughtful, detailed content using AI models that show their reasoning process",
      icon: BrainCircuit,
      route: "/templates/deep-thinking"
    },
  ];

  // Filter templates based on search
  const filteredTemplates = quickTemplates.filter((template) => {
    return template.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
           template.description.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-8">
      <div>
        <h1>Welcome to ContentGenius</h1>
        <p className="text-muted-foreground">
          Create high-quality content in minutes with AI
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2>Templates</h2>
          <Button onClick={() => navigate("/templates")}>
            <Plus className="mr-2 h-4 w-4" /> View All Templates
          </Button>
        </div>
        
        {/* Add Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {filteredTemplates.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                    <CardTitle className="text-sm font-medium">{template.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">{template.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <CardContent>
              <p className="text-muted-foreground mb-4">No templates found matching your criteria</p>
              <Button onClick={() => setSearchQuery("")}>
                Clear Search
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
