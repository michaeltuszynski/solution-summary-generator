# Example Template Configurations

This directory contains industry-specific template examples demonstrating best practices for customizing solution summaries.

## Available Examples

### 📋 Healthcare Template
- **Focus**: HIPAA compliance, patient outcomes, clinical integration
- **Special Features**:
  - Compliance-first slide ordering
  - PHI protection language
  - Clinical workflow considerations
  - EHR/EMR integration patterns

### 💰 Financial Services Template
- **Focus**: Regulatory compliance, risk management, core banking
- **Special Features**:
  - SOX/PCI-DSS alignment
  - Risk control frameworks
  - Real-time transaction processing
  - Audit trail emphasis

### 🏭 Manufacturing Template
- **Focus**: Industry 4.0, OT/IT convergence, operational efficiency
- **Special Features**:
  - Smart factory architecture
  - OEE optimization
  - Supply chain visibility
  - Predictive maintenance

## Usage

To use these examples:

1. **Copy the template directory** to the main templates folder:
   ```bash
   cp -r examples/healthcare ../healthcare
   ```

2. **Customize the configuration** for your specific needs

3. **Add the corresponding PowerPoint template** (template.pptx)

4. **Test the template**:
   ```bash
   npm run generate -- --template=healthcare --test
   ```

## Key Differences from Default Template

| Aspect | Default | Healthcare | Financial | Manufacturing |
|--------|---------|------------|-----------|---------------|
| Temperature | 0.7 | 0.6 | 0.5 | 0.7 |
| Focus | Generic | Compliance | Risk/Regulatory | Efficiency |
| Metrics | Business | Clinical | Financial | Operational |
| Special Slides | None | Clinical Integration | Risk Management | Smart Factory |

## Customization Tips

1. **Industry Language**: Each template uses industry-specific terminology
2. **Compliance Focus**: Risky terms are industry-adjusted
3. **Metrics**: KPIs match industry standards
4. **Slide Order**: Prioritizes industry concerns

## Testing Checklist

Before deploying a new industry template:

- [ ] Validate YAML syntax
- [ ] Test with sample data
- [ ] Review compliance terms
- [ ] Check metric accuracy
- [ ] Verify slide generation
- [ ] Compare with baseline