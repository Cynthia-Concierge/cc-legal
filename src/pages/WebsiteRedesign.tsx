import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Globe,
  Sparkles,
  Copy,
  Download,
  Layout,
  Palette,
  Navigation,
  Play,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import WorkflowVisualization from "@/components/WorkflowVisualization";

interface NodeExecutionDetails {
  nodeId: string;
  nodeName: string;
  startTime?: number;
  endTime?: number;
  duration?: number;
  prompt?: string;
  input?: any;
  output?: any;
  error?: string;
}

interface RedesignResult {
  websiteUrl: string;
  stepExecuted?: string;
  scrapedData?: any;
  normalizedData?: any;
  redesignedWebsite?: {
    structure: {
      pages: Array<{
        name: string;
        path: string;
        description: string;
        sections: Array<{
          name: string;
          type: string;
          content: string;
        }>;
      }>;
    };
    navigation: {
      items: Array<{
        label: string;
        path: string;
        order: number;
      }>;
    };
    design: {
      colorScheme: string;
      typography: string;
      layout: string;
      recommendations: string[];
    };
    improvements: Array<{
      area: string;
      current: string;
      improved: string;
      reason: string;
    }>;
  };
  executionDetails?: Record<string, NodeExecutionDetails>;
}

const WebsiteRedesign = () => {
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<RedesignResult | null>(null);
  const [selectedStep, setSelectedStep] = useState<"full_scrape" | "normalize_data" | "website_design" | "final_prompt" | "full">("full");
  const [currentStep, setCurrentStep] = useState<
    "idle" | "scraping" | "normalizing" | "designing" | "generating" | "complete"
  >("idle");
  const [workflowError, setWorkflowError] = useState<string | undefined>();
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const { toast } = useToast();

  const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    ""; // Empty string uses Firebase Hosting rewrites in production, Vite proxy in dev

  const handleRedesign = async () => {
    if (!websiteUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a website URL",
        variant: "destructive",
      });
      return;
    }

    try {
      new URL(websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`);
    } catch {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setResult(null);
    setWorkflowError(undefined);
    setActiveNode(null);
    setActiveAgent(null);
    setCurrentStep("scraping");

    try {
      const normalizedUrl = websiteUrl.startsWith("http")
        ? websiteUrl
        : `https://${websiteUrl}`;

      // If step-by-step execution is selected, use step endpoint
      if (selectedStep !== "full") {
        const response = await fetch(`${API_BASE_URL}/api/website-redesign-step`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            websiteUrl: normalizedUrl,
            stopAtStep: selectedStep,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || errorData.error || "Failed to execute step"
          );
        }

        const data = await response.json();

        if (data.success && data.data) {
          // Map step to current step state
          if (selectedStep === "full_scrape") {
            setCurrentStep("scraping");
          } else if (selectedStep === "normalize_data") {
            setCurrentStep("normalizing");
          } else if (selectedStep === "website_design") {
            setCurrentStep("designing");
          } else if (selectedStep === "final_prompt") {
            setCurrentStep("generating");
          }

          setResult({
            websiteUrl: data.data.websiteUrl,
            scrapedData: data.data.scrapedData,
            normalizedData: data.data.normalizedData,
            redesignedWebsite: data.data.redesignedWebsite,
            geminiPrompt: data.data.geminiPrompt,
            executionDetails: data.data.executionDetails,
          });

          setCurrentStep("complete");
          toast({
            title: "Success",
            description: `Step ${selectedStep} completed successfully!`,
          });
        } else {
          throw new Error("Invalid response from server");
        }
        return;
      }

      // Use streaming endpoint for full workflow
      const response = await fetch(`${API_BASE_URL}/api/website-redesign-stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          websiteUrl: normalizedUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || errorData.error || "Failed to redesign website"
        );
      }

      // Set up EventSource for Server-Sent Events
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finalResult: any = null;

      if (!reader) {
        throw new Error("Response body is not readable");
      }

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              
              // Handle completion
              if (data.done) {
                if (finalResult) {
                  setResult(finalResult);
                  setCurrentStep("complete");
                  setActiveNode(null);
                  setActiveAgent(null);
                  toast({
                    title: "Success",
                    description: "Website redesign complete!",
                  });
                }
                break;
              }

              // Handle errors
              if (data.error) {
                throw new Error(data.error);
              }

              // Handle agent progress updates
              if (data.agentProgress) {
                const { agent, status } = data.agentProgress;
                if (status === "starting") {
                  setActiveAgent(agent);
                  setActiveNode("website_design");
                  setCurrentStep("designing");
                } else if (status === "completed") {
                  // Agent completed, next one will start
                  // Keep showing current agent until next one starts
                }
              }

              // Handle activeAgent from state updates
              if (data.activeAgent) {
                setActiveAgent(data.activeAgent);
                setActiveNode("website_design");
                setCurrentStep("designing");
              }

              // Update based on node execution
              for (const [nodeName, nodeState] of Object.entries(data)) {
                if (nodeName === "error" || nodeName === "done" || nodeName === "agentProgress" || nodeName === "activeAgent") continue;

                // Update active node
                if (nodeName === "full_scrape") {
                  setActiveNode("full_scrape");
                  setCurrentStep("scraping");
                  setActiveAgent(null);
                } else if (nodeName === "normalize_data") {
                  setActiveNode("normalize_data");
                  setCurrentStep("normalizing");
                  setActiveAgent(null);
                } else if (nodeName === "website_design") {
                  setActiveNode("website_design");
                  setCurrentStep("designing");
                  // activeAgent is set above if present
                } else if (nodeName === "final_prompt") {
                  setActiveNode("final_prompt");
                  setCurrentStep("generating");
                  setActiveAgent(null);
                }

                // Accumulate final result
                if (nodeState && typeof nodeState === "object") {
                  if (!finalResult) {
                    finalResult = { websiteUrl: normalizedUrl };
                  }
                  Object.assign(finalResult, nodeState);
                }
              }
              
              // Update execution details if present
              if (data.executionDetails) {
                if (!finalResult) {
                  finalResult = { websiteUrl: normalizedUrl };
                }
                finalResult.executionDetails = data.executionDetails;
              }
            } catch (parseError) {
              console.error("Error parsing SSE data:", parseError);
            }
          }
        }
      }

      // Final check if we have a result
      if (finalResult && !finalResult.redesignedWebsite) {
        // Fallback: try to get result from non-streaming endpoint
        const fallbackResponse = await fetch(`${API_BASE_URL}/api/website-redesign`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            websiteUrl: normalizedUrl,
          }),
        });

        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          if (fallbackData.success && fallbackData.data) {
            setResult(fallbackData.data);
            setCurrentStep("complete");
            setActiveNode(null);
            setActiveAgent(null);
            toast({
              title: "Success",
              description: "Website redesign complete!",
            });
          }
        }
      }
    } catch (error: any) {
      console.error("Error redesigning website:", error);
      const errorMessage = error.message || "Failed to redesign website. Please try again.";
      setWorkflowError(errorMessage);
      setCurrentStep("idle");
      setActiveNode(null);
      setActiveAgent(null);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${type} copied to clipboard`,
    });
  };

  const downloadResult = () => {
    if (!result?.redesignedWebsite) return;

    const resultContent = JSON.stringify(result.redesignedWebsite, null, 2);
    const blob = new Blob([resultContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `website-redesign-${result.websiteUrl.replace(/[^a-z0-9]/gi, "-")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded",
      description: "Redesign saved to your downloads",
    });
  };

  // Map workflow steps for visualization
  const workflowSteps = [
    {
      id: "full_scrape",
      name: "Full Website Scrape",
      description: "Scraping entire website structure, pages, and content",
      status: currentStep === "scraping" ? "running" : currentStep === "idle" ? "pending" : "completed",
    },
    {
      id: "normalize_data",
      name: "Data Normalization",
      description: "Cleaning and structuring scraped data",
      status: currentStep === "normalizing" ? "running" : currentStep === "scraping" ? "pending" : currentStep === "designing" || currentStep === "complete" ? "completed" : "pending",
    },
    {
      id: "website_design",
      name: "Website Design",
      description: "Analyzing and creating improved website design",
      status: currentStep === "designing" ? "running" : currentStep === "normalizing" ? "pending" : currentStep === "generating" || currentStep === "complete" ? "completed" : "pending",
    },
    {
      id: "final_prompt",
      name: "Final Gemini Prompt",
      description: "Generating creative prompt for Gemini to build Next.js website",
      status: currentStep === "generating" ? "running" : currentStep === "designing" ? "pending" : currentStep === "complete" ? "completed" : "pending",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Workflow Visualization */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <WorkflowVisualization 
            currentStep={currentStep === "scraping" ? "scraping" : currentStep === "normalizing" ? "analyzing" : currentStep === "designing" ? "analyzing" : currentStep === "generating" ? "analyzing" : currentStep === "complete" ? "complete" : "idle"}
            error={workflowError}
            executionDetails={result?.executionDetails}
            websiteUrl={websiteUrl || undefined}
            workflowSteps={workflowSteps}
            activeNode={activeNode}
            activeAgent={activeAgent}
          />
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Enter Website URL</CardTitle>
          <CardDescription>
            Provide the website URL to scrape and redesign. Select a step to test individually or run the full workflow.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="websiteUrl">
              Website URL <span className="text-red-500">*</span>
            </Label>
            <Input
              id="websiteUrl"
              placeholder="https://example.com"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-3">
            <Label>Execution Mode</Label>
            <RadioGroup
              value={selectedStep}
              onValueChange={(value) => setSelectedStep(value as typeof selectedStep)}
              disabled={isLoading}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="full_scrape" id="step1" />
                <Label htmlFor="step1" className="font-normal cursor-pointer">
                  Step 1: Scrape Only (Test scraping)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="normalize_data" id="step2" />
                <Label htmlFor="step2" className="font-normal cursor-pointer">
                  Step 2: Scrape + Normalize (Test normalization)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="website_design" id="step3" />
                <Label htmlFor="step3" className="font-normal cursor-pointer">
                  Step 3: Scrape + Normalize + Design
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="final_prompt" id="step4" />
                <Label htmlFor="step4" className="font-normal cursor-pointer">
                  Step 4: Full Workflow + Gemini Prompt
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="full" id="full" />
                <Label htmlFor="full" className="font-normal cursor-pointer">
                  Full Workflow (Streaming - All Steps)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Button
            onClick={handleRedesign}
            disabled={isLoading || !websiteUrl.trim()}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {currentStep === "scraping" && "Scraping website..."}
                {currentStep === "normalizing" && "Normalizing data..."}
                {currentStep === "designing" && "Designing website..."}
                {currentStep === "generating" && "Generating Gemini prompt..."}
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                {selectedStep === "full_scrape" && "Run Step 1: Scrape"}
                {selectedStep === "normalize_data" && "Run Step 2: Scrape + Normalize"}
                {selectedStep === "website_design" && "Run Step 3: Scrape + Normalize + Design"}
                {selectedStep === "final_prompt" && "Run Step 4: Full Workflow + Gemini Prompt"}
                {selectedStep === "full" && "Run Full Workflow (Streaming)"}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Step 1 Results: Scraped Data */}
      {result && result.scrapedData && !result.normalizedData && !result.redesignedWebsite && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Step 1 Results: Scraped Data
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(
                        JSON.stringify(result.scrapedData, null, 2),
                        "Scraped Data"
                      )
                    }
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-semibold">Domain</Label>
                <p className="text-sm text-muted-foreground">{result.scrapedData.domain}</p>
              </div>
              {result.scrapedData.logo && (
                <div>
                  <Label className="text-sm font-semibold">Logo</Label>
                  <p className="text-sm text-muted-foreground break-all">{result.scrapedData.logo}</p>
                </div>
              )}
              <div>
                <Label className="text-sm font-semibold">Navigation Items</Label>
                <div className="mt-2 space-y-2">
                  {result.scrapedData.navigation?.items?.map((item: any, index: number) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="font-medium">
                          {item.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{item.url}</span>
                      </div>
                      {item.children && item.children.length > 0 && (
                        <div className="mt-2 ml-4 space-y-1">
                          <div className="text-xs font-semibold text-muted-foreground mb-1">
                            Subnavigation:
                          </div>
                          {item.children.map((child: any, childIndex: number) => (
                            <div key={childIndex} className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {child.label}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{child.url}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-sm font-semibold">Pages Scraped</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  {result.scrapedData.pages?.length || 0} pages
                </p>
                <ScrollArea className="h-96 w-full rounded-md border p-4">
                  <div className="space-y-4">
                    {result.scrapedData.pages?.map((page: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{page.name}</h4>
                          <Badge variant="secondary">{page.url}</Badge>
                        </div>
                        <div className="space-y-2">
                          {page.sections?.map((section: any, sIndex: number) => (
                            <div key={sIndex} className="border-l-2 pl-3 py-2">
                              <div className="font-semibold text-sm">{section.heading}</div>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-3">
                                {section.copy}
                              </p>
                              {section.images?.length > 0 && (
                                <div className="mt-2">
                                  <Badge variant="outline" className="text-xs">
                                    {section.images.length} image(s)
                                  </Badge>
                                </div>
                              )}
                              {section.ctas?.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {section.ctas.map((cta: any, cIndex: number) => (
                                    <Badge key={cIndex} variant="outline" className="text-xs">
                                      {cta.label}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2 Results: Normalized Data */}
      {result && result.normalizedData && !result.redesignedWebsite && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Step 2 Results: Normalized Data
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(
                        JSON.stringify(result.normalizedData, null, 2),
                        "Normalized Data"
                      )
                    }
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-semibold">URL</Label>
                <p className="text-sm text-muted-foreground">{result.normalizedData.url}</p>
              </div>
              <div>
                <Label className="text-sm font-semibold">Metadata</Label>
                <div className="mt-1 space-y-1">
                  <p className="text-sm text-muted-foreground">
                    <strong>Title:</strong> {result.normalizedData.metadata?.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Description:</strong> {result.normalizedData.metadata?.description}
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-semibold">Hero Section</Label>
                <div className="mt-1 space-y-1 p-3 bg-slate-50 dark:bg-slate-900 rounded">
                  <p className="text-sm font-medium">{result.normalizedData.hero?.headline}</p>
                  <p className="text-sm text-muted-foreground">{result.normalizedData.hero?.subheadline}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="default">{result.normalizedData.hero?.primaryCTA}</Badge>
                    {result.normalizedData.hero?.secondaryCTA && (
                      <Badge variant="outline">{result.normalizedData.hero.secondaryCTA}</Badge>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-sm font-semibold">Navigation</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {result.normalizedData.navigation?.main?.map((item: any, index: number) => (
                    <Badge key={index} variant="outline">
                      {item.label} ({item.url})
                    </Badge>
                  ))}
                </div>
              </div>
              {result.normalizedData.services && result.normalizedData.services.length > 0 && (
                <div>
                  <Label className="text-sm font-semibold">Services</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {result.normalizedData.services.map((service: string, index: number) => (
                      <Badge key={index} variant="secondary">{service}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {result.normalizedData.sections && result.normalizedData.sections.length > 0 && (
                <div>
                  <Label className="text-sm font-semibold">Sections</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {result.normalizedData.sections.map((section: string, index: number) => (
                      <Badge key={index} variant="outline">{section}</Badge>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <Label className="text-sm font-semibold">Full Normalized Data</Label>
                <ScrollArea className="h-96 w-full rounded-md border p-4 mt-2">
                  <pre className="text-xs font-mono whitespace-pre-wrap">
                    {JSON.stringify(result.normalizedData, null, 2)}
                  </pre>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 4 Results: Gemini Prompt */}
      {result && result.geminiPrompt && !result.redesignedWebsite && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Step 4 Results: Gemini Prompt
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(result.geminiPrompt || "", "Gemini Prompt")
                    }
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Prompt
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-semibold">Creative Gemini Prompt</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  This prompt gives Gemini creative freedom to design a beautiful, premium website using Next.js 14 and TailwindCSS.
                </p>
                <ScrollArea className="h-96 w-full rounded-md border p-4">
                  <pre className="text-xs font-mono whitespace-pre-wrap">
                    {result.geminiPrompt}
                  </pre>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 4 Results: Gemini Prompt */}
      {result && result.geminiPrompt && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Step 4 Results: Gemini Prompt
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(result.geminiPrompt || "", "Gemini Prompt")
                    }
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Prompt
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-semibold">Creative Gemini Prompt</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  This prompt gives Gemini creative freedom to design a beautiful, premium website using Next.js 14 and TailwindCSS. The prompt includes the brand aesthetic direction and the complete website structure with all pages, sections, images, and CTAs.
                </p>
                <ScrollArea className="h-96 w-full rounded-md border p-4">
                  <pre className="text-xs font-mono whitespace-pre-wrap">
                    {result.geminiPrompt}
                  </pre>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3 Results: Full Redesign */}
      {result && result.redesignedWebsite && (
        <div className="space-y-6">
          {/* Design Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Layout className="h-5 w-5" />
                  Website Redesign
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(
                        JSON.stringify(result.redesignedWebsite, null, 2),
                        "Redesign"
                      )
                    }
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadResult}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Design Recommendations */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Design Recommendations
                </h3>
                <div className="space-y-2">
                  <div>
                    <Label className="text-sm font-semibold">Color Scheme</Label>
                    <p className="text-sm text-muted-foreground">
                      {Array.isArray(result.redesignedWebsite.design.colorScheme)
                        ? result.redesignedWebsite.design.colorScheme.join(", ")
                        : typeof result.redesignedWebsite.design.colorScheme === 'string'
                        ? result.redesignedWebsite.design.colorScheme
                        : JSON.stringify(result.redesignedWebsite.design.colorScheme, null, 2)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Typography</Label>
                    <p className="text-sm text-muted-foreground">
                      {typeof result.redesignedWebsite.design.typography === 'string' 
                        ? result.redesignedWebsite.design.typography
                        : JSON.stringify(result.redesignedWebsite.design.typography, null, 2)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Layout</Label>
                    <p className="text-sm text-muted-foreground">
                      {result.redesignedWebsite.design.layout}
                    </p>
                  </div>
                  {result.redesignedWebsite.design.recommendations.length > 0 && (
                    <div>
                      <Label className="text-sm font-semibold">Additional Recommendations</Label>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground mt-1">
                        {result.redesignedWebsite.design.recommendations.map((rec, index) => {
                          // Handle both string and object formats
                          const recommendationText = typeof rec === 'string' 
                            ? rec 
                            : (rec?.recommendation || rec?.text || JSON.stringify(rec));
                          const urgency = typeof rec === 'object' && rec?.urgency 
                            ? rec.urgency 
                            : null;
                          return (
                            <li key={index} className="text-sm">
                              {recommendationText}
                              {urgency && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {urgency}
                                </Badge>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Navigation className="h-4 w-4" />
                  Navigation Structure
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.redesignedWebsite.navigation.items
                    .sort((a, b) => a.order - b.order)
                    .map((item, index) => (
                      <Badge key={index} variant="outline">
                        {item.label} ({item.path})
                      </Badge>
                    ))}
                </div>
              </div>

              {/* Pages Structure */}
              <div>
                <h3 className="font-semibold mb-3">Page Structure</h3>
                <ScrollArea className="h-96 w-full rounded-md border p-4">
                  <div className="space-y-4">
                    {result.redesignedWebsite.structure.pages.map((page, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{page.name}</h4>
                          <Badge variant="secondary">{page.path}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {page.description}
                        </p>
                        {page.sections.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-xs font-semibold">Sections:</Label>
                            <div className="flex flex-wrap gap-2">
                              {page.sections.map((section, sIndex) => (
                                <Badge key={sIndex} variant="outline" className="text-xs">
                                  {section.name} ({section.type})
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Improvements */}
              {result.redesignedWebsite.improvements.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Key Improvements</h3>
                  <ScrollArea className="h-96 w-full rounded-md border p-4">
                    <div className="space-y-4">
                      {result.redesignedWebsite.improvements.map((improvement, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="default">{improvement.area}</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <Label className="text-xs font-semibold text-muted-foreground">
                                Current:
                              </Label>
                              <p className="text-muted-foreground">{improvement.current}</p>
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-muted-foreground">
                                Improved:
                              </Label>
                              <p className="text-muted-foreground">{improvement.improved}</p>
                            </div>
                          </div>
                          <div className="mt-2 pt-2 border-t">
                            <Label className="text-xs font-semibold text-muted-foreground">
                              Why:
                            </Label>
                            <p className="text-xs text-muted-foreground">{improvement.reason}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default WebsiteRedesign;

