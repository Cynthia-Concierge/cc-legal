# Document Library Audit & Mapping

**Date:** 2025-12-20
**Issue:** Discrepancy between document count (showing 21) and actual usable documents (18)
**Status:** ✅ **FIXED** - All 3 problematic templates removed

---

## Executive Summary

**Problem Found:**
- System showed "21 documents" but only 18 could be properly displayed
- 3 templates (template-3, template-9, template-10) were counted but never recommended or shown
- 2 HTML files exist but aren't in the code system

**Root Cause:**
- Inconsistent mappings between `documentCountUtils.ts` (21 templates) and `LegalInventoryChecklist.tsx` (18 templates)
- Templates existed in code but were never recommended by the recommendation engine

**Fix Applied:**
- ✅ Removed template-3, template-9, template-10 from all code files
- ✅ Updated template counts from 21→18 in all files
- ✅ All files now consistent with 18 working templates

---

## Document Inventory

### All 21 Templates in Code (ALL_TEMPLATES)

| # | Template ID | Name | HTML File | Status |
|---|------------|------|-----------|--------|
| 1 | template-6 | Social Media Disclaimer | social_media_disclaimer.html | ✅ Working |
| 2 | template-4 | Photo Release Form | media_release_form.html | ✅ Working |
| 3 | template-intake | Client Intake Form | client_intake_form.html | ✅ Working |
| 4 | template-1 | Basic Waiver of Liability | waiver_release_of_liability.html | ✅ Working |
| 5 | template-2 | Service Agreement & Membership Contract | service_agreement_membership_contract.html | ✅ Working |
| 6 | template-3 | Terms & Conditions, Disclaimer | terms_privacy_disclaimer.html | ⚠️ **Never recommended** |
| 7 | template-5 | Testimonial Consent | testimonial_consent_agreement.html | ✅ Working |
| 8 | template-7 | Independent Contractor Agreement | independent_contractor_agreement.html | ✅ Working |
| 9 | template-8 | Employment Agreement | employment_agreement.html | ✅ Working |
| 10 | template-9 | Influencer Collaboration Agreement | influencer_collaboration_agreement.html | ⚠️ **Never recommended** |
| 11 | template-10 | Trademark & IP Protection Guide | trademark_ip_protection_guide | ❌ **File doesn't exist** |
| 12 | template-membership | Membership Agreement | membership_agreement.html | ✅ Working |
| 13 | template-studio | Studio Policies | studio_policies.html | ✅ Working |
| 14 | template-class | Class Terms & Conditions | class_terms_conditions.html | ✅ Working |
| 15 | template-privacy | Privacy Policy | privacy_policy.html | ✅ Working |
| 16 | template-website | Website Terms & Conditions | website_terms_conditions.html | ✅ Working |
| 17 | template-refund | Refund & Cancellation Policy | refund_cancellation_policy.html | ✅ Working |
| 18 | template-disclaimer | Website Disclaimer | website_disclaimer.html | ✅ Working |
| 19 | template-cookie | Cookie Policy | cookie_policy.html | ✅ Working |
| 20 | template-retreat-waiver | Retreat Liability Waiver | retreat_liability_waiver.html | ✅ Working |
| 21 | template-travel | Travel & Excursion Agreement | travel_excursion_agreement.html | ✅ Working |

### HTML Files Not in Code

| File Name | Purpose | Status |
|-----------|---------|--------|
| trademark_risk_report.html | Trademark risk analysis report | ❌ Not in code |
| trademark_risk_report_lead_magnet.html | Lead magnet version | ❌ Not in code |

---

## Conditional Display Logic

Documents shown to users depend on their business profile answers.

### Core Documents (EVERYONE gets these - 6 docs)

Always recommended in `getRecommendedDocuments()`:

1. **template-1** - Waiver / Release of Liability
2. **template-website** - Website Terms & Conditions
3. **template-privacy** - Privacy Policy
4. **template-disclaimer** - Website Disclaimer
5. **template-cookie** - Cookie Policy
6. **template-refund** - Refund & Cancellation Policy

### Free Templates (EVERYONE can access - 3 docs)

Always available but not forced:

7. **template-6** - Social Media Disclaimer
8. **template-4** - Photo / Video Release
9. **template-intake** - Client Intake Form

---

### Conditional Documents by Business Type

#### Yoga Studio / Pilates / Gym (Physical Location)

**Condition:** `businessType` includes "Studio", "Gym" OR `primaryBusinessType` is "Yoga", "Pilates", "Gym"

**Additional Documents (4):**
- **template-2** - Service Agreement & Membership Contract
- **template-studio** - Studio Policies
- **template-class** - Class Terms & Conditions
- **template-membership** - Membership Agreement

**Total for Yoga Studio (no employees, no retreats):** 13 documents

---

#### Online Coach / Digital Business

**Condition:** `offersOnlineCourses` OR `primaryBusinessType` is "Coaching" OR services include "Online coaching / digital programs"

**Additional Documents:**
- Refund Policy (already in core)

**Total for Online Coach (no employees):** 9 documents

---

#### Retreat Host

**Condition:** `hostsRetreats` OR `primaryBusinessType` is "Retreats" OR services include "Retreats or workshops"

**Additional Documents (2):**
- **template-retreat-waiver** - Retreat Liability Waiver
- **template-travel** - Travel & Excursion Agreement

**Total for Retreat Host (no other conditions):** 11 documents

---

#### Business with Employees

**Condition:** `hasEmployees` is true

**Additional Documents (1):**
- **template-8** - Employment Agreement

---

#### Business with Contractors (but no employees)

**Condition:** `hiresStaff` is true AND `hasEmployees` is false

