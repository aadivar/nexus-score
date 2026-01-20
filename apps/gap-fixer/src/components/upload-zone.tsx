'use client';

import { useCallback, useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateGapReportFile, parseGapReportFile, getGapReportSummary, type ParsedArticle } from '@/lib/parsers/gap-report';
import type { GapType } from '@/lib/db/types';

interface UploadZoneProps {
  onUpload: (data: {
    articles: ParsedArticle[];
    summary: ReturnType<typeof getGapReportSummary>;
    gapCounts: Record<GapType, number>;
  }) => void;
}

export function UploadZone({ onUpload }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setFileName(file.name);

    // Validate file
    const validation = validateGapReportFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setIsProcessing(true);

    try {
      // Parse the CSV
      const parsed = await parseGapReportFile(file);

      if (parsed.errors.length > 0) {
        console.warn('Parse warnings:', parsed.errors);
      }

      if (parsed.articles.length === 0) {
        setError('No articles found in the gap report. Please check the file format.');
        setIsProcessing(false);
        return;
      }

      // Calculate summary
      const summary = getGapReportSummary(parsed);

      // Call parent handler
      onUpload({
        articles: parsed.articles,
        summary,
        gapCounts: parsed.gapCounts,
      });
    } catch (err) {
      setError('Failed to parse the gap report. Please check the file format.');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  }, [onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  return (
    <div
      className={cn(
        'relative rounded-xl border-2 border-dashed p-8 transition-colors',
        isDragging ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 bg-white',
        error && 'border-red-300 bg-red-50'
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <input
        type="file"
        accept=".csv"
        onChange={handleInputChange}
        className="absolute inset-0 cursor-pointer opacity-0"
        disabled={isProcessing}
      />

      <div className="flex flex-col items-center text-center">
        {isProcessing ? (
          <>
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
            <p className="text-lg font-medium text-gray-900">Processing {fileName}...</p>
            <p className="mt-1 text-sm text-gray-500">Parsing gap report</p>
          </>
        ) : error ? (
          <>
            <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
            <p className="text-lg font-medium text-red-900">{error}</p>
            <p className="mt-1 text-sm text-red-600">Click or drag to try again</p>
          </>
        ) : fileName ? (
          <>
            <CheckCircle className="mb-4 h-12 w-12 text-emerald-500" />
            <p className="text-lg font-medium text-gray-900">{fileName}</p>
            <p className="mt-1 text-sm text-gray-500">File uploaded successfully</p>
          </>
        ) : (
          <>
            <Upload className="mb-4 h-12 w-12 text-gray-400" />
            <p className="text-lg font-medium text-gray-900">
              Drop your Crossref Gap Report here
            </p>
            <p className="mt-1 text-sm text-gray-500">
              or click to browse (CSV files only)
            </p>
          </>
        )}
      </div>

      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
        <FileText className="h-4 w-4" />
        <span>Download gap reports from</span>
        <a
          href="https://www.crossref.org/documentation/reports/participation-reports/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-600 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          Crossref Participation Reports
        </a>
      </div>
    </div>
  );
}
