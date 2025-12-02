import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Eye, FileText, AlertTriangle, CheckCircle, XCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkflowResultDetailProps {
  data: any;
  trigger?: React.ReactNode;
}

export function WorkflowResultDetail({ data, trigger }: WorkflowResultDetailProps) {
  const [open, setOpen] = useState(false);

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return "Not provided";
    if (typeof value === "object") {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800 border-red-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const renderLegalDocuments = () => {
    if (!data.legal_documents || typeof data.legal_documents !== "object") {
      return <p className="text-sm text-muted-foreground">No legal documents found</p>;
    }

    const docs = data.legal_documents;
    const docTypes: Record<string, string> = {
      privacyPolicy: "Privacy Policy",
      termsOfService: "Terms of Service",
      refundPolicy: "Refund Policy",
      cookiePolicy: "Cookie Policy",
      disclaimer: "Disclaimer",
    };

    return (
      <div className="space-y-2">
        {Object.entries(docs).map(([key, value]: [string, any]) => {
          if (!value) return null;
          const docName = docTypes[key] || key.replace(/([A-Z])/g, " $1").trim();
          const preview = typeof value === "string" 
            ? value.substring(0, 200) + (value.length > 200 ? "..." : "")
            : String(value).substring(0, 200) + "...";
          
          return (
            <Card key={key} className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {docName}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ScrollArea className="h-32 w-full rounded border p-2 bg-muted/50">
                  <pre className="text-xs whitespace-pre-wrap font-mono">
                    {preview}
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderAnalysis = () => {
    if (!data.analysis || typeof data.analysis !== "object") {
      return <p className="text-sm text-muted-foreground">No analysis available</p>;
    }

    const analysis = data.analysis;

    return (
      <div className="space-y-4">
        {/* Summary */}
        {analysis.summary && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{analysis.summary}</p>
            </CardContent>
          </Card>
        )}

        {/* Missing Documents */}
        {analysis.missingDocuments && analysis.missingDocuments.length > 0 && (
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                Missing Documents ({analysis.missingDocuments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {analysis.missingDocuments.map((doc: string, idx: number) => (
                  <li key={idx} className="text-sm flex items-center gap-2">
                    <XCircle className="h-3 w-3 text-red-500" />
                    {doc}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Issues */}
        {analysis.issues && analysis.issues.length > 0 && (
          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                Issues Found ({analysis.issues.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.issues.map((issue: any, idx: number) => (
                  <div key={idx} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{issue.document || "General"}</p>
                        <p className="text-sm text-muted-foreground mt-1">{issue.issue}</p>
                      </div>
                      <Badge className={cn("text-xs", getSeverityColor(issue.severity))}>
                        {issue.severity || "Unknown"}
                      </Badge>
                    </div>
                    {issue.whyItMatters && (
                      <div className="bg-muted/50 rounded p-2">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Why it matters:</p>
                        <p className="text-xs">{issue.whyItMatters}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Marketing Risks */}
        {analysis.marketingRisks && analysis.marketingRisks.length > 0 && (
          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Info className="h-4 w-4 text-yellow-600" />
                Marketing Risks ({analysis.marketingRisks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analysis.marketingRisks.map((risk: any, idx: number) => (
                  <div key={idx} className="border rounded-lg p-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm flex-1">{risk.risk}</p>
                      <Badge className={cn("text-xs", getSeverityColor(risk.severity))}>
                        {risk.severity}
                      </Badge>
                    </div>
                    {risk.whyItMatters && (
                      <p className="text-xs text-muted-foreground mt-1">{risk.whyItMatters}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Operational Risks */}
        {analysis.operationalRisks && analysis.operationalRisks.length > 0 && (
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-600" />
                Operational Risks ({analysis.operationalRisks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analysis.operationalRisks.map((risk: any, idx: number) => (
                  <div key={idx} className="border rounded-lg p-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm flex-1">{risk.risk}</p>
                      <Badge className={cn("text-xs", getSeverityColor(risk.severity))}>
                        {risk.severity}
                      </Badge>
                    </div>
                    {risk.whyItMatters && (
                      <p className="text-xs text-muted-foreground mt-1">{risk.whyItMatters}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recommendations */}
        {analysis.recommendations && analysis.recommendations.length > 0 && (
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Recommendations ({analysis.recommendations.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.recommendations.map((rec: string, idx: number) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const defaultTrigger = (
    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
      <Eye className="h-4 w-4" />
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Workflow Result Details</DialogTitle>
          <DialogDescription>
            {data.website_url || "Workflow analysis results"}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-muted-foreground">Website URL</p>
                    <a 
                      href={data.website_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {data.website_url}
                    </a>
                  </div>
                  {data.lead_name && (
                    <div>
                      <p className="font-medium text-muted-foreground">Lead Name</p>
                      <p>{data.lead_name}</p>
                    </div>
                  )}
                  {data.lead_company && (
                    <div>
                      <p className="font-medium text-muted-foreground">Company</p>
                      <p>{data.lead_company}</p>
                    </div>
                  )}
                  {data.lead_email && (
                    <div>
                      <p className="font-medium text-muted-foreground">Email</p>
                      <p>{data.lead_email}</p>
                    </div>
                  )}
                  {data.status && (
                    <div>
                      <p className="font-medium text-muted-foreground">Status</p>
                      <Badge 
                        className={cn(
                          data.status === "completed" ? "bg-green-100 text-green-800" :
                          data.status === "error" ? "bg-red-100 text-red-800" :
                          "bg-yellow-100 text-yellow-800"
                        )}
                      >
                        {data.status}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* Legal Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Legal Documents</CardTitle>
                <CardDescription>Documents found and scraped from the website</CardDescription>
              </CardHeader>
              <CardContent>
                {renderLegalDocuments()}
              </CardContent>
            </Card>

            <Separator />

            {/* Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Legal Analysis</CardTitle>
                <CardDescription>Compliance issues, risks, and recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                {renderAnalysis()}
              </CardContent>
            </Card>

            {/* Contact Information */}
            {(data.scraped_email || data.instagram_url || data.facebook_url || data.twitter_url || data.linkedin_url || data.tiktok_url) && (
              <>
                <Separator />
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Contact Information</CardTitle>
                    <CardDescription>Scraped contact details from the website</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {data.scraped_email && (
                        <div>
                          <p className="font-medium text-muted-foreground">Email</p>
                          <a href={`mailto:${data.scraped_email}`} className="text-blue-600 hover:underline">
                            {data.scraped_email}
                          </a>
                        </div>
                      )}
                      {data.instagram_url && (
                        <div>
                          <p className="font-medium text-muted-foreground">Instagram</p>
                          <a href={data.instagram_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {data.instagram_url}
                          </a>
                        </div>
                      )}
                      {data.facebook_url && (
                        <div>
                          <p className="font-medium text-muted-foreground">Facebook</p>
                          <a href={data.facebook_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {data.facebook_url}
                          </a>
                        </div>
                      )}
                      {data.twitter_url && (
                        <div>
                          <p className="font-medium text-muted-foreground">Twitter</p>
                          <a href={data.twitter_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {data.twitter_url}
                          </a>
                        </div>
                      )}
                      {data.linkedin_url && (
                        <div>
                          <p className="font-medium text-muted-foreground">LinkedIn</p>
                          <a href={data.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {data.linkedin_url}
                          </a>
                        </div>
                      )}
                      {data.tiktok_url && (
                        <div>
                          <p className="font-medium text-muted-foreground">TikTok</p>
                          <a href={data.tiktok_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {data.tiktok_url}
                          </a>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Email Content */}
            {(data.email_subject || data.email_body) && (
              <>
                <Separator />
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Generated Email</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {data.email_subject && (
                      <div>
                        <p className="font-medium text-sm text-muted-foreground mb-1">Subject</p>
                        <p className="text-sm">{data.email_subject}</p>
                      </div>
                    )}
                    {data.email_body && (
                      <div>
                        <p className="font-medium text-sm text-muted-foreground mb-1">Body</p>
                        <ScrollArea className="h-48 w-full rounded border p-3 bg-muted/50">
                          <div 
                            className="text-sm prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: data.email_body }}
                          />
                        </ScrollArea>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

