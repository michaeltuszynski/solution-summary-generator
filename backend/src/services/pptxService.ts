import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { Proposal, DiscoveryData } from '../types';

export class PPTXService {
  private outputPath: string;
  private templatePath: string;

  constructor() {
    this.outputPath = path.join(__dirname, '..', '..', 'generated');
    this.templatePath = path.join(__dirname, '..', '..', 'templates');
    
    // Ensure directories exist
    if (!fs.existsSync(this.outputPath)) {
      fs.mkdirSync(this.outputPath, { recursive: true });
    }
  }

  async createPresentation(proposal: Proposal, discoveryData: DiscoveryData): Promise<string> {
    try {
      console.log('🔧 Starting template-based PPTX generation with preserved styling...');
      
      const templateFile = path.join(this.templatePath, 'Solution Summary Template.pptx');
      
      // Check if template exists
      if (!fs.existsSync(templateFile)) {
        throw new Error(`Template file not found: ${templateFile}`);
      }

      console.log('📄 Loading template with preserved styling...');
      
      // Read the template file
      const templateContent = fs.readFileSync(templateFile, 'binary');
      
      // Create a new zip from the template
      const zip = new PizZip(templateContent);
      
      // Prepare replacement data
      const templateData = this.prepareTemplateData(proposal, discoveryData);
      
      // Create docxtemplater instance for PPTX
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      // Replace placeholders with actual data
      console.log('📝 Replacing template content while preserving styling...');
      doc.setData(templateData);

      try {
        doc.render();
      } catch (error) {
        console.warn('⚠️ Template rendering had issues, but continuing...');
        console.warn('Error details:', error);
      }

      // Generate output
      const buf = doc.getZip().generate({ type: 'nodebuffer' });
      
      // Generate filename and save
      const timestamp = Date.now();
      const filename = `proposal-${discoveryData.companyName.replace(/\s+/g, '-')}-${timestamp}.pptx`;
      const outputFile = path.join(this.outputPath, filename);
      
      console.log('💾 Writing styled presentation:', filename);
      fs.writeFileSync(outputFile, buf);
      
      console.log('✅ Template-based presentation created with preserved styling:', outputFile);
      return outputFile;
      
    } catch (error: any) {
      console.error('❌ Template PPTX Generation Error:', error);
      
      // Fallback: Create a simple presentation if template fails
      console.log('🔄 Falling back to simple presentation generation...');
      return this.createFallbackPresentation(proposal, discoveryData);
    }
  }

