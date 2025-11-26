# Testing Guide: Instantly.ai Integration

## ✅ Setup Checklist

Before testing, make sure you have:

1. **Environment Variables** - Check your `.env` file has:
   ```
   INSTANTLY_AI_API_KEY=your_api_key_here
   VITE_INSTANTLY_CAMPAIGN_ID=7f93b98c-f8c6-4c2b-b707-3ea4d0df6934
   ```

2. **Server Running** - The backend server needs to be running

3. **Instantly.ai Account** - You need a valid API key and campaign ID

---

## 🧪 Testing Methods

### Method 1: Using the Test Script (Recommended)

#### Option A: Node.js Script
```bash
# Make sure server is running first
npm run server

# In another terminal, run:
node test-instantly-api.js
```

#### Option B: Bash Script
```bash
# Make sure server is running first
npm run server

# In another terminal, run:
./test-instantly-api.sh
```

#### Custom API URL or Campaign ID:
```bash
node test-instantly-api.js http://localhost:3001 your-campaign-id-here
./test-instantly-api.sh http://localhost:3001 your-campaign-id-here
```

---

### Method 2: Using cURL

```bash
# Test health endpoint
curl http://localhost:3001/health

# Test add-lead endpoint
curl -X POST http://localhost:3001/api/add-lead \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "campaignId": "7f93b98c-f8c6-4c2b-b707-3ea4d0df6934",
    "leadData": {
      "first_name": "Test",
      "last_name": "User",
      "phone": "(555) 123-4567",
      "website": "https://testwebsite.com"
    }
  }'
```

---

### Method 3: Using the Frontend Form

1. Start both frontend and backend:
   ```bash
   npm run dev
   ```

2. Open your browser to `http://localhost:8080`

3. Fill out the form with test data:
   - Name: Test User
   - Email: test@example.com (use a real email to test Instantly.ai)
   - Phone: (555) 123-4567
   - Website: testwebsite.com

4. Submit the form

5. Check:
   - Browser console for any errors
   - Server logs for API calls
   - Instantly.ai dashboard to see if the lead was added

---

### Method 4: Using Postman or Insomnia

**POST** `http://localhost:3001/api/add-lead`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "test@example.com",
  "campaignId": "7f93b98c-f8c6-4c2b-b707-3ea4d0df6934",
  "leadData": {
    "first_name": "Test",
    "last_name": "User",
    "phone": "(555) 123-4567",
    "website": "https://testwebsite.com"
  }
}
```

---

## 🔍 What to Check

### ✅ Success Indicators

1. **Server Response:**
   ```json
   {
     "success": true,
     "data": { ... }
   }
   ```

2. **Server Logs:**
   - No error messages
   - Successful API call logged

3. **Instantly.ai Dashboard:**
   - Lead appears in your campaign
   - Lead status is "Active" or "Pending"

### ❌ Common Issues

1. **401 Unauthorized**
   - Check `INSTANTLY_AI_API_KEY` in `.env`
   - Verify the API key is valid in Instantly.ai

2. **400 Bad Request**
   - Check campaign ID format (should be UUID)
   - Verify email format is valid
   - Check required fields are present

3. **500 Server Error**
   - Check server logs for detailed error
   - Verify Instantly.ai service is accessible
   - Check network connectivity

4. **Connection Refused**
   - Make sure server is running: `npm run server`
   - Check port 3001 is not in use

---

## 🚀 Quick Start Testing

```bash
# Terminal 1: Start the server
npm run server

# Terminal 2: Run the test
node test-instantly-api.js

# Or test via the frontend
npm run dev
# Then open http://localhost:8080
```

---

## 📝 Expected Flow

1. User submits form → Frontend sends data to `/api/add-lead`
2. Server validates request → Calls `InstantlyService.addLeadToCampaign()`
3. InstantlyService → Makes API call to Instantly.ai
4. Instantly.ai → Adds lead to campaign
5. Response → Returns success/error to frontend
6. Frontend → Shows thank you page (even if API fails)

---

## 🐛 Debugging Tips

1. **Check Environment Variables:**
   ```bash
   # In server directory, verify .env is loaded
   node -e "require('dotenv').config(); console.log(process.env.INSTANTLY_AI_API_KEY ? 'API Key found' : 'API Key missing')"
   ```

2. **Enable Verbose Logging:**
   - Check server console output
   - Check browser console for frontend errors

3. **Test Instantly.ai API Directly:**
   ```bash
   curl -X POST https://api.instantly.ai/api/v1/lead/add \
     -H "Content-Type: application/json" \
     -H "X-Api-Key: YOUR_API_KEY" \
     -d '{
       "email": "test@example.com",
       "campaign_id": "YOUR_CAMPAIGN_ID"
     }'
   ```

---

## ✅ Ready to Go Checklist

- [ ] `.env` file has `INSTANTLY_AI_API_KEY`
- [ ] Campaign ID is set (in `.env` or hardcoded)
- [ ] Server starts without errors
- [ ] Health endpoint returns 200
- [ ] Test script runs successfully
- [ ] Lead appears in Instantly.ai dashboard

