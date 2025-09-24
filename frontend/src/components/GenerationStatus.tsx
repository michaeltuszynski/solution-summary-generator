import React from 'react';
import { GenerationStatus as GenerationStatusType } from '../types';
import { Progress } from './ui/progress';
import { Card, CardContent } from './ui/card';

interface GenerationStatusProps {
  status: GenerationStatusType;
}

const GenerationStatus: React.FC<GenerationStatusProps> = ({ status }) => {
  const { isGenerating, progress, currentStep, error } = status;

  if (!isGenerating && !error) {
    return null;
  }

  return (
    <div className="text-center space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <h3 className="text-2xl font-bold" style={{ color: 'var(--dark-gray)', fontFamily: 'var(--font-heading)' }}>
          {error ? '❌ Generation Failed' : '🚀 Generating Your Proposal'}
        </h3>
        {!error && (
          <p style={{ color: 'var(--medium-gray)', fontFamily: 'var(--font-body)' }}>
            This may take 1-2 minutes. Please don't close this window.
          </p>
        )}
      </div>

      {/* Progress Bar */}
      {!error && (
        <div className="space-y-4">
          <Progress 
            value={progress} 
            className="h-4"
            style={{ 
              backgroundColor: 'var(--light-gray)',
              border: '1px solid var(--medium-gray)'
            }}
          />
          
          <div className="flex justify-between text-sm" style={{ color: 'var(--medium-gray)', fontFamily: 'var(--font-body)' }}>
            <span>{progress}% Complete</span>
            <span>Step {getStepNumber(progress)} of 4</span>
          </div>
        </div>
      )}

      {/* Current Step */}
      <div className="space-y-3">
        {!error && (
          <div className="flex items-center justify-center space-x-3">
            <div 
              className="animate-spin rounded-full h-6 w-6 border-b-2"
              style={{ borderColor: 'var(--primary-blue)' }}
            ></div>
            <span className="text-lg font-medium" style={{ color: 'var(--dark-gray)', fontFamily: 'var(--font-heading)' }}>
              {currentStep}
            </span>
          </div>
        )}

        {error && (
          <Card className="border-red-200" style={{ backgroundColor: '#fef2f2' }}>
            <CardContent className="pt-4 pb-4">
              <p className="text-red-700" style={{ fontFamily: 'var(--font-body)' }}>{error}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Progress Steps */}
      {!error && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {[
            { step: 1, label: 'Preparing Data', range: [0, 25] },
            { step: 2, label: 'Processing Documents', range: [25, 50] },
            { step: 3, label: 'Generating Content', range: [50, 90] },
            { step: 4, label: 'Creating Presentation', range: [90, 100] }
          ].map(({ step, label, range }) => {
            const isActive = progress >= range[0]! && progress < range[1]!;
            const isComplete = progress >= range[1]!;
            
            return (
              <Card
                key={step}
                className="transition-all duration-300"
                style={{
                  backgroundColor: isComplete
                    ? '#f0fdf4'
                    : isActive
                    ? '#eff6ff'
                    : 'var(--light-gray)',
                  borderColor: isComplete
                    ? '#bbf7d0'
                    : isActive
                    ? 'var(--primary-blue)'
                    : 'var(--medium-gray)'
                }}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-3xl mb-2">
                    {isComplete ? '✅' : isActive ? '🔄' : '⏳'}
                  </div>
                  <div 
                    className="text-sm font-medium"
                    style={{
                      color: isComplete
                        ? '#166534'
                        : isActive
                        ? 'var(--primary-blue)'
                        : 'var(--medium-gray)',
                      fontFamily: 'var(--font-heading)'
                    }}
                  >
                    {label}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

    </div>
  );
};

const getStepNumber = (progress: number): number => {
  if (progress < 25) return 1;
  if (progress < 50) return 2;
  if (progress < 90) return 3;
  return 4;
};


export default GenerationStatus;
