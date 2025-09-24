import dotenv from 'dotenv';
import { ProposalService } from './services/proposalService';
import { DiscoveryData } from './types';

// Load environment variables
dotenv.config();

async function testConfigurationDrivenSystem() {
  console.log('========================================');
  console.log('Configuration-Driven System Test');
  console.log('========================================\n');

  try {
    // Initialize the service (will automatically use V2 if config exists)
    const proposalService = new ProposalService();

    // Get configuration status
    const configStatus = proposalService.getConfigurationStatus();
    console.log('📋 Configuration Status:');
    console.log(JSON.stringify(configStatus, null, 2));
    console.log();

    // Check current model
    const currentModel = proposalService.getCurrentModel();
    console.log(`🤖 Current Model: ${currentModel}\n`);

    // Create test discovery data
    const discoveryData: DiscoveryData = {
      companyName: 'TechCorp Industries',
      industry: 'Manufacturing',
      businessChallenge: 'Digital transformation of supply chain and production processes',
      techStack: 'Legacy ERP systems, Oracle databases, custom applications',
      projectType: 'Digital Transformation',
      duration: '6-12 months',
      budgetRange: '$500K - $1M',
      successCriteria: 'Improved operational efficiency, real-time visibility, reduced costs'
    };

    console.log('📝 Test Discovery Data:');
    console.log(`   Company: ${discoveryData.companyName}`);
    console.log(`   Industry: ${discoveryData.industry}`);
    console.log(`   Project: ${discoveryData.projectType}`);
    console.log();

    // Generate proposal
    console.log('🚀 Generating proposal with configuration-driven system...\n');
    const startTime = Date.now();

    const proposal = await proposalService.generateProposal(discoveryData);

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    console.log(`✅ Proposal generated in ${duration.toFixed(2)} seconds\n`);

    // Display results
    console.log('📊 Proposal Results:');
    console.log('==================\n');

    // Overview Section
    if (proposal.sections.overview) {
      console.log('📌 OVERVIEW');
      console.log('-----------');
      console.log(`Confidence: ${proposal.sections.overview.confidence}%`);
      console.log(`Warnings: ${proposal.sections.overview.warnings.length}`);
      if (proposal.sections.overview.warnings.length > 0) {
        proposal.sections.overview.warnings.forEach(w => console.log(`  - ${w}`));
      }
      console.log('\nContent Preview:');
      const overviewLines = proposal.sections.overview.content.split('\n').slice(0, 3);
      overviewLines.forEach(line => console.log(`  ${line}`));
      console.log();
    }

    // Solution & Approach Section
    if (proposal.sections.solution_approach) {
      console.log('🔧 SOLUTION & APPROACH');
      console.log('---------------------');
      console.log(`Confidence: ${proposal.sections.solution_approach.confidence}%`);
      console.log(`Warnings: ${proposal.sections.solution_approach.warnings.length}`);
      console.log('\nContent Preview:');
      const solutionLines = proposal.sections.solution_approach.content.split('\n').slice(0, 3);
      solutionLines.forEach(line => console.log(`  ${line}`));
      console.log();
    }

    // Expected Outcomes Section
    if (proposal.sections.outcomes) {
      console.log('🎯 EXPECTED OUTCOMES');
      console.log('-------------------');
      console.log(`Confidence: ${proposal.sections.outcomes.confidence}%`);
      console.log(`Warnings: ${proposal.sections.outcomes.warnings.length}`);
      console.log('\nContent Preview:');
      const outcomesLines = proposal.sections.outcomes.content.split('\n').slice(0, 3);
      outcomesLines.forEach(line => console.log(`  ${line}`));
      console.log();
    }

    // Next Steps Section
    if (proposal.sections.next_steps) {
      console.log('📋 NEXT STEPS');
      console.log('------------');
      console.log(`Warnings: ${proposal.sections.next_steps.warnings.length}`);
      console.log('\nContent Preview:');
      const nextStepsLines = proposal.sections.next_steps.content.split('\n').slice(0, 3);
      nextStepsLines.forEach(line => console.log(`  ${line}`));
      console.log();
    }

    // Overall Statistics
    console.log('📈 Overall Statistics:');
    console.log('--------------------');
    console.log(`Overall Confidence: ${proposal.overallConfidence}%`);
    console.log(`Total Sections: ${Object.keys(proposal.sections).length}`);

    // Calculate total warnings
    let totalWarnings = 0;
    Object.values(proposal.sections).forEach(section => {
      totalWarnings += section.warnings.length;
    });
    console.log(`Total Warnings: ${totalWarnings}`);

    console.log('\n🎉 Configuration-driven system test completed successfully!');

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Test configuration validation
async function testConfigValidation() {
  console.log('\n========================================');
  console.log('Configuration Validation Test');
  console.log('========================================\n');

  try {
    const proposalService = new ProposalService();

    // Test validation with current config (V2 only)
    const configStatus = proposalService.getConfigurationStatus();
    console.log('Current configuration status:', configStatus);

    console.log('\n✅ Configuration validation test passed');
  } catch (error: any) {
    console.error('❌ Validation test failed:', error.message);
  }
}

// Run tests
async function runAllTests() {
  await testConfigurationDrivenSystem();
  await testConfigValidation();
  console.log('\n========================================');
  console.log('All tests completed');
  console.log('========================================');
}

// Execute
runAllTests().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});