import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../types';

export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Handle specific error types
  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: err.message
    });
    return;
  }

  if (err.name === 'MulterError') {
    let message = 'File upload error';
    let status = 400;
    
    switch ((err as any).code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File size too large (max 10MB)';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files (max 5)';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field';
        break;
      default:
        message = err.message;
    }
    
    res.status(status).json({
      success: false,
      error: message
    });
    return;
  }

  // Handle API errors with status codes
  if ('status' in err) {
    const apiError = err as ApiError;
    res.status(apiError.status).json({
      success: false,
      error: apiError.message,
      code: apiError.code
    });
    return;
  }

  // Handle Anthropic API errors
  if (err.message.includes('Anthropic') || err.message.includes('Claude')) {
    res.status(503).json({
      success: false,
      error: 'AI service temporarily unavailable',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
    return;
  }

  // Default error response
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};
