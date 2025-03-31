
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
import { ClipboardCopy, AlertCircle, InfoIcon, Code, Eye, Search, Globe, FileText, Link2 } from "lucide-react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Custom validator for word count
const wordCountValidator = (value: string | undefined, maxWords: number): boolean => {
  if (!value) return true;
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  return wordCount <= maxWords;
};

const blogGeneratorSchema = z.object({
  topic: z.string().min(3, { message: "Topic must be at least 3 characters" }),
  inputMode: z.enum(["webSearch", "manualInput"]).default("webSearch"),
  searchTerm: z.string().optional(),
  manualInput: z.string()
    .optional()
    .refine(
      value => wordCountValidator(value, 2000),
      { message: "Manual input must be 2000 words or less" }
    ),
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
  includeCitations: z.boolean().default(true),
  model: z.string().optional(),
});

type BlogGeneratorFormValues = z.infer<typeof blogGeneratorSchema>;

const defaultValues: Partial<BlogGeneratorFormValues> = {
  inputMode: "webSearch",
  articleType: "informational",
  toneOfArticle: "professional",
  wordCount: 1500,
  includeFirstPerson: false,
  includeAnecdotes: false,
  includeHook: true,
  includeStories: false,
  includeHtmlElement: false,
  includeCitations: true,
  model: "openai/gpt-4o-mini-search-preview",
};

// Web search specific models
const webSearchModels = [
  { 
    id: "openai/gpt-4o-mini-search-preview", 
    name: "GPT-4o mini Search Preview", 
    description: "Fastest web search with good quality",
    recommended: true
  },
  { 
    id: "perplexity/sonar-reasoning-pro", 
    name: "Perplexity Sonar Reasoning Pro", 
    description: "Advanced reasoning with comprehensive citations",
    recommended: true
  },
  { 
    id: "perplexity/sonar-pro", 
    name: "Perplexity Sonar Pro", 
    description: "Handles complex queries with extensive citations",
    recommended: true
  }
];

interface RealTimeBlogGeneratorFormProps {
  includeInternalLinks?: boolean;
  includeCitations?: boolean;
  onCitationsToggle?: (enabled: boolean) => void;
  customOutline?: string;
}

