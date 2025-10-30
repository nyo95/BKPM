import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const filePath = path.join(process.cwd(), 'timeline-manager.tar.gz');
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Read file
    const fileBuffer = await fs.readFile(filePath);
    
    // Create response with proper headers
    const response = new NextResponse(fileBuffer);
    
    // Set headers for file download
    response.headers.set('Content-Type', 'application/gzip');
    response.headers.set('Content-Disposition', 'attachment; filename="timeline-manager.tar.gz"');
    response.headers.set('Content-Length', fileBuffer.length.toString());
    response.headers.set('Cache-Control', 'no-cache');
    
    return response;
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}