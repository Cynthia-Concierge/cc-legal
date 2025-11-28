import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Code,
  MessageSquare,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AutoGenReview {
  agent: string;
  review: string;
  suggestions: string[];
  approved: boolean;
}

interface NodeExecutionDetails {
  nodeId: string;
  nodeName: string;
  startTime?: number;
  endTime?: number;
  duration?: number;
  autogenEnabled: boolean;
  autogenReviews?: AutoGenReview[];
  prompt?: string;
  input?: any;
  output?: any;
  error?: string;
}

interface NodeDetailModalProps {
  node: {
    id: string;
    name: string;
    description: string;
    status: "pending" | "running" | "completed" | "error";
    message?: string;
  };
  details?: NodeExecutionDetails;
  workflowConfig?: {
    prompts?: Record<string, string>;
    autogenConfigs?: Record<string, any>;
  } | null;
  websiteUrl?: string;
  leadInfo?: {
    name?: string;
    company?: string;
    email?: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

const NodeDetailModal = ({
  node,
  details,
  workflowConfig,
  websiteUrl,
  leadInfo,
  isOpen,
  onClose,
}: NodeDetailModalProps) => {
  const [localWorkflowConfig, setLocalWorkflowConfig] = useState<{
    prompts?: Record<string, string>;
    autogenConfigs?: Record<string, any>;
  } | null>(null);

  // Fallback fetch if config is missing
  useEffect(() => {
    if (isOpen && !workflowConfig && !localWorkflowConfig) {
      const fetchConfig = async () => {
        try {
          const API_BASE_URL =
            import.meta.env.VITE_API_URL ||
            (import.meta.env.DEV ? "" : "http://localhost:3001");
          
          // Detect if this is a website redesign workflow
          const isWebsiteRedesign = node.id === "full_scrape" || node.id === "normalize_data" || node.id === "website_design";
          const configEndpoint = isWebsiteRedesign 
            ? "/api/website-redesign-config"
            : "/api/workflow-config";
          
          const urlToUse = websiteUrl || "https://example.com";
          const params = new URLSearchParams({
            websiteUrl: urlToUse,
            ...(leadInfo && !isWebsiteRedesign && { leadInfo: JSON.stringify(leadInfo) }),
          });

          console.log("[NodeDetailModal] Fetching workflow config as fallback:", `${API_BASE_URL}${configEndpoint}?${params}`);
          
          const response = await fetch(`${API_BASE_URL}${configEndpoint}?${params}`);
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              console.log("[NodeDetailModal] Fetched workflow config:", data.data);
              setLocalWorkflowConfig(data.data);
            }
          }
        } catch (error) {
          console.error("[NodeDetailModal] Error fetching workflow config:", error);
        }
      };

      fetchConfig();
    }
  }, [isOpen, workflowConfig, localWorkflowConfig, websiteUrl, leadInfo]);

  // Use workflowConfig from props, or fallback to localWorkflowConfig
  const effectiveConfig = workflowConfig || localWorkflowConfig;

  // Debug logging
  useEffect(() => {
    if (isOpen) {
      console.log("[NodeDetailModal] Modal opened for node:", node.id);
      console.log("[NodeDetailModal] Details:", details);
      console.log("[NodeDetailModal] WorkflowConfig (from props):", workflowConfig);
      console.log("[NodeDetailModal] LocalWorkflowConfig:", localWorkflowConfig);
      console.log("[NodeDetailModal] EffectiveConfig:", effectiveConfig);
      console.log("[NodeDetailModal] Prompt available:", details?.prompt || effectiveConfig?.prompts?.[node.id]);
      console.log("[NodeDetailModal] AutoGen available:", details?.autogenEnabled || effectiveConfig?.autogenConfigs?.[node.id]?.enabled);
      console.log("[NodeDetailModal] All prompts in config:", effectiveConfig?.prompts);
      console.log("[NodeDetailModal] All autogen configs:", effectiveConfig?.autogenConfigs);
    }
  }, [isOpen, node.id, details, workflowConfig, localWorkflowConfig, effectiveConfig]);

  const formatDuration = (ms?: number) => {
    if (!ms) return "N/A";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleTimeString();
  };

