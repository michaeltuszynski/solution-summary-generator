import { DiscoveryData, ProposalSection } from '../types';
import { BedrockService } from './bedrockService';
import { SlideConfigService, SlideConfig } from './slideConfigService';
import { PromptTemplateEngine, TemplateContext } from './promptTemplateEngine';

export interface SlideGenerationResult {
  slideId: string;
  title: string;
  content: string;
  confidence: number;
  warnings: string[];
  placeholders: {
    content: string;
    title?: string;
    confidence?: string;
    warnings?: string;
  };
}

export class SlideGeneratorService {
  private bedrockService: BedrockService;
  private configService: SlideConfigService;
  private templateEngine: PromptTemplateEngine;

  constructor(
    bedrockService?: BedrockService,
    configService?: SlideConfigService,
    templateEngine?: PromptTemplateEngine
  ) {
    this.bedrockService = bedrockService || new BedrockService();
    this.configService = configService || new SlideConfigService();
    this.templateEngine = templateEngine || new PromptTemplateEngine();
  }

  /**
   * Generate all enabled slides for a proposal
   */
  async generateAllSlides(
    discoveryData: DiscoveryData,
    documentContext: string = '',
    progressCallback?: (slideTitle: string, slideNumber: number, totalSlides: number) => void
  ): Promise<SlideGenerationResult[]> {
    const slides = this.configService.getEnabledSlides();
    const results: SlideGenerationResult[] = [];
    const totalSlides = slides.length;

    for (let i = 0; i < slides.length; i++) {
      const slideConfig = slides[i];
      try {
        console.log(`📝 Generating slide ${i + 1}/${totalSlides}: ${slideConfig.title}`);

        // Call progress callback if provided
        if (progressCallback) {
          progressCallback(slideConfig.title, i + 1, totalSlides);
        }

        const result = await this.generateSlide(slideConfig, discoveryData, documentContext);
        results.push(result);
      } catch (error: any) {
        console.error(`❌ Failed to generate slide ${slideConfig.id}:`, error.message);
        // Add error result
        results.push({
          slideId: slideConfig.id,
          title: slideConfig.title,
          content: `Error generating ${slideConfig.title}: ${error.message}`,
          confidence: 0,
          warnings: ['Generation failed'],
          placeholders: slideConfig.placeholder_mapping
        });
      }
    }

    return results;
  }

  /**
   * Generate a single slide based on configuration
   */
  async generateSlide(
    slideConfig: SlideConfig,
    discoveryData: DiscoveryData,
    documentContext: string = ''
  ): Promise<SlideGenerationResult> {
    // Create context for template rendering
    const context = this.createTemplateContext(
      slideConfig,
      discoveryData,
      documentContext
    );

    // Render the prompt template
    const prompt = this.templateEngine.render(slideConfig.prompt.template, context);

    // Get generation settings
    const defaults = this.configService.getDefaults();
    const maxTokens = defaults.max_tokens || 2000;
    const temperature = defaults.temperature || 0.7;

    // Generate content using Bedrock
    const messages = [{ role: 'user', content: prompt }];
    const response = await this.bedrockService.invokeModel(messages, maxTokens, temperature);
    const content = response.content[0]?.text || 'No content generated';

    // Process and validate the content
    const processedContent = this.processContent(content, slideConfig);
    const confidence = this.calculateConfidence(processedContent, slideConfig);
    const warnings = this.validateContent(processedContent, slideConfig);

    return {
      slideId: slideConfig.id,
      title: slideConfig.title,
      content: processedContent,
      confidence,
      warnings,
      placeholders: slideConfig.placeholder_mapping
    };
  }

  /**
   * Create template context for a slide
   */
  private createTemplateContext(
    slideConfig: SlideConfig,
    discoveryData: DiscoveryData,
    documentContext: string
  ): TemplateContext {
    // Get variables from config
    const variables = slideConfig.prompt.variables || {};

    // Create the full context
    return this.templateEngine.createContext(
      discoveryData,
      documentContext,
      variables
    );
  }

  /**
   * Process generated content based on formatting rules
   */
  private processContent(content: string, slideConfig: SlideConfig): string {
    const formatting = this.configService.getGlobalFormatting();
    let processed = content;

    // Remove markdown if configured
    if (formatting.remove_markdown) {
      processed = this.removeMarkdown(processed);
    }

    // Remove section headers if configured
    if (formatting.remove_section_headers) {
      processed = this.removeSectionHeaders(processed, slideConfig.title);
    }

    // Format bullets
    if (formatting.bullet_char) {
      processed = this.standardizeBullets(processed, formatting.bullet_char);
    }

    // Clean up whitespace
    processed = processed
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^\s+/gm, '')
      .trim();

