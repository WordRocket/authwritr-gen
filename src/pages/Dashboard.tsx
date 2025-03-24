
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

  // Templates that match the ones in our app
  const quickTemplates = [
    {
      id: "all-in-one-seo",
      title: "All In One SEO Generator",
      description: "Complete SEO-optimized content with keywords, meta descriptions, and structured sections",
      icon: Search,
      route: "/templates/all-in-one-seo"
    },
    {
      id: "bulk-blog-post",
      title: "Bulk Blog Post Generator",
      description: "Generate multiple blog posts with consistent formatting and structure",
      icon: FileStack,
      route: "/templates/bulk-blog-post"
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickTemplates.map((template) => (
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
      </div>
    </div>
  );
}
