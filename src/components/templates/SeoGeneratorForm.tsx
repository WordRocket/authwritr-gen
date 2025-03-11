
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { ClipboardCopy, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  generateSeoContent, 
  saveGeneratedContent, 
  type SeoFormValues as SeoServiceFormValues 
} from "@/services/contentGenerationService";
import { useAuth } from "@/context/AuthContext";

// Define the validation schema
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
  includeHook: z.boolean().default(false),
  includeStories: z.boolean().default(false),
  includeHtmlElement: z.boolean().default(false),
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
};

export function SeoGeneratorForm() {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [generatedContent, setGeneratedContent] = React.useState("");
  const [activeTab, setActiveTab] = React.useState("content-form");

  const form = useForm<SeoFormValues>({
    resolver: zodResolver(seoFormSchema),
    defaultValues,
  });

  const onSubmit = async (data: SeoFormValues) => {
    setIsGenerating(true);
    
    try {
      const content = await generateSeoContent(data as SeoServiceFormValues);
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
        description: "There was an error generating your content. Please try again.",
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

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Note</AlertTitle>
              <AlertDescription>
                For best results, this template works optimally with the Claude 3.7 model.
              </AlertDescription>
            </Alert>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isGenerating}
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
                  <Button variant="outline" size="sm" onClick={copyToClipboard}>
                    <ClipboardCopy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <div className="whitespace-pre-wrap border p-4 rounded-md bg-muted/50 min-h-[400px] max-h-[600px] overflow-y-auto">
                  {generatedContent}
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab("content-form")}>
                Back to Form
              </Button>
              <Button 
                onClick={handleSaveContent} 
                disabled={isSaving}
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