**Additional Documents (1):**
- **template-7** - Independent Contractor Agreement

---

### Example Scenarios

| Business Type | Employees | Contractors | Retreats | Total Docs |
|--------------|-----------|-------------|----------|------------|
| Yoga Studio | No | No | No | **13** |
| Yoga Studio | Yes | No | No | **14** |
| Yoga Studio | No | Yes | No | **14** |
| Yoga Studio | Yes | No | Yes | **16** |
| Online Coach | No | No | No | **9** |
| Online Coach | Yes | Yes | No | **11** |
| Retreat Host | No | No | Yes | **11** |
| Mixed (Studio + Retreats) | Yes | No | Yes | **16** |

---

## Issues Found

### 1. Template-3 is Redundant

**Current State:**
- Exists in code as "Terms & Conditions, Disclaimer"
- HTML file exists: `terms_privacy_disclaimer.html`
- **Never recommended** by the engine
- NOT in LegalInventoryChecklist.tsx mapping

**Why it's redundant:**
We have separate templates for:
- template-website (Website Terms & Conditions)
- template-privacy (Privacy Policy)
- template-disclaimer (Website Disclaimer)

**Recommendation:** Remove template-3 from the system

---

### 2. Template-9 Never Shown

**Current State:**
- Exists in code as "Influencer Collaboration Agreement"
- HTML file exists: `influencer_collaboration_agreement.html`
- **Never recommended** by the engine
- NOT in LegalInventoryChecklist.tsx mapping

**Recommendation:**
- Either remove it OR
- Add recommendation logic for influencers/online coaches

---

### 3. Template-10 is Broken

**Current State:**
- Exists in code as "Trademark & IP Protection Guide"
- Mapped to file: `trademark_ip_protection_guide` (doesn't exist)
- **Never recommended** by the engine
- NOT in LegalInventoryChecklist.tsx mapping

**Available files:**
- `trademark_risk_report.html`
- `trademark_risk_report_lead_magnet.html`

**Recommendation:**
- Fix the file mapping OR
- Remove template-10 and add proper templates for the trademark reports

---

## Mapping Inconsistencies

### documentCountUtils.ts

**TEMPLATE_TO_CHECKLIST entries: 21**

Includes:
- All 18 working templates
- template-3 (redundant)
- template-9 (never recommended)
- template-10 (broken)

### LegalInventoryChecklist.tsx

**TEMPLATE_TO_CHECKLIST entries: 18**

Missing:
- template-3
- template-9
- template-10

**TEMPLATE_ID_TO_FILE_NAME entries: 21**

Includes all templates, even the broken ones.

---

## Recommended Fixes

### Option A: Clean Up (Recommended)

**Remove:**
1. template-3 from ALL_TEMPLATES (redundant)
2. template-10 from ALL_TEMPLATES (broken)
3. template-9 from ALL_TEMPLATES (unused)

**Result:**
- **18 clean, working templates**
- Count matches reality
- All templates properly mapped and recommended

**Changes needed:**
- `src/lib/wellness/documentEngine.ts` - Remove 3 templates from ALL_TEMPLATES
- `src/lib/wellness/documentCountUtils.ts` - Remove 3 from TEMPLATE_TO_CHECKLIST
- Already correct in LegalInventoryChecklist.tsx

---

### Option B: Complete the Mappings

**Add:**
1. template-3, template-9, template-10 to LegalInventoryChecklist.tsx TEMPLATE_TO_CHECKLIST
2. Fix template-10 file mapping (use trademark_risk_report.html)
3. Add recommendation logic for template-9 and template-10

**Result:**
- **21 templates all working**
- More comprehensive library
- Need to define when to recommend template-9 and template-10

**Changes needed:**
- `src/components/wellness/vault/LegalInventoryChecklist.tsx` - Add 3 templates to TEMPLATE_TO_CHECKLIST
- `src/lib/wellness/documentEngine.ts` - Add recommendation logic for template-9, template-10
- Fix file mapping for template-10

---

## File Structure Reference

```
server/templates/html/
├── class_terms_conditions.html          → template-class ✅
├── client_intake_form.html              → template-intake ✅
├── cookie_policy.html                   → template-cookie ✅
├── employment_agreement.html            → template-8 ✅
├── independent_contractor_agreement.html → template-7 ✅
├── influencer_collaboration_agreement.html → template-9 ⚠️
├── media_release_form.html              → template-4 ✅
├── membership_agreement.html            → template-membership ✅
├── privacy_policy.html                  → template-privacy ✅
├── refund_cancellation_policy.html      → template-refund ✅
├── retreat_liability_waiver.html        → template-retreat-waiver ✅
├── service_agreement_membership_contract.html → template-2 ✅
├── social_media_disclaimer.html         → template-6 ✅
├── studio_policies.html                 → template-studio ✅
├── terms_privacy_disclaimer.html        → template-3 ⚠️
├── testimonial_consent_agreement.html   → template-5 ✅
├── trademark_risk_report.html           → Not in code ❌
├── trademark_risk_report_lead_magnet.html → Not in code ❌
├── travel_excursion_agreement.html      → template-travel ✅
├── waiver_release_of_liability.html     → template-1 ✅
├── website_disclaimer.html              → template-disclaimer ✅
└── website_terms_conditions.html        → template-website ✅
```

---

## Action Items

**Immediate:**
1. Decide between Option A (clean up) or Option B (complete mappings)
2. Implement chosen fix
3. Update documentation
4. Test with different business profiles

**Future:**
1. Add proper templates for trademark reports
2. Consider adding template-9 (Influencer Agreement) recommendation logic
3. Audit all recommendation logic to ensure completeness
