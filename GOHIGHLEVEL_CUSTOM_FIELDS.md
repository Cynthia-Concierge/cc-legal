# GoHighLevel Custom Fields Setup

This document lists all the custom fields you need to create in GoHighLevel to receive business profile data from your wellness dashboard.

## 📋 Required Custom Fields

Create these custom fields in your GoHighLevel location settings:

### Basic Business Information

| Field Name | Type | Description | Example Value |
|------------|------|-------------|---------------|
| `business_name` | Text | Business/Studio name | "Zen Yoga Studio" |
| `website` | Text/URL | Business website | "https://zenyoga.com" |
| `instagram_handle` | Text | Instagram handle | "@zenyogastudio" |
| `business_type` | Dropdown/Text | Type of wellness business | "Yoga Studio", "Personal Trainer", etc. |

**Business Type Options:**
- Yoga Studio
- Pilates Studio
- Gym / Fitness Studio
- Retreat Leader
- Online Coach
- Personal Trainer
- Wellness Practitioner
- Breathwork / Meditation
- Hybrid (Online + In-person)

---

### Scale & Operations

| Field Name | Type | Description | Example Value |
|------------|------|-------------|---------------|
| `team_size` | Dropdown/Text | Number of team members | "0", "1-3", "4-10", "10+" |
| `monthly_clients` | Dropdown/Text | Monthly client volume | "0-20", "20-50", "50-200", "200+" |
| `primary_concern` | Dropdown/Text | Main legal concern | See options below |

**Primary Concern Options:**
- I'm not sure what documents I need
- I want to protect myself from liability
- I want to protect my website + online content
- I want to legally protect my staff/contractors
- I run retreats and need to protect myself
- I want to protect my brand (IP/trademark)
- Everything feels overwhelming — I need guidance

---

### Yes/No Fields (Use Dropdown with "Yes" / "No" options)

| Field Name | Type | Description |
|------------|------|-------------|
| `uses_client_photos` | Dropdown | Does the business use client photos/videos? |
| `hosts_retreats` | Dropdown | Hosts retreats or travel events? |
| `offers_online_courses` | Dropdown | Sells online courses or digital memberships? |
| `has_w2_employees` | Dropdown | Has W-2 employees (not contractors)? |
| `sells_products` | Dropdown | Sells physical products? |
| `physical_movement` | Dropdown | Clients participate in physical movement? |
| `online_payments` | Dropdown | Collects payments/bookings online? |
| `hires_staff` | Dropdown | Hires staff or contractors? |
| `offsite_international` | Dropdown | Runs events off-site or internationally? |

---

### Services Offered

| Field Name | Type | Description | Example Value |
|------------|------|-------------|---------------|
| `services_offered` | Text (Long) | Comma-separated list of services | "Group classes, Private sessions, Online coaching" |

**Service Options:**
- Group classes
- Private sessions
- Retreats
- Online coaching
- Workshops

---

## 🛠️ How to Create Custom Fields in GoHighLevel

1. **Log in to GoHighLevel**
2. **Go to Settings → Custom Fields**
3. **Click "Add Custom Field"**
4. **For each field above:**
   - Enter the exact **Field Name** (e.g., `business_name`)
   - Select the appropriate **Field Type** (Text, Dropdown, etc.)
   - For Dropdown fields, add the options listed above
   - Save the field

5. **Verify Fields:**
   - Check that all field names match EXACTLY (case-sensitive)
   - Ensure dropdown options are added correctly

---

## ✅ Verification Checklist

After creating the fields, verify they appear in:
- [ ] Contact detail page → Additional Info section
- [ ] Contact forms
- [ ] Workflow conditions/actions

---

## 🔄 When Data Syncs to GoHighLevel

Data is automatically synced in these scenarios:

1. **New User Creates Business Profile** → Immediate sync
2. **Existing User Updates Business Profile** → Syncs on save
3. **Migration Script Run** → Bulk sync for all existing users

---

## 📊 Example Contact in GoHighLevel

After sync, a contact will look like:

**General Info:**
- Email: cynthia@sojournandsoiree.com
- Name: Cynthia

**Additional Info (Custom Fields):**
- Business Name: Sojourn & Soirée
- Website: https://sojournandsoiree.com
- Instagram Handle: @sojournandsoiree
- Business Type: Retreat Leader
- Team Size: 1-3
- Monthly Clients: 20-50
- Primary Concern: I run retreats and need to protect myself
- Hosts Retreats: Yes
- Offers Online Courses: No
- Has W2 Employees: No
- Sells Products: Yes
- Uses Client Photos: Yes
- Physical Movement: Yes
- Online Payments: Yes
- Hires Staff: Yes
- Offsite International: Yes
- Services Offered: Retreats, Private sessions

**Tags:**
- ricki new funnel
- created business profile

---

## 🚨 Important Notes

1. **Field Names are Case-Sensitive** - Use exact lowercase names with underscores
2. **Create ALL Fields** - Missing fields won't cause errors, but data won't be stored
3. **Dropdown vs Text** - Use Dropdown for structured data (easier filtering), Text for free-form
4. **Existing Contacts** - Run the migration script to backfill data for existing contacts

---

## 🆘 Troubleshooting

**Data Not Showing Up?**
- Check that field names match exactly
- Verify the field type is correct (Text vs Dropdown)
- Look at server logs for errors
- Check that the contact exists in GHL

**Migration Failing?**
- Ensure all custom fields are created first
- Check GoHighLevel API rate limits
- Verify API credentials are correct

---

## 📞 Support

If you need help:
1. Check server logs for detailed error messages
2. Verify custom fields are created correctly in GHL
3. Test with a single contact first before running full migration
