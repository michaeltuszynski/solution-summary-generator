# Presidio Solution Proposal Generator - Complete Technical Documentation

## 🏗️ Application Architecture

### Technology Stack
- **Backend**: Node.js 18+ with Express.js, TypeScript 5.2 (strict mode)
- **Frontend**: React 18.2 with TypeScript 4.9 (strict mode)
- **AI Engine**: AWS Bedrock with Claude models (intelligent model selection)
- **Document Processing**: Docxtemplater, PizZip, Mammoth, pdf-parse
- **Styling**: Tailwind CSS 3.3 with custom Presidio design variables
- **Security**: Helmet, CORS, express-rate-limit
- **Validation**: Joi schemas for input validation

### Project Structure
```
solution-summary-generator/
├── backend/                    # Node.js/Express API server
│   ├── src/
│   │   ├── server.ts           # Main Express server with middleware setup
│   │   ├── controllers/        # Request handlers
│   │   │   └── proposalController.ts  # Main proposal generation controller
│   │   ├── services/           # Business logic layer
│   │   │   ├── bedrockService.ts      # AWS Bedrock integration for Claude models
│   │   │   ├── proposalOrchestrator.ts # Template selection and orchestration
│   │   │   ├── proposalGenerator.ts    # Core generation engine
│   │   │   ├── documentService.ts     # File processing (PDF/DOCX/TXT/MD)
│   │   │   ├── pptxService.ts         # PowerPoint generation with templates
│   │   │   ├── templateSelectionService.ts # Template management and selection
│   │   │   ├── slideGeneratorService.ts    # Individual slide generation
│   │   │   ├── slideConfigService.ts       # Configuration management
│   │   │   └── promptTemplateEngine.ts     # Mustache template processing
│   │   ├── middleware/         # Express middleware
│   │   │   ├── errorHandler.ts        # Global error handling
│   │   │   └── validation.ts          # Joi validation schemas
│   │   ├── types/              # TypeScript interfaces
│   │   │   └── index.ts               # All type definitions
│   │   └── utils/              # Helper functions
│   ├── templates/              # PPTX templates
│   │   └── Solution Summary Template.pptx
│   ├── uploads/                # Temporary file storage
│   ├── generated/              # Generated presentations
│   ├── package.json            # Dependencies and scripts
│   └── tsconfig.json           # TypeScript config (strict mode)
│
├── frontend/                   # React SPA
│   ├── src/
│   │   ├── App.tsx             # Main app component
│   │   ├── components/         # React components
│   │   │   ├── ProposalGenerator.tsx  # Main orchestrator component
│   │   │   ├── DiscoveryForm.tsx      # Client data input form
│   │   │   ├── FileUpload.tsx         # Drag-and-drop file upload
│   │   │   ├── GenerationStatus.tsx   # Progress tracking
│   │   │   ├── ProposalResult.tsx     # Results display
│   │   │   └── ui/             # Reusable UI components
│   │   │       ├── button.tsx
│   │   │       ├── card.tsx
│   │   │       ├── input.tsx
│   │   │       ├── select.tsx
│   │   │       └── progress.tsx
│   │   ├── services/           # API communication
│   │   │   └── api.ts                  # Axios client with interceptors
│   │   ├── types/              # TypeScript interfaces
│   │   │   └── index.ts               # Shared type definitions
│   │   ├── lib/                # Utilities
│   │   │   └── utils.ts               # Helper functions
│   │   ├── App.css             # Global styles with Presidio variables
│   │   └── index.css           # Tailwind imports
│   ├── public/                 # Static assets
│   ├── package.json            # Dependencies and scripts
│   ├── tsconfig.json           # TypeScript config
│   └── tailwind.config.js     # Tailwind configuration
│
├── CLAUDE.md                   # AI assistant instructions
└── README.md                   # This file
```

## 🔄 Data Flow Architecture

### Request Flow
1. **User Input** → Frontend DiscoveryForm component
2. **Validation** → Frontend form validation + Backend Joi schemas
3. **File Processing** → Multer upload → DocumentService extraction
4. **AI Generation** → ProposalService → Claude API calls
5. **Content Processing** → Confidence scoring + RAP compliance checking
6. **Presentation Creation** → PPTXService template processing
7. **Response** → Frontend display with download link

### Key Services Detailed

#### BedrockService (backend/src/services/bedrockService.ts)
- **AWS Bedrock Integration**: Accesses Claude models through AWS Bedrock
- **Model Selection**: Tests available Claude models in priority order
  - Primary: anthropic.claude-3-5-sonnet-20241022-v2:0
  - Fallbacks: claude-3.5-sonnet-v1, claude-3-sonnet, claude-3-haiku
  - Falls back gracefully if preferred models unavailable

