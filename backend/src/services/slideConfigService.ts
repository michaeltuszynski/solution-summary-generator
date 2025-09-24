import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import Joi from 'joi';

export interface SlideConfig {
  id: string;
  enabled: boolean;
  order: number;
  title: string;
  placeholder_mapping: {
    content: string;
    title?: string;
    confidence?: string;
    warnings?: string;
  };
  prompt: {
    template: string;
    variables?: Record<string, any>;
  };
  validation?: {
    required_keywords?: string[];
    min_word_count?: number;
    max_word_count?: number;
    max_bullets?: number;
    should_contain_numbers?: boolean;
  };
  scoring?: {
    base_score?: number;
    penalties?: Record<string, number>;
    bonuses?: Record<string, number>;
  };
}

export interface StaticSlideConfig {
  id: string;
  order: number;
  title: string;
  placeholder_mapping: Record<string, string>;
  source: 'discovery_data' | 'template' | 'static';
}

export interface GlobalConfig {
  version: string;
  template?: any; // Template configuration section
  metadata: {
    author: string;
    description: string;
    created?: string;
  };
  defaults: {
    model?: string;
    max_tokens?: number;
    temperature?: number;
  };
  global_formatting?: {
    remove_markdown?: boolean;
    max_line_length?: number;
    bullet_char?: string;
    remove_section_headers?: boolean;
  };
  compliance?: {
    risky_terms?: string[];
    absolute_terms?: string[];
    qualifying_terms?: string[];
  };
  slides: SlideConfig[];
  static_slides?: StaticSlideConfig[];
}

export class SlideConfigService {
  private config: GlobalConfig | null = null;
  private configPath: string;
  private lastModified: Date | null = null;
  private isWatching: boolean = false;

  constructor(configPath?: string) {
    this.configPath = configPath || path.join(__dirname, '..', '..', 'config', 'slides.yaml');
    this.loadConfiguration();

    // Enable hot-reloading in development
    if (process.env.NODE_ENV === 'development') {
      this.watchConfiguration();
    }
  }

  /**
   * Load and parse the configuration file
   */
  private loadConfiguration(): void {
    try {
      console.log('📖 Loading slide configuration from:', this.configPath);

      if (!fs.existsSync(this.configPath)) {
        throw new Error(`Configuration file not found: ${this.configPath}`);
      }

      const fileContent = fs.readFileSync(this.configPath, 'utf8');
      const parsedConfig = YAML.parse(fileContent) as GlobalConfig;

      // Validate the configuration
      this.validateConfiguration(parsedConfig);

      this.config = parsedConfig;
      this.lastModified = new Date();

      console.log(`✅ Loaded ${parsedConfig.slides.length} slide configurations`);

    } catch (error: any) {
      console.error('❌ Failed to load configuration:', error.message);

      // If loading fails, use a minimal fallback configuration
      if (!this.config) {
        this.config = this.getFallbackConfiguration();
      }
    }
  }