    return processed;
  }

  /**
   * Calculate confidence score based on configuration
   */
  private calculateConfidence(content: string, slideConfig: SlideConfig): number {
    const scoring = slideConfig.scoring;
    if (!scoring) return 85; // Default score

    let score = scoring.base_score || 85;
    const compliance = this.configService.getComplianceTerms();

    // Check for risky terms
    if (compliance.risky_terms && scoring.penalties?.contains_risky_term) {
      const hasRiskyTerm = compliance.risky_terms.some((term: string) =>
        content.toLowerCase().includes(term.toLowerCase())
      );
      if (hasRiskyTerm) {
        score -= scoring.penalties.contains_risky_term;
      }
    }

    // Check for qualifying terms
    if (compliance.qualifying_terms && scoring.bonuses?.has_qualifying_terms) {
      const hasQualifyingTerm = compliance.qualifying_terms.some((term: string) =>
        content.toLowerCase().includes(term.toLowerCase())
      );
      if (hasQualifyingTerm) {
        score += scoring.bonuses.has_qualifying_terms;
      }
    }

    // Check word count
    const wordCount = content.split(/\s+/).length;
    const validation = slideConfig.validation;

    if (validation) {
      if (validation.min_word_count && wordCount < validation.min_word_count) {
        score -= scoring.penalties?.too_short || 20;
      }
      if (validation.max_word_count && wordCount > validation.max_word_count) {
        score -= scoring.penalties?.too_long || 10;
      }
    }

    // Check for required keywords
    if (validation?.required_keywords && scoring.penalties?.missing_required_keyword) {
      for (const keyword of validation.required_keywords) {
        if (!content.toLowerCase().includes(keyword.toLowerCase())) {
          score -= scoring.penalties.missing_required_keyword;
        }
      }
    }

    // Check for numbers if required
    if (validation?.should_contain_numbers && !content.match(/\d+/)) {
      score -= scoring.penalties?.missing_metrics || 10;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Validate content and generate warnings
   */
  private validateContent(content: string, slideConfig: SlideConfig): string[] {
    const warnings: string[] = [];
    const compliance = this.configService.getComplianceTerms();

    // Check for risky terms
    if (compliance.risky_terms) {
      compliance.risky_terms.forEach((term: string) => {
        if (content.toLowerCase().includes(term.toLowerCase())) {
          warnings.push(`⚠️ Contains risky term: "${term}" - consider revision`);
        }
      });
    }

    // Check for absolute terms
    if (compliance.absolute_terms) {
      compliance.absolute_terms.forEach((term: string) => {
        const regex = new RegExp(`\\b${term.toLowerCase()}\\b`, 'i');
        if (regex.test(content)) {
          warnings.push(`⚠️ Absolute statement detected: "${term}" - consider qualifying`);
        }
      });
    }

    // Check validation rules
    const validation = slideConfig.validation;
    if (validation) {
      const wordCount = content.split(/\s+/).length;

      if (validation.min_word_count && wordCount < validation.min_word_count) {
        warnings.push(`⚠️ Content too short: ${wordCount} words (minimum: ${validation.min_word_count})`);
      }

      if (validation.max_word_count && wordCount > validation.max_word_count) {
        warnings.push(`⚠️ Content too long: ${wordCount} words (maximum: ${validation.max_word_count})`);
      }

      if (validation.required_keywords) {
        validation.required_keywords.forEach(keyword => {
          if (!content.toLowerCase().includes(keyword.toLowerCase())) {
            warnings.push(`⚠️ Missing required keyword: "${keyword}"`);
          }
        });
      }

      // Check bullet count
      const bullets = content.split('\n').filter(line => line.trim().startsWith('•'));
      if (validation.max_bullets && bullets.length > validation.max_bullets) {
        warnings.push(`⚠️ Too many bullet points: ${bullets.length} (maximum: ${validation.max_bullets})`);
      }
    }

    return warnings;
  }

  /**
   * Remove markdown formatting
   */
  private removeMarkdown(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/__(.*?)__/g, '$1')
      .replace(/_(.*?)_/g, '$1')
      .replace(/#{1,6}\s/g, '')
      .replace(/`(.*?)`/g, '$1')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1');
  }

  /**
   * Remove section headers
   */
  private removeSectionHeaders(text: string, slideTitle: string): string {
    // Create patterns for common section headers
    const patterns = [
      new RegExp(`^${slideTitle}[:\\s]*`, 'i'),
      /^(Overview|Solution & Approach|Expected Outcomes|Next Steps)[:\s]*/i,
      /^(Problem Statement|Assumptions|Client Responsibilities)[:\s]*/i
    ];

    let processed = text;
    patterns.forEach(pattern => {
      processed = processed.replace(pattern, '');
    });

    return processed;
  }

  /**
   * Standardize bullet formatting
   */
  private standardizeBullets(text: string, bulletChar: string): string {
    // Replace various bullet characters with the standard one
    const bulletPatterns = [/^[-*·•]/gm, /^\d+\./gm];
    let processed = text;

    bulletPatterns.forEach(pattern => {
      processed = processed.replace(pattern, bulletChar);
    });

    return processed;
  }

  /**
   * Generate static content for slides that don't need AI
   */
  generateStaticContent(
    slideSource: string,
    discoveryData: DiscoveryData
  ): string {
    switch (slideSource) {
      case 'discovery_data':
        return this.formatProblemStatement(discoveryData);
      case 'template':
        return this.getTemplateContent(discoveryData);
      default:
        return 'Content not available';
    }
  }

  /**
   * Format problem statement from discovery data
   */
  private formatProblemStatement(discoveryData: DiscoveryData): string {
    const bullets = [
      `${discoveryData.companyName} is facing ${discoveryData.businessChallenge}`,
      `Current technology stack: ${discoveryData.techStack || 'Legacy systems'}`,
      `Project scope: ${discoveryData.projectType} over ${discoveryData.duration || 'TBD'}`,
      `Budget allocation: ${discoveryData.budgetRange || 'To be determined'}`,
      `Success measured by: ${discoveryData.successCriteria || 'Business objectives'}`
    ];

    return bullets.join('\n\n');
  }

  /**
   * Get template content for static slides
   */
  private getTemplateContent(discoveryData: DiscoveryData): string {
    // This would be customized based on specific requirements
    return 'Template content based on discovery data';
  }

  /**
   * Reload configuration
   */
  reloadConfiguration(): void {
    this.configService.reload();
    console.log('✅ Slide generation configuration reloaded');
  }
}