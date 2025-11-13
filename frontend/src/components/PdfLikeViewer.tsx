// import React from 'react';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

interface Props {
  fileUrl: string;       // blob: URL of the PDF
  filename?: string;     // optional file name for display
  theme?: 'light' | 'dark';
}

// The CDN version below is the simplest to use:
const WORKER_URL =
  'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

export default function PdfLikeViewer({ fileUrl, filename, theme = 'dark' }: Props) {
  const defaultLayout = defaultLayoutPlugin({
    // Custom toolbar that also shows the filename
    renderToolbar: (Toolbar) => (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '4px 8px',
        }}
      >
        <Toolbar />
        {filename && (
          <span style={{ marginLeft: 8, opacity: 0.7, fontSize: 13 }}>
            {filename}
          </span>
        )}
      </div>
    ),
  });

  return (
    <div className={`pdf-like-viewer ${theme}`} style={{ height: 'calc(100vh - 140px)' }}>
      <Worker workerUrl={WORKER_URL}>
        <Viewer fileUrl={fileUrl} plugins={[defaultLayout]} theme={theme} />
      </Worker>
    </div>
  );
}
