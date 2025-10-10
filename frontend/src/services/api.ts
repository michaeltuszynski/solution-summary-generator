import axios, { AxiosResponse } from 'axios';
import { DiscoveryData, GenerationResponse, TemplatesResponse } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Configure axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5 minutes for proposal generation
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    
    // Handle common errors
    if (error.response?.status === 429) {
      throw new Error('Too many requests. Please wait and try again.');
    }
    
    if (error.response?.status === 503) {
      throw new Error('AI service is temporarily unavailable. Please try again later.');
    }
    
    if (error.response?.status >= 500) {
      throw new Error('Server error occurred. Please try again.');
    }
    
    // Return the original error for specific handling
    return Promise.reject(error);
  }
);

export class ProposalApi {
  /**
   * Generate a proposal with real-time progress updates via SSE
   */
  static async generateProposalWithProgress(
    discoveryData: DiscoveryData,
    documents?: File[],
    templateId?: string,
    onProgress?: (data: { slideTitle?: string; progress: number; message?: string; slideNumber?: number; totalSlides?: number }) => void
  ): Promise<GenerationResponse> {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('discoveryData', JSON.stringify(discoveryData));
      if (templateId) {
        formData.append('templateId', templateId);
      }
      if (documents && documents.length > 0) {
        documents.forEach((file) => {
          formData.append('documents', file);
        });
      }

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE_URL}/proposals/generate-stream`);

      xhr.onprogress = function() {
        const messages = xhr.responseText.split('\n\n');
        for (const message of messages) {
          if (!message.trim()) continue;

          const lines = message.split('\n');
          let eventType = 'message';
          let data = '';

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.substring(7);
            } else if (line.startsWith('data: ')) {
              data = line.substring(6);
            }
          }

          if (data) {
            try {
              const parsed = JSON.parse(data);

              if (eventType === 'slide' && onProgress) {
                onProgress({
                  slideTitle: parsed.slideTitle,
                  progress: parsed.progress,
                  slideNumber: parsed.slideNumber,
                  totalSlides: parsed.totalSlides,
                  message: `Generating: ${parsed.slideTitle}...`
                });
              } else if (eventType === 'progress' && onProgress) {
                onProgress({
                  progress: parsed.progress,
                  message: parsed.message
                });
              } else if (eventType === 'complete') {
                resolve({
                  success: true,
                  proposal: parsed.proposal,
                  downloadUrl: parsed.downloadUrl
                });
              } else if (eventType === 'error') {
                reject(new Error(parsed.error || 'Generation failed'));
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      };

      xhr.onerror = function() {
        reject(new Error('Network error during generation'));
      };

      xhr.onabort = function() {
        reject(new Error('Generation cancelled'));
      };

      xhr.send(formData);
    });
  }

  /**
   * Generate a proposal from discovery data and optional documents
   */
  static async generateProposal(
    discoveryData: DiscoveryData,
    documents?: File[],
    templateId?: string
  ): Promise<GenerationResponse> {
    const formData = new FormData();

    // Add discovery data as JSON string
    formData.append('discoveryData', JSON.stringify(discoveryData));

    // Add template ID if provided
    if (templateId) {
      formData.append('templateId', templateId);
    }
    
    // Add documents if provided
    if (documents && documents.length > 0) {
      documents.forEach((file, index) => {
        formData.append('documents', file);
      });
    }
    
    try {
      const response: AxiosResponse<GenerationResponse> = await apiClient.post(
        '/proposals/generate',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const progress = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              console.log(`Upload progress: ${progress}%`);
            }
          },
        }
      );
      
      return response.data;
    } catch (error: any) {
      // Handle API errors
      if (error.response?.data?.error) {
        let errorMessage = error.response.data.error;
        
        // Add validation details if available
        if (error.response.data.details && Array.isArray(error.response.data.details)) {
          const validationDetails = error.response.data.details
            .map((detail: any) => `${detail.field}: ${detail.message}`)
            .join(', ');
          errorMessage += ` (${validationDetails})`;
        }
        
        throw new Error(errorMessage);
      }
      
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. The proposal generation is taking longer than expected.');
      }
      
      throw new Error(error.message || 'Failed to generate proposal');
    }
  }
  
  /**
   * Download a generated presentation
   */
  static async downloadPresentation(filename: string): Promise<Blob> {
    try {
      const response = await apiClient.get(`/proposals/download/${filename}`, {
        responseType: 'blob',
      });
      
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to download presentation');
    }
  }
  
  /**
   * Get proposal status (for future use with async generation)
   */
  static async getProposalStatus(proposalId: string): Promise<any> {
    try {
      const response = await apiClient.get(`/proposals/${proposalId}/status`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to get proposal status');
    }
  }
  
  /**
   * Get available templates
   */
  static async getTemplates(): Promise<TemplatesResponse> {
    try {
      const response = await apiClient.get('/templates');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch templates');
    }
  }

  /**
   * Health check
   */
  static async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await apiClient.get('/health');
      return response.data;
    } catch (error: any) {
      throw new Error('API health check failed');
    }
  }
}

export default ProposalApi;
