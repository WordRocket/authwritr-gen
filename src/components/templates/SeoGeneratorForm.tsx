
import React, { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { CircleHelp } from "lucide-react";
import { recommendedModels, generateSeoContent, saveGeneratedContent } from "@/services/contentGenerationService";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/context/AuthContext";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { HtmlPreviewComponent } from "./HtmlPreviewComponent";

// Define the form schema
const formSchema = z.object({
  topic: z.string().min(2, { message: "Topic must be at least 2 characters" }),
  searchTerm: z.string().optional(),
  targetKeyword: z.string().optional(),
  articleType: z.string().optional(),
  toneOfArticle: z.string().optional(),
  intendedAudience: z.string().optional(),
  additionalContext: z.string().optional(),
  wordCount: z.number().min(300).max(10000),
  model: z.string().optional(),
  includeFirstPerson: z.boolean().default(false),
  includeAnecdotes: z.boolean().default(false),
  includeHook: z.boolean().default(false),
  includeStories: z.boolean().default(false),
  includeHtmlElement: z.boolean().default(false),
  includeInternalLinks: z.boolean().default(false),
});

// Type for the form values
type SeoFormValues = z.infer<typeof formSchema>;

interface SeoGeneratorFormProps {
  includeInternalLinks?: boolean;
}

export const SeoGeneratorForm = ({ includeInternalLinks = false }: SeoGeneratorFormProps) => {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [generatedContent, setGeneratedContent] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [extractedHtmlCode, setExtractedHtmlCode] = useState<string>("");
  const [showAdvancedOptions, setShowAdvancedOptions] = useState<boolean>(false);
  const [contentTitle, setContentTitle] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("editor");
  const [openRouterApiKey, setOpenRouterApiKey] = useState<string>(() => {
    return localStorage.getItem("openRouterApiKey") || "";
  });
  const [isContentSaved, setIsContentSaved] = useState<boolean>(false);
  const [backgroundGeneration, setBackgroundGeneration] = useState<boolean>(false);

  // Form definition
  const form = useForm<SeoFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: "",
      searchTerm: "",
      targetKeyword: "",
      articleType: "informational",
      toneOfArticle: "professional",
      intendedAudience: "",
      additionalContext: "",
      wordCount: 1500,
      model: "anthropic/claude-3.7-sonnet",
      includeFirstPerson: false,
      includeAnecdotes: false,
      includeHook: true,
      includeStories: false,
      includeHtmlElement: false,
      includeInternalLinks: includeInternalLinks,
    },
  });

  // Extract HTML code from generated content
  React.useEffect(() => {
    if (generatedContent) {
      // Look for code blocks that appear to contain HTML
      const htmlCodeBlockRegex = /```(?:html)?\s*(<[\s\S]*?>[\s\S]*?<\/[\s\S]*?>)```/g;
      const htmlInlineRegex = /<(!DOCTYPE|html|div|section|article|header|footer|table|form|button|input|iframe)[\s\S]*?<\/\1>/g;
      
      let matches = [];
      let match;
      
      // First try to find code blocks with HTML
      while ((match = htmlCodeBlockRegex.exec(generatedContent)) !== null) {
        if (match[1] && match[1].trim()) {
          matches.push(match[1].trim());
        }
      }
      
      // If no code blocks found, try to find inline HTML
      if (matches.length === 0) {
        while ((match = htmlInlineRegex.exec(generatedContent)) !== null) {
          if (match[0] && match[0].trim()) {
            matches.push(match[0].trim());
          }
        }
      }
      
      // Use the longest match as it's likely the most complete HTML
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

  const handleSaveContent = async () => {
    if (!contentTitle.trim()) {
      toast({
        variant: "destructive",
        title: "Title Required",
        description: "Please enter a title for your content",
      });
      return;
    }

    if (!isAuthenticated) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please login to save your content",
      });
      return;
    }

    try {
      await saveGeneratedContent(contentTitle, generatedContent, user?.id as string);
      
      setIsContentSaved(true);
      
      toast({
        title: "Content Saved",
        description: "Your content has been saved successfully",
      });
    } catch (error) {
      console.error("Error saving content:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save content. Please try again.",
      });
    }
  };

  const navigateToSavedContent = () => {
    navigate("/content");
  };

  const onSubmit = async (data: SeoFormValues) => {
    const apiKey = openRouterApiKey.trim();
    if (!apiKey) {
      toast({
        variant: "destructive",
        title: "API Key Required",
        description: "Please enter your OpenRouter API Key",
      });
      return;
    }

    // Set title from topic
    setContentTitle(data.topic);
    
    try {
      setIsGenerating(true);
      setIsContentSaved(false);
      
      // If background generation is enabled, show toast and don't wait for content
      if (backgroundGeneration) {
        toast({
          title: "Content Generation Started",
          description: "Your content will be generated in the background. You can continue using the application.",
        });
        
        // Start generation without awaiting
        generateSeoContent(data, apiKey)
          .then((content) => {
            setGeneratedContent(content);
            
            toast({
              title: "Content Generation Complete",
              description: "Your content has been generated successfully!",
            });
            
            setIsGenerating(false);
            // Switch to preview tab automatically
            setActiveTab("preview");
          })
          .catch((error) => {
            console.error("Error generating content:", error);
            
            toast({
              variant: "destructive",
              title: "Generation Error",
              description: error.message || "Failed to generate content",
            });
            
            setIsGenerating(false);
          });
      } else {
        // Regular foreground generation
        const content = await generateSeoContent(data, apiKey);
        setGeneratedContent(content);
        // Switch to preview tab automatically
        setActiveTab("preview");
      }
    } catch (error) {
      console.error("Error generating content:", error);
      
      toast({
        variant: "destructive",
        title: "Generation Error",
        description: error.message || "Failed to generate content",
      });
    } finally {
      if (!backgroundGeneration) {
        setIsGenerating(false);
      }
    }
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newKey = e.target.value;
    setOpenRouterApiKey(newKey);
    localStorage.setItem("openRouterApiKey", newKey);
  };

  return (
    <div className="container mx-auto mt-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="editor">Content Generator</TabsTrigger>
          {generatedContent && <TabsTrigger value="preview">Preview</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="editor">
          <Card>
            <CardHeader>
              <CardTitle>Generate SEO Content</CardTitle>
              <CardDescription>
                Fill in the details below to generate AI-powered SEO content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-4">
                    {/* Basic Options Section */}
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="topic"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Topic <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Benefits of Meditation" {...field} />
                            </FormControl>
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
                              <Input placeholder="e.g. meditation benefits" {...field} />
                            </FormControl>
                            <FormDescription>
                              For SEO optimization (if different from topic)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="searchTerm"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Search Term (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Web search term for real-time research" {...field} />
                            </FormControl>
                            <FormDescription>
                              Enables web search for up-to-date information
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="wordCount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Word Count: {field.value}</FormLabel>
                            <FormControl>
                              <Slider
                                min={300}
                                max={5000}
                                step={100}
                                defaultValue={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="model"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>AI Model</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select model" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="auto">
                                  Auto-select best model (recommended)
                                </SelectItem>
                                {recommendedModels.map((model) => (
                                  <SelectItem key={model.id} value={model.id}>
                                    {model.name} {model.recommended && "⭐"} - {model.description}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="includeInternalLinks"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Include Internal Links</FormLabel>
                              <FormDescription>
                                Add internal links from your sitemap
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={!includeInternalLinks}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="includeHtmlElement"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Include Interactive HTML Element</FormLabel>
                              <FormDescription>
                                Generate an interactive element like a calculator or visualization
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
                      
                      <div className="pt-4">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                        >
                          {showAdvancedOptions ? "Hide" : "Show"} Advanced Options
                        </Button>
                      </div>

                      {/* Advanced Options Section */}
                      {showAdvancedOptions && (
                        <div className="space-y-4 pt-4 border-t mt-4">
                          <FormField
                            control={form.control}
                            name="articleType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Article Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select article type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="informational">Informational</SelectItem>
                                    <SelectItem value="how-to">How-to Guide</SelectItem>
                                    <SelectItem value="listicle">Listicle</SelectItem>
                                    <SelectItem value="anecdote">Case Study</SelectItem>
                                    <SelectItem value="story">Story-based</SelectItem>
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
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                                  <Input placeholder="e.g. Beginners, Professionals, Mothers" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="additionalContext"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Additional Context</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Any additional information or instructions for the AI"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="includeFirstPerson"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-base">First Person Perspective</FormLabel>
                                    <FormDescription>
                                      Write in "I" voice
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

                            <FormField
                              control={form.control}
                              name="includeAnecdotes"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-base">Include Anecdotes</FormLabel>
                                    <FormDescription>
                                      Add short stories
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

                            <FormField
                              control={form.control}
                              name="includeHook"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-base">Include Hook</FormLabel>
                                    <FormDescription>
                                      Start with engaging intro
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

                            <FormField
                              control={form.control}
                              name="includeStories"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-base">Include Stories</FormLabel>
                                    <FormDescription>
                                      Add narrative examples
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
                      )}
                    </div>
                    
                    {/* Background Generation Option */}
                    <div className="border-t pt-4 mt-4">
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Background Generation</FormLabel>
                          <FormDescription>
                            Generate content in the background while you continue using the app
                          </FormDescription>
                        </div>
                        <Switch
                          checked={backgroundGeneration}
                          onCheckedChange={setBackgroundGeneration}
                        />
                      </FormItem>
                    </div>

                    {/* API Key Input */}
                    <div className="border-t pt-4 mt-4">
                      <FormItem>
                        <FormLabel>
                          OpenRouter API Key <span className="text-red-500">*</span>
                        </FormLabel>
                        <div className="flex items-center">
                          <Input
                            type="password"
                            value={openRouterApiKey}
                            onChange={handleApiKeyChange}
                            placeholder="Enter your OpenRouter API Key"
                          />
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button type="button" variant="ghost" size="icon" className="ml-2">
                                <CircleHelp className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>OpenRouter API Key</DialogTitle>
                              </DialogHeader>
                              <DialogDescription>
                                <p className="mb-2">
                                  You need an OpenRouter API key to generate content. If you don't have one, you can get it from:
                                </p>
                                <a
                                  href="https://openrouter.ai/keys"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
                                >
                                  https://openrouter.ai/keys
                                </a>
                                <Alert className="mt-4">
                                  <AlertTitle>Privacy Note</AlertTitle>
                                  <AlertDescription>
                                    Your API key is stored locally in your browser and is never sent to our servers.
                                  </AlertDescription>
                                </Alert>
                              </DialogDescription>
                            </DialogContent>
                          </Dialog>
                        </div>
                        <FormDescription>
                          Required to use the AI models. Your key is stored locally in your browser.
                        </FormDescription>
                      </FormItem>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isGenerating}
                  >
                    {isGenerating && !backgroundGeneration ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Generate Content"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="preview">
          {generatedContent ? (
            <>
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Preview: {contentTitle}</CardTitle>
                      <CardDescription>
                        Generated content preview
                      </CardDescription>
                    </div>
                    {isAuthenticated ? (
                      <div className="flex space-x-2">
                        {isContentSaved ? (
                          <Button onClick={navigateToSavedContent}>
                            View All Content
                          </Button>
                        ) : (
                          <Button onClick={handleSaveContent}>
                            Save Content
                          </Button>
                        )}
                      </div>
                    ) : (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button>Save Content</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Authentication Required</DialogTitle>
                            <DialogDescription>
                              You need to be logged in to save content.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button onClick={() => navigate("/auth")}>
                              Login / Register
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose dark:prose-invert max-w-none">
                    <ReactMarkdown components={{
                      p: ({ node, ...props }) => {
                        const content = props.children;
                        // Check if content contains HTML elements
                        if (typeof content === 'string' && (content.includes('<') && content.includes('>'))) {
                          return <div dangerouslySetInnerHTML={{ __html: content }} />;
                        }
                        return <p {...props} />;
                      },
                      // Handle tables properly
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
                    }}>
                      {generatedContent}
                    </ReactMarkdown>
                  </div>
                  
                  {/* HTML Element Preview if found */}
                  {extractedHtmlCode && (
                    <HtmlPreviewComponent 
                      htmlCode={extractedHtmlCode} 
                      className="mt-8" 
                    />
                  )}
                </CardContent>
                <CardFooter className="border-t pt-6">
                  <Button variant="outline" onClick={() => setActiveTab("editor")} className="w-full">
                    Return to Editor
                  </Button>
                </CardFooter>
              </Card>
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Content Generated</CardTitle>
                <CardDescription>
                  Fill out the form and generate content to see a preview
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setActiveTab("editor")}>
                  Go to Editor
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
