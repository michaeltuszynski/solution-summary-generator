import axios, { AxiosInstance } from 'axios';
import { DiscoveryData, Proposal, ProposalSection, SectionType, ClaudeRequest, ClaudeResponse } from '../types';

export class ProposalService {
  private claudeClient: AxiosInstance;
  private bestModel: string = 'claude-3-sonnet-20240229'; // fallback

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }

    this.claudeClient = axios.create({
      baseURL: 'https://api.anthropic.com/v1',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      timeout: 120000 // 2 minutes timeout
    });

    // Initialize best model on startup
    this.initializeBestModel();
  }

  private async initializeBestModel(): Promise<void> {
    try {
      // Anthropic doesn't provide a public models endpoint, so we'll test known models
      // by making a small test request to see which ones are available
      const knownModels = [
        'claude-sonnet-4-20250514',    // Latest Claude Sonnet 4 (most capable)
        'claude-3-5-sonnet-20241022',  // Latest Claude 3.5 Sonnet
        'claude-3-5-sonnet-20240620',  // Previous Claude 3.5 Sonnet
        'claude-3-sonnet-20240229',    // Claude 3 Sonnet
        'claude-3-haiku-20240307'      // Claude 3 Haiku (fallback)
      ];

      // Test models in priority order
      for (const modelId of knownModels) {
        if (await this.testModel(modelId)) {
          this.bestModel = modelId;
          console.log(`✅ Using available Claude model: ${this.bestModel}`);
          return;
        }
      }

      console.warn('⚠️ No preferred models available, using fallback:', this.bestModel);
    } catch (error) {
      console.warn('⚠️ Failed to initialize model, using fallback:', this.bestModel);
    }
  }

  private async testModel(modelId: string): Promise<boolean> {
    try {
      console.log(`🔍 Testing model availability: ${modelId}`);
      
      // Make a minimal test request to see if the model is available
      const testRequest = {
        model: modelId,
        max_tokens: 10,
        temperature: 0.1,
        messages: [{ role: 'user', content: 'Hi' }]
      };

      await this.claudeClient.post('/messages', testRequest);
      console.log(`✅ Model ${modelId} is available`);
      return true;
    } catch (error: any) {
      console.log(`❌ Model ${modelId} test failed:`, {
        status: error.response?.status,
        error: error.response?.data?.error?.type,
        message: error.response?.data?.error?.message || error.message
      });
      
      // If we get a 404 or model not found error, this model isn't available
      if (error.response?.status === 404 || error.response?.data?.error?.type === 'not_found_error') {
        return false;
      }
      // For other errors (rate limits, etc.), assume the model exists but log the issue
      if (error.response?.status === 429) {
        console.warn(`⚠️ Rate limited testing ${modelId}, assuming available`);
        return true;
      }
      // For auth errors, this is a bigger problem
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.error(`🚫 Authentication error testing ${modelId}:`, error.response?.data);
        return false;
      }
      return true;
    }
  }

  async generateProposal(discoveryData: DiscoveryData, documentContext: string = ''): Promise<Proposal> {
    const sections: SectionType[] = ['overview', 'solution_approach', 'outcomes', 'next_steps'];
    
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

    // Generate each section
    for (const sectionType of sections) {
      try {
        console.log(`Generating ${sectionType} section...`);
        proposal.sections[sectionType] = await this.generateSection(
          sectionType,
          discoveryData,
          documentContext
        );
      } catch (error: any) {
        console.error(`Error generating ${sectionType}:`, error.message);
        proposal.sections[sectionType] = {
          content: `Error generating ${sectionType} section: ${error.message}`,
          confidence: 0,
          warnings: ['Generation failed'],
          generatedAt: new Date()
        };
      }
    }

    // Calculate overall confidence
    const confidenceScores = Object.values(proposal.sections).map(s => s.confidence);
    proposal.overallConfidence = Math.round(
      confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length
    );

    return proposal;
  }

  private async generateSection(
    sectionType: SectionType,
    discoveryData: DiscoveryData,
    documentContext: string
  ): Promise<ProposalSection> {
    const prompt = this.buildPrompt(sectionType, discoveryData, documentContext);

    try {
      const claudeRequest: ClaudeRequest = {
        model: this.bestModel,
        max_tokens: 2000,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      };

      const response = await this.claudeClient.post<ClaudeResponse>('/messages', claudeRequest);
      const content = response.data.content[0]?.text || 'No content generated';
      
      const confidence = this.calculateConfidence(content, sectionType);
      const warnings = this.checkRAPCompliance(content);

      return {
        content,
        confidence,
        warnings,
        generatedAt: new Date()
      };
    } catch (error: any) {
      console.error('Claude API error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          model: this.bestModel
        }
      });
      
      const errorMessage = error.response?.data?.error?.message || error.message || 'Unknown API error';
      throw new Error(`Failed to generate ${sectionType}: ${errorMessage}`);
    }
  }

  private buildPrompt(sectionType: SectionType, data: DiscoveryData, context: string): string {
    const baseContext = `You are a senior solution architect at Presidio, a leading digital services and solutions provider.

Client Information:
- Company: ${data.companyName}
- Industry: ${data.industry}
- Business Challenge: ${data.businessChallenge}
- Technology Stack: ${data.techStack || 'Not specified'}
- Project Type: ${data.projectType}
- Duration: ${data.duration || 'TBD'}
- Budget Range: ${data.budgetRange || 'TBD'}
- Success Criteria: ${data.successCriteria || 'Not specified'}

${context ? `Additional Context from Documents:\n${context.substring(0, 1500)}\n` : ''}`;

    switch (sectionType) {
      case 'overview':
        return `${baseContext}

Generate an Overview section for a PowerPoint slide presentation. This content will be displayed on a slide with 24pt font, so keep it concise and impactful.

Create bullet points that cover:
• ${data.companyName}'s position in the ${data.industry} industry and current challenges
• Why their business challenge matters strategically to their success
• How this connects to their broader business objectives
• Presidio's proposed approach to address their needs

CRITICAL FORMATTING REQUIREMENTS:
- Use bullet points (•) for all content - NO paragraphs
- NO markdown formatting (no ##, **, _, etc.)
- NO section headers or titles in the content (the slide already has a title)
- Do NOT start with "Overview" or any section name
- Keep each bullet point to ONE line maximum (10-12 words per bullet)
- Use simple, clear language for executive audience
- Maximum 4-5 bullet points total (must fit on slide with 24pt font)
- Avoid commitment words like "ensure", "guarantee", "comprehensive"
- Use qualifying language: "proposed", "designed to", "anticipated"
- Be concise and impactful - every word must add value

Write SHORT, punchy bullet points for the Overview slide content ONLY (no headers):`;

      case 'solution_approach':
        return `${baseContext}

Generate a Solution & Approach section for a PowerPoint slide. This content will be displayed with 24pt font, so keep it concise and scannable.

Create bullet points covering these areas:
• High-level solution architecture that addresses their challenge
• Key technology decisions and integration strategy
• Phased delivery approach with clear implementation stages
• Agile methodology and risk mitigation approach
• Testing, validation, and quality assurance strategy
• Project governance and communication framework

CRITICAL FORMATTING REQUIREMENTS:
- Use bullet points (•) for all content - NO paragraphs or numbered lists
- NO markdown formatting (no ##, **, _, etc.)
- NO section headers or titles in the content (the slide already has a title)
- Do NOT start with "Solution & Approach" or any section name
- Keep each bullet point to ONE line maximum (10-12 words per bullet)
- Maximum 5-6 bullet points total (must fit on slide with 24pt font)
- Use outcome-focused language, avoid quantity guarantees
- Include qualifying terms: "estimated", "anticipated", "proposed"
- Avoid risky terms: "ensure", "validate", "comprehensive", "guarantee"
- Focus on approach and capabilities, not specific deliverables
- Be concise and impactful - every word must add value

Write SHORT, punchy bullet points for the Solution & Approach slide content ONLY (no headers):`;

      case 'outcomes':
        return `${baseContext}

Generate an Expected Outcomes section for a PowerPoint slide. This content will be displayed with 24pt font, so keep it concise and impactful.

Create bullet points for expected outcomes that are:
• Directly aligned with their business challenge and success criteria
• Measurable and value-focused (business benefits, not effort metrics)
• Mix of business outcomes (revenue, efficiency, strategic benefits)
• Technical outcomes (system improvements, performance gains, new capabilities)
• Realistic and achievable within their constraints

CRITICAL FORMATTING REQUIREMENTS:
- Use bullet points (•) for all content - NO paragraphs or numbered sections
- NO markdown formatting (no ##, **, _, etc.)
- NO section headers or titles in the content (the slide already has a title)
- Do NOT start with "Expected Outcomes" or any section name
- Keep each bullet point to ONE line maximum (10-12 words per bullet)
- Maximum 4-5 bullet points total (must fit on slide with 24pt font)
- Use business language that executives understand
- Avoid technical jargon or implementation details
- Focus on "what" will be achieved, not "how"
- Include quantifiable benefits where possible (percentages, timeframes)
- Use qualifying terms: "anticipated", "projected", "designed to achieve"
- Be concise and impactful - every word must add value

Write SHORT, punchy bullet points for the Expected Outcomes slide content ONLY (no headers):`;

      case 'next_steps':
        return `${baseContext}

Generate a Next Steps section for a PowerPoint slide. This content will be displayed with 24pt font, so keep it concise and actionable.

Create bullet points for immediate next steps that are:
• Specific to ${data.companyName} and their ${data.projectType} project
• Actionable steps that move the engagement forward
• Clear timeline-based activities for the next 30-60 days
• Focused on validation, planning, and project initiation
• Relevant to their ${data.industry} industry requirements
• Appropriate for their ${data.budgetRange} budget and ${data.duration} timeline

CRITICAL FORMATTING REQUIREMENTS:
- Use bullet points (•) for all content - NO paragraphs or numbered lists
- NO markdown formatting (no ##, **, _, etc.)
- NO section headers or titles in the content (the slide already has a title)
- Do NOT start with "Next Steps" or any section name
- Keep each bullet point to ONE line maximum (10-12 words per bullet)
- Maximum 5-6 bullet points total (must fit on slide with 24pt font)
- Use action-oriented language with clear deliverables
- Include specific timeframes where appropriate (e.g., "within 2 weeks")
- Focus on mutual collaboration and partnership approach
- Avoid generic steps - make them client and project specific
- Be concise and impactful - every word must add value

Write SHORT, punchy bullet points for the Next Steps slide content ONLY (no headers):`;

      default:
        throw new Error(`Unknown section type: ${sectionType}`);
    }
  }

  private calculateConfidence(content: string, sectionType: SectionType): number {
    let score = 85; // Start optimistic

    // Check for risky terms (reduce confidence)
    const riskyTerms = ['ensure', 'guarantee', 'comprehensive', 'validate', 'will deliver'];
    riskyTerms.forEach(term => {
      if (content.toLowerCase().includes(term.toLowerCase())) {
        score -= 10;
      }
    });

    // Check for good qualifying terms (increase confidence)
    const goodTerms = ['proposed', 'designed to', 'anticipated', 'estimated', 'intended to'];
    const hasGoodTerms = goodTerms.some(term => 
      content.toLowerCase().includes(term.toLowerCase())
    );
    if (hasGoodTerms) score += 5;

    // Check content length
    const wordCount = content.split(/\s+/).length;
    if (wordCount < 100) score -= 20;
    if (wordCount > 800) score -= 10;

    // Check for structure (paragraphs)
    const paragraphs = content.split('\n\n').length;
    if (paragraphs < 2) score -= 10;

    // Section-specific checks
    switch (sectionType) {
      case 'overview':
        if (!content.toLowerCase().includes('presidio')) score -= 15;
        break;
      case 'outcomes':
        if (!content.match(/\d+/)) score -= 10; // Should have some numbers/metrics
        break;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private checkRAPCompliance(content: string): string[] {
    const warnings: string[] = [];
    const riskyTerms = [
      'ensure', 'guarantee', 'comprehensive', 'validate',
      'will deliver', 'promise', 'commit to'
    ];

    riskyTerms.forEach(term => {
      if (content.toLowerCase().includes(term.toLowerCase())) {
        warnings.push(`⚠️ Contains risky term: "${term}" - consider revision`);
      }
    });

    // Check for absolute statements
    const absoluteTerms = ['always', 'never', 'all', 'every', 'completely'];
    absoluteTerms.forEach(term => {
      const regex = new RegExp(`\\b${term.toLowerCase()}\\b`, 'i');
      if (regex.test(content)) {
        warnings.push(`⚠️ Absolute statement detected: "${term}" - consider qualifying`);
      }
    });

    return warnings;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Public method to refresh model selection if needed
  async refreshBestModel(): Promise<string> {
    await this.initializeBestModel();
    return this.bestModel;
  }

  // Get current model being used
  getCurrentModel(): string {
    return this.bestModel;
  }
}