#### ProposalOrchestrator (backend/src/services/proposalOrchestrator.ts)
- **Orchestration**: Manages template selection and generation workflow
- **Template Support**: Selects appropriate template based on industry/project type
- **Delegation**: Creates and manages ProposalGenerator instances

#### ProposalGenerator (backend/src/services/proposalGenerator.ts)
- **Core Engine**: Actual proposal content generation
- **Configuration-Driven**: Works with YAML configuration files
- **Slide Processing**: Generates individual slides based on templates
- **Section Generation**: Creates 4 proposal sections
  - Overview: Executive summary with strategic alignment
  - Solution & Approach: Technical architecture and methodology
  - Expected Outcomes: Measurable business and technical benefits
  - Next Steps: Actionable immediate activities
- **Prompt Engineering**: Section-specific prompts with:
  - Presidio context and industry positioning
  - Bullet point formatting requirements
  - RAP compliance guidelines
  - Character limits for slide compatibility
- **Confidence Scoring Algorithm**:
  - Base score: 85%
  - Deductions for: risky terms (-10%), short content (-20%), poor structure (-10%)
  - Additions for: qualifying language (+5%), appropriate metrics
  - Section-specific checks (e.g., Presidio mention in overview)
- **RAP Compliance**: Detects and warns about risky terms
  - Risky: "ensure", "guarantee", "comprehensive", "validate", "will deliver"
  - Absolute: "always", "never", "all", "every", "completely"

#### PPTXService (backend/src/services/pptxService.ts)
- **Template Processing**: Uses Docxtemplater with PizZip
  - Loads branded PPTX template with placeholders
  - Replaces placeholders with generated content
  - Preserves all formatting and styling
- **Content Formatting**:
  - Removes markdown artifacts from Claude output
  - Intelligent bullet point processing (max 150 chars)
  - Smart splitting on conjunctions and natural breaks
  - Limits bullets to 5-6 per slide for readability
- **Fallback Mechanism**: Creates text summary if PPTX fails
- **Template Placeholders**:
  ```
  {COMPANY_NAME}, {PROJECT_TYPE}, {DATE}
  {OVERVIEW_CONTENT}, {SOLUTION_CONTENT}, {OUTCOMES_CONTENT}
  {CONFIDENCE_SCORE}, {OVERVIEW_CONFIDENCE}, etc.
  ```

#### DocumentService (backend/src/services/documentService.ts)
- **Supported Formats**: PDF, DOCX, TXT, MD
- **Processing Pipeline**:
  - PDF: pdf-parse library for text extraction
  - DOCX: Mammoth for Word document conversion
  - Content chunking for context management
  - Term extraction for enhanced proposals

## 🎨 Frontend Components

### ProposalGenerator.tsx (Main Orchestrator)
- **State Management**:
  - `discoveryData`: Form input data
  - `uploadedFiles`: Document upload tracking
  - `generationStatus`: Real-time progress
  - `proposal`: Generated content with scores
  - `downloadUrl`: PPTX file location
- **Step Indicator**: Visual progress through 3 phases
- **Error Handling**: User-friendly error display

### DiscoveryForm.tsx
- **Fields**: Company, Industry, Challenge, Tech Stack, Project Type, Duration, Budget, Success Criteria
- **Validation**: Required fields with type checking
- **Industry Options**: Manufacturing, Healthcare, Financial Services, Government, Retail, Education, Technology
- **Project Types**: Digital Transformation, ERP Modernization, Cloud Migration, Infrastructure, Security, Analytics, Custom Dev

### FileUpload.tsx
- **Drag & Drop**: React-dropzone implementation
- **File Validation**: Type and size restrictions
- **Progress Tracking**: Upload status per file
- **Multi-file Support**: Up to 5 documents

## 🔐 Security Implementation

### Backend Security
```typescript
// Helmet for security headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // requests per window
});

// File upload restrictions
const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5
  },
  fileFilter: // Type validation
});
```

## 📊 TypeScript Configuration

### Backend (tsconfig.json)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### Frontend (tsconfig.json)
```json
{
  "compilerOptions": {
    "target": "es5",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

## 🚀 API Endpoints

### Main Endpoints
- `POST /api/proposals/generate` - Generate proposal from discovery data
  - Body: multipart/form-data with discoveryData JSON and optional documents
  - Returns: Proposal object with sections, confidence scores, and download URL
- `GET /api/proposals/download/:filename` - Download generated PPTX
- `GET /api/proposals/:id/status` - Get proposal generation status
- `GET /api/templates` - Get available proposal templates
- `GET /api/health` - Health check with model info
- `POST /api/debug/refresh-models` - Refresh Claude model selection

### Response Structure
```typescript
interface GenerationResponse {
  success: boolean;
  proposal?: {
    metadata: {
      id: string;
      generated: Date;
      client: string;
      industry: string;
      projectType: string;
    };
    sections: {
      overview: ProposalSection;
      solution_approach: ProposalSection;
      outcomes: ProposalSection;
      next_steps: ProposalSection;
    };
    overallConfidence: number;
  };
  downloadUrl?: string;
  error?: string;
}

