import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { ClaudeRequest, ClaudeResponse } from '../types';

export class BedrockService {
  private client: BedrockRuntimeClient;
  private bestModel: string = 'anthropic.claude-3-sonnet-20240229-v1:0'; // fallback
  private availableModels = [
    'anthropic.claude-3-5-sonnet-20241022-v2:0',    // Claude 3.5 Sonnet v2 - BEST for proposals
    'us.anthropic.claude-3-7-sonnet-20250219-v1:0', // Claude 3.7 Sonnet (newest but requires inference profile)
    'anthropic.claude-3-5-sonnet-20240620-v1:0',    // Claude 3.5 Sonnet v1 (fallback)
    'anthropic.claude-3-sonnet-20240229-v1:0',      // Claude 3 Sonnet (fallback)
    'anthropic.claude-3-haiku-20240307-v1:0'        // Claude 3 Haiku (fast fallback)
  ];

  constructor() {
    const region = process.env.AWS_REGION || 'us-east-1';

    this.client = new BedrockRuntimeClient({
      region: region,
      // AWS SDK will automatically use IAM role, environment variables, or AWS config
      // No need to explicitly set credentials here
    });

    // Initialize best model on startup
    this.initializeBestModel();
  }

  private async initializeBestModel(): Promise<void> {
    try {
      console.log('🔍 Testing AWS Bedrock model availability...');

      // Test models in priority order
      for (const modelId of this.availableModels) {
        if (await this.testModel(modelId)) {
          this.bestModel = modelId;
          console.log(`✅ Using available Bedrock model: ${this.bestModel}`);
          return;
        }
      }

      console.warn('⚠️ No preferred models available, using fallback:', this.bestModel);
    } catch (error) {
      console.warn('⚠️ Failed to initialize model, using fallback:', this.bestModel);
    }
  }

  private async testModel(modelId: string): Promise<boolean> {
    try {
      console.log(`🔍 Testing model availability: ${modelId}`);

      // Make a minimal test request to see if the model is available
      const testRequest = {
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 10,
        temperature: 0.1,
        messages: [{ role: 'user', content: 'Hi' }]
      };

      const command = new InvokeModelCommand({
        modelId: modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(testRequest)
      });

      await this.client.send(command);
      console.log(`✅ Model ${modelId} is available`);
      return true;
    } catch (error: any) {
      console.log(`❌ Model ${modelId} test failed:`, {
        name: error.name,
        message: error.message
      });

      // Check for specific AWS error types
      if (error.name === 'ResourceNotFoundException' ||
          error.name === 'ModelNotReadyException') {
        return false;
      }

      if (error.name === 'ThrottlingException') {
        console.warn(`⚠️ Rate limited testing ${modelId}, assuming available`);
        return true;
      }

      if (error.name === 'AccessDeniedException' ||
          error.name === 'UnauthorizedException') {
        console.error(`🚫 Authentication error testing ${modelId}:`, error.message);
        return false;
      }

      // For other errors, assume the model might be available
      return false;
    }
  }

  async invokeModel(messages: any[], maxTokens: number = 2000, temperature: number = 0.7): Promise<ClaudeResponse> {
    const claudeRequest = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: maxTokens,
      temperature: temperature,
      messages: messages
    };

    try {
      const command = new InvokeModelCommand({
        modelId: this.bestModel,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(claudeRequest)
      });

      const response = await this.client.send(command);

      // Parse the response body
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));

      // Convert Bedrock response to our ClaudeResponse format
      const claudeResponse: ClaudeResponse = {
        content: responseBody.content || [{ text: 'No content generated', type: 'text' }],
        id: responseBody.id || '',
        model: responseBody.model || this.bestModel,
        role: responseBody.role || 'assistant',
        stop_reason: responseBody.stop_reason || 'stop_sequence',
        stop_sequence: responseBody.stop_sequence || null,
        type: responseBody.type || 'message',
        usage: responseBody.usage || { input_tokens: 0, output_tokens: 0 }
      };

      return claudeResponse;
    } catch (error: any) {
      console.error('Bedrock API error:', {
        name: error.name,
        message: error.message,
        modelId: this.bestModel
      });

      // Enhance error message for better debugging
      let errorMessage = error.message || 'Unknown Bedrock API error';

      if (error.name === 'ThrottlingException') {
        errorMessage = 'Rate limit exceeded. Please try again in a few moments.';
      } else if (error.name === 'AccessDeniedException') {
        errorMessage = 'Access denied. Please check AWS IAM permissions for Bedrock.';
      } else if (error.name === 'ValidationException') {
        errorMessage = 'Invalid request format. Please check the input parameters.';
      }

      throw new Error(`Failed to invoke Bedrock model: ${errorMessage}`);
    }
  }

  // Public method to refresh model selection if needed
  async refreshBestModel(): Promise<string> {
    await this.initializeBestModel();
    return this.bestModel;
  }

  // Get current model being used
  getCurrentModel(): string {
    return this.bestModel;
  }
}