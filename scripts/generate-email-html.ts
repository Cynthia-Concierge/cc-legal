import { render } from "@react-email/render";
import { WelcomeEmail } from "../src/emails/WelcomeEmail";
import * as fs from "fs";
import * as path from "path";

// Ensure dist directory exists
const distDir = path.resolve(process.cwd(), "dist");
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
}

const html = await render(WelcomeEmail({ name: 'Ricki' }), {
    pretty: true,
});

console.log("HTML Generated!");
const outputPath = path.resolve(distDir, "email-template.html");
fs.writeFileSync(outputPath, html);
console.log(`Saved to ${outputPath}`);
