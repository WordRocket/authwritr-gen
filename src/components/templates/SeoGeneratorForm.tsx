
import React, { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  generateSeoContent, 
  saveGeneratedContent, 
  recommendedModels, 
  type SeoFormValues as ContentServiceFormValues
} from "@/services/contentGenerationService";
import { useAuth } from "@/context/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { BackgroundGenerationOption } from "./BackgroundGenerationOption";

const formSchema = z.object({
  topic: z.string().min(3, {
    message: "Topic must be at least 3 characters.",
  }),
  title: z.string().optional(),
  targetKeyword: z.string().optional(),
  searchTerm: z.string().optional(), // Add the missing searchTerm field
  articleType: z.string().optional(),
  toneOfArticle: z.string().optional(),
  intendedAudience: z.string().optional(),
  additionalContext: z.string().optional(),
  wordCount: z.number().min(100, {
    message: "Word count must be at least 100.",
  }),
  model: z.string().optional(),
  includeFirstPerson: z.boolean().optional(),
  includeAnecdotes: z.boolean().optional(),
  includeHook: z.boolean().optional(),
  includeStories: z.boolean().optional(),
  includeHtmlElement: z.boolean().optional(),
});

// Define a local interface that extends the service interface
interface LocalSeoFormValues extends ContentServiceFormValues {
  includeInternalLinks: boolean;
  saveOnComplete?: boolean;
}

export function SeoGeneratorForm({ includeInternalLinks }: { includeInternalLinks: boolean }) {
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [contentTitle, setContentTitle] = useState<string>("");
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState(recommendedModels[0]);

  // Add new state for background generation
  const [generateInBackground, setGenerateInBackground] = useState(false);

  useEffect(() => {
    const storedApiKey = localStorage.getItem('openRouterApiKey');
    setApiKey(storedApiKey);
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: "",
      title: "",
      targetKeyword: "",
      searchTerm: "", // Initialize the searchTerm field
      articleType: "informational",
      toneOfArticle: "professional",
      intendedAudience: "",
      additionalContext: "",
      wordCount: 500,
      includeFirstPerson: false,
      includeAnecdotes: false,
      includeHook: false,
      includeStories: false,
      includeHtmlElement: false,
    },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!apiKey) {
      toast({
        title: "Missing OpenRouter API Key",
        description: "Please add your OpenRouter API key in the settings page to generate content.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGenerating(true);
      const actualTitle = values.title || values.topic;
      setContentTitle(actualTitle);

      // Transform form values to the service expected format
      const serviceFormValues: ContentServiceFormValues = {
        topic: values.topic,
        searchTerm: values.searchTerm,
        targetKeyword: values.targetKeyword,
        wordCount: values.wordCount,
        articleType: values.articleType as any,
        toneOfArticle: values.toneOfArticle as any,
        intendedAudience: values.intendedAudience,
        additionalContext: values.additionalContext,
        includeFirstPerson: values.includeFirstPerson || false,
        includeAnecdotes: values.includeAnecdotes || false,
        includeHook: values.includeHook || false,
        includeStories: values.includeStories || false,
        includeHtmlElement: values.includeHtmlElement || false,
        includeInternalLinks: includeInternalLinks,
        model: values.model,
        saveOnComplete: generateInBackground
      };

      if (generateInBackground) {
        // For background generation, notify user and return early
        generateSeoContent(serviceFormValues, apiKey, user?.id, actualTitle)
          .then(() => {
            toast({
              title: "Content generation started",
              description: "Your content is being generated in the background and will be saved to 'My Content'",
              variant: "default"
            });
          })
          .catch((error) => {
            toast({
              title: "Error starting background generation",
              description: error.message,
              variant: "destructive"
            });
          });

        setIsGenerating(false);
        return;
      }

      const content = await generateSeoContent(serviceFormValues, apiKey);
      setGeneratedContent(content);

      // If user is authenticated, automatically save content
      if (isAuthenticated && user) {
        await saveGeneratedContent(actualTitle, content, user.id);
        toast({
          title: "Content saved",
          description: "Your content has been saved to 'My Content'",
        });
      }

    } catch (error: any) {
      console.error("Error generating content:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to generate content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="topic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Topic</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Best practices for React development" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Top 5 React Best Practices in 2024" {...field} />
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
                  <FormLabel>Target Keyword (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., React best practices" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Accordion type="single" collapsible>
              <AccordionItem value="advanced">
                <AccordionTrigger>Advanced Options</AccordionTrigger>
                <AccordionContent>
                  <div className="grid gap-4 py-4">
                    <FormField
                      control={form.control}
                      name="articleType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Article Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select an article type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="informational">Informational</SelectItem>
                              <SelectItem value="listicle">Listicle</SelectItem>
                              <SelectItem value="how-to">How-to</SelectItem>
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a tone" />
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
                          <FormLabel>Intended Audience (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Beginner React developers" {...field} />
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
                          <FormLabel>Additional Context (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="e.g., Focus on performance optimization and modern React practices."
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator />

                    <div className="space-y-2">
                      <FormLabel>Word Count</FormLabel>
                      <FormField
                        control={form.control}
                        name="wordCount"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Slider
                                defaultValue={[field.value]}
                                max={2000}
                                step={100}
                                onValueChange={(value) => field.onChange(value[0])}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <p className="text-sm text-muted-foreground">
                        Selected word count: {form.getValues("wordCount")}
                      </p>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <FormLabel>Content Options</FormLabel>
                      <div className="grid grid-cols-2 gap-2">
                        <FormField
                          control={form.control}
                          name="includeFirstPerson"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="text-nowrap">
                                Include First Person
                              </FormLabel>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="includeAnecdotes"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="text-nowrap">
                                Include Anecdotes
                              </FormLabel>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="includeHook"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="text-nowrap">
                                Include Hook
                              </FormLabel>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="includeStories"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="text-nowrap">
                                Include Stories
                              </FormLabel>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="includeHtmlElement"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="text-nowrap">
                                Include HTML Element
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="border rounded-md p-4 bg-card">
              <FormLabel>Model Selection</FormLabel>
              <p className="text-sm text-muted-foreground mb-4">
                Choose the model that best suits your content needs.
              </p>
              <Select onValueChange={(value) => {
                form.setValue("model", value);
                const selected = recommendedModels.find(model => model.id === value);
                setSelectedModel(selected || recommendedModels[0]);
              }} defaultValue={form.getValues("model") || recommendedModels[0].id}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {recommendedModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">
                {selectedModel?.description}
              </p>
            </div>

            {/* Add Background Generation Option before the form submission area */}
            <div className="border rounded-md p-4 bg-card">
              {isAuthenticated ? (
                <BackgroundGenerationOption
                  enabled={generateInBackground}
                  onToggle={setGenerateInBackground}
                />
              ) : (
                <div className="text-sm text-muted-foreground">
                  Please login to enable background generation and save content automatically.
                </div>
              )}
            </div>

            <div className="flex flex-col space-y-4">
              <Button type="submit" disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    Generating...
                    {/*<Loader2 className="ml-2 h-4 w-4 animate-spin" />*/}
                  </>
                ) : (
                  "Generate Content"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      <div>
        {generatedContent ? (
          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle>Generated Content</CardTitle>
              <CardDescription>
                Here is the content generated based on your input.
              </CardDescription>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <h2 className="text-2xl font-bold mb-4">{contentTitle}</h2>
              <div dangerouslySetInnerHTML={{ __html: generatedContent }} />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Content Preview</CardTitle>
              <CardDescription>
                Fill out the form to generate SEO-optimized content.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Once you generate content, it will be displayed here.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
