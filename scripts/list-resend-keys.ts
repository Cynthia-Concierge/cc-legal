import { Resend } from 'resend';
import 'dotenv/config';

async function listKeys() {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
        console.error("No RESEND_API_KEY found in environment variables.");
        return;
    }

    console.log(`Using API Key from .env: ${apiKey.substring(0, 8)}...`);

    try {
        const resend = new Resend(apiKey);
        const { data: keys, error } = await resend.apiKeys.list();

        if (error) {
            console.error("Error listing keys:", error);
            return;
        }

        if (keys) {
            console.log("\n--- API Response ---");
            console.log(JSON.stringify(keys, null, 2));
            console.log("\nNOTE: The actual secret key (re_...) is NOT returned by the API for security reasons.");
            console.log("If you created a new key specifically for Supabase and didn't save it, you cannot retrieve it.");
            console.log("You should create a new one or use the existing one from your .env file.");
        }
    } catch (err: any) {
        console.error("Exception:", err.message);
    }
}

listKeys();
