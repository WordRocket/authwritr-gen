import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { 
  ClipboardCopy, 
  AlertCircle, 
  InfoIcon, 
  Code, 
  Eye, 
  Plus, 
  Trash2,
  FileText
} from "lucide-react";
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
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BlogArticle {
  id: string;
  title: string;
  keyword: string;
  status: "pending" | "generating" | "completed" | "error";
  wordCount?: number;
}

const globalSettingsSchema = z.object({
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
  wordCountMin: z.number().min(500).max(5000),
  wordCountMax: z.number().min(500).max(5000),
  intendedAudience: z.string().optional(),
  additionalContext: z.string().optional(),
  includeFirstPerson: z.boolean().default(false),
  includeStoriesExamples: z.boolean().default(false),
  includeHook: z.boolean().default(true),
  includeHtmlElement: z.boolean().default(false),
  model: z.string().optional(),
});

type GlobalSettingsFormValues = z.infer<typeof globalSettingsSchema>;

const bulkArticleSchema = z.object({
  articles: z.array(
    z.object({
      title: z.string().min(3, { message: "Title must be at least 3 characters" }),
      keyword: z.string().min(1, { message: "Keyword is required" }),
    })
  ).min(1, { message: "At least one article is required" }),
  bulkInput: z.string().optional(),
});

type BulkArticleFormValues = z.infer<typeof bulkArticleSchema>;

const defaultGlobalSettings: GlobalSettingsFormValues = {
  articleType: "informational",
  toneOfArticle: "professional",
  wordCountMin: 1000,
  wordCountMax: 2000,
  includeFirstPerson: false,
  includeStoriesExamples: false,
  includeHook: true,
  includeHtmlElement: false,
  model: "anthropic/claude-3-7-sonnet",
};

interface BulkBlogGeneratorFormProps {
  includeInternalLinks?: boolean;
  customOutline?: string;
  onGeneratingStateChange?: (generating: boolean) => void;
}

