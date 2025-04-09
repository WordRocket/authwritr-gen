
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PenTool, FileText, Search, Globe } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="container mx-auto py-8 space-y-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
          Welcome to WordRocket
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Generate high-quality, SEO-optimized content for your website or blog with our powerful AI tools.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border hover:border-primary/30 transition-all hover:shadow-md hover:-translate-y-1">
          <CardHeader>
            <div className="rounded-full bg-primary/10 p-3 w-fit mb-2">
              <PenTool className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>All-in-One SEO</CardTitle>
            <CardDescription>Generate optimized blog posts and articles</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Create SEO-friendly content with just a few clicks. Our AI handles keyword optimization and readability.</p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link to="/templates/all-in-one-seo">Get Started</Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="border hover:border-primary/30 transition-all hover:shadow-md hover:-translate-y-1">
          <CardHeader>
            <div className="rounded-full bg-primary/10 p-3 w-fit mb-2">
              <Search className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Deep Thinking</CardTitle>
            <CardDescription>Generate comprehensive analysis articles</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Create in-depth, well-researched content that provides comprehensive analysis on complex topics.</p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link to="/templates/deep-thinking">Try It</Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="border hover:border-primary/30 transition-all hover:shadow-md hover:-translate-y-1">
          <CardHeader>
            <div className="rounded-full bg-primary/10 p-3 w-fit mb-2">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Web Search</CardTitle>
            <CardDescription>Real-Time web search content</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Research topics and create current, relevant content with real-time web search capabilities.</p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link to="/templates/web-search">Research Now</Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="border hover:border-primary/30 transition-all hover:shadow-md hover:-translate-y-1">
          <CardHeader>
            <div className="rounded-full bg-primary/10 p-3 w-fit mb-2">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Bulk Blog Generator</CardTitle>
            <CardDescription>Generate multiple blog posts at once</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Save time by creating multiple SEO-optimized blog posts in a single batch with shared settings.</p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link to="/templates/bulk-blog-generator">Create Multiple</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <div className="mt-10 text-center">
        <Button asChild variant="outline" size="lg" className="px-8">
          <Link to="/content">View My Content</Link>
        </Button>
      </div>
    </div>
  );
};

export default Index;
