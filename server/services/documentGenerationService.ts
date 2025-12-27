/**
 * Document Generation Service
 *
 * Fills PDF templates with user business profile data
 * Uses pdf-lib to programmatically fill form fields in PDFs
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface BusinessProfileData {
  businessName?: string;
  legalEntityName?: string;
  entityType?: string;
  state?: string;
  businessAddress?: string;
  ownerName?: string;
  phone?: string;
  email?: string;
  website?: string;
  instagram?: string;
  businessType?: string;
  services?: string[];
  // Trademark risk report specific fields
  riskLevel?: string;
  score?: number;
  riskFactor1?: string;
  riskFactor2?: string;
  riskFactor3?: string;
  riskFactor4?: string;
  // New lead magnet PDF fields
  riskIcon?: string;
  riskClass?: string;
  urgencyMessage?: string;
  totalConflicts?: number;
  conflictsSection?: string;
  verdict?: string;
  [key: string]: any; // Allow additional dynamic fields
}

export class DocumentGenerationService {
  private templatesPath: string;

  constructor() {
    // Path to PDF templates
    // Use import.meta.url to get current file path in ES modules
    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    this.templatesPath = path.join(currentDir, '../../public/pdfs');
    // Also set path for HTML templates
    // Assuming structure: server/templates/html/social_media_disclaimer.html
    // relative to dist/services/documentGenerationService.js depends on build, 
    // but in dev it's relative to server/services/documentGenerationService.ts
    console.log('[DocGen] PDF Templates path:', this.templatesPath);
  }

  /**
   * Generate a personalized document by filling in template fields
   */
  async generateDocument(
    templateName: string,
    profileData: BusinessProfileData
  ): Promise<Buffer> {
    try {
      // Check for HTML template first
      // In dev environment, we need to look in the source directory structure
      // Adjust path to point to server/templates/html
      const htmlTemplatePath = path.join(__dirname, '../templates/html', `${templateName}.html`);
      console.log('[DocGen] Checking for HTML template at:', htmlTemplatePath);

      let useHtml = false;
      try {
        await fs.access(htmlTemplatePath);
        useHtml = true;
      } catch (e) {
        console.log('[DocGen] HTML template not found, falling back to PDF template');
      }

      if (useHtml) {
        // Generate from HTML using Puppeteer
        console.log('[DocGen] Using HTML template for generation');
        return await this.generateFromHtml(htmlTemplatePath, profileData);
      }

      // Fallback to PDF template
      const templatePath = path.join(this.templatesPath, `${templateName}.pdf`);
      console.log('[DocGen] Loading PDF template from:', templatePath);

      const templateBytes = await fs.readFile(templatePath);
      console.log('[DocGen] Template loaded, size:', templateBytes.length, 'bytes');

      const pdfDoc = await PDFDocument.load(templateBytes);
      console.log('[DocGen] PDF parsed successfully');

      // Check if template has form fields
      const form = pdfDoc.getForm();
      const fields = form.getFields();

      console.log(`[DocGen] Template: ${templateName}`);
      console.log(`[DocGen] Form fields found: ${fields.length}`);

      if (fields.length > 0) {
        // Template has fillable form fields - use them
        await this.fillFormFields(form, profileData);
      } else {
        // Template doesn't have form fields - overlay text
        console.log('[DocGen] No form fields found, overlaying text instead');
        await this.overlayText(pdfDoc, profileData, templateName);
      }

      // Save and return the filled PDF
      const pdfBytes = await pdfDoc.save();
      return Buffer.from(pdfBytes);
    } catch (error: any) {
      console.error('[DocGen] Error generating document:', error);
      throw new Error(`Failed to generate document: ${error.message}`);
    }
  }

  /**
   * Fill form fields in a PDF (if template has them)
   */
  private async fillFormFields(form: any, profileData: BusinessProfileData): Promise<void> {
    const fieldMappings: Record<string, string | undefined> = {
      'business_name': profileData.legalEntityName || profileData.businessName,
      'legal_entity_name': profileData.legalEntityName,
      'entity_type': profileData.entityType,
      'owner_name': profileData.ownerName,
      'business_address': profileData.businessAddress,
      'state': profileData.state,
      'phone': profileData.phone,
      'email': profileData.email,
      'website': profileData.website,
      'instagram': profileData.instagram,
      'business_type': profileData.businessType,
      'services': profileData.services?.join(', '),
      'date': new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
    };

    // Get all fields and fill them
    const fields = form.getFields();
    for (const field of fields) {
      const fieldName = field.getName();
      const value = fieldMappings[fieldName];

      if (value) {
        try {
          const textField = form.getTextField(fieldName);
          textField.setText(value);
          console.log(`[DocGen] Filled field: ${fieldName} = ${value}`);
        } catch (err) {
          // Not a text field, skip
          console.log(`[DocGen] Skipping non-text field: ${fieldName}`);
        }
      }
    }

    // Flatten form so it can't be edited
    form.flatten();
  }

  /**
   * Overlay text on PDF (fallback if no form fields)
   *
   * This adds text at specific coordinates for templates that don't have form fields
   */
  private async overlayText(
    pdfDoc: PDFDocument,
    profileData: BusinessProfileData,
    templateName: string
  ): Promise<void> {
    // Load font
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 10;
    const textColor = rgb(0, 0, 0);

    // Get coordinates for this specific template
    const coordinates = this.getTemplateCoordinates(templateName);

    if (!coordinates) {
      console.log(`[DocGen] No coordinates defined for template: ${templateName}`);
      console.log('[DocGen] Document will be generated without auto-fill');
      return;
    }

    // Get first page (most templates are single page)
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    // Overlay text at specified coordinates
    for (const [fieldName, { x, y }] of Object.entries(coordinates)) {
      let value = '';

      // Map field name to profile data
      switch (fieldName) {
        case 'business_name':
          value = profileData.legalEntityName || profileData.businessName || '';
          break;
        case 'owner_name':
          value = profileData.ownerName || '';
          break;
        case 'business_address':
          value = profileData.businessAddress || '';
          break;
        case 'phone':
          value = profileData.phone || '';
          break;
        case 'email':
          value = profileData.email || '';
          break;
        case 'date':
          value = new Date().toLocaleDateString();
          break;
      }

      if (value) {
        firstPage.drawText(value, {
          x,
          y,
          size: fontSize,
          font,
          color: textColor,
        });
        console.log(`[DocGen] Overlaid ${fieldName} at (${x}, ${y}): ${value}`);
      }
    }
  }

  /**
   * Get coordinates for overlaying text on specific templates
   *
   * These coordinates are template-specific and need to be adjusted
   * based on where fields appear in each PDF template
   */
  private getTemplateCoordinates(templateName: string): Record<string, { x: number; y: number }> | null {
    const coordinateMaps: Record<string, Record<string, { x: number; y: number }>> = {
      'social_media_disclaimer': {
        'business_name': { x: 50, y: 700 },
        'owner_name': { x: 50, y: 650 },
        'business_address': { x: 50, y: 620 },
        'phone': { x: 50, y: 590 },
        'email': { x: 50, y: 560 },
        'date': { x: 50, y: 100 },
      },
    };

    return coordinateMaps[templateName] || null;
  }

  /**
   * Generate PDF from HTML template using Puppeteer
   */
  private async generateFromHtml(
    templatePath: string,
    profileData: BusinessProfileData
  ): Promise<Buffer> {
    try {
      // 1. Read HTML template
      const htmlContent = await fs.readFile(templatePath, 'utf-8');

      // 2. Replace placeholders
      // Simple string replacement for now using handlebars-style placeholders
      // This matches {{placeholder}} syntax
      let populatedHtml = htmlContent;

      const replacements: Record<string, string> = {
        // New Template Placeholders (Uppercase based on user request)
        '{{BusinessName}}': profileData.businessName || '[Business Name]',
        '{{BusinessType}}': profileData.businessType || 'Business',
        '{{BusinessAddress}}': profileData.businessAddress || '[Address]',
        '{{Email}}': profileData.email || '',
        '{{SocialLinks}}': `${profileData.website || ''} ${profileData.instagram ? `| IG: ${profileData.instagram}` : ''}`,
        '{{Jurisdiction}}': profileData.state || '[Jurisdiction]',
        '{{date}}': new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),

        // NEW: Additional placeholders for advanced templates
        '{{LegalEntityName}}': profileData.legalEntityName || profileData.businessName || '[Legal Entity Name]',
        '{{EntityType}}': profileData.entityType || '[Entity Type]',
        '{{State}}': profileData.state || '[State]',
        '{{OwnerName}}': profileData.ownerName || '[Business Owner]',
        '{{Phone}}': profileData.phone || '[Phone Number]',
        '{{Website}}': profileData.website || '',
        '{{Instagram}}': profileData.instagram || '',
        '{{Services}}': Array.isArray(profileData.services) ? profileData.services.join(', ') : '',

        // Backward compatibility / extra fields if needed
        '{{businessName}}': profileData.businessName || '[Business Name]',
        '{{legalEntityName}}': profileData.legalEntityName || profileData.businessName || '[Legal Name]',
        '{{entityType}}': profileData.entityType || '',
        '{{businessAddress}}': profileData.businessAddress || '[Address]',
        '{{ownerName}}': profileData.ownerName || '',
        '{{phone}}': profileData.phone || '',
        '{{email}}': profileData.email || '',
        '{{website}}': profileData.website || '',
        '{{instagram}}': profileData.instagram || '',
        '{{businessType}}': profileData.businessType || '',
        
        // Trademark risk report placeholders
        '{{riskLevel}}': profileData.riskLevel || 'MODERATE RISK',
        '{{score}}': profileData.score?.toString() || '0',
        '{{riskLevelClass}}': (profileData.riskLevel || '').toLowerCase().replace(/\s+/g, '-'),
        '{{riskFactor1}}': profileData.riskFactor1 || 'No federal trademark registration',
        '{{riskFactor2}}': profileData.riskFactor2 || 'Similar name search not fully completed',
        '{{riskFactor3}}': profileData.riskFactor3 || 'Expansion beyond current location planned',
        '{{riskFactor4}}': profileData.riskFactor4 || 'Domain availability uncertain',
        // New improved PDF fields
        '{{verdict}}': profileData.verdict || 'Based on your responses, your brand shows moderate trademark risk. Additional protection is recommended before expansion or major brand investment.',
        '{{trademarkRegistered}}': profileData.trademarkRegistered || 'No',
        '{{trademarkRegisteredIcon}}': profileData.trademarkRegisteredIcon || '❌',
        '{{expansionPlanned}}': profileData.expansionPlanned || 'No',
        '{{expansionPlannedIcon}}': profileData.expansionPlannedIcon || '❌',
        '{{similarNameSearch}}': profileData.similarNameSearch || 'No',
        '{{similarNameSearchIcon}}': profileData.similarNameSearchIcon || '❌',
        '{{domainOwnership}}': profileData.domainOwnership || 'Unchecked',
        '{{translationText}}': profileData.translationText || 'These factors don\'t indicate a current conflict, but they increase exposure as your brand grows.',
        // New question fields
        '{{brandNameOrigin}}': profileData.brandNameOrigin || 'Not specified',
        '{{includesLocation}}': profileData.includesLocation || 'No',
        '{{brandUsageDuration}}': profileData.brandUsageDuration || 'Not specified',
        '{{brandUsageLocations}}': profileData.brandUsageLocations || 'Not specified',
        '{{expansionPlans}}': profileData.expansionPlans || 'Not specified',
        '{{brandingInvestments}}': profileData.brandingInvestments || 'Not specified',
        '{{receivedConfusion}}': profileData.receivedConfusion || 'No',
        '{{differentFromLegalName}}': profileData.differentFromLegalName || 'Not sure',
        '{{workedWithLawyer}}': profileData.workedWithLawyer || 'No',

        // Lead magnet PDF placeholders (NEW)
        '{{riskIcon}}': profileData.riskIcon || this.getRiskIconFromLevel(profileData.riskLevel),
        '{{riskClass}}': profileData.riskClass || (profileData.riskLevel || '').toLowerCase().replace(/\s+/g, '-'),
        '{{urgencyMessage}}': profileData.urgencyMessage || this.getUrgencyMessageFromLevel(profileData.riskLevel),
        '{{totalConflicts}}': profileData.totalConflicts?.toString() || '0',
        '{{conflictsSection}}': profileData.conflictsSection || '<div class="conflict-count-box"><p>No exact trademark matches found in our preliminary scan.</p></div>',
        '{{year}}': new Date().getFullYear().toString(),
      };

      // Perform all replacements
      for (const [placeholder, value] of Object.entries(replacements)) {
        // Global replace of all instances
        // Using replace literal strings technique
        populatedHtml = populatedHtml.split(placeholder).join(value);
      }

      console.log('[DocGen] HTML populated with profile data');

      // 3. Launch Puppeteer to generate PDF
      // Use no-sandbox for better compatibility in container/server environments
      const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: true
      });

      const page = await browser.newPage();

      // Set content
      await page.setContent(populatedHtml, {
        waitUntil: 'networkidle0'
      });

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0px',
          right: '0px',
          bottom: '0px',
          left: '0px'
        }
      });

      await browser.close();

      console.log('[DocGen] HTML converted to PDF successfully');
      return Buffer.from(pdfBuffer);

    } catch (error: any) {
      console.error('[DocGen] Error generating from HTML:', error);
      throw error;
    }
  }

  /**
   * Generate populated HTML (without converting to PDF)
   * Used for the "copy as text" feature
   */
  async generateHtmlOnly(
    templateName: string,
    profileData: BusinessProfileData
  ): Promise<string> {
    try {
      const htmlTemplatePath = path.join(__dirname, '../templates/html', `${templateName}.html`);
      console.log('[DocGen] Loading HTML template for text copy:', htmlTemplatePath);

      // Read HTML template
      const htmlContent = await fs.readFile(htmlTemplatePath, 'utf-8');

      // Replace placeholders (same logic as generateFromHtml)
      let populatedHtml = htmlContent;

      const replacements: Record<string, string> = {
        '{{BusinessName}}': profileData.businessName || '[Business Name]',
        '{{BusinessType}}': profileData.businessType || 'Business',
        '{{BusinessAddress}}': profileData.businessAddress || '[Address]',
        '{{Email}}': profileData.email || '',
        '{{SocialLinks}}': `${profileData.website || ''} ${profileData.instagram ? `| IG: ${profileData.instagram}` : ''}`,
        '{{Jurisdiction}}': profileData.state || '[Jurisdiction]',
        '{{date}}': new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        '{{LegalEntityName}}': profileData.legalEntityName || profileData.businessName || '[Legal Entity Name]',
        '{{EntityType}}': profileData.entityType || '[Entity Type]',
        '{{State}}': profileData.state || '[State]',
        '{{OwnerName}}': profileData.ownerName || '[Business Owner]',
        '{{Phone}}': profileData.phone || '[Phone Number]',
        '{{Website}}': profileData.website || '',
        '{{Instagram}}': profileData.instagram || '',
        '{{Services}}': Array.isArray(profileData.services) ? profileData.services.join(', ') : '',
        '{{businessName}}': profileData.businessName || '[Business Name]',
        '{{legalEntityName}}': profileData.legalEntityName || profileData.businessName || '[Legal Name]',
        '{{entityType}}': profileData.entityType || '',
        '{{businessAddress}}': profileData.businessAddress || '[Address]',
        '{{ownerName}}': profileData.ownerName || '',
        '{{phone}}': profileData.phone || '',
        '{{email}}': profileData.email || '',
        '{{website}}': profileData.website || '',
        '{{instagram}}': profileData.instagram || '',
        '{{businessType}}': profileData.businessType || '',

        // Lead magnet PDF placeholders (NEW)
        '{{riskIcon}}': profileData.riskIcon || this.getRiskIconFromLevel(profileData.riskLevel),
        '{{riskClass}}': profileData.riskClass || (profileData.riskLevel || '').toLowerCase().replace(/\s+/g, '-'),
        '{{urgencyMessage}}': profileData.urgencyMessage || this.getUrgencyMessageFromLevel(profileData.riskLevel),
        '{{totalConflicts}}': profileData.totalConflicts?.toString() || '0',
        '{{conflictsSection}}': profileData.conflictsSection || '<div class="conflict-count-box"><p>No exact trademark matches found in our preliminary scan.</p></div>',
        '{{riskLevel}}': profileData.riskLevel || 'MODERATE RISK',
        '{{verdict}}': profileData.verdict || 'Based on the preliminary scan, we recommend consulting with a trademark attorney to discuss your specific situation.',
        '{{year}}': new Date().getFullYear().toString(),
      };

      // Perform all replacements
      for (const [placeholder, value] of Object.entries(replacements)) {
        populatedHtml = populatedHtml.split(placeholder).join(value);
      }

      console.log('[DocGen] HTML populated successfully for text copy');
      return populatedHtml;

    } catch (error: any) {
      console.error('[DocGen] Error generating HTML:', error);
      throw new Error(`Failed to generate HTML: ${error.message}`);
    }
  }

  /**
   * Helper method to get risk icon emoji from risk level
   */
  private getRiskIconFromLevel(riskLevel?: string): string {
    if (!riskLevel) return '⚡';
    const level = riskLevel.toUpperCase();
    if (level.includes('HIGH')) return '⚠️';
    if (level.includes('MODERATE')) return '⚡';
    if (level.includes('LOW')) return '✅';
    return '⚡';
  }

  /**
   * Helper method to get urgency message from risk level
   */
  private getUrgencyMessageFromLevel(riskLevel?: string): string {
    if (!riskLevel) return 'Protection advised before expansion';
    const level = riskLevel.toUpperCase();
    if (level.includes('HIGH')) return 'Immediate action recommended';
    if (level.includes('MODERATE')) return 'Protection advised before expansion';
    if (level.includes('LOW')) return 'Consider protection as you grow';
    return 'Protection advised before expansion';
  }
}
