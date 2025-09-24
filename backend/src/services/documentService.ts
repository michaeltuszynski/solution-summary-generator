import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import { ProcessedDocument, DocumentMetadata } from '../types';

export class DocumentService {
  private readonly supportedTypes = ['.pdf', '.docx', '.txt', '.md'];

  async extractContent(filePath: string): Promise<string> {
    const ext = path.extname(filePath).toLowerCase();

    switch (ext) {
      case '.pdf':
        return await this.extractPDF(filePath);
      case '.docx':
        return await this.extractDOCX(filePath);
      case '.txt':
      case '.md':
        return await this.extractText(filePath);
      default:
        throw new Error(`Unsupported file type: ${ext}`);
    }
  }

  async processDocument(filePath: string): Promise<ProcessedDocument> {
    const content = await this.extractContent(filePath);
    const metadata = this.createMetadata(filePath);
    const chunks = this.chunkContent(content);
    const extractedTerms = this.extractBusinessTerms(content);

    return {
      content,
      metadata,
      chunks,
      extractedTerms
    };
  }

  private async extractPDF(filePath: string): Promise<string> {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer);
      return this.cleanText(data.text);
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error('Failed to extract PDF content');
    }
  }

  private async extractDOCX(filePath: string): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      return this.cleanText(result.value);
    } catch (error) {
      console.error('DOCX extraction error:', error);
      throw new Error('Failed to extract DOCX content');
    }
  }

  private async extractText(filePath: string): Promise<string> {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return this.cleanText(content);
    } catch (error) {
      console.error('Text extraction error:', error);
      throw new Error('Failed to extract text content');
    }
  }

  private cleanText(text: string): string {
    return text
      .replace(/\r\n/g, '\n')  // Normalize line endings
      .replace(/\n{3,}/g, '\n\n')  // Remove excessive line breaks
      .replace(/\s+/g, ' ')  // Normalize whitespace
      .trim();
  }

  private createMetadata(filePath: string): DocumentMetadata {
    const stats = fs.statSync(filePath);
    const filename = path.basename(filePath);
    const ext = path.extname(filePath);

    return {
      filename,
      size: stats.size,
      type: ext,
      uploadedAt: new Date(),
      processed: true
    };
  }

  private chunkContent(content: string, maxChunkSize: number = 2000): string[] {
    // Simple chunking strategy - split on paragraphs
    const paragraphs = content.split('\n\n');
    const chunks: string[] = [];
    let currentChunk = '';

    for (const paragraph of paragraphs) {
      if (currentChunk.length + paragraph.length > maxChunkSize && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = paragraph;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  private extractBusinessTerms(content: string): string[] {
    const businessTerms = [
      'requirements', 'objectives', 'goals', 'challenges',
      'solution', 'implementation', 'timeline', 'budget',
      'stakeholders', 'deliverables', 'scope', 'assumptions',
      'risks', 'dependencies', 'success criteria', 'metrics'
    ];

    return businessTerms.filter(term =>
      content.toLowerCase().includes(term.toLowerCase())
    );
  }

  isSupported(filename: string): boolean {
    const ext = path.extname(filename).toLowerCase();
    return this.supportedTypes.includes(ext);
  }
}
