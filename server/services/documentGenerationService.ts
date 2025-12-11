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
}

export class DocumentGenerationService {
  private templatesPath: string;

  constructor() {
    // Path to PDF templates
    // Use import.meta.url to get current file path in ES modules
    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    this.templatesPath = path.join(currentDir, '../../public/pdfs');
    console.log('[DocGen] Templates path:', this.templatesPath);
  }

  /**
   * Generate a personalized document by filling in template fields
   */
  async generateDocument(
    templateName: string,
    profileData: BusinessProfileData
  ): Promise<Buffer> {
    try {
      // Load the PDF template
      const templatePath = path.join(this.templatesPath, `${templateName}.pdf`);
      console.log('[DocGen] Loading template from:', templatePath);

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
}
