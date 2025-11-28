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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
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
  scrapedData?: any;
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
  const [currentStep, setCurrentStep] = useState<
    "idle" | "scraping" | "normalizing" | "designing" | "complete"
  >("idle");
  const [workflowError, setWorkflowError] = useState<string | undefined>();
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const { toast } = useToast();

  const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    (import.meta.env.DEV ? "" : "http://localhost:3001");

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

      // Use streaming endpoint for real-time updates
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
      status: currentStep === "designing" ? "running" : currentStep === "normalizing" ? "pending" : currentStep === "complete" ? "completed" : "pending",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Workflow Visualization */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <WorkflowVisualization 
            currentStep={currentStep === "scraping" ? "scraping" : currentStep === "normalizing" ? "analyzing" : currentStep === "designing" ? "analyzing" : currentStep === "complete" ? "complete" : "idle"}
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
            Provide the website URL to scrape and redesign
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
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Redesign Website
              </>
            )}
          </Button>
        </CardContent>
      </Card>

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
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground mt-1">
                        {result.redesignedWebsite.design.recommendations.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
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

