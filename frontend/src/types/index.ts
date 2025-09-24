// Shared types between frontend and backend
export interface DiscoveryData {
  companyName: string;
  industry: IndustryType;
  businessChallenge: string;
  techStack?: string;
  projectType: ProjectType;
  duration?: DurationRange;
  budgetRange?: BudgetRange;
  successCriteria?: string;
}

export interface ProposalSection {
  content: string;
  confidence: number;
  warnings: string[];
  generatedAt: string;
}

export interface Proposal {
  metadata: {
    id: string;
    generated: string;
    client: string;
    industry: string;
    projectType: string;
  };
  sections: {
    overview: ProposalSection;
    solution_approach: ProposalSection;
    outcomes: ProposalSection;
    next_steps: ProposalSection;
  };
  overallConfidence: number;
}

export interface GenerationResponse {
  success: boolean;
  proposal?: Proposal;
  downloadUrl?: string;
  error?: string;
}

export interface ApiError {
  success: false;
  error: string;
  details?: any;
}

export type IndustryType = 
  | 'Manufacturing' 
  | 'Healthcare' 
  | 'Financial Services' 
  | 'Government' 
  | 'Retail' 
  | 'Education' 
  | 'Technology' 
  | 'Other';

export type ProjectType = 
  | 'Digital Transformation'
  | 'ERP Modernization' 
  | 'Cloud Migration'
  | 'Infrastructure Upgrade'
  | 'Security Enhancement'
  | 'Data Analytics'
  | 'Custom Development';

export type DurationRange = '1-3 months' | '3-6 months' | '6-12 months' | '12+ months';

export type BudgetRange = 'Under $100K' | '$100K - $500K' | '$500K - $1M';

export interface FileUpload {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  error?: string;
}

export interface FormErrors {
  [key: string]: string | undefined;
}

export interface GenerationStatus {
  isGenerating: boolean;
  progress: number;
  currentStep: string;
  error?: string;
}
