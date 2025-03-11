
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, BookTemplate, History, Plus, Sparkles, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  // Stats for the dashboard
  const stats = [
    {
      title: "Total Content",
      value: "0",
      icon: FileText,
      description: "Articles generated",
    },
    {
      title: "Templates Used",
      value: "0",
      icon: BookTemplate,
      description: "Content templates",
    },
    {
      title: "Generation History",
      value: "0",
      icon: History,
      description: "Past generations",
    },
  ];

  // Sample templates for quick access
  const quickTemplates = [
    {
      title: "Blog Post",
      description: "SEO-optimized article with headers, bullets, and conclusion",
      icon: FileText,
    },
    {
      title: "Social Media Post",
      description: "Engaging post optimized for social media platforms",
      icon: TrendingUp,
    },
    {
      title: "Product Description",
      description: "Compelling product descriptions that convert",
      icon: Sparkles,
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

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat, i) => (
          <Card key={i} className="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2>Quick Create</h2>
          <Button onClick={() => navigate("/templates")}>
            <Plus className="mr-2 h-4 w-4" /> New Content
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {quickTemplates.map((template, i) => (
            <Card 
              key={i} 
              className="template-card"
              onClick={() => navigate("/templates")}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{template.title}</CardTitle>
                <template.icon className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{template.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2>Recent Content</h2>
          <Button variant="outline" onClick={() => navigate("/content")}>
            View All
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardDescription>
              You haven't created any content yet. Start by selecting a template.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-6">
            <Button onClick={() => navigate("/templates")}>
              <Plus className="mr-2 h-4 w-4" /> Create Content
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
