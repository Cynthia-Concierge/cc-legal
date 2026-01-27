/**
 * Document Generation Service (Firebase Functions)
 *
 * Generates personalized PDF documents from HTML templates.
 * Uses puppeteer-core + @sparticuz/chromium for serverless PDF generation.
 */

import fs from 'fs/promises';
import path from 'path';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

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
    // Additional trademark fields
    verdict?: string;
    trademarkRegistered?: string;
    trademarkRegisteredIcon?: string;
    expansionPlanned?: string;
    expansionPlannedIcon?: string;
    similarNameSearch?: string;
    similarNameSearchIcon?: string;
    domainOwnership?: string;
    translationText?: string;
    brandNameOrigin?: string;
    includesLocation?: string;
    brandUsageDuration?: string;
    brandUsageLocations?: string;
    expansionPlans?: string;
    brandingInvestments?: string;
    receivedConfusion?: string;
    differentFromLegalName?: string;
    workedWithLawyer?: string;
    // Lead magnet PDF fields
    riskIcon?: string;
    riskClass?: string;
    urgencyMessage?: string;
    totalConflicts?: number;
    conflictsSection?: string;
    [key: string]: any; // Allow additional dynamic fields
}

export class DocumentGenerationService {

    constructor() {
        console.log('[DocGen] DocumentGenerationService initialized');
        console.log('[DocGen] __dirname:', __dirname);
    }

    /**
     * Build the replacements map for template placeholders
     */
    private getReplacements(profileData: BusinessProfileData): Record<string, string> {
        return {
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
            '{{riskIcon}}': profileData.riskIcon || this.getRiskIconFromLevel(profileData.riskLevel),
            '{{riskClass}}': profileData.riskClass || (profileData.riskLevel || '').toLowerCase().replace(/\s+/g, '-'),
            '{{urgencyMessage}}': profileData.urgencyMessage || this.getUrgencyMessageFromLevel(profileData.riskLevel),
            '{{totalConflicts}}': profileData.totalConflicts?.toString() || '0',
            '{{conflictsSection}}': profileData.conflictsSection || '<div class="conflict-count-box"><p>No exact trademark matches found in our preliminary scan.</p></div>',
            '{{riskLevel}}': profileData.riskLevel || 'MODERATE RISK',
            '{{verdict}}': profileData.verdict || 'Based on the preliminary scan, we recommend consulting with a trademark attorney to discuss your specific situation.',
            '{{year}}': new Date().getFullYear().toString(),
        };
    }

    /**
     * Resolve the HTML template path, trying multiple locations
     */
    private async resolveTemplatePath(templateName: string): Promise<string> {
        const candidates = [
            path.join(__dirname, 'templates/html', `${templateName}.html`),
            path.join(process.cwd(), 'templates/html', `${templateName}.html`),
            path.join(process.cwd(), 'lib/templates/html', `${templateName}.html`),
        ];

        for (const candidate of candidates) {
            try {
                await fs.access(candidate);
                console.log('[DocGen] Template found at:', candidate);
                return candidate;
            } catch {
                // Try next candidate
            }
        }

        throw new Error(
            `HTML template not found: ${templateName}.html. ` +
            `Tried: ${candidates.join(', ')}. ` +
            `HTML templates are required for personalized document generation.`
        );
    }

    /**
     * Read an HTML template and populate it with profile data
     */
    private async populateTemplate(templatePath: string, profileData: BusinessProfileData): Promise<string> {
        const htmlContent = await fs.readFile(templatePath, 'utf-8');
        let populatedHtml = htmlContent;
        const replacements = this.getReplacements(profileData);

        let replacementCount = 0;
        for (const [placeholder, value] of Object.entries(replacements)) {
            if (populatedHtml.includes(placeholder)) {
                populatedHtml = populatedHtml.split(placeholder).join(value);
                replacementCount++;
            }
        }
        console.log(`[DocGen] Total placeholders replaced: ${replacementCount}`);

        return populatedHtml;
    }

    /**
     * Generate a personalized PDF document from an HTML template
     */
    async generateDocument(
        templateName: string,
        profileData: BusinessProfileData
    ): Promise<Buffer> {
        try {
            console.log(`[DocGen] Generating document: ${templateName}`);
            const templatePath = await this.resolveTemplatePath(templateName);
            const populatedHtml = await this.populateTemplate(templatePath, profileData);

            // Convert HTML to PDF using puppeteer-core + @sparticuz/chromium
            console.log('[DocGen] Launching headless browser for PDF conversion...');

            // In production (Linux/serverless): use @sparticuz/chromium's bundled binary
            // In local dev (macOS): use locally installed Chrome
            const isLocal = process.platform !== 'linux';
            let executablePath: string;
            let launchArgs: string[];

            if (isLocal) {
                // Local dev - find Chrome on macOS or Windows
                const possiblePaths = [
                    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
                    '/Applications/Chromium.app/Contents/MacOS/Chromium',
                    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
                ];
                executablePath = possiblePaths.find(p => {
                    try { require('fs').accessSync(p); return true; } catch { return false; }
                }) || '';
                launchArgs = ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'];
                console.log('[DocGen] Local dev mode, using Chrome at:', executablePath);
            } else {
                executablePath = await chromium.executablePath();
                launchArgs = chromium.args;
                console.log('[DocGen] Production mode, using @sparticuz/chromium');
            }

            const browser = await puppeteer.launch({
                args: launchArgs,
                executablePath,
                headless: true,
            });

            try {
                const page = await browser.newPage();
                await page.setContent(populatedHtml, { waitUntil: 'networkidle0' });

                const pdfBuffer = await page.pdf({
                    format: 'Letter',
                    printBackground: true,
                    margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' }
                });

                console.log(`[DocGen] PDF generated successfully (${pdfBuffer.length} bytes)`);
                return Buffer.from(pdfBuffer);
            } finally {
                await browser.close();
            }
        } catch (error: any) {
            console.error('[DocGen] Error generating document:', error);
            throw new Error(`Failed to generate document: ${error.message}`);
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
            console.log(`[DocGen] Generating HTML: ${templateName}`);
            const templatePath = await this.resolveTemplatePath(templateName);
            const populatedHtml = await this.populateTemplate(templatePath, profileData);
            console.log('[DocGen] HTML populated successfully');
            return populatedHtml;
        } catch (error: any) {
            console.error('[DocGen] Error generating HTML:', error);
            throw new Error(`Failed to generate HTML: ${error.message}`);
        }
    }

    private getRiskIconFromLevel(riskLevel?: string): string {
        if (!riskLevel) return '⚡';
        const level = riskLevel.toUpperCase();
        if (level.includes('HIGH')) return '⚠️';
        if (level.includes('MODERATE')) return '⚡';
        if (level.includes('LOW')) return '✅';
        return '⚡';
    }

    private getUrgencyMessageFromLevel(riskLevel?: string): string {
        if (!riskLevel) return 'Protection advised before expansion';
        const level = riskLevel.toUpperCase();
        if (level.includes('HIGH')) return 'Immediate action recommended';
        if (level.includes('MODERATE')) return 'Protection advised before expansion';
        if (level.includes('LOW')) return 'Consider protection as you grow';
        return 'Protection advised before expansion';
    }
}
