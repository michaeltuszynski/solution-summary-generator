import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { FileUpload as FileUploadType } from '../types';

interface FileUploadProps {
  files: FileUploadType[];
  onChange: (files: FileUploadType[]) => void;
  maxFiles: number;
  acceptedTypes: string[];
}

const FileUpload: React.FC<FileUploadProps> = ({
  files,
  onChange,
  maxFiles,
  acceptedTypes
}) => {

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: FileUploadType[] = acceptedFiles.map(file => ({
      file,
      id: `${Date.now()}-${file.name}`,
      progress: 0,
      status: 'complete' // For simplicity, mark as complete immediately
    }));

    // Filter out duplicates and respect max files limit
    const existingNames = files.map(f => f.file.name);
    const uniqueNewFiles = newFiles.filter(f => !existingNames.includes(f.file.name));
    
    const totalFiles = files.length + uniqueNewFiles.length;
    const filesToAdd = totalFiles > maxFiles 
      ? uniqueNewFiles.slice(0, maxFiles - files.length)
      : uniqueNewFiles;

    onChange([...files, ...filesToAdd]);
  }, [files, onChange, maxFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => {
      acc[`application/${type.replace('.', '')}`] = [type];
      return acc;
    }, {} as Record<string, string[]>),
    maxFiles: maxFiles - files.length,
    disabled: files.length >= maxFiles
  });

  const removeFile = (id: string) => {
    onChange(files.filter(f => f.id !== id));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <Card>
        <CardContent 
          {...getRootProps()}
          style={{
            paddingTop: '24px',
            paddingBottom: '24px',
            textAlign: 'center',
            cursor: files.length >= maxFiles ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            opacity: files.length >= maxFiles ? 0.5 : 1,
            border: `2px dashed ${isDragActive ? 'var(--primary-blue)' : 'var(--medium-gray)'}`,
            backgroundColor: isDragActive ? '#eff6ff' : files.length >= maxFiles ? 'var(--light-gray)' : 'transparent'
          }}
        >
          <input {...getInputProps()} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '48px' }}>📁</div>
            <div 
              style={{ 
                fontSize: '18px',
                fontWeight: '600',
                color: files.length >= maxFiles ? 'var(--medium-gray)' : 'var(--primary-blue)',
                fontFamily: 'var(--font-heading)'
              }}
            >
              {files.length >= maxFiles 
                ? 'Maximum files reached'
                : 'Drop files here or click to browse'
              }
            </div>
            <p style={{ fontSize: '14px', color: 'var(--medium-gray)', fontFamily: 'var(--font-body)' }}>
              Supported: {acceptedTypes.join(', ')} (Max {maxFiles} files)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-semibold" style={{ color: 'var(--dark-gray)', fontFamily: 'var(--font-heading)' }}>
            Uploaded Files ({files.length}/{maxFiles})
          </h4>
          <div className="space-y-2">
            {files.map((fileUpload) => (
              <Card key={fileUpload.id} style={{ backgroundColor: 'var(--light-gray)', border: '1px solid var(--medium-gray)' }}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div style={{ fontSize: '32px' }}>
                        {getFileIcon(fileUpload.file.name)}
                      </div>
                      <div>
                        <div className="font-medium" style={{ color: 'var(--dark-gray)', fontFamily: 'var(--font-heading)' }}>
                          {fileUpload.file.name}
                        </div>
                        <div className="text-sm" style={{ color: 'var(--medium-gray)', fontFamily: 'var(--font-body)' }}>
                          {formatFileSize(fileUpload.file.size)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {/* Status Indicator */}
                      <div className="flex items-center">
                        {fileUpload.status === 'complete' && (
                          <span className="text-green-600" style={{ fontSize: '20px' }}>✅</span>
                        )}
                        {fileUpload.status === 'error' && (
                          <span className="text-red-600" style={{ fontSize: '20px' }}>❌</span>
                        )}
                      </div>
                      
                      {/* Remove Button */}
                      <Button
                        onClick={() => removeFile(fileUpload.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Upload Summary */}
      {files.length > 0 && (
        <div className="text-sm" style={{ color: 'var(--medium-gray)', fontFamily: 'var(--font-body)' }}>
          <p>
            {files.length} file{files.length !== 1 ? 's' : ''} ready for upload
          </p>
        </div>
      )}
    </div>
  );
};

const getFileIcon = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return '📄';
    case 'docx':
    case 'doc':
      return '📝';
    case 'txt':
      return '📋';
    case 'md':
      return '📖';
    default:
      return '📎';
  }
};

export default FileUpload;
