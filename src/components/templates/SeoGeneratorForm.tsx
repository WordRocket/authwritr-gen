import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormDescription,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { ClipboardCopy, AlertCircle, InfoIcon, Code, Eye } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  generateSeoContent, 
  saveGeneratedContent, 
  type SeoFormValues as SeoServiceFormValues,
  recommendedModels 
} from "@/services/contentGenerationService";
import { useAuth } from "@/context/AuthContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import ReactMarkdown from "react-markdown";
import { HtmlPreviewComponent } from "./HtmlPreviewComponent";

const seoFormSchema = z.object({
  topic: z.string().min(3, { message: "Topic must be at least 3 characters" }),
  targetKeyword: z.string().optional(),
  articleType: z.enum([
    "informational", 
    "listicle", 
    "how-to", 
    "anecdote", 
    "story"
  ]).optional(),
  toneOfArticle: z.enum([
    "professional", 
    "conversational", 
    "friendly", 
    "authoritative", 
    "casual"
  ]).optional(),
  intendedAudience: z.string().optional(),
  additionalContext: z.string().optional(),
  wordCount: z.number().min(500).max(5000),
  includeFirstPerson: z.boolean().default(false),
  includeAnecdotes: z.boolean().default(false),
  includeHook: z.boolean().default(true),
  includeStories: z.boolean().default(false),
  includeHtmlElement: z.boolean().default(false),
  model: z.string().optional(),
});

type SeoFormValues = z.infer<typeof seoFormSchema>;

const defaultValues: Partial<SeoFormValues> = {
  articleType: "informational",
  toneOfArticle: "professional",
  wordCount: 1500,
  includeFirstPerson: false,
  includeAnecdotes: false,
  includeHook: true,
  includeStories: false,
  includeHtmlElement: false,
  model: "anthropic/claude-3-7-sonnet",
};

interface SeoGeneratorFormProps {
  includeInternalLinks?: boolean;
}

