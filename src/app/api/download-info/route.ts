import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const filePath = path.join(process.cwd(), 'timeline-manager.tar.gz');
    
    // Check if file exists
    try {
      const stats = await fs.stat(filePath);
      
      return NextResponse.json({
        exists: true,
        size: stats.size,
        sizeFormatted: stats.size < 1024 * 1024 
          ? `${(stats.size / 1024).toFixed(1)} KB`
          : `${(stats.size / (1024 * 1024)).toFixed(1)} MB`,
        lastModified: stats.mtime,
        downloadUrl: '/api/download'
      });
    } catch (error) {
      return NextResponse.json({
        exists: false,
        error: 'File not found'
      }, { status: 404 });
    }
  } catch (error) {
    console.error('File info error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}