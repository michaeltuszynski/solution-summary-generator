# Template Quick Reference Card

## Essential Variables (Mustache Syntax)

### Discovery Data Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `{{companyName}}` | Client company name | "Acme Corp" |
| `{{industry}}` | Industry vertical | "Healthcare" |
| `{{businessChallenge}}` | Problem statement | "Legacy system modernization" |
| `{{projectType}}` | Solution category | "Digital Transformation" |
| `{{techStack}}` | Current technology | "Java, Oracle, VMware" |
| `{{duration}}` | Timeline | "6-12 months" |
| `{{budgetRange}}` | Budget | "$500K - $1M" |
| `{{successCriteria}}` | Success metrics | "50% reduction in processing time" |
| `{{documentContext}}` | Uploaded doc content | Auto-extracted text |

### Custom Variables (per slide)
| Variable | Default | Purpose |
|----------|---------|---------|
| `{{maxBullets}}` | 5 | Limit bullet points |
| `{{maxWordsPerBullet}}` | 12 | Control line length |
| `{{bulletChar}}` | • | Bullet style |

---

## Common Prompt Patterns

### Basic Structure
```yaml
You are a senior solution architect at Presidio...

Client: {{companyName}} ({{industry}})
Challenge: {{businessChallenge}}

Generate content that:
• [Specific requirement]
• [Another requirement]

Format: {{maxBullets}} bullets, {{maxWordsPerBullet}} words each
```

### Conditional Content
```yaml
{{#isHealthcare}}
Include HIPAA compliance considerations
{{/isHealthcare}}

{{#documentContext}}
Context: {{documentContext}}
{{/documentContext}}
```

---

## Validation Rules

### Content Validation
```yaml
validation:
  min_word_count: 100
  max_word_count: 300
  max_bullets: 5
  required_keywords: ["presidio"]
```

### Compliance Terms
```yaml
# AVOID
risky_terms: ["guarantee", "ensure", "comprehensive", "validate"]

# USE INSTEAD
qualifying_terms: ["proposed", "designed to", "anticipated", "intended"]
```

---

## Scoring Formula

```
Base Score (default: 85)
- Penalties:
  - Missing keyword: -15
  - Risky term found: -10
  - Too short/long: -10 to -20
+ Bonuses:
  + Has qualifiers: +5
  + Contains metrics: +5
= Final Score (0-100)
```

---

## File Structure

```
backend/config/templates/{template-name}/
├── config.yaml       # Template configuration
└── template.pptx     # PowerPoint file
```

---

## Testing Commands

```bash
# Quick test with defaults
npm run generate -- --test

# Test specific template
npm run generate -- --template=healthcare --test

# Validate configuration
npm run validate:template -- --template=default

# Compare outputs
npm run compare -- --baseline=A --variant=B
```

---

## Formatting Rules

### Global Settings
```yaml
global_formatting:
  remove_markdown: true      # Strip **, ##, etc.
  max_line_length: 150       # Wrap long lines
  bullet_char: "•"           # Standardize bullets
  remove_section_headers: true
```

### Critical Requirements (in prompts)
```
CRITICAL FORMATTING REQUIREMENTS:
- Use bullet points (•) only
- NO markdown formatting
- NO section headers
- Maximum X bullets
- Y words per bullet max
```

---

## Industry Customization

### Healthcare
- Add: HIPAA, PHI, interoperability
- Focus: Compliance, patient outcomes
- Avoid: Guarantees about patient data

### Financial Services
- Add: SOX, PCI-DSS, regulatory
- Focus: Risk management, compliance
- Avoid: "eliminate risk", "guarantee returns"

### Manufacturing
- Add: OEE, lean, supply chain
- Focus: Efficiency, automation
- Avoid: "zero downtime"

### Government
- Add: FedRAMP, security clearance
- Focus: Compliance, transparency
- Avoid: Specific vendor commitments

---

## Troubleshooting Matrix

| Problem | Quick Fix |
|---------|-----------|
| Generic output | Add more `{{companyName}}` refs |
| Too long | Reduce `maxBullets` and `maxWordsPerBullet` |
| Low confidence | Enhance context, clarify prompts |
| Risky terms | Add to `risky_terms` list |
| Poor formatting | Check `remove_markdown: true` |

---

## Model Parameters

```yaml
defaults:
  model: "anthropic.claude-3-5-sonnet-20241022-v2:0"
  temperature: 0.7    # 0.5-0.9 range
  max_tokens: 2000    # Per slide limit
```

---

## Quick Wins

1. **Reduce bullet count**: 5 → 4 bullets
2. **Shorten bullets**: 15 → 10 words
3. **Add qualifiers**: "will" → "designed to"
4. **Industry context**: Add `{{#isIndustry}}` blocks
5. **Clear formatting**: Add CRITICAL REQUIREMENTS section

---

## Emergency Fixes

```yaml
# Output too generic?
prompt: |
  Specifically for {{companyName}}, not generic...

# Compliance issues?
prompt: |
  NEVER use: guarantee, ensure
  ALWAYS use: proposed, anticipated

# Formatting broken?
global_formatting:
  remove_markdown: true
  clean_aggressive: true
```

---

## Version Control

```bash
# Before changes
git checkout -b template-update
cp config.yaml config.yaml.backup

# After testing
git add -A
git commit -m "Template: [change description]"
git tag template-v1.2.0
```

---

**Need Help?** See `/docs/TEMPLATE_ITERATION_GUIDE.md` for detailed instructions.