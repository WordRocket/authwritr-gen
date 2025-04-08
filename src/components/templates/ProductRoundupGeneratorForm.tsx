
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { SeoFormValues, generateSeoContent, recommendedModels } from "@/services/contentGenerationService";
import { CustomOutlineSection } from "@/components/templates/CustomOutlineSection";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingBag, Plus, Trash, Search, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProductRoundupGeneratorFormProps {
  includeInternalLinks: boolean;
  customOutline: string;
  onCustomOutlineChange: (outline: string) => void;
  onGeneratingStateChange: (generating: boolean) => void;
  onContentGenerated?: (content: string) => void;
  apiKey: string | null;
  onApiError?: (error: string) => void;
}

const formSchema = z.object({
  topic: z.string().min(1, { message: "Please enter a topic" }),
  inputMode: z.enum(["webSearch", "manualInput"]),
  searchTerm: z.string().optional(),
  targetKeyword: z.string().optional(),
  articleType: z.enum(["informational", "listicle", "how-to", "product-roundup", "comparison"]).default("product-roundup"),
  toneOfArticle: z.enum(["professional", "conversational", "friendly", "authoritative", "casual"]).default("conversational"),
  intendedAudience: z.string().optional(),
  additionalContext: z.string().optional(),
  wordCount: z.number().min(500).max(10000).default(2000),
  includeFirstPerson: z.boolean().default(true),
  includeAnecdotes: z.boolean().default(true),
  includeHook: z.boolean().default(true),
  includeStories: z.boolean().default(true),
  includeHtmlElement: z.boolean().default(true),
  model: z.string().default("anthropic/claude-3.7-sonnet"),
});

type ProductFormValues = {
  name: string;
  description: string;
};

