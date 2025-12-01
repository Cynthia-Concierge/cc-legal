import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  FileText, 
  Database, 
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
      fields: ["website_url", "analysis", "email_subject", "email_body", "legal_documents"],
    },
    {
      name: "cold_leads",
      description: "Cold leads imported from Instantly or CSV files",
      icon: <Database className="h-5 w-5" />,
      color: "bg-emerald-500",
      fields: ["first_name", "last_name", "company", "location", "linkedin_url", "email_1", "email_2"],
    },
  ]);

  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<TableData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [limit] = useState(20);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 
    (import.meta.env.DEV ? "" : "http://localhost:3001");

  const fetchTableData = async (tableName: string, pageNum: number = 0) => {
    setLoading(true);
    setError(null);
    try {
      let response;
      const offset = pageNum * limit;

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
      setTableData(data);
      
      if (data.length === 0 && page === 0) {
        console.log(`No data found for table: ${tableName}`, result);
      }
    } catch (err: any) {
      console.error(`Error fetching ${tableName}:`, err);
      setError(err.message || "Failed to fetch table data");
      setTableData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTable) {
      fetchTableData(selectedTable, page);
    }
  }, [selectedTable, page]);

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "object") {
      return JSON.stringify(value).substring(0, 50) + "...";
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
    if (tableData.length === 0) return [];
    
    // Get all headers from first row, prioritize important fields
    const allKeys = Object.keys(tableData[0]);
    const table = tables.find(t => t.name === tableName);
    
    // Sort: put important fields first, then others
    const importantFields = table?.fields || [];
    const sortedKeys = [
      ...allKeys.filter(key => importantFields.some(f => key.includes(f))),
      ...allKeys.filter(key => !importantFields.some(f => key.includes(f)))
    ];
    
    return sortedKeys.slice(0, 10); // Show up to 10 columns
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
                setPage(0);
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
            onClick={() => fetchTableData(selectedTable, page)}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

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
            ) : error ? (
              <div className="text-center py-8">
                <div className="text-red-500 mb-2">{error}</div>
                <div className="text-sm text-muted-foreground">
                  Check the browser console for more details
                </div>
              </div>
            ) : tableData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No data found</p>
                <p className="text-xs mt-2">This table may be empty or the data may not be accessible</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {headers.map((header) => (
                        <TableHead key={header} className="font-semibold">
                          {header.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableData.map((row, idx) => (
                      <TableRow key={row.id || idx}>
                        {headers.map((header) => (
                          <TableCell key={header} className="max-w-[200px] truncate">
                            {header.includes("date") || header.includes("created_at") || header.includes("updated_at") || header.includes("imported_at")
                              ? formatDate(row[header])
                              : formatValue(row[header])}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {tableData.length > 0 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing {page * limit + 1} - {Math.min((page + 1) * limit, tableData.length)} of {tableData.length}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0 || loading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={tableData.length < limit || loading}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
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