interface ProposalSection {
  content: string;
  confidence: number;  // 0-100
  warnings: string[];  // RAP compliance warnings
  generatedAt: Date;
}
```

## 🎯 Business Logic Features

### Confidence Scoring System
- **Content Completeness**: Length and structure analysis
- **RAP Compliance**: Risky term detection
- **Technical Accuracy**: Keyword presence checks
- **Business Alignment**: Industry-specific validation
- **Overall Score**: Weighted average of all factors

### RAP Compliance Engine
- **Risky Terms Detection**: Automated scanning for commitment language
- **Warning Generation**: Specific guidance on problematic phrases
- **Suggestions**: Alternative phrasing recommendations
- **Compliance Scoring**: Impact on overall confidence

### Intelligent Content Processing
- **Bullet Point Optimization**: Smart truncation and splitting
- **Markdown Cleanup**: Removes formatting artifacts
- **Section Header Removal**: Prevents duplicate titles
- **Content Structuring**: Ensures slide-compatible format

## 🔧 Environment Configuration

### Backend (.env)
```env
# AWS Bedrock Configuration (uses IAM role or AWS credentials)
AWS_REGION=us-east-1                  # AWS region for Bedrock
AWS_ACCESS_KEY_ID=xxx                 # Optional: If not using IAM role
AWS_SECRET_ACCESS_KEY=xxx             # Optional: If not using IAM role
NODE_ENV=development                   # Environment mode
PORT=3001                              # Server port
FRONTEND_URL=http://localhost:3000    # CORS origin
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:3001/api  # Backend API URL
```

## 📦 Key Dependencies

### Backend
- **express**: 4.18.2 - Web framework
- **@aws-sdk/client-bedrock-runtime**: 3.895.0 - AWS Bedrock SDK for Claude
- **axios**: 1.6.0 - HTTP client
- **docxtemplater**: 3.66.3 - PPTX template processing
- **pizzip**: 3.2.0 - ZIP file manipulation
- **multer**: 1.4.5 - File upload handling
- **joi**: 17.13.3 - Schema validation
- **mustache**: 4.2.0 - Template engine for prompts
- **yaml**: 2.8.1 - YAML configuration parsing
- **helmet**: 7.1.0 - Security headers
- **cors**: 2.8.5 - Cross-origin support
- **express-rate-limit**: 7.1.5 - Rate limiting
- **pdf-parse**: 1.1.1 - PDF text extraction
- **mammoth**: 1.6.0 - DOCX processing

### Frontend
- **react**: 18.2.0 - UI framework
- **axios**: 1.6.0 - API communication
- **tailwindcss**: 3.3.5 - Utility-first CSS
- **react-dropzone**: 14.2.3 - File upload UI
- **lucide-react**: 0.544.0 - Icon library
- **class-variance-authority**: 0.7.1 - Component variants
- **@radix-ui/react-***: UI primitives

## 🚦 Running the Application

### Development Mode
```bash
# Terminal 1: Backend
cd backend
npm install
npm run dev  # Runs on http://localhost:3001

