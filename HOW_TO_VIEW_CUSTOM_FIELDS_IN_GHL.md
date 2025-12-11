# How to View Custom Fields in GoHighLevel

## Method 1: View Custom Fields on a Contact

### Step 1: Go to Contacts
1. Log in to your GoHighLevel account
2. Click on **"Contacts"** in the left sidebar
3. Search for any contact (e.g., "cynthia@sojournandsoiree.com")

### Step 2: Open Contact Details
1. Click on the contact to open their details
2. Scroll down to the **"Additional Info"** section
3. You should see all custom fields here with their values

### Step 3: Look for These Fields
You should see all 17 custom fields:
- Business Name
- Website
- Instagram Handle
- Business Type
- Team Size
- Monthly Clients
- Primary Concern
- Uses Client Photos (Yes/No)
- Hosts Retreats (Yes/No)
- Offers Online Courses (Yes/No)
- Has W2 Employees (Yes/No)
- Sells Products (Yes/No)
- Physical Movement (Yes/No)
- Online Payments (Yes/No)
- Hires Staff (Yes/No)
- Offsite International (Yes/No)
- Services Offered

---

## Method 2: Manage Custom Fields Settings

### Step 1: Go to Settings
1. Click on **Settings** (gear icon) in the left sidebar
2. Click on **"Custom Fields"** or **"Custom Values"**

### Step 2: View All Fields
Here you'll see a list of ALL custom fields you've created.

**Look for these exact field names:**
- `business_name`
- `website`
- `instagram_handle`
- `business_type`
- `team_size`
- `monthly_clients`
- `primary_concern`
- `uses_client_photos`
- `hosts_retreats`
- `offers_online_courses`
- `has_w2_employees`
- `sells_products`
- `services_offered`
- `physical_movement`
- `online_payments`
- `hires_staff`
- `offsite_international`

### Step 3: Create Missing Fields
If any of these fields are missing, you need to create them:
1. Click **"Add Custom Field"**
2. Enter the exact field name (from the list above)
3. Choose the field type:
   - **Text** for: business_name, website, instagram_handle, services_offered
   - **Dropdown** for: business_type, team_size, monthly_clients, primary_concern, uses_client_photos, hosts_retreats, etc.
   - For Yes/No fields, create a dropdown with two options: "Yes" and "No"
4. Save the field

---

## Method 3: View Fields in Bulk (Smart Lists/Filters)

### Step 1: Create a Smart List
1. Go to **Contacts**
2. Click **"Smart Lists"** or **"Filters"**
3. Create a filter with the tag: `created business profile`

### Step 2: View All Tagged Contacts
This will show you all contacts who have completed their business profile.

### Step 3: Export to CSV (Optional)
1. Select all contacts
2. Click **"Export"**
3. Make sure to include custom fields in the export
4. Download the CSV and open in Excel/Google Sheets
5. You'll see columns for all custom fields

---

## Method 4: Quick Test - View One Contact

**Try this specific contact (we know it has data):**

1. Search for: **cynthia@sojournandsoiree.com**
2. Open the contact
3. Look for "Additional Info" section
4. You should see:
   - Business Name: **Sojourn & Soirée**
   - Website: **https://sojournandsoiree.com**
   - Instagram Handle: **@sojournandsoiree**
   - Business Type: **Retreat Leader**
   - Team Size: **1-3**
   - Monthly Clients: **20-50**
   - Primary Concern: **I run retreats and need to protect myself**
   - And all the Yes/No fields with their values

---

## Troubleshooting

### ❌ "I don't see the Additional Info section"
- The contact might not have any custom fields filled
- Try searching for a different contact from the success list

### ❌ "I see Additional Info but no custom fields"
- The custom fields haven't been created in GoHighLevel yet
- Go to Settings → Custom Fields and create them (see Method 2)

### ❌ "I see the fields but they're empty"
- The migration might have failed for that specific contact
- Try running the migration again
- Or manually fill them in and save

### ❌ "Some fields are there but others are missing"
- Those specific custom fields haven't been created in GoHighLevel
- Go to Settings → Custom Fields
- Create the missing fields using the exact names from the list above

---

## Need to Re-sync a Contact?

If you need to re-sync a contact's custom fields:

```bash
curl -X POST http://localhost:3001/api/add-ghl-business-profile-tag \
  -H "Content-Type: application/json" \
  -d '{"email": "their-email@example.com"}'
```

Or run the full migration again:
```bash
curl -X POST http://localhost:3001/api/migrate-business-profile-tags
```

---

## Quick Video Guide (If Available)

GoHighLevel usually has these features in similar locations:
- **Contacts → [Contact Name] → Additional Info**
- **Settings → Custom Fields**

The exact layout may vary slightly based on your GoHighLevel plan and UI version.
