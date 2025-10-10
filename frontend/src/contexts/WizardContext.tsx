'use client'

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { DiscoveryData, FileUpload as FileUploadType, Proposal } from '../types';

// Session storage key
const SESSION_STORAGE_KEY = 'presidio_wizard_state';

export interface WizardState {
  currentStep: number;
  discoveryData: DiscoveryData | null;
  selectedTemplateId: string | undefined;
  uploadedFiles: FileUploadType[];
  proposal: Proposal | null;
  downloadUrl: string;
  completedSteps: Set<number>;
}

export interface WizardContextType extends WizardState {
  goToStep: (step: number) => void;
  updateDiscovery: (data: DiscoveryData, templateId?: string) => void;
  updateFiles: (files: FileUploadType[]) => void;
  updateProposal: (proposal: Proposal, downloadUrl: string) => void;
  completeStep: (step: number) => void;
  resetWizard: () => void;
  canGoToStep: (step: number) => boolean;
}

const initialState: WizardState = {
  currentStep: 1,
  discoveryData: null,
  selectedTemplateId: undefined,
  uploadedFiles: [],
  proposal: null,
  downloadUrl: '',
  completedSteps: new Set<number>()
};

export const WizardContext = createContext<WizardContextType | undefined>(undefined);

interface WizardProviderProps {
  children: ReactNode;
}

export const WizardProvider: React.FC<WizardProviderProps> = ({ children }) => {
  const [state, setState] = useState<WizardState>(initialState);

  // Load from session storage on mount
  useEffect(() => {
    try {
      const savedState = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        setState(prev => ({
          ...prev,
          currentStep: parsed.currentStep || 1,
          discoveryData: parsed.discoveryData || null,
          selectedTemplateId: parsed.selectedTemplateId,
          completedSteps: new Set(parsed.completedSteps || []),
          // Note: uploadedFiles, proposal, and downloadUrl are NOT restored
          // Files need to be re-uploaded, proposal needs regeneration
        }));
      }
    } catch (error) {
      console.error('Failed to load wizard state from session storage:', error);
    }
  }, []);

  // Save to session storage whenever state changes
  useEffect(() => {
    try {
      const stateToSave = {
        currentStep: state.currentStep,
        discoveryData: state.discoveryData,
        selectedTemplateId: state.selectedTemplateId,
        completedSteps: Array.from(state.completedSteps),
        // Don't save files, proposal, or downloadUrl
      };
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.error('Failed to save wizard state to session storage:', error);
    }
  }, [state.currentStep, state.discoveryData, state.selectedTemplateId, state.completedSteps]);

  const canGoToStep = (step: number): boolean => {
    // Can always go to step 1
    if (step === 1) return true;

    // Can go to step 2 if step 1 is complete
    if (step === 2) return state.completedSteps.has(1);

    // Can go to step 3 (results) if we have a proposal
    if (step === 3) return state.proposal !== null;

    return false;
  };

  const goToStep = (step: number) => {
    if (canGoToStep(step)) {
      setState(prev => {
        // If navigating back from results (step 3) to edit steps, clear proposal
        // This allows regeneration with new inputs
        const isNavigatingBackFromResults = prev.currentStep === 3 && step < 3;

        if (isNavigatingBackFromResults) {
          // Clear proposal and downloadUrl to enable regeneration
          return {
            ...prev,
            currentStep: step,
            proposal: null,
            downloadUrl: ''
          };
        }

        return { ...prev, currentStep: step };
      });
    }
  };

  const updateDiscovery = (data: DiscoveryData, templateId?: string) => {
    setState(prev => {
      const newCompletedSteps = new Set(prev.completedSteps);
      newCompletedSteps.add(1);

      return {
        ...prev,
        discoveryData: data,
        selectedTemplateId: templateId,
        completedSteps: newCompletedSteps,
        currentStep: 2  // Automatically advance to step 2
      };
    });
  };

  const updateFiles = (files: FileUploadType[]) => {
    setState(prev => ({ ...prev, uploadedFiles: files }));
  };

  const updateProposal = (proposal: Proposal, downloadUrl: string) => {
    setState(prev => {
      const newCompletedSteps = new Set(prev.completedSteps);
      newCompletedSteps.add(2);

      return {
        ...prev,
        proposal,
        downloadUrl,
        completedSteps: newCompletedSteps,
        currentStep: 3  // Automatically advance to results step
      };
    });
  };

  const completeStep = (step: number) => {
    setState(prev => {
      const newCompletedSteps = new Set(prev.completedSteps);
      newCompletedSteps.add(step);
      return {
        ...prev,
        completedSteps: newCompletedSteps
      };
    });
  };

  const resetWizard = () => {
    setState(initialState);
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear session storage:', error);
    }
  };

  const contextValue: WizardContextType = {
    ...state,
    goToStep,
    updateDiscovery,
    updateFiles,
    updateProposal,
    completeStep,
    resetWizard,
    canGoToStep,
  };

  return (
    <WizardContext.Provider value={contextValue}>
      {children}
    </WizardContext.Provider>
  );
};