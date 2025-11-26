# Lead Scraping System - Backend API

This backend server handles website scraping, legal document analysis, and personalized email generation.

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   Make sure your `.env` file in the root directory contains:
   ```
   FIRECRAWL_API_KEY=your-firecrawl-api-key
   OPENAI_API_KEY=your-openai-api-key
   PORT=3001 (optional, defaults to 3001)
   ```

3. **Run the Server**
   ```bash
   npm run server
   ```
   
   For development with auto-reload:
   ```bash
   npm run server:dev
   ```

## API Endpoints

### POST `/api/scrape-and-analyze`
Main endpoint that scrapes a website, analyzes legal documents, and generates a personalized email.

**Request Body:**
```json
{
  "websiteUrl": "https://example.com",
  "leadInfo": {
    "name": "John Doe",
    "company": "Acme Inc.",
    "email": "john@example.com"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "websiteUrl": "https://example.com",
    "legalDocuments": ["privacyPolicy", "termsOfService"],
    "analysis": {
      "missingDocuments": ["refundPolicy"],
      "issues": [...],
      "recommendations": [...],
      "summary": "..."
    },
    "email": {
      "subject": "...",
      "body": "..."
    }
  }
}
```

### POST `/api/scrape`
Scrape a website and extract legal documents only (without analysis).

**Request Body:**
```json
{
  "websiteUrl": "https://example.com"
}
```

### GET `/health`
Health check endpoint.

## How It Works

1. **Scraping Phase**: Uses Firecrawl API to scrape the website and find links to legal documents (Privacy Policy, Terms of Service, Refund Policy, etc.)

2. **Analysis Phase**: Sends scraped documents to ChatGPT to analyze compliance and identify missing documents and issues

3. **Email Generation Phase**: Uses ChatGPT to generate a highly personalized email based on the analysis results

## Services

- **FirecrawlService**: Handles website scraping via Firecrawl API
- **OpenAIService**: Handles ChatGPT API calls for analysis and email generation

