import Mustache from 'mustache';
import { DiscoveryData } from '../types';

export interface TemplateContext {
  // From DiscoveryData
  companyName: string;
  industry: string;
  businessChallenge: string;
  techStack: string;
  projectType: string;
  duration: string;
  budgetRange: string;
  successCriteria: string;

  // Additional context
  documentContext?: string;

  // Variables from config
  [key: string]: any;
}

export class PromptTemplateEngine {
  /**
   * Render a prompt template with the given context
   */
  render(template: string, context: TemplateContext): string {
    try {
      // Disable HTML escaping for Mustache since we're not generating HTML
      Mustache.escape = (text: string) => text;

      // Render the template with the context
      const rendered = Mustache.render(template, context);

      // Clean up any extra whitespace
      return this.cleanupOutput(rendered);
    } catch (error: any) {
      console.error('❌ Template rendering error:', error.message);
      throw new Error(`Failed to render prompt template: ${error.message}`);
    }
  }

  /**
   * Create context from DiscoveryData and additional variables
   */
  createContext(
    discoveryData: DiscoveryData,
    documentContext: string = '',
    additionalVariables: Record<string, any> = {}
  ): TemplateContext {
    return {
      // Core discovery data
      companyName: discoveryData.companyName,
      industry: discoveryData.industry || 'Technology',
      businessChallenge: discoveryData.businessChallenge || 'Business optimization',
      techStack: discoveryData.techStack || 'Not specified',
      projectType: discoveryData.projectType,
      duration: discoveryData.duration || 'TBD',
      budgetRange: discoveryData.budgetRange || 'TBD',
      successCriteria: discoveryData.successCriteria || 'Not specified',

      // Additional context
      documentContext: documentContext ? documentContext.substring(0, 1500) : '',

      // Spread any additional variables from the config
      ...additionalVariables
    };
  }

  /**
   * Clean up rendered output
   */
  private cleanupOutput(text: string): string {
    return text
      // Remove excessive line breaks
      .replace(/\n{3,}/g, '\n\n')
      // Remove trailing whitespace
      .replace(/[ \t]+$/gm, '')
      // Remove leading whitespace from lines
      .trim();
  }

  /**
   * Validate that required variables are present in context
   */
  validateContext(template: string, context: TemplateContext): string[] {
    const missingVariables: string[] = [];

    // Find all Mustache variables in the template
    const variablePattern = /\{\{([^}]+)\}\}/g;
    let match;

    while ((match = variablePattern.exec(template)) !== null) {
      const variableName = match[1]?.trim();

      if (!variableName) continue;

      // Skip section variables (they start with # or /)
      if (variableName.startsWith('#') || variableName.startsWith('/')) {
        continue;
      }

      // Check if the variable exists in the context
      if (!this.hasNestedProperty(context, variableName)) {
        missingVariables.push(variableName);
      }
    }

    return missingVariables;
  }

  /**
   * Check if a nested property exists in an object
   */
  private hasNestedProperty(obj: any, path: string): boolean {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current === null || current === undefined || !(key in current)) {
        return false;
      }
      current = current[key];
    }

    return true;
  }

  /**
   * Process a template with conditional sections
   */
  renderWithConditions(
    template: string,
    context: TemplateContext,
    conditions: Record<string, boolean> = {}
  ): string {
    // Add condition flags to the context
    const contextWithConditions = {
      ...context,
      ...conditions
    };

    return this.render(template, contextWithConditions);
  }

  /**
   * Extract variables used in a template
   */
  extractVariables(template: string): string[] {
    const variables: Set<string> = new Set();
    const variablePattern = /\{\{([^}]+)\}\}/g;
    let match;

    while ((match = variablePattern.exec(template)) !== null) {
      const variableName = match[1]?.trim();
      // Skip section variables
      if (variableName && !variableName.startsWith('#') && !variableName.startsWith('/')) {
        variables.add(variableName);
      }
    }

    return Array.from(variables);
  }

  /**
   * Replace placeholders with formatted content
   */
  formatPromptSections(prompt: string, formatting: any): string {
    let formatted = prompt;

    // Apply formatting rules if specified
    if (formatting) {
      if (formatting.remove_markdown) {
        formatted = this.removeMarkdown(formatted);
      }

      if (formatting.max_line_length) {
        formatted = this.enforceLineLength(formatted, formatting.max_line_length);
      }
    }

    return formatted;
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
   * Enforce maximum line length
   */
  private enforceLineLength(text: string, maxLength: number): string {
    const lines = text.split('\n');
    const processedLines: string[] = [];

    for (const line of lines) {
      if (line.length <= maxLength) {
        processedLines.push(line);
      } else {
        // Split long lines at word boundaries
        const words = line.split(' ');
        let currentLine = '';

        for (const word of words) {
          if ((currentLine + ' ' + word).length <= maxLength) {
            currentLine += (currentLine ? ' ' : '') + word;
          } else {
            if (currentLine) processedLines.push(currentLine);
            currentLine = word;
          }
        }

        if (currentLine) processedLines.push(currentLine);
      }
    }

    return processedLines.join('\n');
  }
}