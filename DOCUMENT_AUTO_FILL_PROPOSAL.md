# Document Auto-Fill System - Proposal

## Current State

**What You Have Now:**
- ✅ PDF templates (static documents)
- ✅ AI document generation (creates custom docs from scratch using OpenAI)
- ✅ Basic profile data: business name, type, services, etc.
- ❌ No template auto-fill (PDFs can't be edited programmatically)

**The Problem:**
- Users download static PDFs that require manual editing
- AI generation creates new docs but lacks legal precision of lawyer-drafted templates
- No way to automatically populate specific fields in your templates

---

## What Additional Fields Would You Need?

To fully customize legal agreements, you'd need these fields in your Business Profile:

### 1. **Legal Entity Information** (CRITICAL)
```typescript
{
  // Legal Identity
  legalEntityName: string;           // "Zen Yoga LLC" (vs "Zen Yoga Studio")
  entityType: string;                // LLC, Corporation, Sole Proprietorship, Partnership
  stateOfFormation: string;          // California, New York, etc.
  businessAddress: string;           // Physical address for legal notices

  // Contact
  phone: string;
  email: string;
  ownerName: string;                 // Legal name of owner/representative
}
```

### 2. **Operational Details** (HIGH PRIORITY)
```typescript
{
  // Location & Services
  servicesDescription: string;       // Detailed description of what you offer
  locationTypes: string[];           // ["Studio", "Client's home", "Outdoor", "Virtual"]

  // Policies
  cancellationPolicy: string;        // "24 hours notice required"
  refundPolicy: string;              // "Full refund if cancelled 48hrs before"
  latePolicyMinutes: number;         // 15 minutes = class forfeited

  // Pricing
  hasClassPackages: boolean;
  hasMemberships: boolean;
  acceptsDropIns: boolean;
}
```

### 3. **Liability & Insurance** (MEDIUM PRIORITY)
```typescript
{
  // Insurance
  hasInsurance: boolean;
  insuranceProvider?: string;        // "State Farm", optional
  insuranceAmount?: string;          // "$1M/$2M", optional

  // Liability Specifics
  requiresMedicalClearance: boolean; // Do clients need doctor approval?
  minorConsent: boolean;            // Do you serve minors?
  minAgeRequirement?: number;       // 18, 16, etc.
}
```

### 4. **Digital & Content** (MEDIUM PRIORITY)
```typescript
{
  // Website & Online
  websiteURL: string;
  socialMediaHandles: string[];     // ["@instagram", "@facebook"]
  dataCollectionDescription: string; // "We collect emails and payment info"

  // Content Usage
  contentUsageRights: string;       // "All content is client's, we just host it"
  photoVideoUsage: string;          // "Used for marketing with consent"
}
```

### 5. **Staff & Contractors** (LOW PRIORITY - only if relevant)
```typescript
{
  // Employment
  numberOfW2Employees?: number;
  numberOfContractors?: number;
  paymentStructure?: string;        // "Hourly", "Per class", "Commission"
}
```

---

## Auto-Fill System Options

There are **3 approaches** to auto-filling legal documents:

### Option 1: **PDF Form Auto-Fill** (RECOMMENDED - Easiest)

**How It Works:**
1. Convert your PDF templates to **fillable PDFs** with form fields
2. Use a library like `pdf-lib` or `PDFtron` to populate fields programmatically
3. Generate personalized PDF on-demand

**Example Fields in PDF:**
- `{{business_name}}` → "Zen Yoga Studio"
- `{{owner_name}}` → "Jane Smith"
- `{{address}}` → "123 Main St, San Francisco, CA"
- `{{cancellation_policy}}` → "24 hours notice required"

**Implementation:**
```typescript
import { PDFDocument } from 'pdf-lib';

async function fillPdfTemplate(templatePath: string, userData: BusinessProfile) {
  // Load the PDF template
  const pdfDoc = await PDFDocument.load(templatePath);
  const form = pdfDoc.getForm();

  // Fill in the fields
  form.getTextField('business_name').setText(userData.businessName);
  form.getTextField('owner_name').setText(userData.ownerName);
  form.getTextField('address').setText(userData.businessAddress);
  form.getTextField('cancellation_policy').setText(userData.cancellationPolicy);

  // Flatten form so it can't be edited
  form.flatten();

  // Return filled PDF
  return await pdfDoc.save();
}
```

**Pros:**
- ✅ Legal precision (lawyer-drafted templates stay intact)
- ✅ Easy to implement
- ✅ PDFs are universally compatible
- ✅ Can digitally sign PDFs

**Cons:**
- ❌ Requires converting templates to fillable PDFs (one-time setup)
- ❌ Less flexible than full AI generation

---

### Option 2: **Template String Replacement** (SIMPLE - Good for basic docs)

**How It Works:**
1. Store templates as **text files** or **HTML** with placeholders
2. Replace `{{field_name}}` with actual data
3. Generate PDF or Word doc from filled template

**Example Template (Markdown/HTML):**
```markdown
# WAIVER AND RELEASE OF LIABILITY

This Waiver and Release of Liability ("Waiver") is entered into on {{date}}
by and between {{business_name}}, located at {{business_address}} ("Provider"),
and the undersigned participant ("Participant").

## SERVICES PROVIDED
{{business_name}} provides the following services: {{services_description}}

## ASSUMPTION OF RISK
The Participant acknowledges that participation in {{service_type}} activities
involves inherent risks including, but not limited to, physical injury...

## CANCELLATION POLICY
{{cancellation_policy}}

## REFUND POLICY
{{refund_policy}}

---
**Provider:** {{business_name}}
**Owner/Representative:** {{owner_name}}
**Address:** {{business_address}}
**Phone:** {{phone}}
**Email:** {{email}}
```

**Implementation:**
```typescript
function fillTemplate(template: string, data: BusinessProfile): string {
  let filled = template;

  // Replace all placeholders
  filled = filled.replace('{{business_name}}', data.businessName);
  filled = filled.replace('{{owner_name}}', data.ownerName);
  filled = filled.replace('{{services_description}}', data.servicesDescription);
  filled = filled.replace('{{cancellation_policy}}', data.cancellationPolicy);
  filled = filled.replace('{{date}}', new Date().toLocaleDateString());
  // ... etc

  return filled;
}

// Then convert to PDF
import { jsPDF } from 'jspdf';
const doc = new jsPDF();
doc.text(filled, 10, 10);
doc.save('waiver.pdf');
```

**Pros:**
- ✅ Very simple to implement
- ✅ Easy to edit templates
- ✅ Can generate multiple formats (PDF, Word, HTML)

**Cons:**
- ❌ Formatting can be tricky
- ❌ Less professional than fillable PDFs
- ❌ Need to re-template all existing PDFs

---

### Option 3: **Hybrid: AI + Template** (BEST OF BOTH WORLDS)

**How It Works:**
1. Use your lawyer-drafted templates as **base structure**
2. Use AI to generate **variable sections** based on user profile
3. Combine template + AI-generated content

**Example:**
```typescript
async function generateCustomWaiver(userData: BusinessProfile) {
  // Fixed template sections (lawyer-drafted)
  const baseTemplate = `
    # WAIVER AND RELEASE OF LIABILITY

    This Waiver is entered into on {{date}} by {{business_name}}

    ## STANDARD CLAUSES
    [Lawyer-drafted standard clauses here]
  `;

  // AI-generated custom sections
  const aiPrompt = `
    Generate a specific "Assumption of Risk" clause for a ${userData.businessType}
    that offers: ${userData.services.join(', ')}
    ${userData.hasPhysicalMovement ? 'Includes physical movement activities.' : ''}
    ${userData.isOffsiteOrInternational ? 'Includes offsite/international activities.' : ''}
  `;

  const aiGeneratedRisk = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: aiPrompt }]
  });

  // Combine fixed template + AI content
  return baseTemplate
    .replace('{{date}}', new Date().toLocaleDateString())
    .replace('{{business_name}}', userData.businessName)
    + '\n## ASSUMPTION OF RISK\n' + aiGeneratedRisk.choices[0].message.content;
}
```

**Pros:**
- ✅ Legal precision for critical clauses
- ✅ Flexibility for customization
- ✅ Best user experience

**Cons:**
- ❌ More complex to implement
- ❌ Requires careful prompt engineering

---

## Recommended Implementation Plan

### Phase 1: Collect Missing Fields (Week 1)
1. Add new fields to Business Profile form:
   - Legal entity name & type
   - Owner name
   - Business address
   - Phone & email
   - Cancellation policy (dropdown or text)
   - Refund policy (dropdown or text)
2. Update database schema
3. Update GoHighLevel sync if needed

### Phase 2: Convert Templates to Fillable PDFs (Week 2)
1. Open each PDF in Adobe Acrobat or PDFtron
2. Add form fields with names matching your data model:
   - `business_name`
   - `owner_name`
   - `business_address`
   - etc.
3. Test filling manually

### Phase 3: Build Auto-Fill System (Week 3)
1. Install `pdf-lib`: `npm install pdf-lib`
2. Create a document generation service:
   ```typescript
   // /server/services/documentGenerationService.ts
   export async function generateFilledDocument(
     templateId: string,
     userData: BusinessProfile
   ): Promise<Buffer> {
     // Load template
     // Fill fields
     // Return PDF buffer
   }
   ```
3. Create API endpoint: `POST /api/documents/generate`
4. Update frontend to call this endpoint instead of downloading static PDF

### Phase 4: Add Client Signature (Week 4)
1. Allow clients to e-sign documents
2. Use `pdf-lib` to add signature image
3. Store signed documents in Supabase storage

---

## User Experience Flow

**Before (Current):**
1. User selects document
2. Downloads static PDF
3. Manually fills in business name, address, etc.
4. Prints and signs

**After (Auto-Fill):**
1. User selects document
2. Reviews pre-filled document with their info
3. Clicks "Generate" → instant personalized PDF
4. Can send to client for e-signature
5. Signed doc auto-saved to their vault

---

## Cost Estimate

- **Option 1 (PDF Fill):** ~$0/document (just server processing)
- **Option 2 (Template Replace):** ~$0/document
- **Option 3 (AI Hybrid):** ~$0.02-0.05/document (OpenAI API cost)

---

## Legal Considerations

⚠️ **Important:**
- Auto-filled documents should still be reviewed by a lawyer
- Add disclaimer: "This is a template. Consult an attorney for your specific situation."
- Some states have specific requirements for waivers (e.g., font size, bold text)
- E-signatures are legally binding in most jurisdictions (ESIGN Act)

---

## Next Steps

1. ✅ Review this proposal
2. ⬜ Decide which fields to add to Business Profile
3. ⬜ Choose implementation approach (Option 1 recommended)
4. ⬜ Convert 1-2 templates to fillable PDFs as proof of concept
5. ⬜ Build document generation service
6. ⬜ Add e-signature capability (optional)

**Estimated Development Time:**
- Basic auto-fill (Option 1): 2-3 weeks
- Template replace (Option 2): 1-2 weeks
- Hybrid AI (Option 3): 3-4 weeks

Would you like me to start implementing any of these options?
