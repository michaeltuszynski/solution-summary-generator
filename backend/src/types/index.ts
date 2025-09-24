export interface DiscoveryData {
  companyName: string;
  industry: string;
  businessChallenge: string;
  techStack?: string;
  projectType: string;
  duration?: string;
  budgetRange?: string;
  successCriteria?: string;
}

export interface ProposalSection {
  content: string;
  confidence: number;
  warnings: string[];
  generatedAt: Date;
}

export interface Proposal {
  metadata: {
    id: string;
    generated: Date;
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

export interface DocumentMetadata {
  filename: string;
  size: number;
  type: string;
  uploadedAt: Date;
  processed: boolean;
}

export interface ProcessedDocument {
  content: string;
  metadata: DocumentMetadata;
  chunks: string[];
  extractedTerms: string[];
}

export interface GenerationRequest {
  discoveryData: DiscoveryData;
  documents?: Express.Multer.File[];
}

export interface GenerationResponse {
  success: boolean;
  proposal?: Proposal;
  downloadUrl?: string;
  error?: string;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
}

export interface ConfidenceFactors {
  contentCompleteness: number;
  rapCompliance: number;
  historicalSimilarity: number;
  technicalAccuracy: number;
  businessAlignment: number;
}

export interface RAPComplianceCheck {
  passed: boolean;
  warnings: string[];
  riskyTerms: string[];
  suggestions: string[];
}

export type SectionType = 'overview' | 'solution_approach' | 'outcomes' | 'next_steps';

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

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeRequest {
  model: string;
  max_tokens: number;
  temperature: number;
  messages: ClaudeMessage[];
}

export interface ClaudeResponse {
  content: Array<{
    text: string;
    type: string;
  }>;
  id: string;
  model: string;
  role: string;
  stop_reason: string;
  stop_sequence: null;
  type: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}
