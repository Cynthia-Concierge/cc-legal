import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Circle, Globe, FileSearch, ArrowRight, Sparkles, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import NodeDetailModal from "./NodeDetailModal";

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

interface WorkflowNode {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: "pending" | "running" | "completed" | "error";
  message?: string;
  autogenEnabled?: boolean;
  autogenStatus?: "pending" | "running" | "completed" | "error";
  autogenApprovalCount?: number;
  autogenTotalAgents?: number;
}

interface WorkflowVisualizationProps {
  currentStep: "idle" | "scraping" | "analyzing" | "generating" | "complete";
  error?: string;
  executionDetails?: Record<string, NodeExecutionDetails>;
  websiteUrl?: string;
  leadInfo?: {
    name?: string;
    company?: string;
    email?: string;
  };
  workflowSteps?: Array<{
    id: string;
    name: string;
    description: string;
    status: "pending" | "running" | "completed" | "error";
  }>;
  activeNode?: string | null;
  activeAgent?: string | null;
}

const WorkflowVisualization = ({ currentStep, error, executionDetails, websiteUrl, leadInfo, workflowSteps, activeNode, activeAgent }: WorkflowVisualizationProps) => {
  // Default nodes for legal analyzer workflow
  const defaultNodes: WorkflowNode[] = [
    {
      id: "firecrawl",
      name: "Firecrawl",
      description: "Scraping website and extracting legal documents",
      icon: <Globe className="w-5 h-5" />,
      status: "pending",
    },
    {
      id: "legal_analysis",
      name: "Legal Analysis",
      description: "Analyzing documents with AI for compliance issues",
      icon: <FileSearch className="w-5 h-5" />,
      status: "pending",
    },
  ];

  // Use custom workflow steps if provided, otherwise use default
  const initialNodes: WorkflowNode[] = workflowSteps
    ? workflowSteps.map((step) => ({
        id: step.id,
        name: step.name,
        description: step.description,
        icon: step.id.includes("scrape") ? <Globe className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />,
        status: step.status,
      }))
    : defaultNodes;

  const [nodes, setNodes] = useState<WorkflowNode[]>(initialNodes);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [workflowConfig, setWorkflowConfig] = useState<{
    prompts?: Record<string, string>;
    autogenConfigs?: Record<string, any>;
  } | null>(null);

  // Fetch workflow config when websiteUrl is available and workflow hasn't started
  useEffect(() => {
    console.log("[WorkflowVisualization] useEffect triggered:", { websiteUrl, currentStep, hasLeadInfo: !!leadInfo });
    
    const fetchWorkflowConfig = async () => {
      // Use a placeholder URL if websiteUrl is not provided yet
      const urlToUse = websiteUrl || "https://example.com";
      
      if (currentStep === "idle") {
        try {
          const API_BASE_URL =
            import.meta.env.VITE_API_URL ||
            (import.meta.env.DEV ? "" : "http://localhost:3001");
          
          // Determine which endpoint to use based on workflow steps
          const isWebsiteRedesign = workflowSteps?.some(step => 
            step.id === "full_scrape" || step.id === "website_design"
          );
          
          const configEndpoint = isWebsiteRedesign 
            ? "/api/website-redesign-config"
            : "/api/workflow-config";
          
          const params = new URLSearchParams({
            websiteUrl: urlToUse,
            ...(leadInfo && !isWebsiteRedesign && { leadInfo: JSON.stringify(leadInfo) }),
          });

          console.log("[WorkflowVisualization] Fetching workflow config from:", `${API_BASE_URL}${configEndpoint}?${params}`);
          
          const response = await fetch(`${API_BASE_URL}${configEndpoint}?${params}`);
          
          if (!response.ok) {
            console.error("[WorkflowVisualization] API response not OK:", response.status, response.statusText);
            try {
              const errorData = await response.json();
              console.error("[WorkflowVisualization] Error response:", errorData);
            } catch (e) {
              const errorText = await response.text();
              console.error("[WorkflowVisualization] Error response (text):", errorText);
            }
            return;
          }
          
          const data = await response.json();
          console.log("[WorkflowVisualization] Received workflow config:", data);
          
          if (data.success && data.data) {
            console.log("[WorkflowVisualization] Setting workflow config:", data.data);
            setWorkflowConfig(data.data);
          } else {
            console.warn("[WorkflowVisualization] Unexpected response format:", data);
          }
        } catch (error) {
          console.error("[WorkflowVisualization] Error fetching workflow config:", error);
        }
      } else {
        // Reset config when workflow starts
        if (currentStep !== "idle" && currentStep !== "pending") {
          setWorkflowConfig(null);
        }
      }
    };

    fetchWorkflowConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [websiteUrl, currentStep]); // Removed leadInfo to prevent infinite loop - it's used inside but not as a dependency

  // Update nodes when workflowSteps prop changes
  useEffect(() => {
    if (workflowSteps) {
      setNodes(
        workflowSteps.map((step) => ({
          id: step.id,
          name: step.name,
          description: step.description,
          icon: step.id.includes("scrape") ? <Globe className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />,
          status: step.status,
        }))
      );
    }
  }, [workflowSteps]);

  useEffect(() => {
    const updatedNodes = nodes.map((node) => {
      let status: WorkflowNode["status"] = "pending";
      let message: string | undefined;
      let autogenEnabled = false;
      let autogenStatus: "pending" | "running" | "completed" | "error" = "pending";
      let autogenApprovalCount = 0;
      let autogenTotalAgents = 0;

      // Get execution details for this node
      const details = executionDetails?.[node.id];

      switch (node.id) {
        case "firecrawl":
        case "full_scrape":
          if (activeNode === "full_scrape" || activeNode === "firecrawl") {
            status = "running";
            message = "Scraping website...";
          } else if (currentStep === "scraping" || currentStep === "normalizing" || currentStep === "analyzing" || currentStep === "generating" || currentStep === "designing" || currentStep === "complete") {
            status = currentStep === "scraping" ? "running" : "completed";
            message = currentStep === "scraping" ? "Scraping website..." : "Scraping complete";
          }
          break;
        case "normalize_data":
          if (activeNode === "normalize_data") {
            status = "running";
            message = "Normalizing data...";
          } else if (currentStep === "normalizing" || currentStep === "designing" || currentStep === "complete") {
            status = currentStep === "normalizing" ? "running" : "completed";
            message = currentStep === "normalizing" ? "Normalizing data..." : "Normalization complete";
          }
          break;
        case "website_design":
          if (activeNode === "website_design") {
            status = "running";
            if (activeAgent) {
              const agentNames: Record<string, string> = {
                information_architect: "Information Architect",
                ux_strategist: "UX Strategist",
                cro_expert: "CRO Expert",
                copywriter: "Copywriter",
                ui_designer: "UI Designer",
                wireframe_engineer: "Wireframe Engineer",
                final_composer: "Final Composer",
              };
              message = `Agent: ${agentNames[activeAgent] || activeAgent.replace(/_/g, " ")}`;
            } else {
              message = "Designing website...";
            }
            autogenEnabled = true;
            autogenStatus = "running";
            autogenTotalAgents = 7;
          } else if (currentStep === "designing" || currentStep === "complete") {
            status = currentStep === "designing" ? "running" : "completed";
            message = currentStep === "designing" ? "Designing website..." : "Design complete";
            if (details?.autogenEnabled || activeNode === "website_design") {
              autogenEnabled = true;
              if (details?.autogenReviews) {
                autogenStatus = "completed";
                autogenApprovalCount = details.autogenReviews.filter(r => r.approved).length;
                autogenTotalAgents = details.autogenReviews.length;
              } else if (currentStep === "designing" || activeNode === "website_design") {
                autogenStatus = "running";
                autogenTotalAgents = 7;
              }
            }
          }
          break;
        case "legal_analysis":
          if (currentStep === "analyzing" || currentStep === "generating" || currentStep === "complete") {
            status = currentStep === "analyzing" ? "running" : currentStep === "scraping" ? "pending" : "completed";
            message = currentStep === "analyzing" ? "Analyzing legal documents..." : currentStep !== "scraping" ? "Analysis complete" : undefined;
          }
          // Check if AutoGen is running
          if (details?.autogenEnabled) {
            autogenEnabled = true;
            if (details.autogenReviews) {
              autogenStatus = "completed";
              autogenApprovalCount = details.autogenReviews.filter(r => r.approved).length;
              autogenTotalAgents = details.autogenReviews.length;
            } else if (currentStep === "analyzing") {
              autogenStatus = "running";
            }
          }
          break;
      }

      if (error && (currentStep === "idle" || node.status === "running")) {
        status = "error";
        message = error;
      }

      return { 
        ...node, 
        status, 
        message,
        autogenEnabled,
        autogenStatus,
        autogenApprovalCount,
        autogenTotalAgents,
      };
    });

    setNodes(updatedNodes);
  }, [currentStep, error, executionDetails, activeNode, activeAgent, nodes]);

  const getStatusIcon = (status: WorkflowNode["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "running":
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case "error":
        return <Circle className="w-5 h-5 text-red-500" />;
      default:
        return <Circle className="w-5 h-5 text-gray-300" />;
    }
  };

  const getNodeStyles = (status: WorkflowNode["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-50 border-green-200 shadow-green-100";
      case "running":
        return "bg-blue-50 border-blue-300 shadow-blue-200 animate-pulse";
      case "error":
        return "bg-red-50 border-red-200 shadow-red-100";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="w-full py-8">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Workflow Progress</h3>
        <p className="text-sm text-muted-foreground">
          LangGraph workflow execution in real-time
        </p>
      </div>

      <div className="relative">
        {/* Workflow Container */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
          {nodes.map((node, index) => (
            <div key={node.id} className="flex items-center w-full md:w-auto">
              {/* Node */}
              <div 
                className={cn(
                  "relative flex flex-col items-center p-6 rounded-lg border-2 transition-all duration-300 min-w-[200px] cursor-pointer hover:shadow-lg",
                  getNodeStyles(node.status)
                )}
                onClick={() => {
                  setSelectedNode(node);
                  setIsModalOpen(true);
                }}
              >
                {/* Status Badge */}
                <div className="absolute -top-3 -right-3 bg-white rounded-full p-1 shadow-lg">
                  {getStatusIcon(node.status)}
                </div>

                {/* Icon */}
                <div className={cn(
                  "mb-3 p-3 rounded-full transition-colors",
                  node.status === "completed" ? "bg-green-100 text-green-600" :
                  node.status === "running" ? "bg-blue-100 text-blue-600" :
                  node.status === "error" ? "bg-red-100 text-red-600" :
                  "bg-gray-100 text-gray-400"
                )}>
                  {node.icon}
                </div>

                {/* Node Name */}
                <h4 className={cn(
                  "font-semibold mb-1 text-sm",
                  node.status === "completed" ? "text-green-700" :
                  node.status === "running" ? "text-blue-700" :
                  node.status === "error" ? "text-red-700" :
                  "text-gray-500"
                )}>
                  {node.name}
                </h4>

                {/* Description */}
                <p className="text-xs text-center text-muted-foreground mb-2">
                  {node.description}
                </p>

                {/* AutoGen Badge */}
                {node.autogenEnabled && (
                  <div className="mt-2 flex items-center gap-1">
                    <Badge variant="outline" className="text-xs">
                      <Sparkles className="w-3 h-3 mr-1" />
                      AutoGen
                    </Badge>
                    {node.autogenStatus === "completed" && node.autogenTotalAgents && (
                      <span className="text-xs text-muted-foreground">
                        {node.autogenApprovalCount}/{node.autogenTotalAgents} approved
                      </span>
                    )}
                    {node.autogenStatus === "running" && (
                      <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                    )}
                  </div>
                )}

                {/* Status Message */}
                {node.message && (
                  <div className={cn(
                    "text-xs font-medium mt-2 px-2 py-1 rounded",
                    node.status === "running" ? "text-blue-600 bg-blue-100" :
                    node.status === "completed" ? "text-green-600 bg-green-100" :
                    node.status === "error" ? "text-red-600 bg-red-100" :
                    "text-gray-600 bg-gray-100"
                  )}>
                    {node.message}
                  </div>
                )}

                {/* Click hint */}
                <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <Info className="w-3 h-3" />
                  Click for details
                </div>

                {/* Progress Bar */}
                {node.status === "running" && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-200 rounded-b-lg overflow-hidden">
                    <div className="h-full bg-blue-500" style={{
                      animation: "progress 2s ease-in-out infinite",
                      width: "100%"
                    }}></div>
                  </div>
                )}
              </div>

              {/* Arrow Connector */}
              {index < nodes.length - 1 && (
                <div className="hidden md:flex items-center mx-2">
                  <ArrowRight className={cn(
                    "w-6 h-6 transition-colors",
                    node.status === "completed" ? "text-green-500" : "text-gray-300"
                  )} />
                </div>
              )}

              {/* Vertical Connector for Mobile */}
              {index < nodes.length - 1 && (
                <div className="md:hidden flex flex-col items-center my-2">
                  <div className={cn(
                    "w-0.5 h-8 transition-colors",
                    node.status === "completed" ? "bg-green-500" : "bg-gray-300"
                  )} />
                  <ArrowRight className={cn(
                    "w-4 h-4 rotate-90 transition-colors",
                    node.status === "completed" ? "text-green-500" : "text-gray-300"
                  )} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Connection Lines Background (for visual flow) */}
        <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 -z-10">
          <div className="relative h-full">
            {nodes.map((node, index) => {
              if (index === nodes.length - 1) return null;
              const isCompleted = node.status === "completed";
              return (
                <div
                  key={`line-${index}`}
                  className={cn(
                    "absolute h-full transition-all duration-500",
                    isCompleted ? "bg-green-500" : "bg-gray-200"
                  )}
                  style={{
                    left: `${(index * 100) / (nodes.length - 1)}%`,
                    width: `${100 / (nodes.length - 1)}%`,
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <Circle className="w-4 h-4 text-gray-300" />
          <span className="text-muted-foreground">Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
          <span className="text-muted-foreground">Running</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          <span className="text-muted-foreground">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <Circle className="w-4 h-4 text-red-500" />
          <span className="text-muted-foreground">Error</span>
        </div>
      </div>

      {/* Node Detail Modal */}
      {selectedNode && (
        <NodeDetailModal
          node={selectedNode}
          details={executionDetails?.[selectedNode.id]}
          workflowConfig={workflowConfig}
          websiteUrl={websiteUrl}
          leadInfo={leadInfo}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedNode(null);
          }}
        />
      )}
    </div>
  );
};

export default WorkflowVisualization;