export function SeoGeneratorForm({ includeInternalLinks = false }: SeoGeneratorFormProps) {
  const { user, apiKey } = useAuth();
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [generatedContent, setGeneratedContent] = React.useState("");
  const [activeTab, setActiveTab] = React.useState("content-form");
  const [apiKeyMissing, setApiKeyMissing] = React.useState(!apiKey);
  const [viewMode, setViewMode] = React.useState<"rendered" | "markdown">("rendered");
  const [extractedHtmlCode, setExtractedHtmlCode] = React.useState<string>("");

  const form = useForm<SeoFormValues>({
    resolver: zodResolver(seoFormSchema),
    defaultValues,
  });

  React.useEffect(() => {
    setApiKeyMissing(!apiKey);
  }, [apiKey]);

  React.useEffect(() => {
    if (generatedContent) {
      const htmlCodeBlockRegex = /```(?:html)?\s*(<[\s\S]*?>[\s\S]*?<\/[\s\S]*?>)```/g;
      const htmlInlineRegex = /<(!DOCTYPE|html|div|section|article|header|footer|table|form|button|input|iframe)[\s\S]*?<\/\1>/g;
      
      let matches = [];
      let match;
      
      while ((match = htmlCodeBlockRegex.exec(generatedContent)) !== null) {
        if (match[1] && match[1].trim()) {
          matches.push(match[1].trim());
        }
      }
      
      if (matches.length === 0) {
        while ((match = htmlInlineRegex.exec(generatedContent)) !== null) {
          if (match[0] && match[0].trim()) {
            matches.push(match[0].trim());
          }
        }
      }
      
      if (matches.length > 0) {
        matches.sort((a, b) => b.length - a.length);
        setExtractedHtmlCode(matches[0]);
      } else {
        setExtractedHtmlCode("");
      }
    } else {
      setExtractedHtmlCode("");
    }
  }, [generatedContent]);

  const onSubmit = async (data: SeoFormValues) => {
    if (!apiKey) {
      toast({
        variant: "destructive",
        title: "API Key Required",
        description: "Please add your OpenRouter API key in the settings page to generate content.",
      });
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const formDataWithInternalLinks: SeoFormValues = {
        topic: data.topic,
        wordCount: data.wordCount,
        includeFirstPerson: data.includeFirstPerson,
        includeAnecdotes: data.includeAnecdotes,
        includeHook: data.includeHook,
        includeStories: data.includeStories,
        includeHtmlElement: data.includeHtmlElement,
        ...(data.targetKeyword && { targetKeyword: data.targetKeyword }),
        ...(data.articleType && { articleType: data.articleType }),
        ...(data.toneOfArticle && { toneOfArticle: data.toneOfArticle }),
        ...(data.intendedAudience && { intendedAudience: data.intendedAudience }),
        ...(data.additionalContext && { additionalContext: data.additionalContext }),
        ...(data.model && { model: data.model }),
        includeInternalLinks: includeInternalLinks || false,
      };
      
      const content = await generateSeoContent(formDataWithInternalLinks, apiKey);
      setGeneratedContent(content);
      setActiveTab("generated-content");
      toast({
        title: "Content generated successfully!",
        description: "Your SEO-optimized content is ready to review.",
      });
    } catch (error) {
      console.error("Error generating content:", error);
      toast({
        variant: "destructive",
        title: "Generation failed",
        description: error instanceof Error ? error.message : "There was an error generating your content. Please try again.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveContent = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "You must be logged in to save content.",
      });
      return;
    }
    
    setIsSaving(true);
    try {
      await saveGeneratedContent(
        form.getValues("topic"), 
        generatedContent, 
        user.id
      );
      
      toast({
        title: "Content saved",
        description: "Your content has been saved to your account.",
      });
    } catch (error) {
      console.error("Error saving content:", error);
      toast({
        variant: "destructive",
        title: "Save failed",
        description: "There was an error saving your content. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent);
    toast({
      title: "Copied to clipboard",
      description: "Content has been copied to your clipboard",
    });
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="mb-4 grid w-full grid-cols-2">
        <TabsTrigger value="content-form">Content Form</TabsTrigger>
        <TabsTrigger value="generated-content" disabled={!generatedContent}>
          Generated Content
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="content-form">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="topic"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Blog Post Topic *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Best Coffee Brewing Methods" {...field} />
                          </FormControl>
                          <FormDescription>
                            What is the main topic of your blog post?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="targetKeyword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Keyword</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., coffee brewing methods" {...field} />
                          </FormControl>
                          <FormDescription>
                            The primary keyword to optimize for (if empty, we'll use the topic)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="model"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel>AI Model</FormLabel>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <InfoIcon className="h-4 w-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">Select the AI model that will generate your content. Different models have different capabilities and costs.</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            disabled={apiKeyMissing}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select AI model" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <div className="mb-2 px-2 py-1.5 text-sm font-semibold">Recommended</div>
                              {recommendedModels
                                .filter(model => model.recommended)
                                .map(model => (
                                  <SelectItem key={model.id} value={model.id}>
                                    <div className="flex flex-col">
                                      <span>{model.name}</span>
                                      <span className="text-xs text-muted-foreground">{model.description}</span>
                                    </div>
                                  </SelectItem>
                                ))
                              }
                              <div className="mb-2 mt-2 px-2 py-1.5 text-sm font-semibold">Other Models</div>
                              {recommendedModels
                                .filter(model => !model.recommended)
                                .map(model => (
                                  <SelectItem key={model.id} value={model.id}>
                                    <div className="flex flex-col">
                                      <span>{model.name}</span>
                                      <span className="text-xs text-muted-foreground">{model.description}</span>
                                    </div>
                                  </SelectItem>
                                ))
                              }
                            </SelectContent>
                          </Select>
                          {apiKeyMissing && (
                            <FormDescription className="text-destructive">
                              API key required. Add it in Settings.
                            </FormDescription>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="articleType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Article Type</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select article type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="informational">Informational</SelectItem>
                              <SelectItem value="listicle">Listicle</SelectItem>
                              <SelectItem value="how-to">How-to Guide</SelectItem>
                              <SelectItem value="anecdote">Anecdote</SelectItem>
                              <SelectItem value="story">Story</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="toneOfArticle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tone of Article</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select tone" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="professional">Professional</SelectItem>
                              <SelectItem value="conversational">Conversational</SelectItem>
                              <SelectItem value="friendly">Friendly</SelectItem>
                              <SelectItem value="authoritative">Authoritative</SelectItem>
                              <SelectItem value="casual">Casual</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="intendedAudience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Intended Audience</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Coffee enthusiasts, beginners" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="additionalContext"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Context</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Include any specific information, business details, or context you want in the article" 
                              className="min-h-[120px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="wordCount"
                      render={({ field: { value, onChange, ...rest } }) => (
                        <FormItem>
                          <FormLabel>Word Count: {value}</FormLabel>
                          <FormControl>
                            <Slider
                              min={500}
                              max={5000}
                              step={100}
                              defaultValue={[value]}
                              onValueChange={(values) => onChange(values[0])}
                              {...rest}
                            />
                          </FormControl>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>500</span>
                            <span>5000</span>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-4 pt-4">
                      <h3 className="font-medium">Article Elements</h3>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <FormField
                            control={form.control}
                            name="includeFirstPerson"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 w-full">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">First Person</FormLabel>
                                  <FormDescription>
                                    Write using "I" perspective
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <FormField
                            control={form.control}
                            name="includeAnecdotes"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 w-full">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">Anecdotes</FormLabel>
                                  <FormDescription>
                                    Include personal stories
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <FormField
                            control={form.control}
                            name="includeHook"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 w-full">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">Hook</FormLabel>
                                  <FormDescription>
                                    Start with an engaging hook
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <FormField
                            control={form.control}
                            name="includeStories"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 w-full">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">Stories</FormLabel>
                                  <FormDescription>
                                    Include relevant stories or examples
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <FormField
                            control={form.control}
                            name="includeHtmlElement"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 w-full">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">Interactive HTML Element</FormLabel>
                                  <FormDescription>
                                    Include an interactive HTML element
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {!apiKey ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>API Key Required</AlertTitle>
                <AlertDescription className="flex flex-col gap-2">
                  <p>You need to add an OpenRouter API key in Settings to generate content.</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-fit"
                    onClick={() => window.open("https://openrouter.ai/keys", "_blank")}
                  >
                    Get an OpenRouter API Key
                  </Button>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Note</AlertTitle>
                <AlertDescription>
                  For best results, this template works optimally with the Claude 3.7 Sonnet model.
                </AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full"
              disabled={isGenerating || (!apiKey)}
            >
              {isGenerating ? "Generating..." : "Generate SEO Content"}
            </Button>
          </form>
        </Form>
      </TabsContent>
      
      <TabsContent value="generated-content">
        {generatedContent && (
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Generated Content</h3>
                  <div className="flex gap-2">
                    <div className="border rounded-md overflow-hidden flex">
                      <Button 
                        variant={viewMode === "rendered" ? "default" : "ghost"} 
                        size="sm"
                        onClick={() => setViewMode("rendered")}
                        className="rounded-none"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                      <Button 
                        variant={viewMode === "markdown" ? "default" : "ghost"} 
                        size="sm"
                        onClick={() => setViewMode("markdown")}
                        className="rounded-none"
                      >
                        <Code className="h-4 w-4 mr-2" />
                        Markdown
                      </Button>
                    </div>
                    <Button variant="outline" size="sm" onClick={copyToClipboard}>
                      <ClipboardCopy className="h-4 w-4 mr-2" />
                      Copy {viewMode === "markdown" ? "Markdown" : "Content"}
                    </Button>
                  </div>
                </div>
                
                {viewMode === "rendered" ? (
                  <div className="content-container prose dark:prose-invert max-w-none border p-4 rounded-md bg-muted/50 min-h-[400px] max-h-[800px] overflow-y-auto">
                    <ReactMarkdown components={{
                      p: ({ node, ...props }) => {
                        const content = props.children;
                        if (typeof content === 'string' && (content.includes('<') && content.includes('>'))) {
                          return <div dangerouslySetInnerHTML={{ __html: content }} />;
                        }
                        return <p {...props} />;
                      },
                      table: ({ node, ...props }) => (
                        <div className="overflow-x-auto my-6">
                          <table className="w-full border-collapse border border-border" {...props} />
                        </div>
                      ),
                      thead: ({ node, ...props }) => (
                        <thead className="bg-muted" {...props} />
                      ),
                      tbody: ({ node, ...props }) => (
                        <tbody className="divide-y divide-border" {...props} />
                      ),
                      tr: ({ node, ...props }) => (
                        <tr className="hover:bg-muted/50" {...props} />
                      ),
                      th: ({ node, ...props }) => (
                        <th className="border border-border px-4 py-2 text-left font-semibold" {...props} />
                      ),
                      td: ({ node, ...props }) => (
                        <td className="border border-border px-4 py-2" {...props} />
                      ),
                      ul: ({ node, ...props }) => (
                        <ul className="list-disc pl-6 my-4 space-y-2" {...props} />
                      ),
                      ol: ({ node, ...props }) => (
                        <ol className="list-decimal pl-6 my-4 space-y-2" {...props} />
                      ),
                      li: ({ node, ...props }) => (
                        <li className="pl-1" {...props} />
                      ),
                      h1: ({ node, ...props }) => (
                        <h1 className="text-3xl font-bold mt-8 mb-4 scroll-m-20" {...props} />
                      ),
                      h2: ({ node, ...props }) => (
                        <h2 className="text-2xl font-semibold mt-8 mb-3 scroll-m-20" {...props} />
                      ),
                      h3: ({ node, ...props }) => (
                        <h3 className="text-xl font-semibold mt-6 mb-2 scroll-m-20" {...props} />
                      ),
                      h4: ({ node, ...props }) => (
                        <h4 className="text-lg font-medium mt-4 mb-2 scroll-m-20" {...props} />
                      ),
                      blockquote: ({ node, ...props }) => (
                        <blockquote className="border-l-4 border-primary/50 pl-4 italic my-4" {...props} />
                      ),
                      code: ({ className, children, ...props }) => {
                        const match = /language-(\w+)/.exec(className || '');
                        const isInline = !match && (className || '').indexOf('language-') !== 0;
                        
                        if (isInline) {
                          return <code className="px-1 py-0.5 bg-muted rounded text-sm" {...props}>{children}</code>;
                        }
                        
                        return (
                          <pre className="p-4 bg-muted rounded-md overflow-x-auto">
                            <code className="text-sm" {...props}>{children}</code>
                          </pre>
                        );
                      },
                    }}>
                      {generatedContent}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="min-h-[400px] max-h-[800px] overflow-y-auto">
                    <Textarea 
                      value={generatedContent} 
                      readOnly 
                      className="w-full h-full min-h-[400px] font-mono text-sm"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
            
            {extractedHtmlCode && form.getValues("includeHtmlElement") && (
              <HtmlPreviewComponent htmlCode={extractedHtmlCode} />
            )}
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab("content-form")}>
                Back to Form
              </Button>
              <Button 
                onClick={handleSaveContent} 
                disabled={isSaving || !user}
              >
                {isSaving ? "Saving..." : "Save to My Content"}
              </Button>
            </div>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

