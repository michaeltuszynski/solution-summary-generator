import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

import { errorHandler } from './middleware/errorHandler';
import { validateDiscoveryData } from './middleware/validation';
import { ProposalController } from './controllers/proposalController';
import { DocumentService } from './services/documentService';
import { ProposalOrchestrator } from './services/proposalOrchestrator';
import { PPTXService } from './services/pptxService';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// File upload configuration
const uploadDir = path.join(__dirname, '..', 'uploads');
const generatedDir = path.join(__dirname, '..', 'generated');

// Ensure directories exist
[uploadDir, generatedDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.docx', '.txt', '.md'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} not supported. Allowed types: ${allowedTypes.join(', ')}`));
    }
  }
});

// Initialize services
const documentService = new DocumentService();
const proposalOrchestrator = new ProposalOrchestrator();
const pptxService = new PPTXService();

// Initialize controller
const proposalController = new ProposalController(
  documentService,
  proposalOrchestrator,
  pptxService
);

// Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    claudeModel: proposalOrchestrator.getCurrentModel(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API health check endpoint (for Railway)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Main proposal generation endpoint
app.post('/api/proposals/generate',
  upload.array('documents', 5),
  validateDiscoveryData,
  proposalController.generateProposal.bind(proposalController)
);

// Download generated PPTX
app.get('/api/proposals/download/:filename',
  proposalController.downloadPresentation.bind(proposalController)
);

// Get proposal status (for future use)
app.get('/api/proposals/:id/status',
  proposalController.getProposalStatus.bind(proposalController)
);

// Get available templates
app.get('/api/templates',
  proposalController.getTemplates.bind(proposalController)
);

// Debug endpoint to refresh Claude models
app.post('/api/debug/refresh-models', async (req, res) => {
  try {
    const newModel = await proposalOrchestrator.refreshBestModel();
    res.json({
      success: true,
      message: 'Models refreshed',
      currentModel: newModel
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Presidio Proposal Generator API running on http://localhost:${PORT}`);
  console.log(`📁 Upload directory: ${uploadDir}`);
  console.log(`💾 Generated files: ${generatedDir}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Validate AWS configuration
  if (!process.env.AWS_REGION) {
    console.warn('⚠️  AWS_REGION not set - using default region: us-east-1');
  }

  // Check for AWS credentials (they can come from multiple sources)
  const hasEnvCredentials = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;
  const hasProfileCredentials = process.env.AWS_PROFILE || process.env.AWS_SDK_LOAD_CONFIG;

  if (!hasEnvCredentials && !hasProfileCredentials) {
    console.log('📌 AWS credentials not found in environment variables');
    console.log('   AWS SDK will attempt to use IAM role or AWS CLI configuration');
  } else {
    console.log('✅ AWS credentials configured');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app;
