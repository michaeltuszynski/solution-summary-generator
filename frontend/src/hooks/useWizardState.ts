'use client'


import { useContext } from 'react';
import { WizardContext, WizardContextType } from '../contexts/WizardContext';

export const useWizardState = (): WizardContextType => {
  const context = useContext(WizardContext);

  if (context === undefined) {
    throw new Error('useWizardState must be used within a WizardProvider');
  }

  return context;
};