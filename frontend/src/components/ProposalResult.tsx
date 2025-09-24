import React, { useState } from 'react';
import { Proposal, ProposalSection } from '../types';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

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

  // Build sections array from all available sections in the proposal
  const sections: Array<{ key: string; title: string; data: ProposalSection }> = [];

  // Add sections in a specific order if they exist
  const sectionOrder = [
    { key: 'problem_statement', title: 'Problem Statement' },
    { key: 'overview', title: 'Overview' },
    { key: 'solution_approach', title: 'Solution & Approach' },
    { key: 'outcomes', title: 'Expected Outcomes' },
    { key: 'next_steps', title: 'Next Steps' },
    { key: 'assumptions', title: 'Assumptions' },
    { key: 'client_responsibilities', title: 'Client Responsibilities' }
  ];

  for (const section of sectionOrder) {
    const sectionData = proposal.sections[section.key];
    if (sectionData) {
      sections.push({
        key: section.key,
        title: section.title,
        data: sectionData
      });
    }
  }

  // Add any other sections not in the predefined order
  for (const key in proposal.sections) {
    const sectionData = proposal.sections[key];
    if (sectionData && !sectionOrder.find(s => s.key === key)) {
      // Format the key into a title (e.g., "activity_scope" -> "Activity Scope")
      const title = key.split('_').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');

      sections.push({
        key,
        title,
        data: sectionData
      });
    }
  }

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

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
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

      {/* Section Navigation - Segmented Control Style */}
      <Card style={{ backgroundColor: 'var(--primary-white)', border: '1px solid var(--light-gray)' }}>
        <CardContent className="pt-6">
          {/* Section Navigation */}
          <div className="mb-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {sections.map(({ key, title, data }) => (
                <button
                  key={key}
                  onClick={() => setActiveSection(key)}
                  className="px-3 py-2 text-sm font-medium rounded-md transition-all hover:shadow-md"
                  style={{
                    backgroundColor: activeSection === key ? 'var(--primary-blue)' : 'white',
                    color: activeSection === key ? 'var(--primary-white)' : 'var(--dark-gray)',
                    border: activeSection === key ? '2px solid var(--primary-blue)' : '1px solid var(--medium-gray)',
                    cursor: 'pointer',
                    boxShadow: activeSection === key ? '0 2px 4px rgba(0,0,0,0.1)' : '0 1px 2px rgba(0,0,0,0.05)'
                  }}
                  onMouseEnter={(e) => {
                    if (activeSection !== key) {
                      e.currentTarget.style.backgroundColor = 'var(--light-gray)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeSection !== key) {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  <div className="truncate font-semibold">{title}</div>
                  <div
                    className="text-xs mt-1"
                    style={{
                      opacity: activeSection === key ? 0.9 : 0.7
                    }}
                  >
                    {data.confidence}% Confidence
                  </div>
                </button>
              ))}
            </div>
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
                    {data.content.split('\n').map((line, index) => {
                      // Check if this line is a bullet point
                      const isBullet = line.trim().startsWith('•');

                      if (isBullet) {
                        return (
                          <p key={index} className="mb-2 leading-relaxed"
                             style={{ color: 'var(--dark-gray)', fontFamily: 'var(--font-body)' }}>
                            {line}
                          </p>
                        );
                      } else if (line.trim()) {
                        // Non-bullet text with normal spacing
                        return (
                          <p key={index} className="mb-4 leading-relaxed"
                             style={{ color: 'var(--dark-gray)', fontFamily: 'var(--font-body)' }}>
                            {line}
                          </p>
                        );
                      }
                      return null;
                    })}
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
                        <li key={index}>{warning.startsWith('•') ? warning.substring(1).trim() : warning}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          ))}
        </CardContent>
      </Card>


    </div>
  );
};

export default ProposalResult;
