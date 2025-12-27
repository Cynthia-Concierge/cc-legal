
/**
 * Inspect Instantly.ai Lead Script (Corrected Endpoint)
 * 
 * Usage:
 * npx tsx server/scripts/inspect_instantly_lead.ts [email]
 */

import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const INSTANTLY_API_KEY = process.env.INSTANTLY_AI_API_KEY;
const TARGET_EMAIL = "natalieforstbauer@gmail.com";

async function main() {
    console.log("🚀 Inspecting Instantly.ai Lead...");

    if (!INSTANTLY_API_KEY) {
        console.error("❌ Missing INSTANTLY_AI_API_KEY");
        return;
    }

    const emailToFind = process.argv[2] || TARGET_EMAIL;
    console.log(`🔍 Looking for: ${emailToFind}`);

    // The endpoint for listing leads in a campaign in v2 is likely not "GET /campaigns/{id}/leads".
    // Let's try to verify the correct endpoint.
    // Actually, sometimes search is easier. Let's try searching for the lead.
    // Or referencing InstantlyService.ts... it only Has "add".
    // Looking at standard Instantly API docs:
    // GET /v2/leads is likely for listing workspace leads.
    // Let's try to search specifically for this email.

    // NOTE: If we can't find a search endpoint, we'll try to just ADD the lead again
    // but this time verify the RESPONSE which might contain the updated object.
    // But wait, the previous script showed the response and it didn't contain the custom variables in the response body.

    // Try: GET /api/v2/contacts (some APIs call them contacts)
    // or GET /api/v2/leads?email=...

    try {
        // Attempt: Search strictly by email across workspace
        const url = `https://api.instantly.ai/api/v2/leads?email=${encodeURIComponent(emailToFind)}`;

        // If param filter doesn't work, we'll just get the list and find it.
        // NOTE: If this returns ALL leads, it might be heavy. Limit if possible.
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${INSTANTLY_API_KEY}`,
            },
        });

        if (!response.ok) {
            // Fallback: maybe just /leads
            console.log("Specific search failed, trying general /leads list (limit 10)");
            const listUrl = `https://api.instantly.ai/api/v2/leads?limit=10`;
            const listResp = await fetch(listUrl, {
                method: "GET",
                headers: { "Authorization": `Bearer ${INSTANTLY_API_KEY}` }
            });

            if (!listResp.ok) {
                console.error(`Error listing leads: ${listResp.status}`);
                console.error(await listResp.text());
                return;
            }

            const data: any = await listResp.json();
            console.log("Sample lead keys:", Object.keys(data.data?.leads?.[0] || {}));
            return;
        }

        const data: any = await response.json();

        // In v1/v2, data structure might differ.
        // Usually { data: { leads: [...] } }

        let lead = null;
        if (data.data?.leads) {
            lead = data.data.leads.find((l: any) => l.email === emailToFind);
        } else if (Array.isArray(data)) {
            lead = data.find((l: any) => l.email === emailToFind);
        }

        if (lead) {
            console.log("✅ Found Lead!");
            console.log(JSON.stringify(lead, null, 2));

            console.log("\n--- Custom Variables Analysis ---");
            console.log("Variables present:", Object.keys(lead.custom_variables || {}));
            console.log("Values:", lead.custom_variables);

        } else {
            console.log("❌ Lead not found via search.");
            console.log("Response dump:", JSON.stringify(data, null, 2).substring(0, 500));
        }

    } catch (error) {
        console.error("Fatal Error:", error);
    }
}

main();
