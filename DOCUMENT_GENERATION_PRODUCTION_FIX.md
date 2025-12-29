# Document Generation Production Fix

## Problem
Legal document generation was working locally but not in production (Firebase Functions).

## Root Causes Identified

### 1. Missing Placeholders
The production version (`functions/src/documentGenerationService.ts`) was missing several placeholder replacements that exist in the local version:
- `{{LegalEntityName}}`, `{{EntityType}}`, `{{State}}`, `{{OwnerName}}`, `{{Phone}}`, `{{Website}}`, `{{Instagram}}`, `{{Services}}`
- Lead magnet placeholders: `{{riskIcon}}`, `{{riskClass}}`, `{{urgencyMessage}}`, `{{totalConflicts}}`, `{{conflictsSection}}`, `{{year}}`

### 2. Missing Methods
- `generateHtmlOnly()` method was missing from production version
- Helper methods `getRiskIconFromLevel()` and `getUrgencyMessageFromLevel()` were missing

### 3. Puppeteer Configuration
Puppeteer in Firebase Functions needs additional Chrome arguments for proper execution in the serverless environment.

### 4. Missing Endpoint
The `/api/documents/generate-html` endpoint was missing from the production Firebase Functions code.

## Fixes Applied

### 1. Updated `functions/src/documentGenerationService.ts`

**Added missing placeholders:**
- All uppercase placeholders (`{{LegalEntityName}}`, etc.)
- Lead magnet placeholders (`{{riskIcon}}`, etc.)
- `{{year}}` placeholder

**Added missing methods:**
- `generateHtmlOnly()` - Generates HTML without PDF conversion
- `getRiskIconFromLevel()` - Helper for risk level icons
- `getUrgencyMessageFromLevel()` - Helper for urgency messages

**Enhanced Puppeteer configuration:**
```typescript
const browser = await puppeteer.launch({
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
    ],
    headless: true,
    timeout: 30000
});
```

**Improved error handling:**
- Added detailed logging for template path resolution
- Added `__dirname` logging to help debug path issues
- Enhanced error messages with stack traces

### 2. Updated `functions/src/index.ts`

**Added missing endpoint:**
- `/api/documents/generate-html` - Generates HTML version of documents for copy-as-text feature

### 3. Enhanced BusinessProfileData Interface

Added missing fields:
- `riskIcon`, `riskClass`, `urgencyMessage`, `totalConflicts`, `conflictsSection`
- `[key: string]: any` for dynamic fields

## Deployment Steps

1. **Build the functions:**
   ```bash
   cd functions
   npm run build
   ```

2. **Verify templates are copied:**
   ```bash
   ls -la functions/lib/templates/html/
   ```
   Should show all HTML template files.

3. **Deploy to Firebase:**
   ```bash
   firebase deploy --only functions
   ```

## Verification

After deployment, test document generation:

1. **Test PDF generation:**
   ```bash
   curl -X POST https://YOUR_PROJECT.cloudfunctions.net/api/documents/generate \
     -H "Content-Type: application/json" \
     -d '{"templateName": "social_media_disclaimer", "userId": "USER_ID"}' \
     -o test.pdf
   ```

2. **Test HTML generation:**
   ```bash
   curl -X POST https://YOUR_PROJECT.cloudfunctions.net/api/documents/generate-html \
     -H "Content-Type: application/json" \
     -d '{"templateName": "social_media_disclaimer", "userId": "USER_ID"}'
   ```

3. **Check Firebase Functions logs:**
   ```bash
   firebase functions:log
   ```
   Look for `[DocGen]` log messages to verify template paths and generation process.

## Key Differences: Local vs Production

### Local Development
- Templates: `server/templates/html/`
- Path resolution: `path.join(__dirname, '../templates/html', ...)`
- Puppeteer: Basic args (`--no-sandbox`, `--disable-setuid-sandbox`)

### Production (Firebase Functions)
- Templates: `lib/templates/html/` (copied during build)
- Path resolution: `path.join(__dirname, 'templates/html', ...)`
- Puppeteer: Extended args for serverless environment
- `__dirname` points to `lib/` after compilation

## Troubleshooting

If documents still fail to generate in production:

1. **Check template files exist:**
   ```bash
   ls -la functions/lib/templates/html/
   ```

2. **Check build output:**
   ```bash
   cd functions
   npm run build
   cat lib/documentGenerationService.js | grep templates
   ```

3. **Check Firebase Functions logs:**
   ```bash
   firebase functions:log --only api
   ```
   Look for `[DocGen]` messages showing template paths.

4. **Verify Puppeteer is working:**
   - Check logs for Puppeteer launch errors
   - Ensure Chrome/Chromium is available in Firebase Functions environment
   - Puppeteer should bundle Chromium automatically

## Files Modified

1. `functions/src/documentGenerationService.ts` - Complete update to match local version
2. `functions/src/index.ts` - Added `/api/documents/generate-html` endpoint

## Testing Checklist

- [x] All placeholders match between local and production
- [x] `generateHtmlOnly()` method added
- [x] Helper methods added
- [x] Puppeteer configuration enhanced
- [x] HTML generation endpoint added
- [x] Error handling improved
- [ ] Test in production after deployment
- [ ] Verify all 18 templates generate correctly
- [ ] Test with actual user data

