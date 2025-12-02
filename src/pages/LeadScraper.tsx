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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Globe,
  FileText,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  Megaphone,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import WorkflowVisualization from "@/components/WorkflowVisualization";

interface AnalysisResult {
  missingDocuments: string[];
  issues: Array<{
    document: string;
    issue: string;
    severity: "high" | "medium" | "low";
    whyItMatters?: string;
  }>;
  summary: string;
}


interface NodeExecutionDetails {
  nodeId: string;
  nodeName: string;
  startTime?: number;
  endTime?: number;
  duration?: number;
  autogenEnabled: boolean;
  autogenReviews?: Array<{
    agent: string;
    review: string;
    suggestions: string[];
    approved: boolean;
  }>;
  prompt?: string;
  input?: any;
  output?: any;
  error?: string;
}

interface SocialMediaInfo {
  instagram?: string;
  socialLinks: Record<string, string>;
}

interface ScrapeResult {
  websiteUrl: string;
  legalDocuments: string[];
  socialMedia?: SocialMediaInfo;
  analysis: AnalysisResult;
  executionDetails?: Record<string, NodeExecutionDetails>;
}

const LeadScraper = () => {
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [leadName, setLeadName] = useState("");
  const [leadCompany, setLeadCompany] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ScrapeResult | null>(null);
  const [currentStep, setCurrentStep] = useState<
    "idle" | "scraping" | "analyzing" | "complete"
  >("idle");
  const [workflowError, setWorkflowError] = useState<string | undefined>();
  const { toast } = useToast();

  // Use proxy in development, or direct URL in production
  const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    (import.meta.env.DEV ? "" : "");

  const handleScrape = async () => {
    if (!websiteUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a website URL",
        variant: "destructive",
      });
      return;
    }

    // Validate URL
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
    setCurrentStep("scraping");

    try {
      // Normalize URL
      const normalizedUrl = websiteUrl.startsWith("http")
        ? websiteUrl
        : `https://${websiteUrl}`;

      // Use regular endpoint with simulated progress for better UX
      const response = await fetch(`${API_BASE_URL}/api/scrape-and-analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          websiteUrl: normalizedUrl,
          leadInfo: {
            name: leadName || undefined,
            company: leadCompany || undefined,
            email: leadEmail || undefined,
          },
        }),
      });

      if (!response.ok) {
        let errorData: any = {};
        try {
          const text = await response.text();
          errorData = text ? JSON.parse(text) : {};
        } catch (e) {
          console.error("Failed to parse error response:", e);
        }
        
        const errorMessage = errorData.message || errorData.error || `Server error: ${response.status} ${response.statusText}`;
        console.error("API Error Response:", {
          status: response.status,
          statusText: response.statusText,
          errorData,
        });
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (data.success && data.data) {
        // Simulate step progression for visual feedback
        setCurrentStep("scraping");
        await new Promise(resolve => setTimeout(resolve, 800));
        setCurrentStep("analyzing");
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Validate data structure before setting
        const resultData = {
          websiteUrl: data.data.websiteUrl || websiteUrl,
          legalDocuments: Array.isArray(data.data.legalDocuments) ? data.data.legalDocuments : [],
          socialMedia: data.data.socialMedia || undefined,
          analysis: data.data.analysis || null,
          executionDetails: data.data.executionDetails || {},
        };
        
        setResult(resultData);
        setCurrentStep("complete");
        toast({
          title: "Success",
          description: "Website analyzed successfully!",
        });
      } else {
        throw new Error(data.message || data.error || "Invalid response from server");
      }
    } catch (error: any) {
      console.error("Error scraping website:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
        websiteUrl: websiteUrl,
      });
      
      const errorMessage = error.message || "Failed to scrape website. Please try again.";
      setWorkflowError(errorMessage);
      setResult(null); // Clear any partial results
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      setCurrentStep("idle");
    } finally {
      setIsLoading(false);
    }
  };


  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "default";
    }
  };

  return (
    <div className="space-y-6">
        {/* Workflow Visualization - Always visible */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <WorkflowVisualization 
              currentStep={currentStep}
              error={workflowError}
              executionDetails={result?.executionDetails}
              websiteUrl={websiteUrl || undefined}
              leadInfo={leadName || leadCompany || leadEmail ? {
                name: leadName || undefined,
                company: leadCompany || undefined,
                email: leadEmail || undefined,
              } : undefined}
            />
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Enter Lead Information</CardTitle>
            <CardDescription>
              Provide the website URL and optional lead details
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="leadName">Lead Name (Optional)</Label>
                <Input
                  id="leadName"
                  placeholder="John Doe"
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leadCompany">Company (Optional)</Label>
                <Input
                  id="leadCompany"
                  placeholder="Acme Inc."
                  value={leadCompany}
                  onChange={(e) => setLeadCompany(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leadEmail">Email (Optional)</Label>
                <Input
                  id="leadEmail"
                  type="email"
                  placeholder="john@example.com"
                  value={leadEmail}
                  onChange={(e) => setLeadEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button
              onClick={handleScrape}
              disabled={isLoading || !websiteUrl.trim()}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {currentStep === "scraping" && "Scraping website..."}
                  {currentStep === "analyzing" && "Analyzing legal documents..."}
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Analyze Website
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <div className="space-y-6">
            {/* Legal Documents Found */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Legal Documents Found
                </CardTitle>
              </CardHeader>
              <CardContent>
                {result.legalDocuments && result.legalDocuments.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {result.legalDocuments.map((doc, index) => (
                      <Badge key={index} variant="outline">
                        {doc}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    No legal documents found on this website.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Analysis Results */}
            {result.analysis && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Compliance Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.analysis.summary && (
                    <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                      <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">Summary</h3>
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        {result.analysis.summary}
                      </p>
                    </div>
                  )}

                  {result.analysis.missingDocuments && result.analysis.missingDocuments.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Missing Documents</h3>
                      <div className="flex flex-wrap gap-2">
                        {result.analysis.missingDocuments.map((doc, index) => (
                          <Badge key={index} variant="destructive">
                            {doc}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.analysis.issues && result.analysis.issues.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-4 text-lg">What's Wrong</h3>
                      <div className="space-y-3">
                        {result.analysis.issues.map((issue, index) => (
                          <div
                            key={index}
                            className="border rounded-lg p-4 bg-white dark:bg-slate-900"
                          >
                            <div className="flex items-start gap-3">
                              <Badge
                                variant={getSeverityColor(issue.severity)}
                                className="mt-0.5"
                              >
                                {issue.severity}
                              </Badge>
                              <div className="flex-1">
                                <p className="font-medium text-sm mb-1">
                                  {issue.document}: {issue.issue}
                                </p>
                                {issue.whyItMatters && (
                                  <p className="text-xs text-muted-foreground">
                                    {issue.whyItMatters}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}


                </CardContent>
              </Card>
            )}

            {/* Social Media Info */}
            {result.socialMedia && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Megaphone className="h-5 w-5" />
                    Social Media Found
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {result.socialMedia.instagram ? (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">Instagram:</p>
                      <a
                        href={result.socialMedia.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        {result.socialMedia.instagram}
                      </a>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No Instagram link found in footer
                    </p>
                  )}
                  {Object.keys(result.socialMedia.socialLinks || {}).length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-semibold">Other Social Links:</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(result.socialMedia.socialLinks).map(([platform, url]) => (
                          <a
                            key={platform}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm"
                          >
                            {platform}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Show message if no data is available */}
            {!result.analysis && (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-center py-8">
                    No analysis data available. The workflow may have encountered an error.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
    </div>
  );
};

export default LeadScraper;

