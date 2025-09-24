import { Request, Response, NextFunction } from 'express';
import { DiscoveryData, GenerationResponse } from '../types';
import { DocumentService } from '../services/documentService';
import { ProposalService } from '../services/proposalService';
import { PPTXService } from '../services/pptxService';
import fs from 'fs';
import path from 'path';

export class ProposalController {
  constructor(
    private documentService: DocumentService,
    private proposalService: ProposalService,
    private pptxService: PPTXService
  ) {}

  async generateProposal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const discoveryData: DiscoveryData = req.body.discoveryData;
      const files = req.files as Express.Multer.File[] | undefined;

      console.log('Generating proposal for:', discoveryData.companyName);
      console.log('Files uploaded:', files?.length || 0);

      // Process uploaded documents for context
      let documentContext = '';
      if (files && files.length > 0) {
        for (const file of files) {
          try {
            const content = await this.documentService.extractContent(file.path);
            documentContext += content + '\n\n';
          } catch (error) {
            console.warn(`Failed to process ${file.originalname}:`, error);
          }
        }
      }

      // Generate proposal content
      const proposal = await this.proposalService.generateProposal(discoveryData, documentContext);

      // Generate PPTX presentation
      const pptxPath = await this.pptxService.createPresentation(proposal, discoveryData);

      // Clean up uploaded files
      if (files) {
        files.forEach(file => {
          try {
            fs.unlinkSync(file.path);
          } catch (error) {
            console.warn('Failed to cleanup file:', file.path);
          }
        });
      }

      const response: GenerationResponse = {
        success: true,
        proposal,
        downloadUrl: `/api/proposals/download/${path.basename(pptxPath)}`
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async downloadPresentation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filename = req.params.filename;
      const filePath = path.join(__dirname, '..', '..', 'generated', filename);

      if (!fs.existsSync(filePath)) {
        res.status(404).json({ 
          success: false, 
          error: 'File not found' 
        });
        return;
      }

      // Set headers for download
      res.setHeader('Content-Disposition', `attachment; filename="Presidio-Proposal-${Date.now()}.pptx"`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');

      // Stream file and cleanup after download
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

      fileStream.on('end', () => {
        // Clean up file after download
        setTimeout(() => {
          try {
            fs.unlinkSync(filePath);
          } catch (error) {
            console.warn('Failed to cleanup generated file:', filePath);
          }
        }, 5000);
      });

      fileStream.on('error', (error) => {
        next(error);
      });
    } catch (error) {
      next(error);
    }
  }

  async getProposalStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const proposalId = req.params.id;
      
      // For now, return a simple status - this would be enhanced with real status tracking
      res.json({
        success: true,
        status: 'completed',
        proposalId,
        message: 'Proposal generation completed'
      });
    } catch (error) {
      next(error);
    }
  }
}
