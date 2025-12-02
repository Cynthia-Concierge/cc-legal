import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  FileText, 
  Database, 
  RefreshCw,
  Filter,
  Play,
  Mail,
  MailX,
  Eye,
  FileText as FileTextIcon,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkflowResultDetail } from "./WorkflowResultDetail";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TableInfo {
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  fields: string[];
}

interface TableData {
  [key: string]: any;
}

const DatabaseTables = () => {
  const [tables] = useState<TableInfo[]>([
    {
      name: "contacts",
      description: "Form submissions from landing page opt-ins",
      icon: <Users className="h-5 w-5" />,
      color: "bg-blue-500",
      fields: ["name", "email", "phone", "website", "created_at"],
    },
    {
      name: "workflow_results",
      description: "Legal analyzer workflow results - website scraping, analysis, and generated emails",
      icon: <FileText className="h-5 w-5" />,
      color: "bg-purple-500",
      fields: [
        "website_url", "lead_name", "lead_company", "lead_email",
        "legal_documents", "analysis",
        "scraped_email", "scraped_emails",
        "instagram_url", "facebook_url", "twitter_url", "linkedin_url", "tiktok_url", "other_social_links",
        "email_subject", "email_body",
        "status", "error_message",
        "created_at", "updated_at"
      ],
    },
    {
      name: "cold_leads",
      description: "Cold leads imported from Instantly or CSV files",
      icon: <Database className="h-5 w-5" />,
      color: "bg-emerald-500",
      fields: [
        "first_name", "last_name", "company", "location", 
        "linkedin_url", "email_1", "email_2", "company_website",
        "analyzed_at", "scraped_email", "scraped_emails",
        "instagram_url", "facebook_url", "twitter_url", 
        "linkedin_url_scraped", "tiktok_url", "other_social_links"
      ],
    },
  ]);

  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<TableData[]>([]);
  const [filteredData, setFilteredData] = useState<TableData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [emailFilter, setEmailFilter] = useState<"all" | "has-email" | "no-email">("all");
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [processingLeads, setProcessingLeads] = useState<Set<string>>(new Set());
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 
    (import.meta.env.DEV ? "" : "");

  const fetchTableData = async (tableName: string, append: boolean = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setError(null);
    }
    
    try {
      let response;
      const offset = append ? tableData.length : 0;
      // For cold_leads and workflow_results, fetch all data (use a large limit)
      const limit = (tableName === "cold_leads" || tableName === "workflow_results") ? 10000 : 1000;

      switch (tableName) {
        case "contacts":
          response = await fetch(`${API_BASE_URL}/api/contacts?limit=${limit}&offset=${offset}`);
          break;
        case "workflow_results":
          response = await fetch(`${API_BASE_URL}/api/workflow-results?limit=${limit}&offset=${offset}`);
          break;
        case "cold_leads":
          response = await fetch(`${API_BASE_URL}/api/cold-leads?limit=${limit}&offset=${offset}`);
          break;
        default:
          throw new Error("Unknown table");
      }

      if (!response.ok) {
        // Try to get error details from response
        let errorMessage = `Failed to fetch ${tableName}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
          if (errorData.details) {
            errorMessage += `: ${errorData.details}`;
          }
          if (errorData.hint) {
            errorMessage += ` (${errorData.hint})`;
          }
        } catch (e) {
          // If JSON parsing fails, use status text
          errorMessage = `${errorMessage} (${response.status} ${response.statusText})`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || result.message || "Failed to fetch table data");
      }
      
      const data = result.data || [];
      
      if (append) {
        setTableData(prev => [...prev, ...data]);
        setHasMore(data.length >= limit);
      } else {
        setTableData(data);
        setHasMore(data.length >= limit);
      }
      
      // Apply filter after updating data
      const dataToFilter = append ? [...tableData, ...data] : data;
      applyEmailFilter(dataToFilter, emailFilter, tableName);
      
      if (data.length === 0 && !append) {
        console.log(`No data found for table: ${tableName}`, result);
      }
    } catch (err: any) {
      console.error(`Error fetching ${tableName}:`, err);
      setError(err.message || "Failed to fetch table data");
      if (!append) {
        setTableData([]);
      }
    } finally {
      if (append) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  const applyEmailFilter = (data: TableData[], filter: "all" | "has-email" | "no-email", tableName: string | null) => {
    if (tableName !== "cold_leads" || filter === "all") {
      setFilteredData(data);
      return;
    }

    const filtered = data.filter((row) => {
      const hasEmail = !!(row.email_1 || row.email_2);
      return filter === "has-email" ? hasEmail : !hasEmail;
    });
    setFilteredData(filtered);
  };

  useEffect(() => {
    if (selectedTable) {
      fetchTableData(selectedTable, false);
    }
  }, [selectedTable]);

  useEffect(() => {
    applyEmailFilter(tableData, emailFilter, selectedTable);
  }, [emailFilter, tableData, selectedTable]);

  // Auto-refresh for cold_leads and workflow_results tables every 30 seconds
  useEffect(() => {
    if (selectedTable === "cold_leads" || selectedTable === "workflow_results") {
      const interval = setInterval(() => {
        fetchTableData(selectedTable, false);
      }, 30000); // Refresh every 30 seconds
      setAutoRefreshInterval(interval);
      
      return () => {
        if (interval) clearInterval(interval);
      };
    } else {
      if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        setAutoRefreshInterval(null);
      }
    }
  }, [selectedTable]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
      }
    };
  }, [autoRefreshInterval]);

  const formatValue = (value: any, header?: string): string => {
    if (value === null || value === undefined) return "-";
    
    // Handle arrays (like scraped_emails)
    if (Array.isArray(value)) {
      if (value.length === 0) return "-";
      return value.join(", ");
    }
    
    // Handle objects (like other_social_links)
    if (typeof value === "object") {
      const keys = Object.keys(value);
      if (keys.length === 0) return "-";
      // Format as "key1: value1, key2: value2"
      return keys.map(k => `${k}: ${value[k]}`).join(", ");
    }
    
    // Handle URLs - make them clickable in display
    if (typeof value === "string" && (value.startsWith("http://") || value.startsWith("https://"))) {
      return value.length > 60 ? value.substring(0, 60) + "..." : value;
    }
    
    if (typeof value === "string" && value.length > 50) {
      return value.substring(0, 50) + "...";
    }
    return String(value);
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString() + " " + 
             new Date(dateString).toLocaleTimeString();
    } catch {
      return dateString;
    }
  };

  const getTableHeaders = (tableName: string): string[] => {
    const dataToUse = filteredData.length > 0 ? filteredData : tableData;
    if (dataToUse.length === 0) return [];
    
    // Get all headers from first row, prioritize important fields
    const allKeys = Object.keys(dataToUse[0]);
    const table = tables.find(t => t.name === tableName);
    
    // Sort: put important fields first, then others
    const importantFields = table?.fields || [];
    const sortedKeys = [
      ...allKeys.filter(key => importantFields.some(f => key.includes(f))),
      ...allKeys.filter(key => !importantFields.some(f => key.includes(f)))
    ];
    
    // For cold_leads and workflow_results, show all columns (no limit)
    // For other tables, limit to 10
    return (tableName === "cold_leads" || tableName === "workflow_results") 
      ? sortedKeys 
      : sortedKeys.slice(0, 10);
  };

  const handleRunLegalAnalyzer = async () => {
    if (selectedLeads.size === 0) return;

    const leadsToProcess = filteredData.filter(row => {
      const rowId = row.id || String(row.email_1 || row.email_2 || Math.random());
      return selectedLeads.has(rowId);
    });

    setProcessingLeads(new Set(selectedLeads));
    
    try {
      for (const lead of leadsToProcess) {
        const websiteUrl = lead.company_website || lead.linkedin_url;
        if (!websiteUrl) {
          console.warn(`Skipping lead ${lead.id || lead.email_1}: No website URL`);
          continue;
        }

        const leadInfo = {
          firstName: lead.first_name,
          lastName: lead.last_name,
          company: lead.company,
          location: lead.location,
          email: lead.email_1 || lead.email_2,
          linkedinUrl: lead.linkedin_url,
        };

        try {
          const response = await fetch(`${API_BASE_URL}/api/scrape-and-analyze`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              websiteUrl,
              leadInfo,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error(`Failed to process ${websiteUrl}:`, errorData);
          } else {
            const result = await response.json();
            console.log(`Successfully processed ${websiteUrl}:`, result);
          }
        } catch (error) {
          console.error(`Error processing ${websiteUrl}:`, error);
        }
      }

      // Show success message
      alert(`Successfully processed ${leadsToProcess.length} lead(s). Refreshing table...`);
      
      // Clear selection and refresh table data
      setSelectedLeads(new Set());
      
      // Refresh the table to show updated contact info
      if (selectedTable) {
        await fetchTableData(selectedTable, false);
      }
    } catch (error) {
      console.error("Error running legal analyzer:", error);
      alert("Error processing leads. Check console for details.");
    } finally {
      setProcessingLeads(new Set());
    }
  };

  if (selectedTable) {
    const headers = getTableHeaders(selectedTable);
    const tableInfo = tables.find(t => t.name === selectedTable);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedTable(null);
                setTableData([]);
                setFilteredData([]);
                if (autoRefreshInterval) {
                  clearInterval(autoRefreshInterval);
                  setAutoRefreshInterval(null);
                }
              }}
            >
              ← Back
            </Button>
            <div className={`${tableInfo?.color} p-2 rounded-lg text-white`}>
              {tableInfo?.icon}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {selectedTable}
              </h2>
              <p className="text-sm text-muted-foreground">
                {tableInfo?.description}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchTableData(selectedTable, false)}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
            {(selectedTable === "cold_leads" || selectedTable === "workflow_results") && (
              <span className="text-xs ml-1">(Auto-refresh: 30s)</span>
            )}
          </Button>
        </div>

        {/* Email Filter and Actions (only for cold_leads) */}
        {selectedTable === "cold_leads" && (
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Filter by Email:</span>
                  <div className="flex gap-2">
                    <Button
                      variant={emailFilter === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setEmailFilter("all")}
                    >
                      All
                    </Button>
                    <Button
                      variant={emailFilter === "has-email" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setEmailFilter("has-email")}
                      className="flex items-center gap-1"
                    >
                      <Mail className="h-3 w-3" />
                      Has Email
                    </Button>
                    <Button
                      variant={emailFilter === "no-email" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setEmailFilter("no-email")}
                      className="flex items-center gap-1"
                    >
                      <MailX className="h-3 w-3" />
                      No Email
                    </Button>
                  </div>
                </div>
                {selectedLeads.size > 0 && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleRunLegalAnalyzer}
                    disabled={processingLeads.size > 0}
                    className="flex items-center gap-2"
                  >
                    <Play className="h-4 w-4" />
                    Run Legal Analyzer ({selectedLeads.size})
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading...
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">
                {error}
              </div>
            ) : filteredData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No data found</p>
                <p className="text-xs mt-2">
                  {emailFilter !== "all" 
                    ? `No leads found with ${emailFilter === "has-email" ? "email addresses" : "missing email addresses"}`
                    : "This table may be empty or the data may not be accessible"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {selectedTable === "cold_leads" && (
                        <TableHead className="w-12">
                          <input
                            type="checkbox"
                            checked={selectedLeads.size === filteredData.length && filteredData.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedLeads(new Set(filteredData.map(row => row.id || String(row.email_1 || row.email_2 || Math.random()))));
                              } else {
                                setSelectedLeads(new Set());
                              }
                            }}
                            className="rounded"
                          />
                        </TableHead>
                      )}
                      {headers.map((header) => (
                        <TableHead key={header} className="font-semibold">
                          {header.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                        </TableHead>
                      ))}
                      {selectedTable === "workflow_results" && (
                        <TableHead className="font-semibold w-24">Actions</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((row, idx) => {
                      const rowId = row.id || String(row.email_1 || row.email_2 || idx);
                      const isSelected = selectedLeads.has(rowId);
                      const isProcessing = processingLeads.has(rowId);
                      const hasEmail = !!(row.email_1 || row.email_2);
                      const websiteUrl = row.company_website || row.linkedin_url;
                      
                      return (
                        <TableRow 
                          key={rowId}
                          className={isSelected ? "bg-blue-50 dark:bg-blue-950" : ""}
                        >
                          {selectedTable === "cold_leads" && (
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  const newSelected = new Set(selectedLeads);
                                  if (e.target.checked) {
                                    newSelected.add(rowId);
                                  } else {
                                    newSelected.delete(rowId);
                                  }
                                  setSelectedLeads(newSelected);
                                }}
                                className="rounded"
                                disabled={isProcessing}
                              />
                            </TableCell>
                          )}
                          {headers.map((header) => {
                            const value = row[header];
                            const isUrl = typeof value === "string" && (value.startsWith("http://") || value.startsWith("https://"));
                            const isDate = header.includes("date") || header.includes("created_at") || header.includes("updated_at") || header.includes("imported_at") || header.includes("analyzed_at");
                            
                            // Special handling for complex fields in workflow_results
                            if (selectedTable === "workflow_results") {
                              if (header === "legal_documents" && value && typeof value === "object") {
                                const docCount = Object.keys(value).filter(k => value[k]).length;
                                return (
                                  <TableCell key={header}>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="secondary" className="text-xs">
                                        <FileTextIcon className="h-3 w-3 mr-1" />
                                        {docCount} {docCount === 1 ? "document" : "documents"}
                                      </Badge>
                                      <WorkflowResultDetail data={row} />
                                    </div>
                                  </TableCell>
                                );
                              }
                              
                              if (header === "analysis" && value && typeof value === "object") {
                                const issueCount = value.issues?.length || 0;
                                const missingCount = value.missingDocuments?.length || 0;
                                const recCount = value.recommendations?.length || 0;
                                return (
                                  <TableCell key={header}>
                                    <div className="flex items-center gap-2">
                                      <div className="flex flex-col gap-1">
                                        {issueCount > 0 && (
                                          <Badge variant="destructive" className="text-xs w-fit">
                                            <AlertTriangle className="h-3 w-3 mr-1" />
                                            {issueCount} {issueCount === 1 ? "issue" : "issues"}
                                          </Badge>
                                        )}
                                        {missingCount > 0 && (
                                          <Badge variant="outline" className="text-xs w-fit">
                                            {missingCount} missing
                                          </Badge>
                                        )}
                                        {recCount > 0 && (
                                          <Badge variant="secondary" className="text-xs w-fit">
                                            {recCount} recommendations
                                          </Badge>
                                        )}
                                        {issueCount === 0 && missingCount === 0 && recCount === 0 && (
                                          <span className="text-xs text-muted-foreground">No analysis data</span>
                                        )}
                                      </div>
                                      <WorkflowResultDetail data={row} />
                                    </div>
                                  </TableCell>
                                );
                              }
                              
                              if ((header === "email_subject" || header === "email_body") && value) {
                                const preview = typeof value === "string" 
                                  ? value.substring(0, 50) + (value.length > 50 ? "..." : "")
                                  : String(value).substring(0, 50) + "...";
                                return (
                                  <TableCell key={header}>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-muted-foreground truncate" title={value}>
                                        {preview}
                                      </span>
                                      <WorkflowResultDetail data={row} />
                                    </div>
                                  </TableCell>
                                );
                              }
                            }
                            
                            return (
                              <TableCell key={header} className="max-w-[200px]">
                                {isDate ? (
                                  formatDate(value)
                                ) : isUrl ? (
                                  <a 
                                    href={value} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline truncate block"
                                    title={value}
                                  >
                                    {formatValue(value, header)}
                                  </a>
                                ) : (
                                  <span className="truncate block" title={typeof value === "object" ? JSON.stringify(value) : String(value)}>
                                    {formatValue(value, header)}
                                  </span>
                                )}
                              </TableCell>
                            );
                          })}
                          {selectedTable === "workflow_results" && (
                            <TableCell>
                              <WorkflowResultDetail 
                                data={row}
                                trigger={
                                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                                    <Eye className="h-3 w-3" />
                                    View
                                  </Button>
                                }
                              />
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            {filteredData.length > 0 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing {filteredData.length} {selectedTable === "cold_leads" ? "leads" : selectedTable === "workflow_results" ? "results" : "rows"}
                  {emailFilter !== "all" && ` (${tableData.length} total)`}
                  {(selectedTable === "cold_leads" || selectedTable === "workflow_results") && " - Auto-refreshing every 30 seconds"}
                </div>
                {loadingMore && (
                  <div className="text-sm text-muted-foreground">
                    Loading more...
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Database Tables
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Click on a table to view its data
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tables.map((table) => (
          <Card 
            key={table.name} 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setSelectedTable(table.name)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className={`${table.color} p-2 rounded-lg text-white`}>
                  {table.icon}
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">
                    {table.name}
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    {table.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Key Fields:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {table.fields.slice(0, 4).map((field) => (
                    <Badge
                      key={field}
                      variant="secondary"
                      className="text-xs font-mono"
                    >
                      {field}
                    </Badge>
                  ))}
                  {table.fields.length > 4 && (
                    <Badge variant="secondary" className="text-xs">
                      +{table.fields.length - 4} more
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DatabaseTables;
