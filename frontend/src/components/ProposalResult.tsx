import React, { useState } from 'react';
import { Proposal } from '../types';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface ProposalResultProps {
  proposal: Proposal;
  downloadUrl: string;
  onDownload: () => void;
  onReset: () => void;
}

const ProposalResult: React.FC<ProposalResultProps> = ({
  proposal,
  downloadUrl,
  onDownload,
  onReset
}) => {
  const [activeSection, setActiveSection] = useState<string>('overview');

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceIcon = (confidence: number): string => {
    if (confidence >= 80) return '✅';
    if (confidence >= 60) return '⚠️';
    return '❌';
  };

  const sections = [
    { key: 'overview', title: 'Overview', data: proposal.sections.overview },
    { key: 'solution_approach', title: 'Solution & Approach', data: proposal.sections.solution_approach },
    { key: 'outcomes', title: 'Expected Outcomes', data: proposal.sections.outcomes }
  ];

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <Card style={{ backgroundColor: 'var(--primary-white)', border: '1px solid var(--light-gray)' }}>
        <CardContent className="text-center pt-6">
          <div style={{ fontSize: '48px', marginBottom: 'var(--spacing-md)' }}>🎉</div>
          <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--dark-gray)', fontFamily: 'var(--font-heading)' }}>
            Proposal Generated Successfully!
          </h2>
          <p className="text-lg mb-6" style={{ color: 'var(--medium-gray)', fontFamily: 'var(--font-body)' }}>
            Your branded PowerPoint presentation is ready for download
          </p>
          
          {/* Overall Confidence Score */}
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full" 
               style={{ backgroundColor: 'var(--light-gray)' }}>
            <span style={{ fontSize: '24px' }}>
              {getConfidenceIcon(proposal.overallConfidence)}
            </span>
            <span className={`font-bold text-lg ${getConfidenceColor(proposal.overallConfidence)}`}>
              Overall Confidence: {proposal.overallConfidence}%
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Proposal Metadata */}
      <Card style={{ backgroundColor: 'var(--light-gray)', border: '1px solid var(--light-gray)' }}>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span style={{ color: 'var(--medium-gray)', fontFamily: 'var(--font-body)' }}>Client:</span>
              <div className="font-medium" style={{ color: 'var(--dark-gray)', fontFamily: 'var(--font-heading)' }}>
                {proposal.metadata.client}
              </div>
            </div>
            <div>
              <span style={{ color: 'var(--medium-gray)', fontFamily: 'var(--font-body)' }}>Industry:</span>
              <div className="font-medium" style={{ color: 'var(--dark-gray)', fontFamily: 'var(--font-heading)' }}>
                {proposal.metadata.industry}
              </div>
            </div>
            <div>
              <span style={{ color: 'var(--medium-gray)', fontFamily: 'var(--font-body)' }}>Project Type:</span>
              <div className="font-medium" style={{ color: 'var(--dark-gray)', fontFamily: 'var(--font-heading)' }}>
                {proposal.metadata.projectType}
              </div>
            </div>
            <div>
              <span style={{ color: 'var(--medium-gray)', fontFamily: 'var(--font-body)' }}>Generated:</span>
              <div className="font-medium" style={{ color: 'var(--dark-gray)', fontFamily: 'var(--font-heading)' }}>
                {new Date(proposal.metadata.generated).toLocaleDateString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section Tabs */}
      <Card style={{ backgroundColor: 'var(--primary-white)', border: '1px solid var(--light-gray)' }}>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2 mb-6">
            {sections.map(({ key, title, data }) => (
              <Button
                key={key}
                onClick={() => setActiveSection(key)}
                variant={activeSection === key ? "default" : "outline"}
                className="flex items-center space-x-2"
                style={{
                  backgroundColor: activeSection === key ? 'var(--primary-blue)' : 'transparent',
                  borderColor: 'var(--primary-blue)',
                  color: activeSection === key ? 'var(--primary-white)' : 'var(--primary-blue)'
                }}
              >
                <span>{getConfidenceIcon(data.confidence)}</span>
                <span>{title}</span>
                <span className={`text-xs ${getConfidenceColor(data.confidence)}`}>
                  ({data.confidence}%)
                </span>
              </Button>
            ))}
          </div>

          {/* Section Content */}
          {sections.map(({ key, title, data }) => (
            <div
              key={key}
              className={`${activeSection === key ? 'block' : 'hidden'}`}
            >
              {/* Section Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold" style={{ color: 'var(--dark-gray)', fontFamily: 'var(--font-heading)' }}>
                  {title}
                </h3>
                <div className={`flex items-center space-x-2 font-medium ${getConfidenceColor(data.confidence)}`}>
                  <span>{getConfidenceIcon(data.confidence)}</span>
                  <span>{data.confidence}% Confidence</span>
                </div>
              </div>

              {/* Section Content */}
              <Card className="mb-4" style={{ backgroundColor: 'var(--primary-white)', border: '1px solid var(--light-gray)' }}>
                <CardContent className="pt-6">
                  <div className="prose max-w-none">
                    {data.content.split('\n\n').map((paragraph, index) => (
                      <p key={index} className="mb-4 leading-relaxed" 
                         style={{ color: 'var(--dark-gray)', fontFamily: 'var(--font-body)' }}>
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Warnings */}
              {data.warnings.length > 0 && (
                <Card className="border-yellow-200" style={{ backgroundColor: '#fefce8' }}>
                  <CardContent className="pt-6">
                    <h4 className="font-medium text-yellow-800 mb-2">
                      ⚠️ Review Recommendations
                    </h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      {data.warnings.map((warning, index) => (
                        <li key={index}>• {warning}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          onClick={onDownload}
          disabled={!downloadUrl}
          className="flex-1"
          size="lg"
          style={{
            backgroundColor: 'var(--primary-blue)',
            color: 'var(--primary-white)',
            fontFamily: 'var(--font-heading)'
          }}
        >
          <span className="mr-2">📥</span>
          Download PowerPoint Presentation
        </Button>
        
        <Button
          onClick={onReset}
          variant="outline"
          size="lg"
          style={{
            borderColor: 'var(--primary-blue)',
            color: 'var(--primary-blue)',
            fontFamily: 'var(--font-heading)'
          }}
        >
          <span className="mr-2">🔄</span>
          Generate Another Proposal
        </Button>
      </div>

      {/* Next Steps */}
      <Card style={{ backgroundColor: '#eff6ff', border: '1px solid var(--primary-blue)' }}>
        <CardHeader>
          <CardTitle className="flex items-center" style={{ color: 'var(--primary-blue)', fontFamily: 'var(--font-heading)' }}>
            <span className="mr-2">📋</span>
            Next Steps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm" style={{ color: 'var(--dark-gray)', fontFamily: 'var(--font-body)' }}>
            <li>• Review the generated content for accuracy and completeness</li>
            <li>• Address any RAP compliance warnings highlighted above</li>
            <li>• Customize the presentation with client-specific details if needed</li>
            <li>• Schedule a review with your team before client delivery</li>
            <li>• Use this proposal as the foundation for your Statement of Work</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProposalResult;
