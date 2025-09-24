import React from 'react';
import ProposalGenerator from './components/ProposalGenerator';
import './App.css';

const App: React.FC = () => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--light-gray)' }}>
      {/* Header */}
      <header className="app-header">
        <div className="container">
          <h1 
            className="app-title text-center"
            style={{ 
              fontFamily: 'var(--font-heading)',
              fontWeight: 'var(--weight-bold)',
              color: 'var(--primary-blue)',
              fontSize: 'var(--text-h1)'
            }}
          >
            Presidio Solution Proposal Generator
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container" style={{ paddingTop: 'var(--spacing-lg)' }}>
        <ProposalGenerator />
      </main>
    </div>
  );
};

export default App;
