# Configuration-Driven Slide Generation Guide

## Overview

The proposal generation system is now fully configuration-driven. This means you can:
- Add, remove, or modify slides without touching code
- Update prompts and formatting rules via YAML
- Create industry-specific configurations
- Test different prompt variations easily

## Configuration File Location

The system requires a configuration file at:
```
backend/config/slides.yaml
```

## Configuration Structure

### 1. Global Settings

```yaml
version: "1.0"
metadata:
  author: "Your Name"
  description: "Purpose of this configuration"

defaults:
  model: "anthropic.claude-3-5-sonnet-20241022-v2:0"
  max_tokens: 2000
  temperature: 0.7
```

### 2. Formatting Rules

```yaml
global_formatting:
  remove_markdown: true
  max_line_length: 150
  bullet_char: "•"
  remove_section_headers: true
```

### 3. Compliance Terms

```yaml
compliance:
  risky_terms:
    - "ensure"
    - "guarantee"
    - "comprehensive"
  qualifying_terms:
    - "proposed"
    - "designed to"
    - "anticipated"
```

### 4. Slide Definitions

Each slide configuration includes:

```yaml
slides:
  - id: "overview"                    # Unique identifier
    enabled: true                      # Enable/disable slide
    order: 1                           # Display order
    title: "Overview"                  # Slide title

    placeholder_mapping:               # PPTX template placeholders
      content: "OVERVIEW_CONTENT"
      title: "OVERVIEW_TITLE"
      confidence: "OVERVIEW_CONFIDENCE"
      warnings: "OVERVIEW_WARNINGS"

    prompt:
      template: |                      # Mustache template
        Generate content for {{companyName}}...
      variables:                       # Additional variables
        maxBullets: 5
        maxWordsPerBullet: 12

    validation:                        # Content validation rules
      required_keywords: ["presidio"]
      min_word_count: 100
      max_word_count: 300
      max_bullets: 5

    scoring:                          # Confidence scoring
      base_score: 85
      penalties:
        missing_required_keyword: 15
        contains_risky_term: 10
      bonuses:
        has_qualifying_terms: 5
```

## Template Variables

The following variables are available in prompt templates:

### From Discovery Data
- `{{companyName}}` - Client company name
- `{{industry}}` - Industry vertical
- `{{businessChallenge}}` - Main challenge
- `{{techStack}}` - Current technology
- `{{projectType}}` - Type of project
- `{{duration}}` - Project timeline
- `{{budgetRange}}` - Budget allocation
- `{{successCriteria}}` - Success metrics

### From Configuration
- Any variables defined in the `prompt.variables` section

### Conditional Sections
```yaml
{{#documentContext}}
Additional context: {{documentContext}}
{{/documentContext}}
```

## How to Add a New Slide

1. **Add slide definition** to `config/slides.yaml`:

```yaml
slides:
  - id: "risk_assessment"
    enabled: true
    order: 5
    title: "Risk Assessment"

    placeholder_mapping:
      content: "RISK_CONTENT"
      title: "RISK_TITLE"

    prompt:
      template: |
        Generate a risk assessment for {{companyName}}'s {{projectType}} project.

        Consider:
        • Technical risks related to {{techStack}}
        • Timeline risks for {{duration}} timeline
        • Budget risks for {{budgetRange}} budget

        Format as {{maxBullets}} bullet points.

      variables:
        maxBullets: 6

    validation:
      min_word_count: 150
      max_word_count: 400
```

2. **Update PPTX template** with matching placeholders:
   - Add `{RISK_CONTENT}` placeholder in PowerPoint
   - Add `{RISK_TITLE}` placeholder for the title

3. **Restart the service** (or wait for hot-reload in development)

## How to Modify Prompts

1. Open `config/slides.yaml`
2. Find the slide you want to modify
3. Update the `prompt.template` section
4. Save the file
5. In development, changes apply automatically
6. In production, restart the service

## Industry-Specific Configurations

Create different configuration files for different industries:

```
config/
  ├── slides.yaml           # Default configuration
  ├── slides-healthcare.yaml
  ├── slides-manufacturing.yaml
  └── slides-financial.yaml
```

Load the appropriate configuration based on client industry.

## Testing Configuration Changes

### 1. Validate Configuration

```bash
npx ts-node src/test-config-system.ts
```

### 2. Preview Single Slide

```javascript
const preview = await proposalService.previewSlide(
  'overview',
  discoveryData
);
```

### 3. Check Configuration Status

```javascript
const status = proposalService.getConfigurationStatus();
console.log(status);
// Output: { version, totalSlides, enabledSlides, etc. }
```

## API Endpoints for Configuration

### Get Configuration Status
```
GET /api/config/status
```

### Validate Configuration
```
POST /api/config/validate
Body: { configPath: "/path/to/config.yaml" }
```

### Preview Slide Generation
```
POST /api/config/preview/:slideId
Body: { discoveryData: {...} }
```

### List Available Slides
```
GET /api/config/slides
```

## Best Practices

### 1. Prompt Writing
- Keep prompts concise and specific
- Use variables for flexibility
- Include formatting instructions
- Specify output constraints

### 2. Validation Rules
- Set reasonable word count limits
- Include required keywords for compliance
- Validate bullet point counts

### 3. Scoring Configuration
- Start with base score of 85
- Apply penalties for violations
- Add bonuses for good practices

### 4. Version Control
- Track configuration changes in Git
- Document why changes were made
- Test configurations before production

## Troubleshooting

### Configuration Not Found Error
```
❌ Configuration file not found!
The proposal generation system requires a configuration file at:
/path/to/backend/config/slides.yaml
```

**Solution:** Ensure `config/slides.yaml` exists

### Validation Errors
```
Configuration validation failed: "slides[0].prompt" is required
```

**Solution:** Check the configuration against the schema

### Template Variable Not Found
```
Missing variable: companyName
```

**Solution:** Ensure all variables in templates are provided

### Hot-Reload Not Working
**Solution:** Only works when `NODE_ENV=development`

## Migration from Hardcoded System

1. The system no longer supports hardcoded prompts
2. All prompts must be defined in configuration
3. Configuration file is required - no fallback mode
4. Existing PPTX templates remain compatible

## Configuration Schema

The full JSON schema is available at:
```
config/schemas/slide-config.schema.json
```

Use this for IDE validation and auto-completion.

## Examples

### Minimal Configuration
```yaml
version: "1.0"
metadata:
  author: "Team"
  description: "Minimal working configuration"

defaults:
  model: "anthropic.claude-3-5-sonnet-20241022-v2:0"

slides:
  - id: "overview"
    enabled: true
    order: 1
    title: "Overview"
    placeholder_mapping:
      content: "OVERVIEW_CONTENT"
    prompt:
      template: "Generate an overview for {{companyName}}"
```

### Full Featured Configuration
See `config/slides.yaml` for a complete example with all features.

## Support

For issues or questions about configuration:
1. Check this guide
2. Validate your configuration file
3. Review the test output
4. Check logs for detailed errors