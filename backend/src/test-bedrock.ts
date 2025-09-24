import dotenv from 'dotenv';
import { BedrockService } from './services/bedrockService';

// Load environment variables
dotenv.config();

async function testBedrockIntegration() {
  console.log('🔧 Testing AWS Bedrock Integration...\n');

  try {
    // Initialize BedrockService
    const bedrockService = new BedrockService();

    // Wait for model initialization
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get current model
    const currentModel = bedrockService.getCurrentModel();
    console.log(`\n📍 Current Model: ${currentModel}\n`);

    // Test a simple prompt
    console.log('📝 Testing simple prompt...');
    const testMessages = [
      {
        role: 'user',
        content: 'Please respond with exactly: "AWS Bedrock integration is working!"'
      }
    ];

    const response = await bedrockService.invokeModel(testMessages, 100, 0.1);
    console.log('✅ Response received:');
    console.log('   Content:', response.content[0]?.text);
    console.log('   Model:', response.model);
    console.log('   Stop Reason:', response.stop_reason);
    console.log('   Tokens Used:', response.usage);

    // Test a more complex prompt for proposal generation
    console.log('\n📝 Testing proposal-style prompt...');
    const proposalMessages = [
      {
        role: 'user',
        content: `Generate a brief overview for a company called TestCorp in the Manufacturing industry facing digital transformation challenges. Keep it to 2-3 bullet points.`
      }
    ];

    const proposalResponse = await bedrockService.invokeModel(proposalMessages, 500, 0.7);
    console.log('✅ Proposal Response received:');
    console.log('   Content:', proposalResponse.content[0]?.text);

    console.log('\n🎉 AWS Bedrock integration test completed successfully!');

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error('   Error details:', error);
    process.exit(1);
  }
}

// Run the test
console.log('========================================');
console.log('AWS Bedrock Integration Test');
console.log('========================================\n');

testBedrockIntegration().then(() => {
  console.log('\n========================================');
  process.exit(0);
}).catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});