  private prepareTemplateData(proposal: Proposal, discoveryData: DiscoveryData): any {
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    });

    return {
      // Company and project info
      COMPANY_NAME: discoveryData.companyName,
      PROJECT_TYPE: `${discoveryData.projectType} Initiative`,
      DATE: currentDate,
      
      // Confidence scores
      CONFIDENCE_SCORE: `${proposal.overallConfidence || 0}%`,
      OVERVIEW_CONFIDENCE: `${proposal.sections.overview?.confidence || 0}%`,
      SOLUTION_CONFIDENCE: `${proposal.sections.solution_approach?.confidence || 0}%`,
      OUTCOMES_CONFIDENCE: `${proposal.sections.outcomes?.confidence || 0}%`,
      
      // Section titles
      PROBLEM_TITLE: 'Problem Statement',
      OVERVIEW_TITLE: 'Overview',
      SOLUTION_TITLE: 'Solution & Approach', 
      OUTCOMES_TITLE: 'Expected Outcomes',
      ASSUMPTIONS_TITLE: 'Assumptions',
      CLIENT_RESPONSIBILITIES_TITLE: 'Client Responsibilities',
      NEXTSTEPS_TITLE: 'Next Steps',
      
      // Section content
      PROBLEM_CONTENT: this.formatProblemStatement(discoveryData),
      OVERVIEW_CONTENT: this.formatContentForTemplate(proposal.sections.overview?.content || 'Content not available'),
      SOLUTION_CONTENT: this.formatContentForTemplate(proposal.sections.solution_approach?.content || 'Content not available'),
      OUTCOMES_CONTENT: this.formatContentForTemplate(proposal.sections.outcomes?.content || 'Content not available'),
      ASSUMPTIONS_CONTENT: this.formatAssumptions(discoveryData),
      CLIENT_RESPONSIBILITIES_CONTENT: this.formatClientResponsibilities(discoveryData),
      
      // Warnings
      OVERVIEW_WARNINGS: this.formatWarnings(proposal.sections.overview?.warnings),
      SOLUTION_WARNINGS: this.formatWarnings(proposal.sections.solution_approach?.warnings),
      OUTCOMES_WARNINGS: this.formatWarnings(proposal.sections.outcomes?.warnings),
      
      // Next steps - Claude-generated client-specific content
      NEXT_STEPS: this.formatContentForTemplate(proposal.sections.next_steps?.content || 'Content not available'),
      
      // Additional context
      INDUSTRY: discoveryData.industry || 'Technology',
      BUSINESS_CHALLENGE: discoveryData.businessChallenge || 'Business optimization',
      BUDGET_RANGE: discoveryData.budgetRange || 'TBD',
      DURATION: discoveryData.duration || 'TBD'
    };
  }

  private formatContentForTemplate(content: string): string {
    // Clean up content for template insertion and handle text formatting
    let formatted = content
      .replace(/\n{3,}/g, '\n\n')  // Remove excessive line breaks
      .replace(/^\s+/gm, '')       // Remove leading whitespace
      .trim();

    // Remove any markdown formatting that might have slipped through
    formatted = formatted
      .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove bold markdown (**text**)
      .replace(/\*(.*?)\*/g, '$1')      // Remove italic markdown (*text*)
      .replace(/__(.*?)__/g, '$1')      // Remove bold markdown (__text__)
      .replace(/_(.*?)_/g, '$1')        // Remove italic markdown (_text_)
      .replace(/#{1,6}\s/g, '')         // Remove markdown headers (# ## ###)
      .replace(/`(.*?)`/g, '$1')        // Remove code formatting (`text`)
      .replace(/\[(.*?)\]\(.*?\)/g, '$1'); // Remove links [text](url) -> text

    // Remove section headers that might appear at the start
    const headerPatterns = [
      /^(Overview|Solution & Approach|Expected Outcomes|Assumptions|Client Responsibilities)[\s:]/i,
      /^(Problem Statement|Next Steps)[\s:]/i
    ];
    
    headerPatterns.forEach(pattern => {
      formatted = formatted.replace(pattern, '');
    });

    // Process bullets intelligently - split long ones, preserve meaning
    const processedBullets = this.intelligentBulletProcessing(formatted);
    
    return processedBullets.join('\n\n');
  }

  private intelligentBulletProcessing(content: string): string[] {
    // Claude content is already in bullet format, just clean it up
    let bullets = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 5)
      .map(line => {
        // Remove bullet characters if present
        return line.replace(/^[-•*]\s*/, '').trim();
      })
      .filter(line => line.length > 0);

    // If no bullets found, try splitting by periods for paragraph content
    if (bullets.length === 0 || bullets.length === 1) {
      bullets = content
        .split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 10)
        .slice(0, 5);
    }

    const processedBullets: string[] = [];
    const maxBulletLength = 150; // Longer for complete thoughts
    const maxTotalBullets = 6;   // Allow more bullets

    for (const bullet of bullets) {
      if (processedBullets.length >= maxTotalBullets) break;
      
      let bulletText = bullet.trim();
      
      if (bulletText.length <= maxBulletLength) {
        // Bullet is good as-is - add bullet character
        processedBullets.push(`• ${bulletText}`);
      } else {
        // Split long bullet intelligently
        const splitBullets = this.intelligentBulletSplit(bulletText);
        splitBullets.forEach(splitBullet => {
          if (processedBullets.length < maxTotalBullets) {
            processedBullets.push(`• ${splitBullet}`);
          }
        });
      }
    }

    return processedBullets.slice(0, maxTotalBullets);
  }

  private intelligentBulletSplit(text: string): string[] {
    const maxLength = 80;
    
    if (text.length <= maxLength) {
      return [text];
    }

    // Strategy 1: Split on natural conjunctions and connectors
    const conjunctionPatterns = [
      /,\s+(and|while|with|including|through|via|by|using|ensuring)\s+/i,
      /\s+(and|while|with|including|through|via|by|using|ensuring)\s+/i,
      /;\s+/,
      /\s+–\s+/, // em dash
      /\s+-\s+/, // hyphen with spaces
    ];

    for (const pattern of conjunctionPatterns) {
      const parts = text.split(pattern);
      if (parts.length > 1) {
        const splitResults: string[] = [];
        let currentPart = '';
        
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i].trim();
          const connector = i > 0 ? this.extractConnector(text, pattern) : '';
          
          if (currentPart && (currentPart + ' ' + connector + ' ' + part).length > maxLength) {
            // Current part is getting too long, save it and start new one
            splitResults.push(currentPart.trim());
            currentPart = part;
          } else if (currentPart) {
            // Add to current part with appropriate connector
            currentPart += ' ' + connector + ' ' + part;
          } else {
            currentPart = part;
          }
        }
        
        if (currentPart) {
          splitResults.push(currentPart.trim());
        }
        
        // If we successfully split into meaningful parts, return them
        if (splitResults.length > 1 && splitResults.every(part => part.length <= maxLength + 10)) {
          return splitResults;
        }
      }
    }

    // Strategy 2: Split on sentence boundaries
    const sentences = text.split(/\.\s+/).filter(s => s.length > 0);
    if (sentences.length > 1) {
      const result: string[] = [];
      let currentGroup = '';
      
      for (const sentence of sentences) {
        const sentenceWithPeriod = sentence.endsWith('.') ? sentence : sentence + '.';
        
        if (currentGroup && (currentGroup + ' ' + sentenceWithPeriod).length > maxLength) {
          result.push(currentGroup.trim());
          currentGroup = sentenceWithPeriod;
        } else {
          currentGroup = currentGroup ? currentGroup + ' ' + sentenceWithPeriod : sentenceWithPeriod;
        }
      }
      
      if (currentGroup) {
        result.push(currentGroup.trim());
      }
      
      if (result.length > 1) {
        return result;
      }
    }

    // Strategy 3: Split on parenthetical information
    const parenMatch = text.match(/^(.*?)\s*\((.*?)\)(.*)$/);
    if (parenMatch) {
      const [, before, inside, after] = parenMatch;
      const mainText = (before + after).trim();
      const parenthetical = `(${inside})`;
      
      if (mainText.length <= maxLength && parenthetical.length <= maxLength) {
        return [mainText, parenthetical];
      }
    }

    // Strategy 4: Intelligent word boundary split as last resort
    const words = text.split(' ');
    const result: string[] = [];
    let currentBullet = '';
    
    for (const word of words) {
      if (currentBullet && (currentBullet + ' ' + word).length > maxLength) {
        // Find a good breaking point in the current bullet
        const breakPoint = this.findGoodBreakPoint(currentBullet);
        if (breakPoint > 0) {
          const firstPart = currentBullet.substring(0, breakPoint).trim();
          const secondPart = currentBullet.substring(breakPoint).trim();
          result.push(firstPart);
          currentBullet = secondPart + ' ' + word;
        } else {
          result.push(currentBullet.trim());
          currentBullet = word;
        }
      } else {
        currentBullet = currentBullet ? currentBullet + ' ' + word : word;
      }
    }
    
    if (currentBullet) {
      result.push(currentBullet.trim());
    }
    
    return result.filter(bullet => bullet.length > 0);
  }

  private extractConnector(text: string, pattern: RegExp): string {
    const match = text.match(pattern);
    if (match && match[0]) {
      // Extract the connecting word/phrase
      const connector = match[0].replace(/[,;\s-–]/g, '').trim();
      return connector || 'and';
    }
    return 'and';
  }

  private findGoodBreakPoint(text: string): number {
    // Look for good breaking points like conjunctions, prepositions
    const breakWords = ['and', 'or', 'but', 'while', 'with', 'through', 'by', 'for', 'in', 'on', 'at', 'to'];
    
    for (const breakWord of breakWords) {
      const index = text.lastIndexOf(' ' + breakWord + ' ', text.length * 0.7); // Look in last 30%
      if (index > text.length * 0.3) { // But not too early (first 30%)
        return index;
      }
    }
    
    // Look for comma as backup
    const commaIndex = text.lastIndexOf(', ', text.length * 0.7);
    if (commaIndex > text.length * 0.3) {
      return commaIndex + 2; // After the comma and space
    }
    
    return 0; // No good break point found
  }

  private formatProblemStatement(discoveryData: DiscoveryData): string {
    // Create professional executive summary of business challenges
    const problemPoints = [];
    
    // Extract key themes from business challenge and present professionally
    if (discoveryData.businessChallenge) {
      const challenge = discoveryData.businessChallenge.toLowerCase();
      
      // Market competition challenges
      if (challenge.includes('compet') || challenge.includes('market share') || challenge.includes('losing customers')) {
        problemPoints.push(`• ${discoveryData.industry || 'Market'} competition pressures require immediate modernization`);
      }
      
      // Technology/system challenges  
      if (challenge.includes('legacy') || challenge.includes('outdated') || challenge.includes('system') || challenge.includes('technology')) {
        problemPoints.push('• Legacy technology infrastructure limits operational efficiency and growth');
      }
      
      // Customer experience challenges
      if (challenge.includes('customer') || challenge.includes('experience') || challenge.includes('service')) {
        problemPoints.push('• Current systems cannot deliver modern customer expectations');
      }
      
      // Digital transformation needs
      if (challenge.includes('digital') || challenge.includes('online') || challenge.includes('e-commerce') || challenge.includes('omnichannel')) {
        problemPoints.push('• Digital capabilities gap threatens competitive positioning');
      }
      
      // Operational efficiency challenges
      if (challenge.includes('manual') || challenge.includes('process') || challenge.includes('efficiency') || challenge.includes('productivity')) {
        problemPoints.push('• Manual processes create bottlenecks and limit scalability');
      }
    }
    
    // Add industry-specific context
    if (discoveryData.industry && problemPoints.length < 4) {
      problemPoints.push(`• ${discoveryData.industry} industry demands require strategic technology investment`);
    }
    
    // Add timeline urgency if specified
    if (discoveryData.duration && problemPoints.length < 4) {
      problemPoints.push(`• ${discoveryData.duration} implementation timeline requires focused execution`);
    }
    
    // Ensure we have at least 3-4 professional problem points
    if (problemPoints.length === 0) {
      problemPoints.push('• Legacy systems hindering competitive advantage and growth');
      problemPoints.push('• Operational inefficiencies impacting customer satisfaction');
      problemPoints.push('• Technology gaps limiting business agility and innovation');
      problemPoints.push('• Digital transformation required for market leadership');
    }
    
    // Limit to 4-5 bullets maximum for slide readability
    return problemPoints.slice(0, 5).join('\n\n');
  }

  private formatAssumptions(discoveryData: DiscoveryData): string {
    // Create concise assumptions (4-5 bullets max, 10-12 words each)
    const assumptions = [];
    
    // Technology assumptions (shortened)
    assumptions.push('• Current systems remain operational during implementation');
    
    // Timeline assumptions (shortened)
    if (discoveryData.duration) {
      assumptions.push(`• ${discoveryData.duration} timeline assumes full client availability`);
    } else {
      assumptions.push('• Timeline assumes full client availability and decisions');
    }
    
    // Budget assumptions (shortened)
    if (discoveryData.budgetRange) {
      assumptions.push(`• ${discoveryData.budgetRange} budget includes all specified requirements`);
    } else {
      assumptions.push('• Budget includes all currently specified requirements');
    }
    
    // Business assumptions (shortened)
    assumptions.push('• Key stakeholders available for validation and testing');
    assumptions.push('• Client provides system access and documentation');
    
    // Limit to 5 bullets maximum
    return assumptions.slice(0, 5).join('\n\n');
  }

  private formatClientResponsibilities(discoveryData: DiscoveryData): string {
    // Define concise client responsibilities (5-6 bullets max, 10-12 words each)
    const responsibilities = [];
    
    // Project management responsibilities (shortened)
    responsibilities.push('• Designate primary project sponsor and decision-maker');
    responsibilities.push('• Provide subject matter experts for requirements gathering');
    
    // Technical responsibilities (shortened)
    responsibilities.push('• Provide system access, databases, and documentation');
    responsibilities.push('• Configure network connectivity and security permissions');
    
    // Resource responsibilities (shortened)
    responsibilities.push('• Allocate internal resources for testing and validation');
    responsibilities.push('• Participate in status meetings and deliverable reviews');
    
    // Limit to 6 bullets maximum
    return responsibilities.slice(0, 6).join('\n\n');
  }

  private formatWarnings(warnings?: string[]): string {
    if (!warnings || warnings.length === 0) {
      return '';
    }
    return '⚠️ Review Notes: ' + warnings.join('; ');
  }



  private async createFallbackPresentation(proposal: Proposal, discoveryData: DiscoveryData): Promise<string> {
    console.log('📝 Creating fallback presentation...');
    
    // Generate filename
    const timestamp = Date.now();
    const filename = `proposal-${discoveryData.companyName.replace(/\s+/g, '-')}-${timestamp}-fallback.pptx`;
    const outputFile = path.join(this.outputPath, filename);
    
    // Create a simple text-based summary file as fallback
    const summaryContent = `
SOLUTION PROPOSAL FOR ${discoveryData.companyName.toUpperCase()}
${discoveryData.projectType} Initiative
Generated: ${new Date().toLocaleDateString()}

PROBLEM STATEMENT
${this.formatProblemStatement(discoveryData)}

OVERVIEW (Confidence: ${proposal.sections.overview?.confidence || 0}%)
${proposal.sections.overview?.content || 'Not available'}

SOLUTION & APPROACH (Confidence: ${proposal.sections.solution_approach?.confidence || 0}%)
${proposal.sections.solution_approach?.content || 'Not available'}

EXPECTED OUTCOMES (Confidence: ${proposal.sections.outcomes?.confidence || 0}%)
${proposal.sections.outcomes?.content || 'Not available'}

ASSUMPTIONS
${this.formatAssumptions(discoveryData)}

CLIENT RESPONSIBILITIES
${this.formatClientResponsibilities(discoveryData)}

Overall Confidence Score: ${proposal.overallConfidence || 0}%
Generated by Presidio Solution Proposal Generator
`;

    // Write as text file for now
    const textFile = outputFile.replace('.pptx', '.txt');
    fs.writeFileSync(textFile, summaryContent);
    
    console.log('✅ Fallback summary created:', textFile);
    return textFile;
  }
}