export function RealTimeBlogGeneratorForm({ 
  includeInternalLinks = false,
  includeCitations = true,
  onCitationsToggle,
  customOutline = ""
}: RealTimeBlogGeneratorFormProps) {
  const { user, apiKey } = useAuth();
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [generatedContent, setGeneratedContent] = React.useState("");
  const [activeTab, setActiveTab] = React.useState("content-form");
  const [apiKeyMissing, setApiKeyMissing] = React.useState(!apiKey);
  const [viewMode, setViewMode] = React.useState<"rendered" | "markdown">("rendered");
  const [extractedHtmlCode, setExtractedHtmlCode] = React.useState<string>("");

  const form = useForm<BlogGeneratorFormValues>({
    resolver: zodResolver(blogGeneratorSchema),
    defaultValues: {
      ...defaultValues,
      includeCitations
    },
  });

  const inputMode = form.watch("inputMode");
  const includeLocalCitations = form.watch("includeCitations");

  // Update parent state when local citations value changes
  React.useEffect(() => {
    if (onCitationsToggle && includeLocalCitations !== includeCitations) {
      onCitationsToggle(includeLocalCitations);
    }
  }, [includeLocalCitations, includeCitations, onCitationsToggle]);

  // Update local form when prop changes
  React.useEffect(() => {
    form.setValue("includeCitations", includeCitations);
  }, [includeCitations, form]);

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

  // Update the model when the input mode changes
  React.useEffect(() => {
    if (inputMode === "webSearch") {
      form.setValue("model", "openai/gpt-4o-mini-search-preview");
    } else {
      form.setValue("model", "openai/o1-mini-2024-09-12");
    }
  }, [inputMode, form]);

  const onSubmit = async (data: BlogGeneratorFormValues) => {
    if (!apiKey) {
      toast({
        variant: "destructive",
        title: "API Key Required",
        description: "Please add your OpenRouter API key in the settings page to generate content.",
      });
      return;
    }
    
    if (data.inputMode === "webSearch" && (!data.searchTerm || data.searchTerm.trim() === "")) {
      toast({
        variant: "destructive",
        title: "Search Term Required",
        description: "Please enter a search term for web research.",
      });
      return;
    }
    
    if (data.inputMode === "manualInput" && (!data.manualInput || data.manualInput.trim() === "")) {
      toast({
        variant: "destructive",
        title: "Manual Input Required",
        description: "Please enter your research content in the manual input field.",
      });
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const formDataWithInternalLinks = {
        ...data,
        includeInternalLinks,
        // When using web search, we'll always use Claude 3.7 Sonnet for final content generation
        finalContentModel: data.inputMode === "webSearch" ? "anthropic/claude-3.7-sonnet" : undefined
      };
      
      const content = await generateSeoContent(formDataWithInternalLinks as SeoServiceFormValues, apiKey);
      setGeneratedContent(content);
      setActiveTab("generated-content");
      toast({
        title: "Content generated successfully!",
        description: data.inputMode === "webSearch" 
          ? "Your web-researched blog post is ready to review."
          : "Your blog post based on your input is ready to review.",
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
                <CardHeader>
                  <CardTitle>Content Research</CardTitle>
                  <CardDescription>
                    Choose how to provide research for your blog post
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="inputMode"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Research Method</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="webSearch" />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer flex items-center">
                                <Search className="mr-2 h-4 w-4" />
                                Web Search
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="manualInput" />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer flex items-center">
                                <FileText className="mr-2 h-4 w-4" />
                                Manual Input
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormDescription>
                          Choose to research topics online or provide your own research
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {inputMode === "webSearch" && (
                    <>
                      <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                        <InfoIcon className="h-4 w-4 text-blue-500" />
                        <AlertTitle className="text-blue-700 dark:text-blue-300">Two-step generation process</AlertTitle>
                        <AlertDescription className="text-blue-600 dark:text-blue-400">
                          <p>1. We'll use the model you select below to research the web for relevant information</p>
                          <p>2. Then we'll use Claude 3.7 Sonnet to craft the final blog post</p>
                        </AlertDescription>
                      </Alert>

                      <FormField
                        control={form.control}
                        name="searchTerm"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center">
                              <Search className="mr-2 h-4 w-4" />
                              Web Search Term *
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., latest coffee brewing methods 2025" {...field} />
                            </FormControl>
                            <FormDescription>
                              The term to research online for up-to-date information
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="includeCitations"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base flex items-center">
                                <Link2 className="mr-2 h-4 w-4" />
                                Include Citations
                              </FormLabel>
                              <FormDescription>
                                Copy sources and add citations to the end of the blog post
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
                    </>
                  )}

                  {inputMode === "manualInput" && (
                    <FormField
                      control={form.control}
                      name="manualInput"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center">
                            <FileText className="mr-2 h-4 w-4" />
                            Your Research Content *
                          </FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Paste your research content here (up to 2000 words)..."
                              className="min-h-[200px]"
                              showCount
                              countType="words"
                              maxCount={2000}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Paste your own research content to use as the basis for your article
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="topic"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          <Globe className="mr-2 h-4 w-4" />
                          Blog Post Topic *
                        </FormLabel>
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

                  {inputMode === "webSearch" && (
                    <FormField
                      control={form.control}
                      name="model"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel>Research Model</FormLabel>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <InfoIcon className="h-4 w-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">
                                    Select the AI model to use for web research. Content will be generated with Claude 3.7 Sonnet.
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select research model" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {webSearchModels.map(model => (
                                <SelectItem key={model.id} value={model.id}>
                                  <div className="flex flex-col">
                                    <span>{model.name} {model.recommended && "★"}</span>
                                    <span className="text-xs text-muted-foreground">{model.description}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Choose a model for web research. Final content will be generated with Claude 3.7 Sonnet.
                          </FormDescription>
                          {apiKeyMissing && (
                            <FormDescription className="text-destructive">
                              API key required. Add it in Settings.
                            </FormDescription>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {inputMode === "manualInput" && (
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
                                  <p className="max-w-xs">
                                    Select the AI model to use for content generation.
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select AI model" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {recommendedModels.map(model => (
                                <SelectItem key={model.id} value={model.id}>
                                  <div className="flex flex-col">
                                    <span>{model.name} {model.recommended && "★"}</span>
                                    <span className="text-xs text-muted-foreground">{model.description}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Choose a model for your content generation.
                          </FormDescription>
                          {apiKeyMissing && (
                            <FormDescription className="text-destructive">
                              API key required. Add it in Settings.
                            </FormDescription>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

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
                              showCount
                              countType="words"
                              maxCount={1000}
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Business information will be used sparingly and only when relevant
                          </FormDescription>
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
                  {inputMode === "webSearch"
                    ? "Web search uses a two-step process: research with your selected model, then final content generation with Claude 3.7 Sonnet."
                    : "Using your own research content may help save on API costs."}
                </AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full"
              disabled={isGenerating || (!apiKey)}
            >
              {isGenerating ? "Generating..." : inputMode === "webSearch" ? "Generate Real-Time Blog Post" : "Generate Blog Post"}
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
