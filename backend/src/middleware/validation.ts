import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { DiscoveryData } from '../types';

const discoveryDataSchema = Joi.object<DiscoveryData>({
  companyName: Joi.string().required().min(1).max(100).trim(),
  industry: Joi.string().required().valid(
    'Manufacturing',
    'Healthcare', 
    'Financial Services',
    'Government',
    'Retail',
    'Education',
    'Technology',
    'Other'
  ),
  businessChallenge: Joi.string().required().min(10).max(2500).trim(),
  techStack: Joi.string().optional().max(500).trim(),
  projectType: Joi.string().required().valid(
    'Digital Transformation',
    'ERP Modernization',
    'Cloud Migration',
    'Infrastructure Upgrade',
    'Security Enhancement',
    'Data Analytics',
    'Custom Development'
  ),
  duration: Joi.string().optional().valid(
    '1-3 months',
    '3-6 months', 
    '6-12 months',
    '12+ months'
  ),
  budgetRange: Joi.string().optional().valid(
    'Under $100K',
    '$100K - $500K',
    '$500K - $1M'
  ),
  successCriteria: Joi.string().optional().max(2500).trim()
});

export const validateDiscoveryData = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    let discoveryData: DiscoveryData;
    
    // Handle both JSON and form-data
    if (req.body.discoveryData) {
      // Form-data (with file uploads)
      discoveryData = typeof req.body.discoveryData === 'string' 
        ? JSON.parse(req.body.discoveryData)
        : req.body.discoveryData;
    } else {
      // Direct JSON
      discoveryData = req.body;
    }

    const { error, value } = discoveryDataSchema.validate(discoveryData, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      });
      return;
    }

    // Attach validated data to request
    req.body.discoveryData = value;
    next();
    
  } catch (parseError) {
    res.status(400).json({
      success: false,
      error: 'Invalid JSON in discoveryData field'
    });
  }
};

export const validateFileUploads = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const files = req.files as Express.Multer.File[] | undefined;
  
  if (files && files.length > 0) {
    const allowedTypes = ['.pdf', '.docx', '.txt', '.md'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    for (const file of files) {
      // Check file size
      if (file.size > maxSize) {
        res.status(400).json({
          success: false,
          error: `File ${file.originalname} exceeds 10MB limit`
        });
        return;
      }
      
      // Check file type
      const ext = file.originalname.toLowerCase().split('.').pop();
      if (!ext || !allowedTypes.includes(`.${ext}`)) {
        res.status(400).json({
          success: false,
          error: `File type .${ext} not supported. Allowed: ${allowedTypes.join(', ')}`
        });
        return;
      }
    }
  }
  
  next();
};
