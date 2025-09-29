# Solution Summary Template Iteration Guide

## Overview
This guide provides comprehensive instructions for iterating, customizing, and improving Solution Summary templates to generate high-quality proposals tailored to specific clients and industries.

## Table of Contents
1. [Input Map Overview](#input-map-overview)
2. [Template Architecture](#template-architecture)
3. [Iteration Workflow](#iteration-workflow)
4. [Prompt Engineering Best Practices](#prompt-engineering-best-practices)
5. [Industry Customization](#industry-customization)
6. [Testing and Validation](#testing-and-validation)
7. [Troubleshooting](#troubleshooting)

---

## Input Map Overview

### Primary Input Categories

#### 1. Discovery Data (User Form Inputs)
```yaml
Core Fields:
  - companyName: Client company identifier
  - industry: Vertical market classification
  - businessChallenge: Problem statement (free text)
  - projectType: Solution category
  - techStack: Current technology environment

Constraints:
  - duration: Project timeline range
  - budgetRange: Financial parameters
  - successCriteria: Measurable outcomes
```

#### 2. Document Context
- Optional PDF/text uploads
- Processed into 1500-character chunks
- Injected via `{{documentContext}}` variable

#### 3. Template Configuration
- Model parameters (temperature, max_tokens)
- Formatting rules (bullet style, line length)
- Validation criteria (word counts, keywords)
- Compliance terms (risky/qualifying language)

### Data Flow
```
User Input → DiscoveryData → Template Selection → Prompt Generation → AI Processing → Output Validation → PowerPoint
```

---

## Template Architecture

### Directory Structure
```
backend/config/templates/
├── default/
│   ├── config.yaml      # Template configuration
│   └── template.pptx    # PowerPoint template file
├── healthcare/          # Industry-specific template
├── financial/           # Industry-specific template
└── manufacturing/       # Industry-specific template
```

### Configuration Schema
```yaml
template:
  id: "unique-identifier"
  name: "Display Name"
  industries: ["Healthcare", "all"]
  project_types: ["Digital Transformation", "all"]

defaults:
  model: "anthropic.claude-3-5-sonnet-20241022-v2:0"
  temperature: 0.7
  max_tokens: 2000

slides:
  - id: "slide-identifier"
    title: "Slide Title"
    prompt:
      template: "Mustache template string"
      variables:
        customVar: value
    validation:
      min_word_count: 100
      max_word_count: 300
```

---

## Iteration Workflow

### 1. Baseline Establishment
```bash
# Generate baseline outputs
npm run generate -- --template=default --save-baseline

# Review outputs in: outputs/baseline/
```

### 2. Identify Improvement Areas
- **Content Quality Issues**
  - Generic language
  - Missing industry context
  - Weak value propositions

- **Formatting Problems**
  - Excessive bullet points
  - Inconsistent structure
  - Poor readability

- **Compliance Concerns**
  - Risky terminology
  - Over-promising language
  - Missing qualifiers

### 3. Iterative Refinement Process

#### A. Prompt Variable Optimization
```yaml
# Before
variables:
  maxBullets: 8
  maxWordsPerBullet: 20

# After (optimized for slide space)
variables:
  maxBullets: 5
  maxWordsPerBullet: 12
```

#### B. Context Enhancement
```yaml
# Before
prompt:
  template: |
    Generate content for {{companyName}}.

# After (industry-aware)
prompt:
  template: |
    Generate content for {{companyName}} in the {{industry}} sector.
    Consider industry-specific requirements:
    {{#isHealthcare}}
    - HIPAA compliance
    - Patient data security
    {{/isHealthcare}}
```

#### C. Output Formatting
```yaml
# Add formatting instructions
CRITICAL FORMATTING REQUIREMENTS:
- Use bullet points (•) for all content
- NO markdown formatting
- Keep each bullet to ONE line (12 words max)
- Maximum 5 bullet points total
```

### 4. Version Control
```bash
# Tag template versions
git tag template-v1.2.0 -m "Improved healthcare prompts"

# Track changes in changelog
echo "v1.2.0 - Enhanced healthcare compliance language" >> CHANGELOG.md
```

---

## Prompt Engineering Best Practices

### 1. Variable Usage

#### Mustache Syntax
```mustache
Basic: {{variableName}}
Conditional: {{#hasValue}}...{{/hasValue}}
Inverted: {{^isEmpty}}...{{/isEmpty}}
```

#### Common Patterns
```yaml
# Industry-specific content
{{#isManufacturing}}
Focus on operational efficiency and supply chain optimization.
{{/isManufacturing}}

# Optional context inclusion
{{#documentContext}}
Additional Context:
{{documentContext}}
{{/documentContext}}
```

### 2. Prompt Structure

#### Effective Template Pattern
```yaml
prompt:
  template: |
    # Role Definition
    You are a senior solution architect at Presidio...

    # Context Injection
    Client Information:
    - Company: {{companyName}}
    - Challenge: {{businessChallenge}}

    # Task Specification
    Generate content that:
    • Addresses specific pain points
    • Aligns with industry standards

    # Formatting Rules
    CRITICAL REQUIREMENTS:
    - Use bullet points only
    - Maximum {{maxBullets}} bullets

    # Output Instruction
    Write concise bullet points:
```

### 3. Token Optimization

#### Strategies
- Remove redundant instructions
- Use variable substitution for repeated content
- Leverage context windows efficiently
- Implement progressive disclosure

#### Example
```yaml
# Inefficient (350 tokens)
prompt: |
  Generate a detailed solution approach for {{companyName}}.
  The solution should address their {{businessChallenge}}.
  Make sure to include technical details about {{techStack}}.
  Consider their industry which is {{industry}}.
  [... lengthy repetitive instructions ...]

# Optimized (150 tokens)
prompt: |
  For {{companyName}} ({{industry}}):
  Challenge: {{businessChallenge}}
  Tech: {{techStack}}

  Generate solution approach:
  • Architecture addressing challenge
  • {{techStack}} integration
  • Industry-specific considerations

  Format: {{maxBullets}} bullets, {{maxWordsPerBullet}} words each
```

---

## Industry Customization

### Healthcare Template Adjustments
```yaml
slides:
  - id: "compliance_considerations"
    title: "Compliance & Security"
    prompt:
      template: |
        Healthcare-specific requirements:
        • HIPAA compliance architecture
        • Patient data encryption standards
        • Audit trail implementation
        • BAA considerations with third parties

variables:
  complianceFrameworks: ["HIPAA", "HITECH", "FDA 21 CFR Part 11"]
  securityPriority: "maximum"
```

### Financial Services Modifications
```yaml
compliance:
  risky_terms:
    - "guarantee returns"
    - "eliminate risk"
  required_terms:
    - "regulatory compliance"
    - "SOX requirements"

variables:
  regulatoryContext: ["SOX", "PCI-DSS", "GDPR", "Basel III"]
```

### Manufacturing Optimizations
```yaml
prompt:
  focus_areas:
    - "OT/IT convergence"
    - "Digital twin implementation"
    - "Predictive maintenance"
    - "Supply chain visibility"

variables:
  industryMetrics: ["OEE", "MTBF", "cycle time", "yield"]
```

---

## Testing and Validation

### 1. Unit Testing Prompts
```javascript
// test/prompts.test.js
describe('Prompt Generation', () => {
  test('includes all required variables', () => {
    const prompt = generatePrompt(discoveryData);
    expect(prompt).toContain(discoveryData.companyName);
    expect(prompt).toContain(discoveryData.industry);
  });

  test('respects token limits', () => {
    const tokens = countTokens(prompt);
    expect(tokens).toBeLessThan(2000);
  });
});
```

### 2. Output Validation
```yaml
validation:
  # Content requirements
  min_word_count: 100
  max_word_count: 300
  required_keywords: ["presidio", "solution"]

  # Structure requirements
  max_bullets: 5
  bullet_format: "^[•\\-\\*]\\s"

  # Compliance checks
  forbidden_terms: ["guarantee", "ensure", "comprehensive"]
  required_qualifiers: ["proposed", "anticipated", "designed to"]
```

### 3. A/B Testing Framework
```bash
# Generate variants
npm run generate -- --template=default --variant=A --output=test/A/
npm run generate -- --template=optimized --variant=B --output=test/B/

# Compare outputs
npm run compare -- --baseline=test/A/ --variant=test/B/
```

### 4. Quality Metrics
```javascript
const metrics = {
  readability: calculateFleschScore(content),
  specificity: countClientReferences(content),
  compliance: checkRiskyTerms(content),
  completeness: validateSections(content),
  confidence: averageConfidenceScore(sections)
};
```

---

## Troubleshooting

### Common Issues and Solutions

#### 1. Generic Output
**Problem**: Content lacks client specificity
**Solution**:
- Increase `{{companyName}}` references in prompts
- Add industry-specific context variables
- Include `Focus on {{companyName}}'s specific situation` instruction

#### 2. Excessive Length
**Problem**: Bullets exceed slide space
**Solution**:
```yaml
variables:
  maxBullets: 4  # Reduce from 6
  maxWordsPerBullet: 10  # Reduce from 15

prompt:
  template: |
    CRITICAL: Maximum {{maxBullets}} bullets
    Each bullet: {{maxWordsPerBullet}} words MAX
```

#### 3. Compliance Violations
**Problem**: Risky terms in output
**Solution**:
```yaml
prompt:
  template: |
    AVOID these terms: ensure, guarantee, comprehensive
    USE these instead: designed to, anticipated, proposed

compliance:
  risky_terms: [...expanded list...]
  auto_replace:
    "will ensure": "designed to support"
    "guarantee": "aim to achieve"
```

#### 4. Low Confidence Scores
**Problem**: Sections scoring below 70%
**Solution**:
- Enhance context with document uploads
- Add more specific success criteria
- Improve prompt clarity and structure
- Increase base_score for well-defined sections

#### 5. Formatting Inconsistencies
**Problem**: Mixed bullet styles, markdown artifacts
**Solution**:
```yaml
global_formatting:
  remove_markdown: true
  standardize_bullets: "•"
  clean_whitespace: true

post_processing:
  - remove_pattern: "^#+\\s"  # Remove headers
  - replace: {"\\*\\*(.+?)\\*\\*": "$1"}  # Remove bold
```

---

## Best Practices Checklist

### Before Template Modification
- [ ] Create baseline outputs for comparison
- [ ] Document current issues and goals
- [ ] Back up existing configuration
- [ ] Set up version control branch

### During Iteration
- [ ] Make incremental changes
- [ ] Test each modification independently
- [ ] Document rationale for changes
- [ ] Validate against multiple test cases

### After Changes
- [ ] Run full test suite
- [ ] Compare outputs with baseline
- [ ] Check compliance and validation
- [ ] Update documentation
- [ ] Tag version in git

### Production Deployment
- [ ] Peer review changes
- [ ] Test with real client data (sanitized)
- [ ] Monitor confidence scores
- [ ] Collect user feedback
- [ ] Plan next iteration cycle

---

## Appendix: Quick Command Reference

```bash
# Development Commands
npm run dev              # Start development server
npm run test:prompts     # Test prompt generation
npm run validate         # Check template syntax

# Generation Commands
npm run generate -- --template=healthcare --test
npm run generate -- --company="Acme Corp" --industry="Healthcare"

# Analysis Commands
npm run analyze:output   # Analyze generation quality
npm run compare:templates # Compare template outputs
npm run metrics          # Generate quality metrics report
```

---

## Support and Resources

- **Template Examples**: `/backend/config/templates/examples/`
- **Quick Reference**: `/docs/TEMPLATE_QUICK_REFERENCE.md`
- **Issue Tracking**: Create issues in project repository
- **Version History**: See `CHANGELOG.md` in template directories

For additional assistance, consult the development team or review the source code documentation.