export function ProductRoundupGeneratorForm({
  includeInternalLinks = false,
  customOutline = "",
  onCustomOutlineChange,
  onGeneratingStateChange,
  onContentGenerated,
  apiKey,
  onApiError,
}: ProductRoundupGeneratorFormProps) {
  const [content, setContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentTab, setCurrentTab] = useState("form");
  const [products, setProducts] = useState<ProductFormValues[]>([]);
  const navigate = useNavigate();
  
  useEffect(() => {
    setContent("");
  }, [apiKey]);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: "",
      inputMode: "manualInput",
      searchTerm: "",
      targetKeyword: "",
      articleType: "product-roundup",
      toneOfArticle: "conversational",
      intendedAudience: "",
      additionalContext: "",
      wordCount: 2000,
      includeFirstPerson: true,
      includeAnecdotes: true,
      includeHook: true,
      includeStories: true,
      includeHtmlElement: true,
      model: "anthropic/claude-3.7-sonnet",
    },
  });

  const inputMode = form.watch("inputMode");

  const productForm = useForm<ProductFormValues>({
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const handleProductAdd = productForm.handleSubmit((data) => {
    if (products.length >= 5) {
      toast({
        title: "Maximum Products Reached",
        description: "You can compare up to 5 products at a time.",
        variant: "destructive",
      });
      return;
    }
    setProducts([...products, data]);
    
    productForm.reset({
      name: "",
      description: "",
    });
  });

  const removeProduct = (index: number) => {
    const updatedProducts = [...products];
    updatedProducts.splice(index, 1);
    setProducts(updatedProducts);
  };

  async function onSubmit(data: z.infer<typeof formSchema>) {
    if (data.inputMode === "manualInput" && products.length === 0) {
      toast({
        title: "No Products Added",
        description: "Please add at least one product for your round-up article.",
        variant: "destructive",
      });
      return;
    }

    if (!apiKey) {
      toast({
        title: "API Key Missing",
        description: "Please add your OpenRouter API key in Settings.",
        variant: "destructive",
      });
      if (onApiError) {
        onApiError("API key is missing. Please add your OpenRouter API key in Settings.");
      }
      return;
    }
    
    setIsGenerating(true);
    setContent("");
    
    if (onGeneratingStateChange) {
      onGeneratingStateChange(true);
    }

    console.log("Starting content generation with model:", data.model);

    try {
      let searchTermOrManualInput = data.inputMode === "webSearch" ? data.searchTerm : "";
      
      if (data.inputMode === "manualInput") {
        const productDescriptions = products.map((product, index) => {
          return `
Product ${index + 1}: ${product.name}
Description: ${product.description}
          `;
        }).join("\n\n");
        
        searchTermOrManualInput = `
Product Round-up for: ${data.topic}
Number of products: ${products.length}

${productDescriptions}
        `;
      }

      const searchModel = data.inputMode === "webSearch" ? "perplexity/sonar-reasoning-pro" : data.model;

      const customOutlineOption = customOutline ? { customOutline } : {};
      
      console.log("Sending request to generateSeoContent with model:", searchModel);
      console.log("Product count:", products.length);
      
      const generatedContent = await generateSeoContent({
        topic: data.topic,
        wordCount: data.wordCount,
        includeFirstPerson: data.includeFirstPerson,
        includeAnecdotes: data.includeAnecdotes,
        includeHook: data.includeHook,
        includeStories: data.includeStories,
        includeHtmlElement: data.includeHtmlElement,
        searchTerm: data.inputMode === "webSearch" ? data.searchTerm : undefined,
        manualInput: data.inputMode === "manualInput" ? searchTermOrManualInput : undefined,
        inputMode: data.inputMode,
        targetKeyword: data.targetKeyword,
        articleType: data.articleType,
        toneOfArticle: data.toneOfArticle,
        intendedAudience: data.intendedAudience,
        additionalContext: data.additionalContext,
        includeInternalLinks,
        model: searchModel,
        finalContentModel: data.inputMode === "webSearch" ? "anthropic/claude-3.7-sonnet" : undefined,
      }, apiKey, customOutlineOption);

      console.log("Content generation successful");
      
      if (generatedContent !== "BACKGROUND_GENERATION_STARTED") {
        setContent(generatedContent);
        if (onContentGenerated) {
          onContentGenerated(generatedContent);
        }
        setCurrentTab("preview");
        
        toast({
          title: "Content Generated",
          description: "Your product round-up has been successfully generated.",
        });
      }
    } catch (error: any) {
      console.error("Content generation error:", error);
      
      if (onApiError) {
        onApiError(error.message || "An error occurred while generating content.");
      }
      
      // Check if it's an authentication error and provide a direct link to settings
      if (error.message && typeof error.message === 'string' && 
          (error.message.toLowerCase().includes('api key') || 
           error.message.toLowerCase().includes('authentication') || 
           error.message.toLowerCase().includes('auth'))) {
        toast({
          title: "Authentication Error",
          description: "Please check your API key in Settings",
          variant: "destructive",
          action: (
            <Button variant="outline" size="sm" onClick={() => navigate('/settings')}>
              Go to Settings
            </Button>
          ),
        });
      } else {
        toast({
          title: "Generation Failed",
          description: error.message || "An error occurred while generating content.",
          variant: "destructive",
        });
      }
    } finally {
      setIsGenerating(false);
      if (onGeneratingStateChange) {
        onGeneratingStateChange(false);
      }
    }
  }

  return (
    <div className="space-y-4">
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="form">Form</TabsTrigger>
          <TabsTrigger value="preview" disabled={!content}>Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="form" className="space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Product Round-up Details</h2>
                
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="topic"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Topic</FormLabel>
                        <FormControl>
                          <Input placeholder="Best wireless headphones in 2025" {...field} />
                        </FormControl>
                        <FormDescription>
                          Enter the topic of your product round-up article
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="inputMode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Input Mode</FormLabel>
                        <FormControl>
                          <RadioGroup 
                            onValueChange={field.onChange} 
                            value={field.value} 
                            className="flex flex-col space-y-1"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="manualInput" id="manualInput" />
                              <label htmlFor="manualInput" className="flex items-center cursor-pointer">
                                <Pencil className="mr-2 h-4 w-4" />
                                <div>Manual Product Input</div>
                              </label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="webSearch" id="webSearch" />
                              <label htmlFor="webSearch" className="flex items-center cursor-pointer">
                                <Search className="mr-2 h-4 w-4" />
                                <div>Web Search</div>
                              </label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormDescription>
                          Choose whether to manually input product details or use web search
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {inputMode === "webSearch" && (
                    <FormField
                      control={form.control}
                      name="searchTerm"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Search Term</FormLabel>
                          <FormControl>
                            <Input placeholder="Best wireless headphones 2025 review comparison" {...field} />
                          </FormControl>
                          <FormDescription>
                            Enter a search term to find information about products
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {inputMode === "manualInput" && (
                    <div className="border p-4 rounded-md space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Product Details</h3>
                        <span className="text-sm text-muted-foreground">{products.length}/5 Products</span>
                      </div>
                      
                      {products.length > 0 && (
                        <div className="space-y-2 mb-4">
                          {products.map((product, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                              <div>
                                <span className="font-medium">{product.name}</span>
                              </div>
                              <div className="flex space-x-2">
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => removeProduct(index)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-center">Add Product</h4>
                        
                        <div>
                          <FormLabel htmlFor="name">Product Name</FormLabel>
                          <Input
                            id="name"
                            placeholder="Sony WH-1000XM5"
                            {...productForm.register("name", { required: true })}
                          />
                          {productForm.formState.errors.name && (
                            <p className="text-sm font-medium text-destructive">Product name is required</p>
                          )}
                        </div>
                        
                        <div>
                          <FormLabel htmlFor="description">Description</FormLabel>
                          <Textarea
                            id="description"
                            placeholder="Describe the product including key features, pricing, pros and cons..."
                            {...productForm.register("description", { required: true })}
                            className="min-h-[150px]"
                          />
                          <FormDescription className="mt-2">
                            Include details like: product features, pricing, pros, cons, and any other relevant information.
                          </FormDescription>
                          {productForm.formState.errors.description && (
                            <p className="text-sm font-medium text-destructive">Description is required</p>
                          )}
                        </div>
                        
                        <Button 
                          type="button" 
                          onClick={handleProductAdd} 
                          className="w-full"
                        >
                          Add Product
                        </Button>
                      </div>
                    </div>
                  )}

                  <Separator className="my-4" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="targetKeyword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Keyword (optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="wireless headphones" {...field} />
                          </FormControl>
                          <FormDescription>
                            Main keyword to optimize for
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select article type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="product-roundup">Product Round-up</SelectItem>
                              <SelectItem value="comparison">Comparison</SelectItem>
                              <SelectItem value="informational">Informational</SelectItem>
                              <SelectItem value="listicle">Listicle</SelectItem>
                              <SelectItem value="how-to">How-To</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Type of article to generate
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          <FormDescription>
                            Tone of voice for the article
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
                          <FormLabel>Word Count</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="500" 
                              max="10000" 
                              placeholder="2000" 
                              {...field} 
                              onChange={(e) => field.onChange(Number(e.target.value))} 
                            />
                          </FormControl>
                          <FormDescription>
                            Target word count (500-10,000)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="intendedAudience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Intended Audience (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Tech enthusiasts looking for high-quality audio products" {...field} />
                        </FormControl>
                        <FormDescription>
                          Who is this article for?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="additionalContext"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Context (optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Any additional information to include in the article..." 
                            {...field} 
                            className="min-h-[100px]"
                          />
                        </FormControl>
                        <FormDescription>
                          Additional information or special instructions
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <CustomOutlineSection 
                    outline={customOutline} 
                    onChange={onCustomOutlineChange || (() => {})} 
                  />

                  <h3 className="text-lg font-medium pt-4">Article Elements</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="includeFirstPerson"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between p-3 border rounded-md">
                          <div className="space-y-0.5">
                            <FormLabel>First Person Perspective</FormLabel>
                            <FormDescription>
                              Write using "I" and personal experience
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="includeAnecdotes"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between p-3 border rounded-md">
                          <div className="space-y-0.5">
                            <FormLabel>Include Anecdotes</FormLabel>
                            <FormDescription>
                              Add relevant anecdotes and examples
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="includeHook"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between p-3 border rounded-md">
                          <div className="space-y-0.5">
                            <FormLabel>Include Hook</FormLabel>
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="includeStories"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between p-3 border rounded-md">
                          <div className="space-y-0.5">
                            <FormLabel>Include Stories</FormLabel>
                            <FormDescription>
                              Add relevant stories and narratives
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="includeHtmlElement"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between p-3 border rounded-md">
                          <div className="space-y-0.5">
                            <FormLabel>Include HTML Element</FormLabel>
                            <FormDescription>
                              Add interactive element like comparison table
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {inputMode === "manualInput" && (
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
                              {recommendedModels.map(model => (
                                <SelectItem key={model.id} value={model.id}>
                                  {model.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            AI model to generate content
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </Card>
              
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  size="lg" 
                  disabled={isGenerating || !apiKey}
                  className="flex items-center"
                >
                  {isGenerating ? (
                    <>
                      <span className="animate-pulse">Generating...</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      Generate Product Round-up
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="preview">
          {content && (
            <div className="border p-4 rounded-md bg-card">
              <div dangerouslySetInnerHTML={{ __html: content }} />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
