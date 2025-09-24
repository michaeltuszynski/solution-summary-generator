# AWS Bedrock Migration Guide

## Migration from Anthropic Direct API to AWS Bedrock

### ✅ Completed Changes

#### 1. **Dependencies Updated**
- Added: `@aws-sdk/client-bedrock-runtime` (v3.895.0)
- Removed dependency on direct Anthropic API
- Kept `axios` for other HTTP requests

#### 2. **New BedrockService Class**
Created `backend/src/services/bedrockService.ts`:
- Uses AWS SDK v3 `BedrockRuntimeClient`
- Implements model availability testing
- Prioritizes latest Claude models (Sonnet 4, 3.5, 3, Haiku)
- Handles AWS-specific errors (throttling, access denied, validation)
- Maintains same interface as previous implementation

#### 3. **Updated ProposalService**
Modified `backend/src/services/proposalService.ts`:
- Replaced direct Anthropic axios calls with BedrockService
- Removed API key management
- Delegates model selection to BedrockService
- Maintains all existing business logic

#### 4. **Environment Configuration**
Updated `.env` file structure:
```env
# NEW - AWS Configuration
AWS_REGION=us-east-1

# UNCHANGED - Server Configuration
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# REMOVED - No longer needed
# ANTHROPIC_API_KEY=sk-ant-xxx
```

### 📋 AWS Setup Requirements

#### Option 1: AWS IAM Role (Recommended for EC2/ECS/Lambda)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": "arn:aws:bedrock:*:*:foundation-model/anthropic.claude*"
    }
  ]
}
```

#### Option 2: AWS CLI Configuration (Local Development)
```bash
# Configure AWS credentials
aws configure

# Enter:
# AWS Access Key ID: YOUR_ACCESS_KEY
# AWS Secret Access Key: YOUR_SECRET_KEY
# Default region name: us-east-1
# Default output format: json
```

#### Option 3: Environment Variables
```bash
export AWS_ACCESS_KEY_ID=your_access_key_id
export AWS_SECRET_ACCESS_KEY=your_secret_access_key
export AWS_REGION=us-east-1
```

### 🚀 Testing the Migration

1. **Verify AWS Credentials**:
```bash
aws sts get-caller-identity
```

2. **Check Bedrock Access**:
```bash
aws bedrock list-foundation-models --region us-east-1 | grep claude
```

3. **Run Test Script**:
```bash
cd backend
npx ts-node src/test-bedrock.ts
```

4. **Start the Application**:
```bash
npm run dev
```

### 📊 Model Priority Order

The BedrockService attempts to use models in this order:
1. `anthropic.claude-sonnet-4-20250514-v1:0` - Latest Claude Sonnet 4
2. `anthropic.claude-3-5-sonnet-20241022-v1:0` - Latest Claude 3.5 Sonnet
3. `anthropic.claude-3-5-sonnet-20240620-v1:0` - Previous Claude 3.5 Sonnet
4. `anthropic.claude-3-sonnet-20240229-v1:0` - Claude 3 Sonnet
5. `anthropic.claude-3-haiku-20240307-v1:0` - Claude 3 Haiku (fallback)

### 🔄 Key Differences from Direct API

| Aspect | Anthropic Direct | AWS Bedrock |
|--------|-----------------|-------------|
| Authentication | API Key | IAM Role/Credentials |
| Endpoint | api.anthropic.com | bedrock-runtime.region.amazonaws.com |
| Model IDs | claude-3-sonnet | anthropic.claude-3-sonnet-v1:0 |
| Error Types | HTTP errors | AWS SDK exceptions |
| Rate Limiting | Per API key | Per AWS account/region |
| Billing | Anthropic billing | AWS billing |

### ⚠️ Important Notes

1. **AWS Account Requirements**:
   - Must have Bedrock access enabled in your AWS account
   - May need to request access to specific Claude models
   - Check model availability in your region

2. **Cost Considerations**:
   - Billing through AWS instead of Anthropic
   - Pricing may differ from direct API
   - Monitor usage through AWS CloudWatch

3. **Regional Availability**:
   - Not all models available in all regions
   - Best availability in us-east-1 and us-west-2
   - Can use cross-region inference if needed

### 🛠️ Troubleshooting

**Error: Could not load credentials from any providers**
- Solution: Configure AWS credentials using one of the options above

**Error: AccessDeniedException**
- Solution: Ensure IAM user/role has bedrock:InvokeModel permission

**Error: Model not found**
- Solution: Check model availability in your region
- May need to request access through AWS console

**Error: ThrottlingException**
- Solution: Implement exponential backoff
- Consider using different regions for load distribution

### 🔜 Future Enhancements

1. **Implement response streaming** for real-time generation
2. **Add CloudWatch logging** for monitoring
3. **Implement AWS X-Ray tracing** for performance analysis
4. **Add multi-region failover** for high availability
5. **Cache model availability** to reduce startup checks

### 📚 Resources

- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/)
- [Bedrock Model IDs](https://docs.aws.amazon.com/bedrock/latest/userguide/model-ids.html)
- [IAM Policies for Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/security-iam.html)