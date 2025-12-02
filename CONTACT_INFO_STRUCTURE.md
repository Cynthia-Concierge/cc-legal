# Contact Information Structure in Workflow Results and Cold Leads

## Overview

Contact information scraped from websites during the Legal Analyzer workflow is now organized into separate, dedicated columns for better querying and organization. **Contact information is stored in BOTH tables:**
- `workflow_results` - Full workflow analysis results
- `cold_leads` - Lead information with scraped contact details

This dual storage makes it easy to:
- View contact info directly in the leads list
- Query leads by contact information
- Keep workflow results and lead data synchronized

## Database Schema

### workflow_results Table

The `workflow_results` table includes the following contact information columns:

### Email Columns

| Column | Type | Description |
|--------|------|-------------|
| `scraped_email` | TEXT | Primary email address found on the website (first email in the array) |
| `scraped_emails` | JSONB | Array of all email addresses found on the website |

**Example:**
```json
scraped_email: "contact@example.com"
scraped_emails: ["contact@example.com", "info@example.com", "support@example.com"]
```

### Social Media Columns

| Column | Type | Description |
|--------|------|-------------|
| `instagram_url` | TEXT | Instagram profile URL |
| `facebook_url` | TEXT | Facebook profile/page URL |
| `twitter_url` | TEXT | Twitter/X profile URL |
| `linkedin_url` | TEXT | LinkedIn profile/company URL (scraped from website) |
| `tiktok_url` | TEXT | TikTok profile URL |
| `other_social_links` | JSONB | Other social media platforms (YouTube, Pinterest, etc.) |

**Example:**
```json
instagram_url: "https://instagram.com/example"
facebook_url: "https://facebook.com/example"
twitter_url: "https://twitter.com/example"
linkedin_url: "https://linkedin.com/company/example"
tiktok_url: "https://tiktok.com/@example"
other_social_links: {
  "youtube": "https://youtube.com/@example",
  "pinterest": "https://pinterest.com/example"
}
```

### cold_leads Table

The `cold_leads` table includes the **same contact information columns** (with one exception):

| Column | Type | Description |
|--------|------|-------------|
| `scraped_email` | TEXT | Primary email address found on the website |
| `scraped_emails` | JSONB | Array of all email addresses found |
| `instagram_url` | TEXT | Instagram profile URL |
| `facebook_url` | TEXT | Facebook profile/page URL |
| `twitter_url` | TEXT | Twitter/X profile URL |
| `linkedin_url_scraped` | TEXT | LinkedIn URL scraped from website (different from `linkedin_url` which is from lead import) |
| `tiktok_url` | TEXT | TikTok profile URL |
| `other_social_links` | JSONB | Other social media platforms |

**Note:** The `cold_leads` table uses `linkedin_url_scraped` instead of `linkedin_url` to distinguish between:
- `linkedin_url` - LinkedIn URL from the original lead import
- `linkedin_url_scraped` - LinkedIn URL found by scraping the website

## How It Works

1. **Firecrawl Scraping**: The workflow uses Firecrawl to scrape the website and extract:
   - Email addresses from `mailto:` links and plain text
   - Social media links from footer and page content

2. **Data Organization**: The `WorkflowResultsService` organizes the scraped data:
   - First email becomes `scraped_email`
   - All emails go into `scraped_emails` array
   - Major social platforms get dedicated columns
   - Other platforms go into `other_social_links` JSONB

3. **Dual Database Storage**: Contact information is saved to **BOTH tables**:
   - `workflow_results` - Full analysis results with contact info
   - `cold_leads` - Lead record is updated with contact info (matched by website URL or email)

4. **Automatic Matching**: The system automatically matches workflow results to cold leads by:
   - Website URL (`company_website` in `cold_leads` matches `website_url` in workflow)
   - Email address (`email_1` or `email_2` in `cold_leads` matches lead email)

## Querying Examples

### Find all workflow results with Instagram URLs
```sql
SELECT * FROM workflow_results 
WHERE instagram_url IS NOT NULL;
```

### Find all cold leads with Instagram URLs
```sql
SELECT * FROM cold_leads 
WHERE instagram_url IS NOT NULL;
```

### Find cold leads that have been analyzed and have contact info
```sql
SELECT * FROM cold_leads 
WHERE analyzed_at IS NOT NULL 
  AND (scraped_email IS NOT NULL OR instagram_url IS NOT NULL);
```

### Find results with specific email domain (both tables)
```sql
-- In workflow_results
SELECT * FROM workflow_results 
WHERE scraped_email LIKE '%@example.com'
   OR scraped_emails::text LIKE '%@example.com';

-- In cold_leads
SELECT * FROM cold_leads 
WHERE scraped_email LIKE '%@example.com'
   OR scraped_emails::text LIKE '%@example.com';
```

### Find results with any social media
```sql
SELECT * FROM workflow_results 
WHERE instagram_url IS NOT NULL
   OR facebook_url IS NOT NULL
   OR twitter_url IS NOT NULL
   OR linkedin_url IS NOT NULL
   OR tiktok_url IS NOT NULL
   OR other_social_links IS NOT NULL;
```

### Find results with YouTube links
```sql
SELECT * FROM workflow_results 
WHERE other_social_links->>'youtube' IS NOT NULL;
```

## Migration

If you have an existing database with the old `contact_info` JSONB column, run the migration script:

```bash
# Run in Supabase SQL Editor
migration_add_contact_info_and_analyzed_at.sql
```

This will:
- Remove the old `contact_info` column
- Add all new organized columns
- Create appropriate indexes
- Add column comments

## Benefits

1. **Better Querying**: Query specific contact types without parsing JSON
2. **Indexed Columns**: Faster searches on email and Instagram URLs
3. **Clear Organization**: Each contact type has its own column
4. **Flexible Storage**: `other_social_links` handles new platforms
5. **Easy Filtering**: Filter by specific social platforms in SQL
6. **Dual Storage**: Contact info in both `workflow_results` and `cold_leads` for easy access
7. **Automatic Updates**: When a workflow runs, matching cold leads are automatically updated with contact info
8. **Lead Management**: View and filter leads directly by scraped contact information

