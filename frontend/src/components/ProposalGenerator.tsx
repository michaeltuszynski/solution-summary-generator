import React, { useState } from 'react';
import DiscoveryForm from './DiscoveryForm';
import FileUpload from './FileUpload';
import GenerationStatus from './GenerationStatus';
import ProposalResult from './ProposalResult';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { DiscoveryData, FileUpload as FileUploadType, Proposal, GenerationStatus as GenerationStatusType } from '../types';
import { ProposalApi } from '../services/api';

const ProposalGenerator: React.FC = () => {
  const [discoveryData, setDiscoveryData] = useState<DiscoveryData | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>(undefined);
  const [uploadedFiles, setUploadedFiles] = useState<FileUploadType[]>([]);
  const [generationStatus, setGenerationStatus] = useState<GenerationStatusType>({
    isGenerating: false,
    progress: 0,
    currentStep: ''
  });
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleDiscoverySubmit = (data: DiscoveryData, templateId?: string) => {
    setDiscoveryData(data);
    setSelectedTemplateId(templateId);
    setError('');
  };

  const handleFilesChange = (files: FileUploadType[]) => {
    setUploadedFiles(files);
  };

  const handleGenerate = async () => {
    if (!discoveryData) {
      setError('Please complete the discovery form first');
      return;
    }

    setGenerationStatus({
      isGenerating: true,
      progress: 10,
      currentStep: 'Preparing data...'
    });
    setError('');
    setProposal(null);
    setDownloadUrl('');

    try {
      // Update progress
      setGenerationStatus(prev => ({
        ...prev,
        progress: 30,
        currentStep: 'Processing documents...'
      }));

      // Get actual File objects from FileUpload types
      const files = uploadedFiles
        .filter(f => f.status === 'complete')
        .map(f => f.file);

      setGenerationStatus(prev => ({
        ...prev,
        progress: 50,
        currentStep: 'Generating proposal sections...'
      }));

      // Call API with templateId
      const response = await ProposalApi.generateProposal(discoveryData, files, selectedTemplateId);

      if (response.success && response.proposal) {
        setGenerationStatus(prev => ({
          ...prev,
          progress: 90,
          currentStep: 'Creating presentation...'
        }));

        setProposal(response.proposal);
        if (response.downloadUrl) {
          setDownloadUrl(response.downloadUrl);
        }

        setGenerationStatus(prev => ({
          ...prev,
          progress: 100,
          currentStep: 'Complete!',
          isGenerating: false
        }));
      } else {
        throw new Error(response.error || 'Generation failed');
      }
    } catch (err: any) {
      console.error('Generation error:', err);
      setError(err.message || 'Failed to generate proposal');
      setGenerationStatus(prev => ({
        ...prev,
        isGenerating: false,
        error: err.message
      }));
    }
  };

  const handleDownload = async () => {
    if (!downloadUrl) return;

    try {
      const filename = downloadUrl.split('/').pop() || 'proposal.pptx';
      const blob = await ProposalApi.downloadPresentation(filename);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Presidio-Proposal-${discoveryData?.companyName.replace(/\s+/g, '-')}-${Date.now()}.pptx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(`Download failed: ${err.message}`);
    }
  };

  const handleReset = () => {
    setDiscoveryData(null);
    setUploadedFiles([]);
    setGenerationStatus({
      isGenerating: false,
      progress: 0,
      currentStep: ''
    });
    setProposal(null);
    setDownloadUrl('');
    setError('');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Step Indicator */}
      <Card style={{ backgroundColor: 'var(--primary-white)', border: '1px solid var(--light-gray)' }}>
        <CardContent 
          className="step-indicator-container"
          style={{ 
            padding: '32px 24px', 
            paddingTop: '32px',
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '100px',
            boxSizing: 'border-box'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'clamp(16px, 4vw, 32px)', flexWrap: 'wrap' }}>
            {[
              { step: 1, label: 'Discovery', active: !discoveryData, completed: !!discoveryData },
              { step: 2, label: 'Generate', active: generationStatus.isGenerating, completed: !!proposal },
              { step: 3, label: 'Results', active: !!proposal, completed: false }
            ].map(({ step, label, active, completed }) => (
              <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div 
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    fontFamily: 'var(--font-heading)',
                    transition: 'all 0.3s ease',
                    backgroundColor: completed 
                      ? 'var(--primary-blue)' 
                      : active 
                      ? 'var(--primary-orange)' 
                      : 'var(--light-gray)',
                    color: completed || active ? 'var(--primary-white)' : 'var(--medium-gray)',
                    border: `2px solid ${completed || active ? 'transparent' : 'var(--medium-gray)'}`
                  }}
                >
                  {completed ? '✓' : step}
                </div>
                <span 
                  style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    fontFamily: 'var(--font-heading)',
                    color: completed || active ? 'var(--dark-gray)' : 'var(--medium-gray)'
                  }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200" style={{ backgroundColor: '#fef2f2' }}>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">❌</span>
              <span className="text-red-700 font-medium" style={{ fontFamily: 'var(--font-body)' }}>
                {error}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Discovery Form */}
      {!discoveryData && (
        <Card style={{ backgroundColor: 'var(--primary-white)', border: '1px solid var(--light-gray)' }}>
          <CardHeader>
            <CardTitle style={{ 
              color: 'var(--dark-gray)', 
              fontFamily: 'var(--font-heading)', 
              fontWeight: 'var(--weight-semibold)',
              fontSize: 'var(--text-h3)'
            }}>
              Discovery Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-6 text-gray-600" style={{ fontFamily: 'var(--font-body)' }}>
              Tell us about your client's business challenge and requirements.
            </p>
            <DiscoveryForm onSubmit={handleDiscoverySubmit} />
          </CardContent>
        </Card>
      )}

      {/* Generate Proposal */}
      {discoveryData && !generationStatus.isGenerating && !proposal && (
        <Card style={{ backgroundColor: 'var(--primary-white)', border: '1px solid var(--light-gray)' }}>
          <CardHeader>
            <CardTitle style={{ 
              color: 'var(--dark-gray)', 
              fontFamily: 'var(--font-heading)', 
              fontWeight: 'var(--weight-semibold)',
              fontSize: 'var(--text-h3)'
            }}>
              Generate Proposal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-6 text-gray-600" style={{ fontFamily: 'var(--font-body)' }}>
              Ready to generate your proposal! Optionally add supporting documents to enhance the quality.
            </p>
            
            {/* Optional File Upload Section */}
            <div style={{ 
              backgroundColor: 'var(--bg-light)', 
              padding: '20px', 
              borderRadius: '8px', 
              marginBottom: '24px',
              border: '1px dashed var(--medium-gray)'
            }}>
              <h4 style={{ 
                margin: '0 0 12px 0',
                fontSize: '16px',
                fontWeight: 'var(--weight-semibold)',
                color: 'var(--dark-gray)',
                fontFamily: 'var(--font-heading)'
              }}>
                Supporting Documents (Optional)
              </h4>
              <p style={{ 
                margin: '0 0 16px 0',
                fontSize: '14px',
                color: 'var(--medium-gray)',
                fontFamily: 'var(--font-body)'
              }}>
                Add relevant files to enhance proposal accuracy
              </p>
              <FileUpload
                files={uploadedFiles}
                onChange={handleFilesChange}
                maxFiles={5}
                acceptedTypes={['.pdf', '.docx', '.txt', '.md']}
              />
            </div>
            
            <div className="flex flex-col gap-4">
              <Button
                onClick={handleGenerate}
                size="lg"
                style={{
                  backgroundColor: 'var(--primary-blue)',
                  color: 'var(--primary-white)',
                  fontFamily: 'var(--font-heading)',
                  width: '100%',
                  padding: '16px'
                }}
              >
                {uploadedFiles.length > 0 ? `GENERATE PROPOSAL (${uploadedFiles.length} document${uploadedFiles.length > 1 ? 's' : ''})` : 'GENERATE PROPOSAL'}
              </Button>
              
              <Button
                onClick={handleReset}
                variant="outline"
                size="lg"
                style={{
                  borderColor: 'var(--primary-blue)',
                  color: 'var(--primary-blue)',
                  fontFamily: 'var(--font-heading)',
                  width: '100%'
                }}
              >
                RESET
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generation Status */}
      {generationStatus.isGenerating && (
        <Card style={{ backgroundColor: 'var(--primary-white)', border: '1px solid var(--light-gray)' }}>
          <CardContent className="pt-6">
            <GenerationStatus status={generationStatus} />
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {proposal && (
        <ProposalResult
          proposal={proposal}
          downloadUrl={downloadUrl}
          onDownload={handleDownload}
          onReset={handleReset}
        />
      )}
    </div>
  );
};

export default ProposalGenerator;
