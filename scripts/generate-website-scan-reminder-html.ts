import { render } from "@react-email/render";
import { WebsiteScanReminderEmail } from "../src/emails/WebsiteScanReminderEmail";
import * as fs from "fs";
import * as path from "path";

// Ensure dist directory exists
const distDir = path.resolve(process.cwd(), "dist");
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
}

const html = await render(WebsiteScanReminderEmail({ 
    name: 'Ricki',
    scanLink: 'https://cynthiaconcierge.com/wellness/dashboard'
}), {
    pretty: true,
});

console.log("HTML Generated!");
const outputPath = path.resolve(distDir, "website-scan-reminder-email.html");
fs.writeFileSync(outputPath, html);
console.log(`Saved to ${outputPath}`);