export function BulkBlogGeneratorForm({ 
  includeInternalLinks = false,
  customOutline = "",
  onGeneratingStateChange
}: BulkBlogGeneratorFormProps) {
  const { user, apiKey } = useAuth();
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("global-settings");
  const [apiKeyMissing, setApiKeyMissing] = React.useState(!apiKey);
  const [blogArticles, setBlogArticles] = React.useState<BlogArticle[]>([]);
  const navigate = useNavigate();

  const globalSettingsForm = useForm<GlobalSettingsFormValues>({
    resolver: zodResolver(globalSettingsSchema),
    defaultValues: defaultGlobalSettings,
  });

  const bulkArticleForm = useForm<BulkArticleFormValues>({
    resolver: zodResolver(bulkArticleSchema),
    defaultValues: {
      articles: [
        { title: "", keyword: "" }
      ],
      bulkInput: ""
    }
  });

  React.useEffect(() => {
    setApiKeyMissing(!apiKey);
  }, [apiKey]);

  const addArticle = () => {
    const currentArticles = bulkArticleForm.getValues("articles");
    bulkArticleForm.setValue("articles", [
      ...currentArticles,
      { title: "", keyword: "" }
    ]);
  };

  const removeArticle = (index: number) => {
    const currentArticles = bulkArticleForm.getValues("articles");
    if (currentArticles.length > 1) {
      currentArticles.splice(index, 1);
      bulkArticleForm.setValue("articles", [...currentArticles]);
    } else {
      toast({
        variant: "destructive",
        title: "Cannot remove",
        description: "You must have at least one article.",
      });
    }
  };

  const processBulkInput = () => {
    const bulkText = bulkArticleForm.getValues("bulkInput") || "";
    if (!bulkText.trim()) {
      toast({
        variant: "destructive",
        title: "Empty input",
        description: "Please enter topics or paste CSV content.",
      });
      return;
    }

    try {
      const lines = bulkText.split('\n');
      const newArticles = lines
        .filter(line => line.trim())
        .map(line => {
          const [title, keyword] = line.split(',').map(item => item.trim());
          return {
            title: title || "",
            keyword: keyword || title || "",
          };
        });

      if (newArticles.length > 0) {
        bulkArticleForm.setValue("articles", newArticles);
        bulkArticleForm.setValue("bulkInput", "");
        setActiveTab("article-list");
        toast({
          title: "Bulk import successful",
          description: `Imported ${newArticles.length} articles.`,
        });
      }
    } catch (error) {
      const lines = bulkText.split('\n');
      const newArticles = lines
        .filter(line => line.trim())
        .map(line => ({
          title: line.trim(),
          keyword: line.trim(),
        }));

      if (newArticles.length > 0) {
        bulkArticleForm.setValue("articles", newArticles);
        bulkArticleForm.setValue("bulkInput", "");
        setActiveTab("article-list");
        toast({
          title: "Bulk import successful",
          description: `Imported ${newArticles.length} articles.`,
        });
      }
    }
  };

  const onSubmit = async () => {
    if (!apiKey) {
      toast({
        variant: "destructive",
        title: "API Key Required",
        description: "Please add your OpenRouter API key in the settings page to generate content.",
      });
      return;
    }

    try {
      await globalSettingsForm.trigger();
      await bulkArticleForm.trigger();
      
      if (!globalSettingsForm.formState.isValid || !bulkArticleForm.formState.isValid) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Please fix the form errors before submitting.",
        });
        return;
      }
      
      const globalSettings = globalSettingsForm.getValues();
      const articlesToGenerate = bulkArticleForm.getValues().articles;
      
      if (articlesToGenerate.length === 0) {
        toast({
          variant: "destructive",
          title: "No Articles",
          description: "Please add at least one article to generate.",
        });
        return;
      }
      
      setIsGenerating(true);
      if (onGeneratingStateChange) {
        onGeneratingStateChange(true);
      }
      
      const articles = articlesToGenerate.map((article, index) => ({
        id: `article-${Date.now()}-${index}`,
        title: article.title,
        keyword: article.keyword,
        status: "pending" as const,
      }));
      
      setBlogArticles(articles);
      
      toast({
        title: "Bulk generation starting",
        description: `Starting generation of ${articles.length} articles. This may take a few minutes.`,
      });
      
      let successCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < articles.length; i++) {
        const article = articles[i];
        
        setBlogArticles(prev => prev.map(a => 
          a.id === article.id ? { ...a, status: "generating" as const } : a
        ));
        
        try {
          const wordCount = Math.floor(
            Math.random() * (globalSettings.wordCountMax - globalSettings.wordCountMin + 1) 
            + globalSettings.wordCountMin
          );
          
          const requestData: SeoServiceFormValues = {
            topic: article.title,
            targetKeyword: article.keyword,
            articleType: globalSettings.articleType,
            toneOfArticle: globalSettings.toneOfArticle,
            intendedAudience: globalSettings.intendedAudience,
            additionalContext: globalSettings.additionalContext,
            wordCount,
            includeFirstPerson: globalSettings.includeFirstPerson,
            includeAnecdotes: globalSettings.includeStoriesExamples,
            includeStories: globalSettings.includeStoriesExamples,
            includeHook: globalSettings.includeHook,
            includeHtmlElement: globalSettings.includeHtmlElement,
            includeInternalLinks,
            backgroundGeneration: false,
            model: globalSettings.model,
          };
          
          let options = {};
          if (customOutline) {
            options = { customOutline };
          }
          
          const content = await generateSeoContent(requestData, apiKey, options);
          
          if (content && content !== "BACKGROUND_GENERATION_STARTED") {
            const { data: { user } } = await supabase.auth.getUser();
            
            if (user) {
              await saveGeneratedContent(article.title, content, user.id);
              
              setBlogArticles(prev => prev.map(a => 
                a.id === article.id ? { ...a, status: "completed" as const, wordCount } : a
              ));
              
              successCount++;
            } else {
              throw new Error("User not authenticated");
            }
          } else {
            setBlogArticles(prev => prev.map(a => 
              a.id === article.id ? { ...a, status: "completed" as const, wordCount } : a
            ));
            
            successCount++;
          }
          
        } catch (error) {
          console.error(`Error generating article ${article.title}:`, error);
          
          setBlogArticles(prev => prev.map(a => 
            a.id === article.id ? { ...a, status: "error" as const } : a
          ));
          
          errorCount++;
          
          toast({
            variant: "destructive",
            title: `Failed to generate "${article.title}"`,
            description: error instanceof Error ? error.message : "An unknown error occurred",
          });
        }
        
        if (i < articles.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      const finalMessage = 
        errorCount > 0 
          ? `Generated ${successCount} articles with ${errorCount} failures. View successful articles in My Content.`
          : `Generated ${successCount} articles. View them in My Content.`;
      
      toast({
        title: "Bulk generation completed",
        description: finalMessage,
      });
      
      if (successCount > 0) {
        setTimeout(() => {
          navigate("/content");
        }, 3000);
      }
      
    } catch (error) {
      console.error("Bulk generation error:", error);
      toast({
        variant: "destructive",
        title: "Generation failed",
        description: error instanceof Error ? error.message : "There was an error generating your content.",
      });
    } finally {
      setIsGenerating(false);
      if (onGeneratingStateChange) {
        onGeneratingStateChange(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="global-settings">Global Settings</TabsTrigger>
          <TabsTrigger value="article-list">Article List</TabsTrigger>
          <TabsTrigger value="bulk-import">Bulk Import</TabsTrigger>
        </TabsList>
        
        <TabsContent value="global-settings">
          <Form {...globalSettingsForm}>
            <form className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Content Settings</CardTitle>
                    <CardDescription>
                      These settings will apply to all generated articles
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={globalSettingsForm.control}
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
                      control={globalSettingsForm.control}
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
                      control={globalSettingsForm.control}
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
                      control={globalSettingsForm.control}
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
                  <CardHeader>
                    <CardTitle>Advanced Settings</CardTitle>
                    <CardDescription>
                      Additional options for article generation
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={globalSettingsForm.control}
                      name="wordCountMin"
                      render={({ field: { value, onChange, ...rest } }) => (
                        <FormItem>
                          <FormLabel>Minimum Word Count: {value}</FormLabel>
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
                    
                    <FormField
                      control={globalSettingsForm.control}
                      name="wordCountMax"
                      render={({ field: { value, onChange, ...rest } }) => (
                        <FormItem>
                          <FormLabel>Maximum Word Count: {value}</FormLabel>
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

                    <FormField
                      control={globalSettingsForm.control}
                      name="additionalContext"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Context</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Include any specific information, business details, or context you want in all articles" 
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
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Article Elements</CardTitle>
                  <CardDescription>
                    Choose which elements to include in all generated articles
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={globalSettingsForm.control}
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

                    <FormField
                      control={globalSettingsForm.control}
                      name="includeStoriesExamples"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 w-full">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Stories & Examples</FormLabel>
                            <FormDescription>
                              Include personal stories or relevant examples
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
                      control={globalSettingsForm.control}
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

                    <FormField
                      control={globalSettingsForm.control}
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
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button 
                    type="button" 
                    onClick={() => setActiveTab("article-list")}
                  >
                    Continue to Article List
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </Form>
        </TabsContent>
        
        <TabsContent value="article-list">
          <Form {...bulkArticleForm}>
            <form className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>Article List</span>
                    <Button 
                      type="button" 
                      size="sm" 
                      onClick={addArticle}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Article
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Define all articles you want to generate
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {bulkArticleForm.watch("articles").map((article, index) => (
                      <div key={index} className="grid grid-cols-12 gap-4 items-start">
                        <div className="col-span-5">
                          <FormField
                            control={bulkArticleForm.control}
                            name={`articles.${index}.title`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Title/Topic</FormLabel>
                                <FormControl>
                                  <Input placeholder="Article title or topic" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="col-span-5">
                          <FormField
                            control={bulkArticleForm.control}
                            name={`articles.${index}.keyword`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Target Keyword</FormLabel>
                                <FormControl>
                                  <Input placeholder="Main keyword to target" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="col-span-2 pt-8">
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => removeArticle(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab("global-settings")}
                  >
                    Back to Settings
                  </Button>
                  
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveTab("bulk-import")}
                    >
                      Bulk Import
                    </Button>
                    <Button
                      type="button"
                      onClick={onSubmit}
                      disabled={isGenerating || !apiKey}
                    >
                      {isGenerating ? "Generating..." : "Generate All Articles"}
                    </Button>
                  </div>
                </CardFooter>
              </Card>
              
              {blogArticles.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Generation Status</CardTitle>
                    <CardDescription>
                      Status of your article generation requests
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Keyword</TableHead>
                          <TableHead>Word Count</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {blogArticles.map((article) => (
                          <TableRow key={article.id}>
                            <TableCell>{article.title}</TableCell>
                            <TableCell>{article.keyword}</TableCell>
                            <TableCell>{article.wordCount || "—"}</TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                {article.status === "pending" && (
                                  <span className="px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground">
                                    Pending
                                  </span>
                                )}
                                {article.status === "generating" && (
                                  <span className="px-2 py-1 rounded-full text-xs bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                                    Generating
                                  </span>
                                )}
                                {article.status === "completed" && (
                                  <span className="px-2 py-1 rounded-full text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                                    Completed
                                  </span>
                                )}
                                {article.status === "error" && (
                                  <span className="px-2 py-1 rounded-full text-xs bg-destructive/20 text-destructive">
                                    Error
                                  </span>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
              
              {!apiKey && (
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
              )}
            </form>
          </Form>
        </TabsContent>
        
        <TabsContent value="bulk-import">
          <Form {...bulkArticleForm}>
            <form className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Bulk Import</CardTitle>
                  <CardDescription>
                    Paste a list of topics or CSV data to quickly add multiple articles
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <FormField
                      control={bulkArticleForm.control}
                      name="bulkInput"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Paste Topics or CSV Data</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter one topic per line or paste CSV data in 'title,keyword' format" 
                              className="min-h-[240px]"
                              showCount
                              countType="characters"
                              maxCount={100}
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Format: One topic per line, or "title,keyword" format for CSV data
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="bg-muted p-4 rounded-md">
                      <h4 className="text-sm font-medium mb-2">Format Examples:</h4>
                      <div className="text-sm space-y-1 text-muted-foreground">
                        <p>Simple list (one topic per line):</p>
                        <pre className="bg-background p-2 rounded text-xs">
                          Best coffee brewing methods{"\n"}
                          How to train your cat{"\n"}
                          Top 10 travel destinations
                        </pre>
                        
                        <p className="mt-2">CSV format (title,keyword):</p>
                        <pre className="bg-background p-2 rounded text-xs">
                          Ultimate Guide to Home Brewing,coffee brewing{"\n"}
                          How to Train Your Cat in 7 Days,cat training{"\n"}
                          10 Must-Visit Travel Destinations in 2023,travel destinations
                        </pre>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab("article-list")}
                  >
                    Back to Article List
                  </Button>
                  <Button
                    type="button"
                    onClick={processBulkInput}
                  >
                    Process Bulk Input
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </Form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
