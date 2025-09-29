import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { DiscoveryData, IndustryType, ProjectType, DurationRange, BudgetRange, FormErrors, Template } from '../types';
import ProposalApi from '../services/api';
import { useWizardState } from '../hooks/useWizardState';

interface DiscoveryFormProps {
  onSubmit: (data: DiscoveryData, templateId?: string) => void;
  initialData?: DiscoveryData;
}

const DiscoveryForm: React.FC<DiscoveryFormProps> = ({ onSubmit, initialData }) => {
  const { selectedTemplateId } = useWizardState();

  const [formData, setFormData] = useState<Partial<DiscoveryData>>(
    initialData || {
      companyName: '',
      businessChallenge: '',
      techStack: '',
      successCriteria: ''
    }
  );

  const [errors, setErrors] = useState<FormErrors>({});
  const [templates, setTemplates] = useState<Template[]>([]);
  const [localTemplateId, setLocalTemplateId] = useState<string>(selectedTemplateId || '');
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  // Fetch templates on component mount
  useEffect(() => {
    const fetchTemplates = async () => {
      setLoadingTemplates(true);
      try {
        const response = await ProposalApi.getTemplates();
        if (response.success && response.templates) {
          setTemplates(response.templates);
          // Auto-select default template if not already set
          if (!localTemplateId) {
            const defaultTemplate = response.templates.find(t => t.id === 'default');
            if (defaultTemplate) {
              setLocalTemplateId(defaultTemplate.id);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load templates:', error);
        // Continue without templates - backend will use default
      } finally {
        setLoadingTemplates(false);
      }
    };
    fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const industries: IndustryType[] = [
    'Manufacturing',
    'Healthcare', 
    'Financial Services',
    'Government',
    'Retail',
    'Education',
    'Technology',
    'Other'
  ];

  const projectTypes: ProjectType[] = [
    'Digital Transformation',
    'ERP Modernization',
    'Cloud Migration',
    'Infrastructure Upgrade',
    'Security Enhancement',
    'Data Analytics',
    'Custom Development'
  ];

  const durations: DurationRange[] = [
    '1-3 months',
    '3-6 months',
    '6-12 months',
    '12+ months'
  ];

  const budgets: BudgetRange[] = [
    'Under $100K',
    '$100K - $500K',
    '$500K - $1M'
  ];

  const handleChange = (field: keyof DiscoveryData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.companyName?.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    if (!formData.industry) {
      newErrors.industry = 'Industry is required';
    }

    if (!formData.businessChallenge?.trim()) {
      newErrors.businessChallenge = 'Business challenge is required';
    }

    if (!formData.projectType) {
      newErrors.projectType = 'Project type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Pass data to parent - let parent handle context update and navigation
    onSubmit(formData as DiscoveryData, localTemplateId || undefined);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Company Information Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="companyName" className="text-sm font-medium">
            Company Name *
          </label>
          <Input
            id="companyName"
            type="text"
            placeholder="e.g., TechCorp Manufacturing"
            value={formData.companyName || ''}
            onChange={(e) => handleChange('companyName', e.target.value)}
            className={errors.companyName ? 'border-red-500' : ''}
          />
          {errors.companyName && (
            <div className="text-sm text-red-600">{errors.companyName}</div>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="industry-select" className="text-sm font-medium">
            Industry *
          </label>
          <Select value={formData.industry || ''} onValueChange={(value) => handleChange('industry', value)}>
            <SelectTrigger id="industry-select" name="industry" className={errors.industry ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select Industry" />
            </SelectTrigger>
            <SelectContent>
              {industries.map(industry => (
                <SelectItem key={industry} value={industry}>{industry}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.industry && (
            <div className="text-sm text-red-600">{errors.industry}</div>
          )}
        </div>
      </div>

      {/* Business Challenge */}
      <div className="space-y-2">
        <label htmlFor="businessChallenge" className="text-sm font-medium">
          Business Challenge *
        </label>
        <Textarea
          id="businessChallenge"
          rows={4}
          placeholder="Describe the primary business challenge or pain point..."
          value={formData.businessChallenge || ''}
          onChange={(e) => handleChange('businessChallenge', e.target.value)}
          className={errors.businessChallenge ? 'border-red-500' : ''}
        />
        {errors.businessChallenge && (
          <div className="text-sm text-red-600">{errors.businessChallenge}</div>
        )}
      </div>

      {/* Technology and Project Type Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="techStack" className="text-sm font-medium">
            Current Technology Stack
          </label>
          <Input
            id="techStack"
            type="text"
            placeholder="e.g., SAP ECC, Oracle, .NET applications"
            value={formData.techStack || ''}
            onChange={(e) => handleChange('techStack', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="projectType-select" className="text-sm font-medium">
            Project Type *
          </label>
          <Select value={formData.projectType || ''} onValueChange={(value) => handleChange('projectType', value)}>
            <SelectTrigger id="projectType-select" name="projectType" className={errors.projectType ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select Project Type" />
            </SelectTrigger>
            <SelectContent>
              {projectTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.projectType && (
            <div className="text-sm text-red-600">{errors.projectType}</div>
          )}
        </div>
      </div>

      {/* Duration and Budget Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="duration-select" className="text-sm font-medium">
            Project Duration
          </label>
          <Select value={formData.duration || ''} onValueChange={(value) => handleChange('duration', value)}>
            <SelectTrigger id="duration-select" name="duration">
              <SelectValue placeholder="Select Duration" />
            </SelectTrigger>
            <SelectContent>
              {durations.map(duration => (
                <SelectItem key={duration} value={duration}>{duration}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label htmlFor="budgetRange-select" className="text-sm font-medium">
            Budget Range
          </label>
          <Select value={formData.budgetRange || ''} onValueChange={(value) => handleChange('budgetRange', value)}>
            <SelectTrigger id="budgetRange-select" name="budgetRange">
              <SelectValue placeholder="Select Budget Range" />
            </SelectTrigger>
            <SelectContent>
              {budgets.map(budget => (
                <SelectItem key={budget} value={budget}>{budget}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Success Criteria */}
      <div className="space-y-2">
        <label htmlFor="successCriteria" className="text-sm font-medium">
          Success Criteria
        </label>
        <Textarea
          id="successCriteria"
          rows={3}
          placeholder="How will success be measured? What are the key outcomes?"
          value={formData.successCriteria || ''}
          onChange={(e) => handleChange('successCriteria', e.target.value)}
        />
      </div>

      {/* Template Selection */}
      {templates.length > 0 && (
        <div className="space-y-2">
          <label htmlFor="template-select" className="text-sm font-medium">
            Proposal Template
          </label>
          <Select value={localTemplateId} onValueChange={setLocalTemplateId}>
            <SelectTrigger id="template-select" name="template">
              <SelectValue placeholder={loadingTemplates ? "Loading templates..." : "Select Template"} />
            </SelectTrigger>
            <SelectContent>
              {templates.map(template => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name} - {template.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-center pt-4">
        <Button
          type="submit"
          className="w-full max-w-md"
          size="lg"
        >
          Continue to Documents
        </Button>
      </div>
    </form>
  );
};

export default DiscoveryForm;