import { DiscoveryData, Proposal } from '../types';
import { ProposalServiceV2 } from './proposalServiceV2';
import { TemplateSelectionService, TemplateSelectionCriteria } from './templateSelectionService';
import fs from 'fs';
import path from 'path';

/**
 * ProposalService - Configuration-driven proposal generation with template selection
 */
export class ProposalService {
  private v2Service: ProposalServiceV2 | null = null;
  private templateService: TemplateSelectionService;
  private currentTemplateId: string | null = null;

  constructor(templateId?: string) {
    this.templateService = new TemplateSelectionService();

    // Initialize with specified template or default
    this.initializeWithTemplate(templateId);
  }

  private initializeWithTemplate(templateId?: string) {
    try {
      // Select template based on criteria
      const criteria: TemplateSelectionCriteria = templateId ? {
        templateId: templateId
      } : {};

      const selectedTemplate = this.templateService.selectTemplate(criteria);
      this.currentTemplateId = selectedTemplate.id;

      console.log(`🎯 Using template: ${selectedTemplate.name} (${selectedTemplate.id})`);

      // Initialize V2 service with selected template's configuration
      this.v2Service = new ProposalServiceV2(selectedTemplate.configPath, selectedTemplate.templatePath);
    } catch (error: any) {
      console.error('❌ Failed to initialize template:', error.message);

      // Try legacy fallback
      const legacyConfigPath = path.join(__dirname, '..', '..', 'config', 'slides.yaml');
      if (fs.existsSync(legacyConfigPath)) {
        console.log('📋 Falling back to legacy configuration');
        this.v2Service = new ProposalServiceV2(legacyConfigPath);
      } else {
        throw new Error('No configuration available for proposal generation');
      }
    }
  }

  /**
   * Generate a proposal using the configuration-driven system with automatic template selection
   */
  async generateProposal(discoveryData: DiscoveryData, documentContext: string = '', templateId?: string): Promise<Proposal> {
    // If a different template is requested, reinitialize
    if (templateId && templateId !== this.currentTemplateId) {
      this.initializeWithTemplate(templateId);
    }

    // If no specific template requested, select based on discovery data
    if (!templateId && !this.currentTemplateId) {
      const criteria: TemplateSelectionCriteria = {
        industry: discoveryData.industry,
        projectType: discoveryData.projectType
      };
      const selectedTemplate = this.templateService.selectTemplate(criteria);
      this.initializeWithTemplate(selectedTemplate.id);
    }

    if (!this.v2Service) {
      throw new Error('Proposal service not initialized');
    }

    return this.v2Service.generateProposal(discoveryData, documentContext);
  }

  /**
   * Refresh configuration (reload from file)
   */
  async refreshBestModel(): Promise<string> {
    if (!this.v2Service) {
      throw new Error('Proposal service not initialized');
    }
    return await this.v2Service.refreshConfiguration();
  }

  /**
   * Get current model being used (from configuration)
   */
  getCurrentModel(): string {
    if (!this.v2Service) {
      throw new Error('Proposal service not initialized');
    }
    return this.v2Service.getCurrentModel();
  }

  /**
   * Get configuration status
   */
  getConfigurationStatus(): any {
    if (!this.v2Service) {
      throw new Error('Proposal service not initialized');
    }
    return {
      ...this.v2Service.getConfigurationStatus(),
      currentTemplate: this.currentTemplateId,
      availableTemplates: this.templateService.getAvailableTemplates().map(t => ({
        id: t.id,
        name: t.name,
        industries: t.industries,
        projectTypes: t.projectTypes
      }))
    };
  }

  /**
   * Validate configuration file
   */
  validateConfiguration(configPath?: string): { valid: boolean; error?: string } {
    if (!this.v2Service) {
      throw new Error('Proposal service not initialized');
    }
    return this.v2Service.validateConfiguration(configPath);
  }

  /**
   * Preview a single slide (for testing)
   */
  async previewSlide(
    slideId: string,
    discoveryData: DiscoveryData,
    documentContext: string = ''
  ): Promise<any> {
    if (!this.v2Service) {
      throw new Error('Proposal service not initialized');
    }
    return this.v2Service.previewSlide(slideId, discoveryData, documentContext);
  }

  /**
   * Get list of available slides from configuration
   */
  getAvailableSlides(): any[] {
    if (!this.v2Service) {
      throw new Error('Proposal service not initialized');
    }
    return this.v2Service.getAvailableSlides();
  }

  /**
   * Get list of available templates
   */
  getAvailableTemplates() {
    return this.templateService.getAvailableTemplates();
  }

  /**
   * Get current template ID
   */
  getCurrentTemplateId(): string | null {
    return this.currentTemplateId;
  }

  /**
   * Switch to a different template
   */
  switchTemplate(templateId: string): void {
    this.initializeWithTemplate(templateId);
  }
}