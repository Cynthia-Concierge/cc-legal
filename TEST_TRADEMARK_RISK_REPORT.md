# Testing Trademark Risk Report Flow Locally

This guide will help you test the complete trademark risk report flow locally without needing Firebase emulators.

## ✅ What You Need

You **do NOT need Firebase emulators** for local testing. The endpoint is available in the local server (`server/index.ts`).

## 📋 Prerequisites

1. **Environment Variables** - Make sure your `.env` file has:
   ```bash
   # Supabase (required for database operations)
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Optional but recommended

   # Resend (required for sending emails)
   RESEND_API_KEY=your_resend_api_key
   EMAIL_FROM_ADDRESS=your_verified_email@yourdomain.com

   # Puppeteer (for PDF generation - usually works out of the box)
   # No additional config needed
   ```

2. **Database Tables** (optional but recommended):
   - `trademark_requests` table (for storing requests)
   - `legal_timeline` table (for event tracking - optional)

## 🚀 Step-by-Step Testing

### 1. Start the Local Development Server

```bash
# This starts both frontend (Vite) and backend (Express) servers
npm run dev
```

This will:
- Start the backend server on `http://localhost:3001`
- Start the frontend dev server on `http://localhost:5173`
- Proxy `/api/*` requests from frontend to backend

### 2. Test the Flow

1. **Open the app** in your browser: `http://localhost:5173`

2. **Navigate to the Wellness Dashboard** where the trademark quiz widget is located

3. **Start the Quiz**:
   - Click on the "Is Your Brand Name Protected?" widget
   - Click "Start Brand Protection Quiz"
   - Answer all 4 questions

4. **Submit the Request**:
   - After completing the quiz, you'll see your risk score
   - Click "Get My Trademark Risk Report"
   - Enter your business name
   - Click "Send Me The Report"

5. **Check the Results**:
   - **Console logs**: Check your terminal for:
     ```
     [Trademark] Received request for: YourBusinessName (your@email.com)
     [Trademark] PDF generated successfully, size: XXXX
     [EmailService] Sending trademark risk report: ...
     ```
   - **Email**: Check the email address you used (should receive the risk report with PDF attachment)
   - **Database**: Check Supabase dashboard for:
     - Entry in `trademark_requests` table
     - Entry in `legal_timeline` table (if it exists)

### 3. Verify PDF Generation

The PDF should be:
- **3 pages** with proper formatting
- **Contains your business name** and risk score
- **Includes risk factors** based on your quiz answers
- **Has proper disclaimers** on page 1

### 4. Test Edge Cases

Test these scenarios:

**Missing Business Name:**
```bash
curl -X POST http://localhost:3001/api/trademarks/request \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "name": "Test User"}'
```
Should return: `400 Bad Request` with error message

**Missing Email:**
```bash
curl -X POST http://localhost:3001/api/trademarks/request \
  -H "Content-Type: application/json" \
  -d '{"businessName": "Test Business", "name": "Test User"}'
```
Should return: `400 Bad Request` with error message

**Valid Request:**
```bash
curl -X POST http://localhost:3001/api/trademarks/request \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test-user-id",
    "email": "your-email@example.com",
    "name": "Test User",
    "businessName": "Test Business",
    "score": 8,
    "riskLevel": "MODERATE RISK",
    "answers": [5, 3, 2, 1]
  }'
```

## 🔍 Debugging Tips

### PDF Generation Fails

If PDF generation fails, check:
1. **Puppeteer installation**: `npm list puppeteer`
2. **Console errors**: Look for Puppeteer launch errors
3. **Template path**: Verify `server/templates/html/trademark_risk_report.html` exists

**Common fix:**
```bash
# Reinstall puppeteer if needed
npm install puppeteer
```

### Email Not Sending

If emails aren't sending:
1. **Check Resend API key**: Verify it's set in `.env`
2. **Check email address**: Must be verified in Resend dashboard
3. **Check console**: Look for Resend API errors
4. **Test Resend connection**:
   ```bash
   npm run check-resend-config
   ```

### Database Errors

If you see database errors:
1. **Check Supabase connection**: Verify URL and keys in `.env`
2. **Check table exists**: Run SQL to create `trademark_requests` table if needed
3. **RLS policies**: Make sure service role key is set (bypasses RLS)

**Create trademark_requests table (if missing):**
```sql
CREATE TABLE IF NOT EXISTS trademark_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  business_name TEXT NOT NULL,
  quiz_score INTEGER,
  risk_level TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## 📧 Email Testing

To test emails without sending real ones:

1. **Use Resend's test mode** (if available)
2. **Use a test email service** like Mailtrap
3. **Check Resend dashboard** for sent emails and delivery status

## 🎯 Expected Behavior

When everything works correctly:

1. ✅ Quiz completes and shows risk score
2. ✅ Form submission sends request to `/api/trademarks/request`
3. ✅ PDF is generated (check console for "PDF generated successfully")
4. ✅ Email is sent with PDF attachment (check Resend dashboard)
5. ✅ Database entry is created (check Supabase)
6. ✅ Event is logged (if `legal_timeline` table exists)
7. ✅ Success message shows in UI
8. ✅ Widget updates to show "Trademark Risk Report Sent"

## 🚨 Common Issues & Solutions

### Issue: "PDF generation failed"
**Solution**: Check Puppeteer is installed and template file exists

### Issue: "Email service error"
**Solution**: Verify RESEND_API_KEY and EMAIL_FROM_ADDRESS in `.env`

### Issue: "Database error"
**Solution**: Check Supabase credentials and table existence

### Issue: "Template not found"
**Solution**: Verify `server/templates/html/trademark_risk_report.html` exists

## 📝 Testing Checklist

- [ ] Backend server starts without errors
- [ ] Frontend connects to backend (check network tab)
- [ ] Quiz completes successfully
- [ ] Risk score calculates correctly
- [ ] PDF generates (check console logs)
- [ ] Email sends with PDF attachment
- [ ] Database entry is created
- [ ] Event is logged (if table exists)
- [ ] UI shows success message
- [ ] Widget updates correctly

## 🔄 Next Steps After Testing

Once local testing is successful:

1. **Deploy to Firebase Functions** (if using Firebase):
   ```bash
   cd functions
   npm run build
   firebase deploy --only functions
   ```

2. **Update frontend API URL** for production:
   - Set `VITE_API_URL` to your production API URL
   - Or use Firebase Functions URL

3. **Test in production** with a real email address

## 💡 Pro Tips

- **Use console.log**: The code has extensive logging - check terminal output
- **Test with real email**: Use your own email to verify PDF attachment works
- **Check file sizes**: PDF should be ~50-200KB depending on content
- **Verify PDF content**: Open the attached PDF to ensure formatting is correct

