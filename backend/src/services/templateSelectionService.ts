import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

export interface TemplateInfo {
  id: string;
  name: string;
  description: string;
  file: string;
  industries: string[];
  projectTypes: string[];
  configPath: string;
  templatePath: string;
}

export interface TemplateConfig {
  template: {
    id: string;
    name: string;
    description: string;
    file: string;
    industries: string[];
    project_types: string[];
    global_mappings?: Record<string, string>;
  };
  [key: string]: any; // Rest of the config (slides, defaults, etc.)
}

export interface TemplateSelectionCriteria {
  industry?: string;
  projectType?: string;
  templateId?: string; // Direct selection
}

/**
 * Service for managing and selecting proposal templates
 */
export class TemplateSelectionService {
  private templatesDir: string;
  private availableTemplates: Map<string, TemplateInfo>;
  private defaultTemplateId: string = 'default';

  constructor() {
    this.templatesDir = path.join(__dirname, '..', '..', 'config', 'templates');
    this.availableTemplates = new Map();
    this.loadAvailableTemplates();
  }

  /**
   * Scan and load all available templates
   */
  private loadAvailableTemplates(): void {
    try {
      if (!fs.existsSync(this.templatesDir)) {
        console.warn(`⚠️ Templates directory not found: ${this.templatesDir}`);
        // Fall back to legacy configuration
        this.loadLegacyConfiguration();
        return;
      }

      const templateDirs = fs.readdirSync(this.templatesDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      for (const templateDir of templateDirs) {
        try {
          const configPath = path.join(this.templatesDir, templateDir, 'config.yaml');
          const templatePath = path.join(this.templatesDir, templateDir);

          if (!fs.existsSync(configPath)) {
            console.warn(`⚠️ No config.yaml found in template directory: ${templateDir}`);
            continue;
          }

          const configContent = fs.readFileSync(configPath, 'utf-8');
          const config = yaml.load(configContent) as TemplateConfig;

          if (!config.template) {
            console.warn(`⚠️ Invalid template configuration in ${templateDir}: missing template section`);
            continue;
          }

          const templateInfo: TemplateInfo = {
            id: config.template.id,
            name: config.template.name,
            description: config.template.description,
            file: config.template.file,
            industries: config.template.industries || ['all'],
            projectTypes: config.template.project_types || ['all'],
            configPath: configPath,
            templatePath: path.join(templatePath, config.template.file)
          };

          this.availableTemplates.set(templateInfo.id, templateInfo);
          console.log(`✅ Loaded template: ${templateInfo.name} (${templateInfo.id})`);
        } catch (error: any) {
          console.error(`❌ Error loading template ${templateDir}:`, error.message);
        }
      }

      if (this.availableTemplates.size === 0) {
        console.warn('⚠️ No templates found, falling back to legacy configuration');
        this.loadLegacyConfiguration();
      }
    } catch (error: any) {
      console.error('❌ Error loading templates:', error.message);
      this.loadLegacyConfiguration();
    }
  }

  /**
   * Load legacy configuration for backward compatibility
   */
  private loadLegacyConfiguration(): void {
    const legacyConfigPath = path.join(__dirname, '..', '..', 'config', 'slides.yaml');
    const legacyTemplatePath = path.join(__dirname, '..', '..', 'templates', 'Solution Summary Template.pptx');

    if (fs.existsSync(legacyConfigPath)) {
      const templateInfo: TemplateInfo = {
        id: 'legacy',
        name: 'Legacy Configuration',
        description: 'Backward compatibility with old configuration structure',
        file: 'Solution Summary Template.pptx',
        industries: ['all'],
        projectTypes: ['all'],
        configPath: legacyConfigPath,
        templatePath: legacyTemplatePath
      };

      this.availableTemplates.set('legacy', templateInfo);
      this.defaultTemplateId = 'legacy';
      console.log('📋 Using legacy configuration for backward compatibility');
    }
  }

  /**
   * Get all available templates
   */
  getAvailableTemplates(): TemplateInfo[] {
    return Array.from(this.availableTemplates.values());
  }

  /**
   * Select the most appropriate template based on criteria
   */
  selectTemplate(criteria: TemplateSelectionCriteria): TemplateInfo {
    // Direct selection by ID
    if (criteria.templateId) {
      const template = this.availableTemplates.get(criteria.templateId);
      if (template) {
        console.log(`✅ Selected template by ID: ${template.name}`);
        return template;
      }
      console.warn(`⚠️ Template ${criteria.templateId} not found, using default`);
    }

    // Score-based selection
    let bestTemplate: TemplateInfo | null = null;
    let bestScore = -1;

    for (const template of this.availableTemplates.values()) {
      let score = 0;

      // Check industry match
      if (criteria.industry) {
        if (template.industries.includes('all')) {
          score += 1; // Partial match for universal templates
        } else if (template.industries.includes(criteria.industry)) {
          score += 3; // Strong match for specific industry
        }
      }

      // Check project type match
      if (criteria.projectType) {
        if (template.projectTypes.includes('all')) {
          score += 1; // Partial match for universal templates
        } else if (template.projectTypes.includes(criteria.projectType)) {
          score += 3; // Strong match for specific project type
        }
      }

      // Default template gets a small boost if no specific matches
      if (template.id === this.defaultTemplateId && score === 0) {
        score = 0.5;
      }

      if (score > bestScore) {
        bestScore = score;
        bestTemplate = template;
      }
    }

    // Fallback to default template
    if (!bestTemplate) {
      bestTemplate = this.availableTemplates.get(this.defaultTemplateId) || null;
      if (!bestTemplate) {
        // Last resort: get first available template
        const firstTemplate = this.availableTemplates.values().next().value;
        bestTemplate = firstTemplate || null;
      }
    }

    if (!bestTemplate) {
      throw new Error('No templates available');
    }

    console.log(`🎯 Selected template: ${bestTemplate.name} (score: ${bestScore})`);
    return bestTemplate;
  }

  /**
   * Load the complete configuration for a selected template
   */
  loadTemplateConfig(templateId: string): TemplateConfig {
    const templateInfo = this.availableTemplates.get(templateId);
    if (!templateInfo) {
      throw new Error(`Template not found: ${templateId}`);
    }

    try {
      const configContent = fs.readFileSync(templateInfo.configPath, 'utf-8');
      return yaml.load(configContent) as TemplateConfig;
    } catch (error: any) {
      throw new Error(`Failed to load template configuration: ${error.message}`);
    }
  }

  /**
   * Get template info by ID
   */
  getTemplateInfo(templateId: string): TemplateInfo | undefined {
    return this.availableTemplates.get(templateId);
  }

  /**
   * Check if a template exists
   */
  templateExists(templateId: string): boolean {
    return this.availableTemplates.has(templateId);
  }

  /**
   * Get the default template
   */
  getDefaultTemplate(): TemplateInfo {
    const defaultTemplate = this.availableTemplates.get(this.defaultTemplateId);
    if (!defaultTemplate) {
      throw new Error('Default template not found');
    }
    return defaultTemplate;
  }
}