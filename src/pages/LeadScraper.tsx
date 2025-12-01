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
  Mail,
  Copy,
  Download,
  Sparkles,
  Megaphone,
  Settings,
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
  marketingRisks?: Array<{
    risk: string;
    severity: "high" | "medium" | "low";
    whyItMatters: string;
  }>;
  operationalRisks?: Array<{
    risk: string;
    severity: "high" | "medium" | "low";
    whyItMatters?: string;
  }>;
  recommendations: string[];
  summary: string;
}

interface EmailContent {
  subject: string;
  body: string;
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

interface ScrapeResult {
  websiteUrl: string;
  legalDocuments: string[];
  analysis: AnalysisResult;
  email: EmailContent;
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
    "idle" | "scraping" | "analyzing" | "generating" | "complete"
  >("idle");
  const [workflowError, setWorkflowError] = useState<string | undefined>();
  const { toast } = useToast();

  // Use proxy in development, or direct URL in production
  const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    (import.meta.env.DEV ? "" : "http://localhost:3001");

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
        // This gives users visual feedback as the workflow progresses
        setCurrentStep("scraping");
        await new Promise(resolve => setTimeout(resolve, 800));
        setCurrentStep("analyzing");
        await new Promise(resolve => setTimeout(resolve, 800));
        setCurrentStep("generating");
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Validate data structure before setting
        const resultData = {
          websiteUrl: data.data.websiteUrl || websiteUrl,
          legalDocuments: Array.isArray(data.data.legalDocuments) ? data.data.legalDocuments : [],
          analysis: data.data.analysis || null,
          email: data.data.email || null,
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

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${type} copied to clipboard`,
    });
  };

  const downloadEmail = () => {
    if (!result?.email) {
      toast({
        title: "Error",
        description: "No email available to download",
        variant: "destructive",
      });
      return;
    }

    const emailContent = `Subject: ${result.email.subject || ""}\n\n${result.email.body || ""}`;
    const blob = new Blob([emailContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `email-${(result.websiteUrl || "website").replace(/[^a-z0-9]/gi, "-")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded",
      description: "Email saved to your downloads",
    });
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
                  {currentStep === "analyzing" && "Analyzing documents..."}
                  {currentStep === "generating" && "Generating email..."}
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
                    <div>
                      <h3 className="font-semibold mb-2">Summary</h3>
                      <p className="text-sm text-muted-foreground">
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
                      <h3 className="font-semibold mb-2">Document Issues Found</h3>
                      <Accordion type="single" collapsible className="w-full">
                        {result.analysis.issues.map((issue, index) => (
                          <AccordionItem key={index} value={`issue-${index}`}>
                            <AccordionTrigger>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={getSeverityColor(issue.severity)}
                                >
                                  {issue.severity}
                                </Badge>
                                <span className="font-medium">
                                  {issue.document}
                                </span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="space-y-2">
                              <p className="text-sm text-muted-foreground">
                                {issue.issue}
                              </p>
                              {issue.whyItMatters && (
                                <div className="mt-2 pt-2 border-t">
                                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                                    Why it matters:
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {issue.whyItMatters}
                                  </p>
                                </div>
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  )}

                  {result.analysis.marketingRisks &&
                    result.analysis.marketingRisks.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                          <Megaphone className="h-4 w-4" />
                          Marketing & FTC Compliance Risks
                        </h3>
                        <Accordion type="single" collapsible className="w-full">
                          {result.analysis.marketingRisks.map((risk, index) => (
                            <AccordionItem
                              key={index}
                              value={`marketing-${index}`}
                            >
                              <AccordionTrigger>
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant={getSeverityColor(risk.severity)}
                                  >
                                    {risk.severity}
                                  </Badge>
                                  <span className="font-medium text-sm">
                                    {risk.risk}
                                  </span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <p className="text-sm text-muted-foreground">
                                  {risk.whyItMatters}
                                </p>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </div>
                    )}

                  {result.analysis.operationalRisks &&
                    result.analysis.operationalRisks.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          Operational & Website Compliance Risks
                        </h3>
                        <Accordion type="single" collapsible className="w-full">
                          {result.analysis.operationalRisks.map((risk, index) => (
                            <AccordionItem
                              key={index}
                              value={`operational-${index}`}
                            >
                              <AccordionTrigger>
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant={getSeverityColor(risk.severity)}
                                  >
                                    {risk.severity}
                                  </Badge>
                                  <span className="font-medium text-sm">
                                    {risk.risk}
                                  </span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                {risk.whyItMatters && (
                                  <p className="text-sm text-muted-foreground">
                                    {risk.whyItMatters}
                                  </p>
                                )}
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </div>
                    )}

                  {result.analysis.recommendations && result.analysis.recommendations.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Recommendations</h3>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {result.analysis.recommendations.map((rec, index) => {
                          // Handle both string and object formats
                          const recommendationText = typeof rec === 'string' 
                            ? rec 
                            : (rec?.recommendation || rec?.text || JSON.stringify(rec));
                          const urgency = typeof rec === 'object' && rec?.urgency 
                            ? rec.urgency 
                            : null;
                          return (
                            <li key={index}>
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
                </CardContent>
              </Card>
            )}

            {/* Generated Email */}
            {result.email && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Generated Email
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(
                            `Subject: ${result.email?.subject || ""}\n\n${result.email?.body || ""}`,
                            "Email"
                          )
                        }
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadEmail}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-semibold">Subject</Label>
                    <Input
                      value={result.email?.subject || ""}
                      readOnly
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Body</Label>
                    <ScrollArea className="h-96 w-full rounded-md border p-4 mt-1">
                      <div
                        className="prose prose-sm dark:prose-invert max-w-none [&_p]:leading-relaxed [&_p]:mb-4 [&_li]:mb-2 [&_ul]:space-y-2 [&_ol]:space-y-2"
                        style={{
                          lineHeight: '1.6',
                        }}
                        dangerouslySetInnerHTML={{
                          __html: result.email?.body || "",
                        }}
                      />
                    </ScrollArea>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Show message if no data is available */}
            {!result.analysis && !result.email && (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-center py-8">
                    No analysis or email data available. The workflow may have encountered an error.
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

