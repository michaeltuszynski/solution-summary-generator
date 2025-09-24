import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { Proposal, DiscoveryData } from '../types';

export class PPTXService {
  private outputPath: string;
  private templatePath: string;
  private templateFile: string;

  constructor(templatePath?: string) {
    this.outputPath = path.join(__dirname, '..', '..', 'generated');

    // Use provided template path or default to legacy location
    if (templatePath) {
      this.templateFile = templatePath;
      this.templatePath = path.dirname(templatePath);
    } else {
      // Legacy fallback
      this.templatePath = path.join(__dirname, '..', '..', 'templates');
      this.templateFile = path.join(this.templatePath, 'Solution Summary Template.pptx');
    }

    // Ensure directories exist
    if (!fs.existsSync(this.outputPath)) {
      fs.mkdirSync(this.outputPath, { recursive: true });
    }
  }

  async createPresentation(proposal: Proposal, discoveryData: DiscoveryData): Promise<string> {
    try {
      console.log('🔧 Starting template-based PPTX generation with preserved styling...');
      
      // Use the configured template file
      const templateFile = this.templateFile;

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
      
      // Next steps
      NEXT_STEPS: this.getNextStepsContent(),
      
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

    // Ensure proper bullet formatting
    formatted = formatted
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        // If line doesn't start with bullet, add one
        if (line && !line.startsWith('•') && !line.startsWith('-') && !line.startsWith('*')) {
          return '• ' + line;
        }
        // Convert other bullet types to consistent bullet
        return line.replace(/^[-*]\s/, '• ');
      })
      .join('\n\n');

    return formatted.trim();
  }

  private formatProblemStatement(discoveryData: DiscoveryData): string {
    // Create concise problem statement (4-5 bullets max, 10-12 words each)
    const problemPoints = [];
    
    // Main business challenge (shortened)
    if (discoveryData.businessChallenge) {
      const shortChallenge = this.shortenBulletPoint(discoveryData.businessChallenge);
      problemPoints.push(`• ${shortChallenge}`);
    }
    
    // Industry context (shortened)
    if (discoveryData.industry) {
      problemPoints.push(`• Competitive ${discoveryData.industry} market demands operational excellence`);
    }
    
    // Technology challenges (shortened)
    if (discoveryData.techStack) {
      problemPoints.push(`• Legacy ${discoveryData.techStack} systems limiting business agility`);
    }
    
    // Budget and timeline pressures (shortened)
    if (discoveryData.budgetRange && discoveryData.duration) {
      problemPoints.push(`• Tight ${discoveryData.duration} timeline with ${discoveryData.budgetRange} budget constraints`);
    }
    
    // Default problem statement if no specific data (shortened)
    if (problemPoints.length === 0) {
      problemPoints.push('• Legacy systems hindering operational efficiency');
      problemPoints.push('• Limited real-time business visibility');
      problemPoints.push('• Manual processes creating bottlenecks');
      problemPoints.push('• Digital transformation urgently needed');
    }
    
    // Limit to 4-5 bullets maximum
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

  private getNextStepsContent(): string {
    // Create concise next steps (5-6 bullets max, 10-12 words each)
    return [
      '• Review and validate proposal assumptions',
      '• Schedule technical deep-dive sessions',
      '• Finalize project scope and timeline',
      '• Prepare detailed Statement of Work', 
      '• Begin contract negotiations',
      '• Plan project kickoff and team allocation'
    ].slice(0, 6).join('\n\n');
  }

  private shortenBulletPoint(text: string): string {
    // Helper to shorten bullet points to 10-12 words maximum
    const words = text.split(' ');
    if (words.length <= 12) {
      return text;
    }
    
    // Take first 10 words and add ellipsis if needed
    const shortened = words.slice(0, 10).join(' ');
    return shortened.endsWith('.') ? shortened : shortened + '...';
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

NEXT STEPS
• Review and validate proposal assumptions
• Schedule technical deep-dive sessions
• Finalize project scope and timeline
• Prepare detailed Statement of Work
• Begin contract negotiations
• Plan project kickoff and team allocation

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