  const getAgentName = (agentId: string) => {
    const names: Record<string, string> = {
      compliance_specialist: "Compliance Specialist",
      risk_assessor: "Risk Assessor",
      recommendations_specialist: "Recommendations Specialist",
      tone_specialist: "Tone Specialist",
      content_specialist: "Content Specialist",
      personalization_specialist: "Personalization Specialist",
      subject_line_specialist: "Subject Line Specialist",
      formatting_specialist: "Formatting & Readability Specialist",
      information_architect: "Information Architect",
      ux_strategist: "UX Strategist",
      cro_expert: "CRO / Conversion Expert",
      copywriter: "Copywriter",
      ui_designer: "Brand/UI Designer",
      wireframe_engineer: "Component & Wireframe Engineer",
      final_composer: "Final JSON Composer",
    };
    return names[agentId] || agentId;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {node.name} - Execution Details
            {details?.autogenEnabled && (
              <Badge variant="outline" className="ml-2">
                <Sparkles className="w-3 h-3 mr-1" />
                AutoGen Enabled
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>{node.description}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="autogen" disabled={!details?.autogenEnabled && !effectiveConfig?.autogenConfigs?.[node.id]?.enabled}>
              AutoGen {details?.autogenReviews && `(${details.autogenReviews.length})`} {effectiveConfig?.autogenConfigs?.[node.id]?.enabled && !details?.autogenEnabled && "🤖"}
            </TabsTrigger>
            <TabsTrigger value="prompt" disabled={!details?.prompt && !effectiveConfig?.prompts?.[node.id]}>
              Prompt {effectiveConfig?.prompts?.[node.id] && !details?.prompt && "📋"}
            </TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[60vh] mt-4">
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Clock className="w-4 h-4" />
                    Execution Time
                  </div>
                  <div className="text-sm text-muted-foreground pl-6">
                    {formatDuration(details?.duration)}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    Status
                  </div>
                  <div className="pl-6">
                    <Badge
                      variant={
                        node.status === "completed"
                          ? "default"
                          : node.status === "error"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {node.status}
                    </Badge>
                  </div>
                </div>

                {details?.startTime && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Start Time</div>
                    <div className="text-sm text-muted-foreground">
                      {formatTimestamp(details.startTime)}
                    </div>
                  </div>
                )}

                {details?.endTime && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">End Time</div>
                    <div className="text-sm text-muted-foreground">
                      {formatTimestamp(details.endTime)}
                    </div>
                  </div>
                )}
              </div>

              {details?.autogenEnabled && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Sparkles className="w-4 h-4" />
                      AutoGen Status
                    </div>
                    <div className="pl-6 space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Enabled:</span>{" "}
                        <Badge variant="outline">Yes</Badge>
                      </div>
                      {details.autogenReviews && (
                        <div className="text-sm">
                          <span className="font-medium">Agents:</span>{" "}
                          {details.autogenReviews.length} agents reviewed this
                          node
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {details?.error && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-red-600">
                      <AlertCircle className="w-4 h-4" />
                      Error
                    </div>
                    <div className="pl-6 text-sm text-muted-foreground bg-red-50 dark:bg-red-950 p-3 rounded">
                      {details.error}
                    </div>
                  </div>
                </>
              )}

              {details?.output && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Output Summary</div>
                    <div className="pl-6 text-sm text-muted-foreground bg-slate-50 dark:bg-slate-900 p-3 rounded">
                      <pre className="whitespace-pre-wrap text-xs">
                        {JSON.stringify(details.output, null, 2)}
                      </pre>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>

            {/* AutoGen Tab */}
            <TabsContent value="autogen" className="space-y-4">
              {details?.autogenEnabled || effectiveConfig?.autogenConfigs?.[node.id]?.enabled ? (
                details?.autogenReviews && details.autogenReviews.length > 0 ? (
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      {details.autogenReviews.filter((r) => r.approved).length}{" "}
                      of {details.autogenReviews.length} agents approved this
                      output.
                    </div>
                    {details.autogenReviews.map((review, index) => (
                      <div
                        key={index}
                        className={cn(
                          "border rounded-lg p-4 space-y-3",
                          review.approved
                            ? "border-green-200 bg-green-50 dark:bg-green-950"
                            : "border-yellow-200 bg-yellow-50 dark:bg-yellow-950"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            <span className="font-medium">
                              {getAgentName(review.agent)}
                            </span>
                          </div>
                          {review.approved ? (
                            <Badge variant="default" className="bg-green-600">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Approved
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-yellow-600">
                              <XCircle className="w-3 h-3 mr-1" />
                              Needs Revision
                            </Badge>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="text-sm font-medium">Review:</div>
                          <div className="text-sm text-muted-foreground pl-4">
                            {review.review}
                          </div>
                        </div>

                        {review.suggestions.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-sm font-medium">
                              Suggestions:
                            </div>
                            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground pl-4">
                              {review.suggestions.map((suggestion, idx) => (
                                <li key={idx}>{suggestion}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {effectiveConfig?.autogenConfigs?.[node.id] && (
                      <>
                        <div className="flex items-center gap-2 text-sm font-medium mb-4">
                          <Sparkles className="w-4 h-4" />
                          AutoGen Configuration
                          <Badge variant="outline" className="ml-2 text-xs">
                            Preview (before execution)
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mb-4">
                          {effectiveConfig.autogenConfigs[node.id].enabled
                            ? "AutoGen is enabled for this node. The following agents will review the output:"
                            : "AutoGen is not enabled for this node."}
                        </div>
                        {effectiveConfig.autogenConfigs[node.id].enabled &&
                          effectiveConfig.autogenConfigs[node.id].agents && (
                            <div className="space-y-3">
                              {Object.entries(
                                effectiveConfig.autogenConfigs[node.id].agents
                              ).map(([agentId, agentConfig]: [string, any]) => (
                                <div
                                  key={agentId}
                                  className="border rounded-lg p-4 space-y-3 bg-slate-50 dark:bg-slate-900"
                                >
                                  <div className="flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4" />
                                    <span className="font-medium">
                                      {agentConfig.name || getAgentName(agentId)}
                                    </span>
                                    <Badge variant="outline" className="ml-2 text-xs">
                                      {agentConfig.model || "gpt-4o-mini"}
                                    </Badge>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="text-sm font-medium">
                                      System Message:
                                    </div>
                                    <ScrollArea className="h-[20vh] border rounded-lg p-3 bg-white dark:bg-slate-800">
                                      <pre className="whitespace-pre-wrap text-xs font-mono">
                                        {agentConfig.systemMessage}
                                      </pre>
                                    </ScrollArea>
                                  </div>
                                  {agentConfig.temperature !== undefined && (
                                    <div className="text-xs text-muted-foreground">
                                      Temperature: {agentConfig.temperature}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                      </>
                    )}
                    {!effectiveConfig?.autogenConfigs?.[node.id] && (
                      <div className="text-center py-8 text-muted-foreground">
                        AutoGen review is in progress or not yet available.
                      </div>
                    )}
                  </div>
                )
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  AutoGen is not enabled for this node.
                </div>
              )}
            </TabsContent>

            {/* Prompt Tab */}
            <TabsContent value="prompt" className="space-y-4">
              {(details?.prompt || effectiveConfig?.prompts?.[node.id]) ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Code className="w-4 h-4" />
                    System Prompt
                    {!details?.prompt && effectiveConfig?.prompts?.[node.id] && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Preview (before execution)
                      </Badge>
                    )}
                  </div>
                  <ScrollArea className="h-[50vh] border rounded-lg p-4">
                    <pre className="whitespace-pre-wrap text-xs font-mono">
                      {details?.prompt || effectiveConfig?.prompts?.[node.id] || "No prompt available"}
                    </pre>
                  </ScrollArea>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No prompt available for this node.
                </div>
              )}
            </TabsContent>

            {/* Data Tab */}
            <TabsContent value="data" className="space-y-4">
              <div className="space-y-4">
                {details?.input && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Input Data</div>
                    <ScrollArea className="h-[25vh] border rounded-lg p-4">
                      <pre className="whitespace-pre-wrap text-xs font-mono">
                        {JSON.stringify(details.input, null, 2)}
                      </pre>
                    </ScrollArea>
                  </div>
                )}

                {details?.output && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Output Data</div>
                    <ScrollArea className="h-[25vh] border rounded-lg p-4">
                      <pre className="whitespace-pre-wrap text-xs font-mono">
                        {JSON.stringify(details.output, null, 2)}
                      </pre>
                    </ScrollArea>
                  </div>
                )}

                {!details?.input && !details?.output && (
                  <div className="text-center py-8 text-muted-foreground">
                    No data available for this node.
                  </div>
                )}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default NodeDetailModal;
