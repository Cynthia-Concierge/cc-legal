# How to Get Your Instantly.ai API Key

## ⚠️ Current Issue
Your API key is returning `ERR_AUTH_FAILED`, which means it's either:
- Invalid or expired
- Not generated from the correct location
- Missing required permissions/scopes

## ✅ Steps to Get a Valid API Key

### Step 1: Log into Instantly.ai
1. Go to [https://app.instantly.ai](https://app.instantly.ai)
2. Log in with your account

### Step 2: Navigate to API Settings
1. Click on your **Profile/Settings** (usually top right)
2. Go to **Settings** → **Integrations** → **API Keys**
   - OR go to **Settings** → **API**
   - The exact path may vary slightly

### Step 3: Create a New API Key
1. Click **"Create API Key"** or **"Generate API Key"**
2. Give it a descriptive name (e.g., "CClegal Lead Integration")
3. **IMPORTANT**: Make sure to select the appropriate scopes/permissions:
   - ✅ **Leads** - Add leads to campaigns
   - ✅ **Campaigns** - Access campaign data (if needed)
4. Click **"Create"** or **"Generate"**

### Step 4: Copy the API Key
1. **Copy the entire API key immediately** - you may only see it once!
2. It should look like a base64-encoded string (similar to what you have)
3. Make sure there are no extra spaces or line breaks

### Step 5: Update Your .env File
1. Open your `.env` file
2. Replace the existing `INSTANTLY_AI_API_KEY` value:
   ```
   INSTANTLY_AI_API_KEY=your_new_api_key_here
   ```
3. **Important**: No spaces around the `=` sign
4. Save the file

### Step 6: Restart Your Server
```bash
# Stop your server (Ctrl+C)
# Then restart:
npm run server
```

### Step 7: Test Again
```bash
node test-api-key-direct.js
```

## 🔍 Alternative: Check Your Current API Key

If you think your API key should be valid, try:

1. **Verify in Instantly.ai Dashboard:**
   - Go to Settings → API Keys
   - Check if your key is still active
   - Check if it has the right permissions

2. **Test with cURL directly:**
   ```bash
   curl -X POST https://api.instantly.ai/api/v1/lead/add \
     -H "Content-Type: application/json" \
     -H "X-Api-Key: YOUR_API_KEY_HERE" \
     -d '{
       "email": "test@example.com",
       "campaign_id": "7f93b98c-f8c6-4c2b-b707-3ea4d0df6934"
     }'
   ```

3. **Check API Key Format:**
   - Should be base64-encoded
   - Usually 40-60 characters long
   - No spaces or special characters (except `=` at the end for padding)

## 📝 Common Issues

1. **Wrong Location**: Make sure you're getting the API key from Settings → API Keys, not from webhook URLs or other places
2. **Expired Key**: Some API keys expire - generate a new one
3. **Wrong Account**: Make sure you're logged into the correct Instantly.ai account
4. **Missing Permissions**: The API key needs "Leads" permission to add leads

## ✅ Once You Have a Valid Key

After updating your `.env` file and restarting the server, test with:
```bash
node test-api-key-direct.js
```

You should see:
```
✅ SUCCESS! API key is valid and lead was added.
```

