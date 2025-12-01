import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Sparkles, Database } from "lucide-react";
import LeadScraper from "./LeadScraper";
import WebsiteRedesign from "./WebsiteRedesign";
import DatabaseTables from "@/components/DatabaseTables";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Workflow Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage and execute different LangGraph workflows
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue="legal-analyzer" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="legal-analyzer" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Legal Analyzer
                </TabsTrigger>
                <TabsTrigger value="website-redesign" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Website Redesign
                </TabsTrigger>
                <TabsTrigger value="database" className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Database Tables
                </TabsTrigger>
              </TabsList>

              <TabsContent value="legal-analyzer" className="mt-0">
                <LeadScraper />
              </TabsContent>

              <TabsContent value="website-redesign" className="mt-0">
                <WebsiteRedesign />
              </TabsContent>

              <TabsContent value="database" className="mt-0">
                <DatabaseTables />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

