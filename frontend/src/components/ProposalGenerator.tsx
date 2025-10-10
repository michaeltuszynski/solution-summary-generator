'use client'

import React, { useState } from 'react';
import DiscoveryForm from './DiscoveryForm';
import FileUpload from './FileUpload';
import GenerationStatus from './GenerationStatus';
import ProposalResult from './ProposalResult';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { GenerationStatus as GenerationStatusType } from '../types';
import { ProposalApi } from '../services/api';
import { WizardProvider } from '../contexts/WizardContext';
import { useWizardState } from '../hooks/useWizardState';
import { DiscoveryData } from '../types';

const ProposalGeneratorContent: React.FC = () => {
  const {
    currentStep,
    discoveryData,
    selectedTemplateId,
    uploadedFiles,
    proposal,
    downloadUrl,
    completedSteps,
    goToStep,
    updateDiscovery,
    updateFiles,
    updateProposal,
    completeStep,
    resetWizard,
    canGoToStep
  } = useWizardState();

  const [generationStatus, setGenerationStatus] = useState<GenerationStatusType>({
    isGenerating: false,
    progress: 0,
    currentStep: ''
  });
  const [error, setError] = useState<string>('');

  const handleFilesChange = (files: any[]) => {
    updateFiles(files);
  };

  const handleContinueFromDiscovery = (data: DiscoveryData, templateId?: string) => {
    // updateDiscovery now handles completing step 1 and navigating to step 2
    updateDiscovery(data, templateId);
  };

  const handleContinueFromDocuments = async () => {
    completeStep(2);
    // Skip step 3 and go directly to generation
    await handleGenerate();
  };

  const handleGenerate = async () => {
    if (!discoveryData) {
      setError('Please complete the discovery form first');
      return;
    }

    // Prevent multiple simultaneous generations
    if (generationStatus.isGenerating) {
      return;
    }

    setGenerationStatus({
      isGenerating: true,
      progress: 5,
      currentStep: 'Starting generation...'
    });
    setError('');

    try {
      // Get actual File objects from FileUpload types
      const files = uploadedFiles
        .filter(f => f.status === 'complete')
        .map(f => f.file);

      // Use SSE-enabled API with real-time progress updates
      const response = await ProposalApi.generateProposalWithProgress(
        discoveryData,
        files,
        selectedTemplateId,
        (progressData) => {
          // Update UI with real-time progress from backend
          setGenerationStatus(prev => ({
            ...prev,
            progress: progressData.progress,
            currentStep: progressData.message || prev.currentStep,
            isGenerating: true
          }));
        }
      );

      if (response.success && response.proposal) {
        // updateProposal now handles completing step 2 and navigating to step 3
        updateProposal(response.proposal, response.downloadUrl || '');

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

  const handleNewProposal = () => {
    if (window.confirm('Start a new proposal? This will clear all current data.')) {
      resetWizard();
      setGenerationStatus({
        isGenerating: false,
        progress: 0,
        currentStep: ''
      });
      setError('');
    }
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
              { step: 1, label: 'Discovery', active: currentStep === 1, completed: completedSteps.has(1) },
              { step: 2, label: 'Documents', active: currentStep === 2, completed: completedSteps.has(2) },
              { step: 3, label: 'Results', active: currentStep === 3, completed: false }
            ].map(({ step, label, active, completed }) => (
              <div
                key={step}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: canGoToStep(step) ? 'pointer' : 'default' }}
                onClick={() => canGoToStep(step) && goToStep(step)}
              >
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

      {/* Step 1: Discovery Form */}
      <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
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
            <DiscoveryForm onSubmit={handleContinueFromDiscovery} {...(discoveryData && { initialData: discoveryData })} />
          </CardContent>
        </Card>
      </div>

      {/* Step 2: Document Upload */}
      <div style={{ display: currentStep === 2 && !generationStatus.isGenerating ? 'block' : 'none' }}>
        <Card style={{ backgroundColor: 'var(--primary-white)', border: '1px solid var(--light-gray)' }}>
          <CardHeader>
            <CardTitle style={{
              color: 'var(--dark-gray)',
              fontFamily: 'var(--font-heading)',
              fontWeight: 'var(--weight-semibold)',
              fontSize: 'var(--text-h3)'
            }}>
              Supporting Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-6 text-gray-600" style={{ fontFamily: 'var(--font-body)' }}>
              Add relevant files to enhance proposal accuracy (optional).
            </p>

            <div style={{
              backgroundColor: 'var(--bg-light)',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '24px',
              border: '1px dashed var(--medium-gray)'
            }}>
              <FileUpload
                files={uploadedFiles}
                onChange={handleFilesChange}
                maxFiles={5}
                acceptedTypes={['.pdf', '.docx', '.txt', '.md']}
              />
            </div>

            <div className="flex gap-4">
              <Button
                onClick={() => goToStep(1)}
                variant="outline"
                size="lg"
                style={{
                  borderColor: 'var(--primary-blue)',
                  color: 'var(--primary-blue)',
                  fontFamily: 'var(--font-heading)',
                  flex: 1
                }}
              >
                BACK
              </Button>
              <Button
                onClick={handleContinueFromDocuments}
                disabled={generationStatus.isGenerating}
                size="lg"
                style={{
                  backgroundColor: 'var(--primary-blue)',
                  color: 'var(--primary-white)',
                  fontFamily: 'var(--font-heading)',
                  flex: 1,
                  opacity: generationStatus.isGenerating ? 0.5 : 1,
                  cursor: generationStatus.isGenerating ? 'not-allowed' : 'pointer'
                }}
              >
                CONTINUE
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generation Status (shown while generating) */}
      {generationStatus.isGenerating && (
        <Card style={{ backgroundColor: 'var(--primary-white)', border: '1px solid var(--light-gray)' }}>
          <CardContent className="pt-6">
            <GenerationStatus status={generationStatus} />
          </CardContent>
        </Card>
      )}

      {/* Step 3: Results */}
      <div style={{ display: currentStep === 3 && !generationStatus.isGenerating ? 'block' : 'none' }}>
        {proposal && (
          <div>
            <ProposalResult
              proposal={proposal}
              downloadUrl={downloadUrl}
              onDownload={handleDownload}
              onReset={handleNewProposal}
            />
            <div className="mt-6 space-y-4">
              {/* Edit Options */}
              <Card style={{ backgroundColor: 'var(--bg-light)', border: '1px solid var(--light-gray)' }}>
                <CardContent className="pt-6">
                  <h4 style={{
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 'var(--weight-semibold)',
                    fontSize: '16px',
                    marginBottom: '12px',
                    color: 'var(--dark-gray)',
                    textAlign: 'center'
                  }}>
                    Want to regenerate with different inputs?
                  </h4>
                  <div className="flex gap-3 justify-center">
                    <Button
                      onClick={() => goToStep(1)}
                      variant="outline"
                      size="lg"
                      style={{
                        borderColor: 'var(--primary-blue)',
                        color: 'var(--primary-blue)',
                        fontFamily: 'var(--font-heading)'
                      }}
                    >
                      EDIT DISCOVERY DATA
                    </Button>
                    <Button
                      onClick={() => goToStep(2)}
                      variant="outline"
                      size="lg"
                      style={{
                        borderColor: 'var(--primary-blue)',
                        color: 'var(--primary-blue)',
                        fontFamily: 'var(--font-heading)'
                      }}
                    >
                      EDIT DOCUMENTS
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* New Proposal */}
              <div className="flex justify-center">
                <Button
                  onClick={handleNewProposal}
                  variant="outline"
                  size="lg"
                  style={{
                    borderColor: 'var(--medium-gray)',
                    color: 'var(--medium-gray)',
                    fontFamily: 'var(--font-heading)'
                  }}
                >
                  START NEW PROPOSAL
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Wrap the component with WizardProvider
const ProposalGenerator: React.FC = () => {
  return (
    <WizardProvider>
      <ProposalGeneratorContent />
    </WizardProvider>
  );
};

export default ProposalGenerator;