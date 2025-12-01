import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  Copy, 
  Check, 
  Loader2, 
  Building2, 
  Globe,
  MessageSquare,
  Settings,
  Eye,
  Sparkles,
  Bot,
  Calendar,
  Users,
  TrendingUp,
  FileText,
  Workflow
} from "lucide-react";
import { toast } from "sonner";
import VoiceWidget from "@/components/VoiceWidget";
import LeadScraper from "./LeadScraper";
import WebsiteRedesign from "./WebsiteRedesign";

interface Business {
  id: string;
  domain: string;
  name: string;
  status: "pending" | "active" | "inactive";
  created_at: string;
  updated_at: string;
}

const BusinessWidget = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [onboarding, setOnboarding] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [newBusinessDomain, setNewBusinessDomain] = useState("");
  const [newBusinessName, setNewBusinessName] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("template");

  const API_BASE_URL = import.meta.env.VITE_API_URL || 
    (import.meta.env.DEV ? "http://localhost:3001" : "");

  // Load businesses
  const loadBusinesses = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/business`);
      if (!response.ok) throw new Error("Failed to load businesses");
      const result = await response.json();
      setBusinesses(result.data || []);
    } catch (error: any) {
      toast.error("Failed to load businesses: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBusinesses();
  }, []);

  // Onboard new business
  const handleOnboard = async () => {
    if (!newBusinessDomain.trim()) {
      toast.error("Please enter a domain");
      return;
    }

    try {
      setOnboarding(newBusinessDomain);
      const response = await fetch(`${API_BASE_URL}/api/business/onboard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: newBusinessDomain,
          name: newBusinessName || newBusinessDomain,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to onboard business");
      }

      const result = await response.json();
      toast.success(`Business "${result.data.business.name}" onboarded successfully!`);
      setNewBusinessDomain("");
      setNewBusinessName("");
      await loadBusinesses();
      setActiveTab("businesses");
    } catch (error: any) {
      toast.error("Onboarding failed: " + error.message);
    } finally {
      setOnboarding(null);
    }
  };

  // Copy business ID
  const copyBusinessId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success("Business ID copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Copy embed code
  const copyEmbedCode = (businessId: string) => {
    const embedCode = `<script src="${window.location.origin}/api/widget.js" data-business="${businessId}"></script>`;
    navigator.clipboard.writeText(embedCode);
    toast.success("Embed code copied!");
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-green-500",
      pending: "bg-yellow-500",
      inactive: "bg-gray-500",
    };
    return colors[status] || "bg-gray-500";
  };

  // Filter businesses
  const filteredBusinesses = businesses.filter(
    (b) =>
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.domain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats
  const stats = {
    total: businesses.length,
    active: businesses.filter(b => b.status === "active").length,
    pending: businesses.filter(b => b.status === "pending").length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                AI Platform Dashboard
              </h1>
              <p className="text-muted-foreground text-lg">
                Unified platform for AI booking widgets, legal analysis, and website redesign workflows
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="px-4 py-2">
                <Sparkles className="h-4 w-4 mr-2" />
                Powered by Gemini Live
              </Badge>
            </div>
          </div>

          {/* How It Works Together */}
          <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900/10 dark:via-purple-900/10 dark:to-pink-900/10 p-6 rounded-xl border-2 border-blue-200 dark:border-blue-800 mb-6">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Workflow className="h-5 w-5 text-blue-600" />
              How Everything Works Together
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">1</span>
                </div>
                <div>
                  <p className="font-medium mb-1">Website Redesign</p>
                  <p className="text-muted-foreground">Scrape and analyze websites to understand their structure</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple-600 dark:text-purple-400 font-bold">2</span>
                </div>
                <div>
                  <p className="font-medium mb-1">Business Onboarding</p>
                  <p className="text-muted-foreground">Automatically extract business data and create widget configs</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-pink-100 dark:bg-pink-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-pink-600 dark:text-pink-400 font-bold">3</span>
                </div>
                <div>
                  <p className="font-medium mb-1">AI Widget Deployment</p>
                  <p className="text-muted-foreground">Deploy voice-enabled booking widgets powered by Gemini Live</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Businesses</p>
                    <p className="text-3xl font-bold mt-1">{stats.total}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Widgets</p>
                    <p className="text-3xl font-bold mt-1">{stats.active}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending</p>
                    <p className="text-3xl font-bold mt-1">{stats.pending}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Widget Deployments</p>
                    <p className="text-3xl font-bold mt-1">{stats.active}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                    <Bot className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 mb-6 h-auto min-h-12">
            <TabsTrigger value="template" className="flex items-center gap-2 text-xs md:text-sm font-semibold py-2">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Template Widget</span>
              <span className="sm:hidden">Template</span>
            </TabsTrigger>
            <TabsTrigger value="businesses" className="flex items-center gap-2 text-xs md:text-sm font-semibold py-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Businesses ({stats.total})</span>
              <span className="sm:hidden">Businesses</span>
            </TabsTrigger>
            <TabsTrigger value="onboard" className="flex items-center gap-2 text-xs md:text-sm font-semibold py-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Onboard New</span>
              <span className="sm:hidden">Onboard</span>
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2 text-xs md:text-sm font-semibold py-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="legal-analyzer" className="flex items-center gap-2 text-xs md:text-sm font-semibold py-2">
              <FileText className="h-4 w-4" />
              <span className="hidden lg:inline">Legal Analyzer</span>
              <span className="lg:hidden">Legal</span>
            </TabsTrigger>
            <TabsTrigger value="website-redesign" className="flex items-center gap-2 text-xs md:text-sm font-semibold py-2">
              <Workflow className="h-4 w-4" />
              <span className="hidden lg:inline">Website Redesign</span>
              <span className="lg:hidden">Redesign</span>
            </TabsTrigger>
          </TabsList>

          {/* Template Widget Tab */}
          <TabsContent value="template" className="mt-0 space-y-6">
            <Card className="border-2 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <Sparkles className="h-6 w-6 text-purple-600" />
                      Template Widget
                    </CardTitle>
                    <CardDescription className="mt-2 text-base">
                      Test and interact with the template widget. This is the base widget that will be customized for each business.
                    </CardDescription>
                  </div>
                  <Badge className="bg-purple-600 text-white px-4 py-1">
                    Live Preview
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {/* Widget Info */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 p-6 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Bot className="h-5 w-5 text-blue-600" />
                      Widget Features
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                          <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium">Voice Interaction</p>
                          <p className="text-sm text-muted-foreground">Real-time voice conversations with Gemini Live</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0">
                          <Eye className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="font-medium">Visual Analysis</p>
                          <p className="text-sm text-muted-foreground">Webcam support for skin/body analysis</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                          <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="font-medium">Smart Booking</p>
                          <p className="text-sm text-muted-foreground">AI-powered appointment scheduling</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center flex-shrink-0">
                          <Users className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                          <p className="font-medium">Business-Specific</p>
                          <p className="text-sm text-muted-foreground">Automatically adapts to each business config</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border">
                    <h3 className="font-semibold text-lg mb-3">How to Test</h3>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                      <li>Look for the chat button in the bottom right corner of your screen</li>
                      <li>Click it to open the widget</li>
                      <li>Click "Start Conversation" to begin a voice chat</li>
                      <li>Try asking about services, pricing, or booking an appointment</li>
                      <li>Enable camera for visual analysis features</li>
                    </ol>
                  </div>

                  {/* Template Widget - Using a demo business ID */}
                  <div className="relative min-h-[600px] border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-xl p-8 bg-slate-50 dark:bg-slate-900/50">
                    <div className="absolute top-4 left-4">
                      <Badge variant="outline" className="bg-white dark:bg-slate-800">
                        Template Widget Preview
                      </Badge>
                    </div>
                    <div className="text-center mb-6">
                      <p className="text-sm text-muted-foreground mb-2">
                        The widget will appear in the bottom right corner
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Note: This template uses demo data. Real businesses will load their specific configuration.
                      </p>
                    </div>
                    {/* Template widget with demo config */}
                    <VoiceWidget 
                      businessId="template-demo"
                      businessConfig={{
                        businessId: "template-demo",
                        name: "Template Business",
                        domain: "template.example.com",
                        services: [
                          { name: "Consultation", description: "Initial consultation", price: 100 },
                          { name: "Treatment", description: "Full treatment session", price: 250 },
                          { name: "Follow-up", description: "Follow-up appointment", price: 150 }
                        ],
                        pricing: {
                          consultation: "$100",
                          treatment: "$250",
                          followup: "$150"
                        },
                        faqs: [
                          { question: "What services do you offer?", answer: "We offer consultations, treatments, and follow-up appointments." },
                          { question: "How do I book?", answer: "You can book through this widget or call us directly." }
                        ],
                        hours: "Monday-Friday: 9am-5pm",
                        bookingSystem: {
                          type: "mock",
                          calendar: []
                        },
                        images: {
                          logo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop"
                        }
                      }}
                      apiBaseUrl={API_BASE_URL}
                      agentName="Template Assistant"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Businesses Tab */}
          <TabsContent value="businesses" className="mt-0">
            <Card className="border-2 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">All Businesses</CardTitle>
                    <CardDescription className="mt-2">
                      Manage your AI booking widgets
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search businesses..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    <Button onClick={loadBusinesses} variant="outline" size="sm">
                      Refresh
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredBusinesses.length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">
                      {searchTerm ? "No businesses found" : "No businesses yet"}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm 
                        ? "Try adjusting your search terms" 
                        : "Onboard your first business to get started"}
                    </p>
                    {!searchTerm && (
                      <Button onClick={() => setActiveTab("onboard")} className="mt-4">
                        <Plus className="h-4 w-4 mr-2" />
                        Onboard First Business
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredBusinesses.map((business) => (
                      <Card key={business.id} className="hover:shadow-md transition-all border-2">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold">{business.name}</h3>
                                <Badge className={getStatusBadge(business.status)}>
                                  {business.status}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                                <Globe className="h-4 w-4" />
                                <span>{business.domain}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>ID: {business.id.substring(0, 8)}...</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2"
                                  onClick={() => copyBusinessId(business.id)}
                                >
                                  {copiedId === business.id ? (
                                    <Check className="h-3 w-3" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedBusiness(business);
                                  copyEmbedCode(business.id);
                                }}
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Embed Code
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedBusiness(business);
                                  setActiveTab("preview");
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Preview
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedBusiness(business)}
                              >
                                <Settings className="h-4 w-4 mr-2" />
                                Details
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onboard Tab */}
          <TabsContent value="onboard" className="mt-0">
            <Card className="border-2 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Plus className="h-6 w-6 text-green-600" />
                  Onboard New Business
                </CardTitle>
                <CardDescription className="mt-2 text-base">
                  Automatically scrape and configure a business for the AI booking widget
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="domain" className="text-base font-semibold">Domain *</Label>
                  <Input
                    id="domain"
                    placeholder="example.com"
                    value={newBusinessDomain}
                    onChange={(e) => setNewBusinessDomain(e.target.value)}
                    disabled={!!onboarding}
                    className="h-12 text-base"
                  />
                  <p className="text-sm text-muted-foreground">
                    Enter the business website domain (e.g., theskinagency.com)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-base font-semibold">Business Name (Optional)</Label>
                  <Input
                    id="name"
                    placeholder="The Skin Agency"
                    value={newBusinessName}
                    onChange={(e) => setNewBusinessName(e.target.value)}
                    disabled={!!onboarding}
                    className="h-12 text-base"
                  />
                  <p className="text-sm text-muted-foreground">
                    If not provided, the domain will be used as the name
                  </p>
                </div>
                <Button
                  onClick={handleOnboard}
                  disabled={!!onboarding || !newBusinessDomain.trim()}
                  className="w-full h-12 text-base font-semibold"
                  size="lg"
                >
                  {onboarding ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Onboarding {onboarding}...
                    </>
                  ) : (
                    <>
                      <Plus className="h-5 w-5 mr-2" />
                      Start Onboarding
                    </>
                  )}
                </Button>
                {onboarding && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                    <p className="font-semibold mb-3 text-base">Onboarding in progress:</p>
                    <ul className="list-disc list-inside space-y-2 text-sm">
                      <li>Scraping website with Firecrawl...</li>
                      <li>Capturing screenshots with Playwright...</li>
                      <li>Normalizing data with AI...</li>
                      <li>Saving configuration...</li>
                    </ul>
                    <p className="mt-4 text-xs text-muted-foreground">
                      This may take 1-2 minutes. Please don't close this page.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="mt-0">
            <Card className="border-2 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Widget Preview</CardTitle>
                <CardDescription className="mt-2 text-base">
                  Test the widget with a specific business
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="preview-business-id" className="text-base font-semibold">Select Business</Label>
                  <select
                    id="preview-business-id"
                    value={selectedBusiness?.id || ""}
                    onChange={(e) => {
                      const id = e.target.value;
                      if (id) {
                        const business = businesses.find(b => b.id === id);
                        if (business) {
                          setSelectedBusiness(business);
                        }
                      }
                    }}
                    className="w-full h-12 px-4 rounded-md border border-input bg-background text-base"
                  >
                    <option value="">Select a business...</option>
                    {businesses.map((business) => (
                      <option key={business.id} value={business.id}>
                        {business.name} ({business.domain})
                      </option>
                    ))}
                  </select>
                </div>
                {selectedBusiness && (
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-6 rounded-xl border-2 border-purple-200 dark:border-purple-800">
                    <p className="text-sm font-semibold mb-2">
                      Previewing widget for: <span className="text-purple-600 dark:text-purple-400">{selectedBusiness.name}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      The voice widget will appear in the bottom right corner. Click the microphone button to start a conversation.
                    </p>
                  </div>
                )}
                {selectedBusiness && (
                  <div className="relative min-h-[400px] border-2 border-dashed border-purple-300 dark:border-purple-700 rounded-xl p-8 bg-slate-50 dark:bg-slate-900/50">
                    <VoiceWidget 
                      businessId={selectedBusiness.id}
                      apiBaseUrl={API_BASE_URL}
                    />
                  </div>
                )}
                {!selectedBusiness && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select a business above to preview its widget</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Legal Analyzer Tab */}
          <TabsContent value="legal-analyzer" className="mt-0">
            <Card className="border-2 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <FileText className="h-6 w-6 text-blue-600" />
                  Legal Document Analyzer
                </CardTitle>
                <CardDescription className="mt-2 text-base">
                  Analyze websites for legal compliance and generate personalized outreach emails
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <LeadScraper />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Website Redesign Tab */}
          <TabsContent value="website-redesign" className="mt-0">
            <Card className="border-2 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Workflow className="h-6 w-6 text-purple-600" />
                  Website Redesign Workflow
                </CardTitle>
                <CardDescription className="mt-2 text-base">
                  Scrape, analyze, and redesign websites with AI-powered workflows
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <WebsiteRedesign />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Business Details Modal */}
        {selectedBusiness && activeTab !== "preview" && (
          <Card className="mt-6 border-2 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{selectedBusiness.name}</CardTitle>
                  <CardDescription>{selectedBusiness.domain}</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedBusiness(null)}
                >
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Business ID</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input value={selectedBusiness.id} readOnly />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyBusinessId(selectedBusiness.id)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Embed Code</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      value={`<script src="${window.location.origin}/api/widget.js" data-business="${selectedBusiness.id}"></script>`}
                      readOnly
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyEmbedCode(selectedBusiness.id)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge className={getStatusBadge(selectedBusiness.status)}>
                    {selectedBusiness.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BusinessWidget;
