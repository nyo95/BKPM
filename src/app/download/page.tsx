'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileArchive, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function DownloadPage() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [fileSize, setFileSize] = useState<string>('');

  useEffect(() => {
    // Fetch file info
    fetch('/api/download')
      .then(res => {
        if (res.ok) {
          const contentLength = res.headers.get('content-length');
          if (contentLength) {
            const size = parseInt(contentLength);
            if (size < 1024 * 1024) {
              setFileSize(`${(size / 1024).toFixed(1)} KB`);
            } else {
              setFileSize(`${(size / (1024 * 1024)).toFixed(1)} MB`);
            }
          }
        }
      })
      .catch(err => console.error('Error fetching file info:', err));
  }, []);

  const handleDownload = async () => {
    setIsDownloading(true);
    
    try {
      const response = await fetch('/api/download');
      
      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'timeline-manager.tar.gz';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setDownloadComplete(true);
      toast.success('Download completed successfully!');
      
      // Reset after 3 seconds
      setTimeout(() => {
        setDownloadComplete(false);
      }, 3000);
      
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <FileArchive className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Download Timeline Manager</CardTitle>
            <CardDescription>
              Complete interior architecture project management system
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">File:</span>
                <span className="font-medium">timeline-manager.tar.gz</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Size:</span>
                <span className="font-medium">{fileSize || 'Loading...'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Format:</span>
                <span className="font-medium">Compressed Archive</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Complete source code</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Sample data included</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Documentation included</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Ready to deploy</span>
              </div>
            </div>

            <Button 
              onClick={handleDownload}
              disabled={isDownloading}
              className="w-full"
              size="lg"
            >
              {isDownloading ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Downloading...
                </>
              ) : downloadComplete ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Downloaded!
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download Project
                </>
              )}
            </Button>

            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                <span>After download: Extract and run <code className="bg-muted px-1 rounded">npm install</code></span>
              </div>
              <div className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                <span>Then run <code className="bg-muted px-1 rounded">npm run dev</code> to start</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}