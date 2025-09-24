import { DiscoveryData, Proposal, ProposalSection, SectionType } from '../types';
import { BedrockService } from './bedrockService';
import { SlideGeneratorService } from './slideGeneratorService';
import { SlideConfigService } from './slideConfigService';
import { PPTXService } from './pptxService';

/**
 * Refactored ProposalService that uses configuration-driven slide generation
 */
export class ProposalServiceV2 {
  private slideGenerator: SlideGeneratorService;
  private configService: SlideConfigService;
  private pptxService: PPTXService | null = null;
  private templatePath: string | undefined;

  constructor(configPath?: string, templatePath?: string) {
    const bedrockService = new BedrockService();
    this.configService = new SlideConfigService(configPath);
    this.slideGenerator = new SlideGeneratorService(bedrockService, this.configService);
    this.templatePath = templatePath;

    // Initialize PPTX service if template path provided
    if (templatePath) {
      this.pptxService = new PPTXService(templatePath);
    }
  }

  /**
   * Generate a complete proposal using the configuration-driven system
   */
  async generateProposal(discoveryData: DiscoveryData, documentContext: string = ''): Promise<Proposal> {
    console.log('📋 Generating proposal using configuration-driven system...');

    // Generate proposal metadata
    const proposal: Proposal = {
      metadata: {
        id: this.generateId(),
        generated: new Date(),
        client: discoveryData.companyName,
        industry: discoveryData.industry,
        projectType: discoveryData.projectType
      },
      sections: {} as any,
      overallConfidence: 0
    };

    try {
      // Generate all slides based on configuration
      const slides = await this.slideGenerator.generateAllSlides(discoveryData, documentContext);

      // Map generated slides to proposal sections
      for (const slide of slides) {
        const sectionType = this.mapSlideIdToSectionType(slide.slideId);
        if (sectionType) {
          proposal.sections[sectionType] = {
            content: slide.content,
            confidence: slide.confidence,
            warnings: slide.warnings,
            generatedAt: new Date()
          };
        }
      }

      // Ensure all required sections are present (even if empty)
      this.ensureRequiredSections(proposal);

      // Calculate overall confidence
      proposal.overallConfidence = this.calculateOverallConfidence(proposal);

      console.log('✅ Proposal generation completed using configuration');

    } catch (error: any) {
      console.error('❌ Error generating proposal:', error.message);

      // Ensure we have at least empty sections
      this.ensureRequiredSections(proposal);

      // Add error information to sections
      Object.keys(proposal.sections).forEach(key => {
        if (!proposal.sections[key as SectionType].content) {
          proposal.sections[key as SectionType] = {
            content: `Error generating content: ${error.message}`,
            confidence: 0,
            warnings: ['Generation failed'],
            generatedAt: new Date()
          };
        }
      });
    }

    return proposal;
  }

  /**
   * Map slide ID from config to SectionType
   */
  private mapSlideIdToSectionType(slideId: string): SectionType | null {
    const mapping: Record<string, SectionType> = {
      'problem_statement': 'problem_statement' as any,
      'overview': 'overview',
      'solution_approach': 'solution_approach',
      'outcomes': 'outcomes',
      'next_steps': 'next_steps',
      'assumptions': 'assumptions' as any,
      'client_responsibilities': 'client_responsibilities' as any
    };

    return mapping[slideId] || null;
  }

  /**
   * Ensure all required sections are present in the proposal
   */
  private ensureRequiredSections(proposal: Proposal): void {
    const requiredSections: SectionType[] = ['overview', 'solution_approach', 'outcomes', 'next_steps'];

    for (const section of requiredSections) {
      if (!proposal.sections[section]) {
        proposal.sections[section] = {
          content: '',
          confidence: 0,
          warnings: ['Section not generated'],
          generatedAt: new Date()
        };
      }
    }
  }

  /**
   * Calculate overall confidence score
   */
  private calculateOverallConfidence(proposal: Proposal): number {
    const sections = Object.values(proposal.sections);
    if (sections.length === 0) return 0;

    const totalConfidence = sections.reduce((sum, section) => sum + section.confidence, 0);
    return Math.round(totalConfidence / sections.length);
  }

  /**
   * Generate unique ID for proposal
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Get current model being used (from config defaults)
   */
  getCurrentModel(): string {
    const defaults = this.configService.getDefaults();
    return defaults.model || 'anthropic.claude-3-5-sonnet-20241022-v2:0';
  }

  /**
   * Refresh configuration (for hot-reloading)
   */
  async refreshConfiguration(): Promise<string> {
    this.configService.reload();
    this.slideGenerator.reloadConfiguration();
    return 'Configuration reloaded successfully';
  }

  /**
   * Get configuration status
   */
  getConfigurationStatus(): any {
    const config = this.configService.getConfiguration();
    const enabledSlides = this.configService.getEnabledSlides();

    return {
      version: config.version,
      author: config.metadata.author,
      totalSlides: config.slides.length,
      enabledSlides: enabledSlides.length,
      slideNames: enabledSlides.map(s => s.title),
      model: config.defaults.model,
      compliance: {
        riskyTerms: config.compliance?.risky_terms?.length || 0,
        qualifyingTerms: config.compliance?.qualifying_terms?.length || 0
      }
    };
  }

  /**
   * Validate configuration without applying it
   */
  validateConfiguration(configPath?: string): { valid: boolean; error?: string } {
    try {
      const testService = new SlideConfigService(configPath);
      const config = testService.getConfiguration();
      testService.destroy();

      return {
        valid: true
      };
    } catch (error: any) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Generate a single slide preview (for testing)
   */
  async previewSlide(
    slideId: string,
    discoveryData: DiscoveryData,
    documentContext: string = ''
  ): Promise<any> {
    const slideConfig = this.configService.getSlideConfig(slideId);

    if (!slideConfig) {
      throw new Error(`Slide configuration not found: ${slideId}`);
    }

    const result = await this.slideGenerator.generateSlide(
      slideConfig,
      discoveryData,
      documentContext
    );

    return {
      slideId: result.slideId,
      title: result.title,
      content: result.content,
      confidence: result.confidence,
      warnings: result.warnings,
      wordCount: result.content.split(/\s+/).length,
      bulletCount: result.content.split('\n').filter(line => line.trim().startsWith('•')).length
    };
  }

  /**
   * Get all available slide configurations
   */
  getAvailableSlides(): any[] {
    const slides = this.configService.getEnabledSlides();

    return slides.map(slide => ({
      id: slide.id,
      title: slide.title,
      order: slide.order,
      hasValidation: !!slide.validation,
      hasScoring: !!slide.scoring,
      requiredKeywords: slide.validation?.required_keywords || [],
      maxBullets: slide.validation?.max_bullets || 'unlimited'
    }));
  }
}