  /**
   * Validate configuration against schema
   */
  private validateConfiguration(config: GlobalConfig): void {
    const schema = Joi.object({
      version: Joi.string().required(),
      template: Joi.object().optional(), // Allow template configuration
      metadata: Joi.object({
        author: Joi.string().required(),
        description: Joi.string().required(),
        created: Joi.string()
      }).required(),
      defaults: Joi.object({
        model: Joi.string(),
        max_tokens: Joi.number(),
        temperature: Joi.number().min(0).max(1)
      }),
      global_formatting: Joi.object({
        remove_markdown: Joi.boolean(),
        max_line_length: Joi.number(),
        bullet_char: Joi.string(),
        remove_section_headers: Joi.boolean()
      }),
      compliance: Joi.object({
        risky_terms: Joi.array().items(Joi.string()),
        absolute_terms: Joi.array().items(Joi.string()),
        qualifying_terms: Joi.array().items(Joi.string())
      }),
      slides: Joi.array().items(
        Joi.object({
          id: Joi.string().required(),
          enabled: Joi.boolean().required(),
          order: Joi.number().required(),
          title: Joi.string().required(),
          placeholder_mapping: Joi.object({
            content: Joi.string().required(),
            title: Joi.string(),
            confidence: Joi.string(),
            warnings: Joi.string()
          }).required(),
          prompt: Joi.object({
            template: Joi.string().required(),
            variables: Joi.object()
          }).required(),
          validation: Joi.object({
            required_keywords: Joi.array().items(Joi.string()),
            min_word_count: Joi.number(),
            max_word_count: Joi.number(),
            max_bullets: Joi.number(),
            should_contain_numbers: Joi.boolean()
          }),
          scoring: Joi.object({
            base_score: Joi.number(),
            penalties: Joi.object(),
            bonuses: Joi.object()
          })
        })
      ).required(),
      static_slides: Joi.array().items(
        Joi.object({
          id: Joi.string().required(),
          order: Joi.number().required(),
          title: Joi.string().required(),
          placeholder_mapping: Joi.object().required(),
          source: Joi.string().valid('discovery_data', 'template', 'static').required()
        })
      )
    });

    const { error } = schema.validate(config);
    if (error) {
      throw new Error(`Configuration validation failed: ${error.message}`);
    }
  }

  /**
   * Watch configuration file for changes (development only)
   */
  private watchConfiguration(): void {
    if (this.isWatching) return;

    console.log('👀 Watching configuration file for changes...');

    fs.watchFile(this.configPath, (curr, prev) => {
      if (curr.mtime !== prev.mtime) {
        console.log('🔄 Configuration file changed, reloading...');
        this.loadConfiguration();
      }
    });

    this.isWatching = true;
  }

  /**
   * Get fallback configuration if loading fails
   */
  private getFallbackConfiguration(): GlobalConfig {
    return {
      version: '1.0',
      metadata: {
        author: 'System',
        description: 'Fallback configuration'
      },
      defaults: {
        model: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        max_tokens: 2000,
        temperature: 0.7
      },
      slides: []
    };
  }

  /**
   * Get the current configuration
   */
  getConfiguration(): GlobalConfig {
    if (!this.config) {
      this.loadConfiguration();
    }
    return this.config!;
  }

  /**
   * Get configuration for a specific slide
   */
  getSlideConfig(slideId: string): SlideConfig | undefined {
    const config = this.getConfiguration();
    return config.slides.find(slide => slide.id === slideId && slide.enabled);
  }

  /**
   * Get all enabled slides in order
   */
  getEnabledSlides(): SlideConfig[] {
    const config = this.getConfiguration();
    return config.slides
      .filter(slide => slide.enabled)
      .sort((a, b) => a.order - b.order);
  }

  /**
   * Get static slides
   */
  getStaticSlides(): StaticSlideConfig[] {
    const config = this.getConfiguration();
    return config.static_slides || [];
  }

  /**
   * Get global formatting rules
   */
  getGlobalFormatting(): any {
    const config = this.getConfiguration();
    return config.global_formatting || {};
  }

  /**
   * Get compliance terms
   */
  getComplianceTerms(): any {
    const config = this.getConfiguration();
    return config.compliance || {};
  }

  /**
   * Get default model settings
   */
  getDefaults(): any {
    const config = this.getConfiguration();
    return config.defaults || {};
  }

  /**
   * Reload configuration manually
   */
  reload(): void {
    console.log('♻️ Manually reloading configuration...');
    this.loadConfiguration();
  }

  /**
   * Validate a custom configuration
   */
  validateCustomConfig(config: any): { valid: boolean; error?: string } {
    try {
      this.validateConfiguration(config);
      return { valid: true };
    } catch (error: any) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Update configuration (for testing or dynamic updates)
   */
  updateConfiguration(config: GlobalConfig): void {
    this.validateConfiguration(config);
    this.config = config;
    console.log('✅ Configuration updated programmatically');
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.isWatching) {
      fs.unwatchFile(this.configPath);
      this.isWatching = false;
    }
  }
}