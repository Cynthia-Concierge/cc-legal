import { useState } from "react";
import { CheckCircle, Download, FolderDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import DynamicBackground from "@/components/DynamicBackground";
import { useNavigate } from "react-router-dom";
import JSZip from "jszip";

const TEMPLATES_DRIVE_LINK = "https://drive.google.com/drive/folders/1zMJGH7KLXguT_yl86hT0Qccx-UT9Bcyi?usp=sharing";

const TEMPLATE_FILES = [
  { url: "/wellness-legal-templates/Employment-Agreement.docx", name: "Employment Agreement.docx" },
  { url: "/wellness-legal-templates/Independent-Contractor-Agreement.docx", name: "Independent Contractor Agreement.docx" },
  { url: "/wellness-legal-templates/Service-Agreement-Membership-Contract.docx", name: "Service Agreement & Membership Contract.docx" },
  { url: "/wellness-legal-templates/Terms-Conditions-Privacy-Policy-Disclaimer.docx", name: "Terms & Conditions, Privacy Policy, Disclaimer (Website + Services).docx" },
];

const ThankYou = () => {
  const navigate = useNavigate();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleOpenDriveFolder = () => {
    window.open(TEMPLATES_DRIVE_LINK, "_blank", "noopener,noreferrer");
  };

  const handleDownloadFolder = async () => {
    setIsDownloading(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder("Wellness Legal Templates");
      if (!folder) throw new Error("Could not create zip folder");

      for (const file of TEMPLATE_FILES) {
        const res = await fetch(file.url);
        if (!res.ok) throw new Error(`Failed to fetch ${file.name}`);
        const blob = await res.blob();
        folder.file(file.name, blob);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(zipBlob);
      link.download = "Wellness Legal Templates.zip";
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <DynamicBackground />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-gradient-to-r from-teal-500 to-emerald-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-teal-500 to-emerald-600 bg-clip-text text-transparent">
            Thank you — you're in!
          </h1>
          <p className="text-xl mb-8 text-gray-700">
            Your free legal templates are ready. Download the folder with all agreements or open them in Google Drive.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
            <Button
              onClick={handleDownloadFolder}
              disabled={isDownloading}
              className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold py-4 px-8 text-lg hover:from-teal-400 hover:to-emerald-500 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              <FolderDown className="h-6 w-6" />
              {isDownloading ? "Preparing zip..." : "Download folder (all agreements)"}
            </Button>
            <Button
              variant="outline"
              onClick={handleOpenDriveFolder}
              className="border-teal-500 text-teal-700 font-semibold py-4 px-8 text-lg hover:bg-teal-50 flex items-center justify-center gap-2"
            >
              <Download className="h-6 w-6" />
              Open in Google Drive
            </Button>
          </div>

          <p className="text-sm text-gray-500 mb-8">
            Employment Agreement, Independent Contractor Agreement, Service Agreement, Terms &amp; Conditions, Privacy Policy, and more.
          </p>

          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-gray-600 hover:text-gray-900"
          >
            Return to home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ThankYou;



