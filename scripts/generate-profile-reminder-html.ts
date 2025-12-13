import { render } from "@react-email/render";
import { ProfileCompletionReminderEmail } from "../src/emails/ProfileCompletionReminderEmail";
import * as fs from "fs";
import * as path from "path";

// Ensure dist directory exists
const distDir = path.resolve(process.cwd(), "dist");
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
}

const html = await render(ProfileCompletionReminderEmail({ 
    name: 'Ricki',
    profileLink: 'https://cynthiaconcierge.com/wellness/dashboard/profile'
}), {
    pretty: true,
});

console.log("HTML Generated!");
const outputPath = path.resolve(distDir, "profile-completion-reminder-email.html");
fs.writeFileSync(outputPath, html);
console.log(`Saved to ${outputPath}`);