# Terminal 2: Frontend
cd frontend
npm install
npm start    # Runs on http://localhost:3000
```

### Production Build
```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
serve -s build
```

## 🧪 Testing Considerations

### Unit Testing Strategy
- **Backend**: Jest with ts-jest for service testing
- **Frontend**: React Testing Library for component testing
- **API Testing**: Supertest for endpoint validation
- **Mocking**: Claude API responses for consistent testing

### Integration Testing
- End-to-end flow validation
- File upload processing verification
- PPTX generation validation
- Cross-browser compatibility testing

## 📈 Performance Optimizations

### Backend
- Async/await for non-blocking operations
- Stream processing for large files
- Caching for Claude model availability
- Connection pooling for API clients

### Frontend
- React.memo for expensive components
- Lazy loading for code splitting
- Optimistic UI updates
- Debounced API calls

## 🔮 Future Enhancements

### Phase 1 (Weeks 1-2)
- Add remaining proposal sections (Activity Scope, Assumptions, Client Responsibilities, Additional Considerations)
- Implement vector database (Pinecone/Weaviate) for RAG
- Add semantic search for historical proposals

### Phase 2 (Weeks 3-4)
- Machine learning for confidence scoring
- Industry-specific templates
- Multi-language support
- Advanced analytics dashboard

### Phase 3 (Month 2)
- Collaboration features (comments, annotations)
- Version control for proposals
- Workflow automation
- API for third-party integrations

## 📝 Code Quality Standards

### TypeScript Best Practices
- Strict mode enabled
- No implicit any
- Exhaustive type checking
- Interface-first design

### React Patterns
- Functional components with hooks
- Proper error boundaries
- Controlled components
- Custom hooks for logic reuse

### API Design
- RESTful principles
- Proper HTTP status codes
- Comprehensive error responses
- Request/response validation

## 🛡️ Security Best Practices

1. **Input Validation**: All user input validated with Joi schemas
2. **File Security**: Type validation, size limits, virus scanning ready
3. **API Security**: Rate limiting, CORS, authentication ready
4. **Secret Management**: Environment variables, never committed
5. **Error Handling**: No sensitive data in error messages
6. **Dependency Security**: Regular updates, vulnerability scanning

## 📊 Monitoring & Observability

### Logging Strategy
- Request/response logging
- Error tracking with stack traces
- Performance metrics
- Claude API usage tracking

### Health Checks
- `/api/health` endpoint
- Model availability monitoring
- File system checks
- Database connectivity (when added)

## 🎯 Business Value Metrics

- **Time Reduction**: 75% faster proposal generation (8 hours → 2 hours)
- **Quality Improvement**: Consistent RAP compliance
- **Scalability**: Junior staff can create senior-level proposals
- **ROI**: Immediate through time savings and quality improvement

## 🎨 Template Customization

### Overview
The Solution Summary Generator uses a configuration-driven template system that allows for easy customization of proposals based on industry, project type, and client needs.

### Template System Architecture
Templates are stored in `/backend/config/templates/` with the following structure:
```
backend/config/templates/
├── default/              # Standard template
│   ├── config.yaml      # Template configuration
│   └── template.pptx    # PowerPoint file
├── examples/            # Industry-specific examples
│   ├── healthcare/      # Healthcare template
│   ├── financial/       # Financial services template
│   └── manufacturing/   # Manufacturing template
```

### Quick Start - Customizing Templates

1. **Modify Existing Templates**
   - Edit `/backend/config/templates/default/config.yaml`
   - Adjust prompts, variables, and validation rules
   - See [Template Quick Reference](docs/TEMPLATE_QUICK_REFERENCE.md) for syntax

2. **Create Industry-Specific Templates**
   ```bash
   # Copy an example template
   cp -r backend/config/templates/examples/healthcare backend/config/templates/healthcare

   # Customize the configuration
   edit backend/config/templates/healthcare/config.yaml

   # Test your template
   npm run generate -- --template=healthcare --test
   ```

3. **Key Customization Points**
   - **Prompts**: Tailor AI instructions for specific industries
   - **Variables**: Control formatting (bullets, word counts)
   - **Compliance**: Define risky/required terms
   - **Validation**: Set content quality thresholds

### Template Documentation

- **[Template Iteration Guide](docs/TEMPLATE_ITERATION_GUIDE.md)** - Comprehensive guide for template customization
  - Input mapping and data flow
  - Prompt engineering best practices
  - Industry-specific adaptations
  - Testing and validation workflows
  - Troubleshooting common issues

- **[Template Quick Reference](docs/TEMPLATE_QUICK_REFERENCE.md)** - One-page reference card
  - Variable syntax and common patterns
  - Validation rules and scoring
  - Quick fixes for common problems
  - Testing commands

- **[Example Templates](backend/config/templates/examples/README.md)** - Industry samples
  - Healthcare (HIPAA compliance focus)
  - Financial Services (regulatory emphasis)
  - Manufacturing (Industry 4.0/OT focus)

### Template Variables (Mustache Syntax)

| Variable | Description | Example Usage |
|----------|-------------|---------------|
| `{{companyName}}` | Client company | `For {{companyName}}'s needs...` |
| `{{industry}}` | Industry vertical | `{{#isHealthcare}}HIPAA focus{{/isHealthcare}}` |
| `{{businessChallenge}}` | Problem statement | `Addressing: {{businessChallenge}}` |
| `{{maxBullets}}` | Bullet limit | `Maximum {{maxBullets}} points` |

### Testing Templates

```bash
# Validate template syntax
npm run validate:template -- --template=default

# Generate test output
npm run generate -- --template=healthcare --company="Test Corp" --test

# Compare template outputs
npm run compare -- --baseline=default --variant=healthcare
```

## 📚 Additional Resources

- [Anthropic Claude API Documentation](https://docs.anthropic.com)
- [React TypeScript Best Practices](https://react-typescript-cheatsheet.netlify.app)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

This README serves as the complete technical documentation for the Presidio Solution Proposal Generator. It captures the full architecture, implementation details, and serves as a reference for future development and maintenance.