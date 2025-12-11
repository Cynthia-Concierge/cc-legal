import dotenv from "dotenv";
import { EmailService } from "./server/services/emailService";

dotenv.config();

const apiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.EMAIL_FROM_ADDRESS || "onboarding@resend.dev";
const testEmail = "rickibodner@gmail.com"; // Must match Resend account email for testing

if (!apiKey) {
    console.error("❌ RESEND_API_KEY is not set in .env");
    process.exit(1);
}

console.log(`📧 Testing Resend integration...`);
console.log(`From: ${fromEmail}`);
console.log(`To: ${testEmail}`);

const emailService = new EmailService(apiKey, fromEmail);

async function test() {
    try {
        const result = await emailService.sendWelcomeEmail(testEmail, "Ricki");
        console.log("✅ Email sent successfully:", result);
    } catch (error) {
        console.error("❌ Failed to send email:", error);
    }
}

test();
