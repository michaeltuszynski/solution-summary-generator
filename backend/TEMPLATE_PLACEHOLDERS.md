# PowerPoint Template Placeholders

This document outlines the placeholders that should be used in the "Solution Summary Template.pptx" file for dynamic content replacement.

## Slide Structure and Placeholders

### Slide 1: Title Slide
- `{{COMPANY_NAME}}` - Client company name
- `{{PROJECT_TYPE}}` - Type of project (e.g., "Digital Transformation Initiative")
- `{{CONFIDENCE_SCORE}}` - Overall proposal confidence percentage
- `{{DATE}}` - Current date

### Slide 2: Overview
- `{{SLIDE_TITLE}}` - Will be replaced with "Overview"
- `{{SLIDE_CONTENT}}` - Main content for the overview section
- `{{CONFIDENCE}}` - Section confidence percentage
- `{{WARNINGS}}` - Any warnings or review notes (optional)

### Slide 3: Solution & Approach
- `{{SLIDE_TITLE}}` - Will be replaced with "Solution & Approach"
- `{{SLIDE_CONTENT}}` - Main content for the solution approach
- `{{CONFIDENCE}}` - Section confidence percentage
- `{{WARNINGS}}` - Any warnings or review notes (optional)

### Slide 4: Expected Outcomes
- `{{SLIDE_TITLE}}` - Will be replaced with "Expected Outcomes"
- `{{SLIDE_CONTENT}}` - Main content for expected outcomes
- `{{CONFIDENCE}}` - Section confidence percentage
- `{{WARNINGS}}` - Any warnings or review notes (optional)

### Slide 5: Next Steps
- `{{SLIDE_TITLE}}` - Will be replaced with "Next Steps"
- `{{NEXT_STEPS}}` - Bulleted list of next steps
- `{{COMPANY_NAME}}` - Client company name for personalization

## Template Preparation Instructions

1. **Create Text Placeholders**: In your PowerPoint template, add text boxes with the placeholder text exactly as shown above (including the double curly braces).

2. **Styling**: Format the placeholders with your desired fonts, colors, and positioning. The formatting will be preserved when the content is replaced.

3. **Branding**: Add your logos, colors, and brand elements directly to the template slides.

4. **Layout**: Position the placeholders where you want the dynamic content to appear.

## Example Template Structure

```
Slide 1 (Title):
- Large title: "{{COMPANY_NAME}}"
- Subtitle: "Solution Proposal"
- Project type: "{{PROJECT_TYPE}}"
- Confidence: "Confidence: {{CONFIDENCE_SCORE}}"
- Date: "{{DATE}}"

Slide 2-4 (Content):
- Header: "{{SLIDE_TITLE}}"
- Main content area: "{{SLIDE_CONTENT}}"
- Top right: "{{CONFIDENCE}}"
- Bottom (optional): "{{WARNINGS}}"

Slide 5 (Next Steps):
- Header: "{{SLIDE_TITLE}}"
- Content area: "{{NEXT_STEPS}}"
- Footer: "Questions? Contact your Presidio team..."
```

## Notes

- Placeholders are case-sensitive
- Keep placeholder text in separate text boxes for best results
- The system will automatically format content as bullet points where appropriate
- Confidence scores are displayed as percentages
- Warnings are optional and will be hidden if not present
