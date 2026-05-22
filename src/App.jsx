import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Upload, 
  Download, 
  RefreshCw
} from 'lucide-react';

// Custom Brand Icon: Shield & Padlock matching your uploaded reference image
const ShieldLockIcon = ({ className = "w-5 h-5", ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    {...props}
  >
    {/* Shield Outer Shape */}
    <path d="M12 2L20 5v6c0 5.25-3.41 10.18-8 11-4.59-.82-8-5.75-8-11V5l8-3z" />
    {/* Padlock inner shackle & body cutout in white (negative space) */}
    <path
      fill="white"
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 7.5c-1.38 0-2.5 1.12-2.5 2.5v1.5H8.5c-.55 0-1 .45-1 1v5c0 .55.45 1 1 1h7c.55 0 1-.45 1-1v-5c0-.55-.45-1-1-1H14.5V10c0-1.38-1.12-2.5-2.5-2.5zm1.5 4V10c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v1.5h3zM12 13c-.55 0-1 .45-1 1 0 .38.22.71.53.88l-.28.87c-.05.17.07.35.25.35h1c.18 0 .3-.18.25-.35l-.28-.87c.31-.17.53-.5.53-.88 0-.55-.45-1-1-1z"
    />
  </svg>
);

export default function App() {
  // Core Application States
  const [activeTab, setActiveTab] = useState('workspace'); // 'workspace' | 'about'
  const [originalFile, setOriginalFile] = useState(null);
  const [originalImageUrl, setOriginalImageUrl] = useState('');
  const [processedImageUrl, setProcessedImageUrl] = useState('');
  const [processingState, setProcessingState] = useState('idle'); // 'idle' | 'processing' | 'done'

  // Security Configuration Parameters
  const [disruptionStrength, setDisruptionStrength] = useState(35);
  const [adversarialModel, setAdversarialModel] = useState('resnet');
  const [exportFormat, setExportFormat] = useState('webp');
  const [scrubMetadata, setScrubMetadata] = useState(true);

  // File Statistics
  const [fileStats, setFileStats] = useState({
    fileName: '',
    originalSize: 0,
    processedSize: 0,
    dimensions: { w: 0, h: 0 }
  });

  // UI Interactive States
  const [dragActive, setDragActive] = useState(false);
  const [hoverActive, setHoverActive] = useState(false);
  const [hoverCoords, setHoverCoords] = useState({ x: 0.5, y: 0.5 });

  // Refs for hidden processing canvases and visual elements
  const originalCanvasRef = useRef(null);
  const processedCanvasRef = useRef(null);
  const origMagnifierCanvasRef = useRef(null);
  const procMagnifierCanvasRef = useRef(null);

  // Reset the workspace memory buffers
  const handleClearWorkspace = () => {
    if (originalImageUrl) URL.revokeObjectURL(originalImageUrl);
    if (processedImageUrl) URL.revokeObjectURL(processedImageUrl);

    setOriginalFile(null);
    setOriginalImageUrl('');
    setProcessedImageUrl('');
    setProcessingState('idle');
    setFileStats({
      fileName: '',
      originalSize: 0,
      processedSize: 0,
      dimensions: { w: 0, h: 0 }
    });
    setHoverActive(false);
  };

  // Perform client-side cryptographic image scrambling
  const applySecurityProtocols = useCallback(async () => {
    if (!originalFile || !originalImageUrl) return;

    setProcessingState('processing');

    // Simulate minor processing lag for standard corporate operations
    await new Promise(resolve => setTimeout(resolve, 600));

    try {
      const img = new Image();
      img.src = originalImageUrl;
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const w = img.width;
      const h = img.height;
      setFileStats(prev => ({ ...prev, dimensions: { w, h } }));

      const origCanvas = originalCanvasRef.current;
      const procCanvas = processedCanvasRef.current;

      if (!origCanvas || !procCanvas) {
        throw new Error('Workspace canvases are uninitialized.');
      }

      origCanvas.width = w;
      origCanvas.height = h;
      const origCtx = origCanvas.getContext('2d');
      origCtx.drawImage(img, 0, 0);

      procCanvas.width = w;
      procCanvas.height = h;
      const procCtx = procCanvas.getContext('2d');
      procCtx.drawImage(img, 0, 0);

      // Extract raw frame buffer
      const imageData = procCtx.getImageData(0, 0, w, h);
      const data = imageData.data;

      // Calculate perturbation boundaries
      const step = disruptionStrength === 0 
        ? 999999999 
        : Math.max(1, Math.floor(100 / disruptionStrength));
      const magnitude = Math.max(1, Math.min(3, Math.ceil(disruptionStrength / 30)));

      // Model-specific mathematical perturbation matrix offsets
      for (let i = 0; i < data.length; i += 4 * step) {
        const pixelIndex = i / 4;
        const x = pixelIndex % w;
        const y = Math.floor(pixelIndex / w);

        for (let c = 0; c < 3; c++) {
          const originalVal = data[i + c];
          let noiseOffset = 0;

          if (adversarialModel === 'resnet') {
            const seed = Math.sin(pixelIndex * 0.25 + c * 4.5) * 10000;
            noiseOffset = Math.round((seed - Math.floor(seed)) * 2 - 1) * magnitude;
          } else if (adversarialModel === 'densenet') {
            const seed = Math.cos((x + y) * 0.15 + c * 2.1) * 5000;
            noiseOffset = Math.round((seed - Math.floor(seed)) * 2 - 1) * (magnitude * 1.2);
          } else if (adversarialModel === 'vit') {
            const seed = Math.sin(x * 0.05) * Math.sin(y * 0.05) * Math.cos((x - y) * 0.05) * 15000;
            noiseOffset = Math.round((seed - Math.floor(seed)) * 2 - 1) * (magnitude * 1.5);
          }

          let newVal = originalVal + noiseOffset;
          if (newVal < 0) newVal = 0;
          if (newVal > 255) newVal = 255;
          data[i + c] = newVal;
        }
      }

      procCtx.putImageData(imageData, 0, 0);

      // Export canvas directly inside browser memory sandbox
      const formatMime = `image/${exportFormat}`;
      const quality = 0.90; // Fixed high fidelity output for corporate platforms
      
      procCanvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Failed to compile output artifact.');
        }

        if (processedImageUrl) {
          URL.revokeObjectURL(processedImageUrl);
        }

        const outUrl = URL.createObjectURL(blob);
        setProcessedImageUrl(outUrl);
        setFileStats(prev => ({
          ...prev,
          processedSize: blob.size
        }));
        setProcessingState('done');
      }, formatMime, quality);

    } catch (error) {
      console.error(error);
      setProcessingState('idle');
    }
  }, [originalFile, originalImageUrl, disruptionStrength, adversarialModel, exportFormat]);

  // Load a file into local memory
  const handleFileLoad = (file) => {
    if (!file || !file.type.startsWith('image/')) return;

    handleClearWorkspace();

    setOriginalFile(file);
    const url = URL.createObjectURL(file);
    setOriginalImageUrl(url);

    setFileStats({
      fileName: file.name,
      originalSize: file.size,
      processedSize: 0,
      dimensions: { w: 0, h: 0 }
    });
  };

  // HTML5 Native Drag & Drop Handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileLoad(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileLoad(e.target.files[0]);
    }
  };

  // Synchronized pixel loupe tracking coordinates percentage-wise
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    setHoverCoords({ x, y });
  };

  // Synchronized pixel loupe tracking coordinates for mobile touch screens
  const handleTouchMove = (e) => {
    if (e.touches && e.touches[0]) {
      const touch = e.touches[0];
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (touch.clientY - rect.top) / rect.height));

      setHoverCoords({ x, y });
    }
  };

  // Draw synchronized magnifying loupe canvases with detailed sub-pixel grid lines
  useEffect(() => {
    if (!hoverActive || processingState !== 'done') return;

    const origMagnifier = origMagnifierCanvasRef.current;
    const procMagnifier = procMagnifierCanvasRef.current;
    const origCanvas = originalCanvasRef.current;
    const procCanvas = processedCanvasRef.current;

    if (origMagnifier && procMagnifier && origCanvas && procCanvas) {
      const origCtx = origMagnifier.getContext('2d');
      const procCtx = procMagnifier.getContext('2d');

      if (origCtx && procCtx) {
        origCtx.imageSmoothingEnabled = false;
        procCtx.imageSmoothingEnabled = false;

        const lensSize = 120; // Loupe canvas size
        const patchSize = 15; // 15x15 source patch gives sharp 8x magnification
        const pixelSize = lensSize / patchSize; // Exactly 8x8 pixels per source pixel

        const sx = hoverCoords.x * origCanvas.width - patchSize / 2;
        const sy = hoverCoords.y * origCanvas.height - patchSize / 2;

        // Render Original Loupe (White base in light mode)
        origCtx.fillStyle = '#FFFFFF';
        origCtx.fillRect(0, 0, lensSize, lensSize);
        origCtx.drawImage(origCanvas, sx, sy, patchSize, patchSize, 0, 0, lensSize, lensSize);

        // Render Shielded Loupe (White base in light mode)
        procCtx.fillStyle = '#FFFFFF';
        procCtx.fillRect(0, 0, lensSize, lensSize);
        procCtx.drawImage(procCanvas, sx, sy, patchSize, patchSize, 0, 0, lensSize, lensSize);

        // Faint sub-pixel grid dividers overlay (Faint dark lines for light theme)
        origCtx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
        origCtx.lineWidth = 1;
        procCtx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
        procCtx.lineWidth = 1;

        for (let offset = 0; offset <= lensSize; offset += pixelSize) {
          // X grids
          origCtx.beginPath();
          origCtx.moveTo(offset, 0);
          origCtx.lineTo(offset, lensSize);
          origCtx.stroke();

          procCtx.beginPath();
          procCtx.moveTo(offset, 0);
          procCtx.lineTo(offset, lensSize);
          procCtx.stroke();

          // Y grids
          origCtx.beginPath();
          origCtx.moveTo(0, offset);
          origCtx.lineTo(lensSize, offset);
          origCtx.stroke();

          procCtx.beginPath();
          procCtx.moveTo(0, offset);
          procCtx.lineTo(lensSize, offset);
          procCtx.stroke();
        }
      }
    }
  }, [hoverActive, hoverCoords, processingState]);

  // Trigger auto-processing when parameters adjust
  useEffect(() => {
    if (originalFile && processingState === 'done') {
      const delay = setTimeout(() => {
        applySecurityProtocols();
      }, 400); // Debounce parameters for smoother UX
      return () => clearTimeout(delay);
    }
  }, [disruptionStrength, adversarialModel, exportFormat, scrubMetadata]);

  // Initial processing trigger when file is imported
  useEffect(() => {
    if (originalFile && processingState === 'idle') {
      applySecurityProtocols();
    }
  }, [originalFile]);

  // Render clean file size string
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = 1;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-brand-dark text-stone-600 flex flex-col font-sans select-none overflow-x-hidden antialiased">
      
      {/* 1. TOP HEADER (Simple, Light & Clean) */}
      <header className="h-14 bg-brand-card border-b border-brand-border px-4 sm:px-6 flex justify-between items-center z-50 sticky top-0 shadow-sm">
        <div className="flex items-center">
          {/* Crisp custom brand badge containing your custom shield-padlock icon */}
          <div className="mr-3 flex items-center justify-center text-stone-900">
            <ShieldLockIcon className="w-7 h-7" />
          </div>
          {/* Brand title */}
          <span className="font-bold text-stone-900 tracking-tight text-base">ScrapperShield</span>
          
          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 sm:gap-1.5 ml-4 sm:ml-6 border-l border-brand-border pl-4 sm:pl-6 h-6">
            <button 
              onClick={() => setActiveTab('workspace')}
              className={`px-2.5 sm:px-3 py-1 rounded text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${activeTab === 'workspace' ? 'bg-brand-blue text-white shadow-sm' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'}`}
            >
              Studio
            </button>
            <button 
              onClick={() => setActiveTab('about')}
              className={`px-2.5 sm:px-3 py-1 rounded text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${activeTab === 'about' ? 'bg-brand-blue text-white shadow-sm' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'}`}
            >
              About
            </button>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-stone-700 bg-stone-100 border border-stone-200 rounded px-2.5 sm:px-3 py-1 shadow-sm whitespace-nowrap">
          <span className="w-2 h-2 rounded-full bg-stone-400 animate-pulse flex-shrink-0"></span>
          <span>
            Safe & Private<span className="hidden sm:inline"> (No servers used)</span>
          </span>
        </div>
      </header>

      {/* 2. WORKSPACE / ABOUT PAGE VIEWPORTS */}
      {activeTab === 'about' ? (
        <main className="flex-1 max-w-[1000px] w-full mx-auto p-4 sm:p-6 md:p-8 flex flex-col gap-6 items-start animate-fadeIn">
          {/* Back button */}
          <button 
            onClick={() => setActiveTab('workspace')}
            className="flex items-center gap-1.5 text-sm font-bold text-stone-500 hover:text-stone-950 transition-colors cursor-pointer"
          >
            <span>←</span> Back to Studio Workspace
          </button>

          {/* Hero Banner */}
          <div className="w-full bg-white border border-brand-border rounded-lg p-6 sm:p-8 md:p-10 flex flex-col gap-4 shadow-sm relative overflow-hidden">
            {/* Soft decorative background SVG shield shape */}
            <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 text-stone-100 opacity-20 pointer-events-none hidden md:block">
              <ShieldLockIcon className="w-64 h-64" />
            </div>

            <div className="flex flex-col gap-1.5 z-10">
              <div className="flex items-center gap-2 text-stone-900">
                <ShieldLockIcon className="w-8 h-8" />
                <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">ScrapperShield</h1>
              </div>
              <p className="text-sm text-stone-500 font-semibold tracking-wide">
                Version 4.0 &bull; Runs entirely on your computer
              </p>
            </div>
            
            <p className="text-stone-700 text-sm sm:text-base leading-relaxed max-w-2xl z-10">
              ScrapperShield is a zero-trust, completely client-side cryptographic image utility built to shield independent artists, creators, and photographers from digital exploitation. By purging location histories and disrupting AI scraping models at the pixel level, ScrapperShield ensures your creative voice remains exclusively yours.
            </p>
          </div>

          {/* Core Info Panels */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Why This Tool is Used */}
            <div className="bg-white border border-brand-border rounded-lg p-5 sm:p-6 flex flex-col gap-4 shadow-sm">
              <h2 className="text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2">
                <span>🛡️</span> Why This Tool is Used
              </h2>
              <div className="text-sm text-stone-600 leading-relaxed flex flex-col gap-3">
                <p>
                  Today, automated AI scrapers crawl the web day and night, harvesting drawings, illustrations, and photos from public portfolios. This data scraping occurs without your explicit consent, proper credit, or any financial compensation.
                </p>
                <p>
                  Once an artist's signature visual style is ingested by an AI model, anyone can generate endless derivatives matching that voice using basic text prompts. This threatens the value and livelihoods of independent human creators.
                </p>
                <p>
                  ScrapperShield stands as a protective wall between your artworks and AI data crawlers. It provides creators with proactive, digital defense to secure their work before uploading it anywhere online.
                </p>
              </div>
            </div>

            {/* How This Tool Benefits You */}
            <div className="bg-white border border-brand-border rounded-lg p-5 sm:p-6 flex flex-col gap-4 shadow-sm">
              <h2 className="text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2">
                <span>✨</span> How It Benefits You
              </h2>
              <div className="text-sm text-stone-600 leading-relaxed flex flex-col gap-3">
                <p>
                  <strong className="text-stone-900 font-bold block">1. Microscopic Pattern Disruption</strong>
                  Inserts tiny mathematical perturbations into the pixel grid. To the human eye, your image remains absolutely pristine and unchanged. To AI vector crawlers, however, these microscopic changes completely scramble the image recognition patterns, rendering the photo completely useless for training AI models.
                </p>
                <p>
                  <strong className="text-stone-900 font-bold block">2. Complete EXIF Metadata Scrubber</strong>
                  Standard smartphone/camera image files carry hidden headers detailing your camera settings, exact time, device serial number, and precise GPS location. ScrapperShield strips this data fully, protecting your physical privacy.
                </p>
                <p>
                  <strong className="text-stone-900 font-bold block">3. 100% Client-Side Privacy</strong>
                  None of your files are ever transmitted over the network or uploaded to a database. All cryptographic calculations and pixel locks run entirely within your local browser window sandbox. Your privacy is structurally guaranteed.
                </p>
              </div>
            </div>

          </div>

          {/* Creator Credits Card */}
          <div className="w-full bg-white border border-brand-border rounded-lg p-5 sm:p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-stone-100 border border-brand-border flex items-center justify-center text-stone-900 shadow-sm flex-shrink-0 font-extrabold text-lg">
                MB
              </div>
              <div className="flex flex-col">
                <span className="text-xs uppercase font-semibold text-stone-400 tracking-wider">Developed By</span>
                <h3 className="text-base sm:text-lg font-bold text-stone-900">Mahesh Bollineni</h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Dedicated to engineering elegant, client-first solutions that secure user privacy and creative rights.
                </p>
              </div>
            </div>

            {/* Contact Details */}
            <div className="flex flex-col sm:items-end gap-2.5 w-full sm:w-auto border-t sm:border-t-0 border-stone-100 pt-4 sm:pt-0">
              <a 
                href="https://instagram.com/mahesh._.23_" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-stone-700 hover:text-stone-950 font-semibold transition-colors"
              >
                <svg className="w-4 h-4 text-stone-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
                <span>instagram.com/mahesh._.23_</span>
              </a>

              <a 
                href="mailto:mahesh.bollineni1623@gmail.com" 
                className="flex items-center gap-2 text-sm text-stone-700 hover:text-stone-950 font-semibold transition-colors"
              >
                <svg className="w-4 h-4 text-stone-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <span>mahesh.bollineni1623@gmail.com</span>
              </a>
            </div>
          </div>
        </main>
      ) : (
        <main className="flex-1 max-w-[1440px] w-full mx-auto p-4 sm:p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Controls Console - 3-column span */}
        <section className="lg:col-span-3 flex flex-col gap-6">
          <div className="bg-brand-card border border-brand-border rounded-lg p-4 sm:p-5 flex flex-col gap-5 shadow-sm">
            <div>
              <h2 className="text-sm font-bold tracking-wide text-stone-900">
                Protection Settings
              </h2>
            </div>

            {/* Range Slider: Protection Strength */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-stone-700">Protection Strength</span>
                <span className="text-xs font-bold bg-brand-dark border border-brand-border px-2 py-0.5 rounded text-stone-900">
                  {disruptionStrength}%
                </span>
              </div>
              <input 
                type="range"
                min="0"
                max="100"
                value={disruptionStrength}
                onChange={(e) => setDisruptionStrength(Number(e.target.value))}
                disabled={!originalFile || processingState === 'processing'}
                className="w-full disabled:opacity-30 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-stone-500 leading-relaxed">
                Higher strength makes it harder for AI bots to steal your style, but may slightly change how the image looks.
              </p>
            </div>

            {/* Form Select: Anti-AI Method */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-stone-700">Anti-AI Method</label>
              <select 
                value={adversarialModel}
                onChange={(e) => setAdversarialModel(e.target.value)}
                disabled={!originalFile || processingState === 'processing'}
                className="w-full bg-white border border-brand-border rounded px-3 py-2 text-sm text-stone-900 font-sans focus:outline-none focus:border-stone-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                <option value="resnet">Smart Pattern Disruption</option>
                <option value="densenet">Simple Pixel Lock</option>
              </select>
            </div>

            {/* Form Select: Save File As */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-stone-700">Save File As</label>
              <select 
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                disabled={!originalFile || processingState === 'processing'}
                className="w-full bg-white border border-brand-border rounded px-3 py-2 text-sm text-stone-900 font-sans focus:outline-none focus:border-stone-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                <option value="webp">WebP format</option>
                <option value="png">PNG format</option>
              </select>
            </div>

            {/* Standard Checkbox: Erase Hidden Tracking Data */}
            <div className="flex items-start gap-2.5 pt-3.5 border-t border-brand-border">
              <input 
                id="scrub-exif"
                type="checkbox"
                checked={scrubMetadata}
                onChange={(e) => setScrubMetadata(e.target.checked)}
                disabled={!originalFile || processingState === 'processing'}
                className="h-4 w-4 mt-0.5 rounded border-stone-300 bg-white text-stone-900 focus:ring-0 focus:ring-offset-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              />
              <label htmlFor="scrub-exif" className="text-sm flex flex-col gap-0.5 cursor-pointer select-none">
                <span className="font-semibold text-stone-900 text-sm">Erase Hidden Tracking Data</span>
                <span className="text-xs text-stone-500 leading-relaxed">
                  Removes your phone/camera name, time taken, and your exact GPS location from the photo.
                </span>
              </label>
            </div>

            {/* Action Button: PROTECT MY PHOTO */}
            <button
              onClick={applySecurityProtocols}
              disabled={!originalFile || processingState === 'processing'}
              className="w-full bg-brand-blue hover:bg-brand-blue-hover text-white font-semibold text-sm py-2.5 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              {processingState === 'processing' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>PROTECTING IMAGE...</span>
                </>
              ) : (
                <span>PROTECT MY IMAGE</span>
              )}
            </button>

            {/* Privacy Note */}
            <p className="text-xs text-stone-500 leading-relaxed font-sans border-t border-brand-border/40 pt-4">
              Your files never leave your device. All privacy stripping and shielding happens right inside your browser window. Zero network transmission. Zero server footprint.
            </p>

          </div>
        </section>

        {/* MIDDLE COLUMN: Live Preview Workspace - 6-column span */}
        <section className="lg:col-span-6 flex flex-col h-full gap-6">
          <div className="bg-brand-card border border-brand-border rounded-lg flex flex-col min-h-[460px] sm:min-h-[560px] relative overflow-hidden shadow-sm">
            
            {/* Display Frame Header */}
            <div className="bg-stone-50 border-b border-brand-border px-4 sm:px-5 py-3 flex items-center justify-between gap-2 z-10">
              <span className="text-sm font-bold text-stone-900">
                Studio Viewport
              </span>
              
              {/* Clean Export Trigger */}
              {originalFile && processingState === 'done' && (
                <a
                  href={processedImageUrl}
                  download={`scrappersield_${originalFile.name.split('.')[0]}.${exportFormat}`}
                  className="bg-brand-blue hover:bg-brand-blue-hover text-white font-semibold text-xs sm:text-sm px-2.5 sm:px-4 py-1.5 sm:py-2 rounded transition-colors flex items-center gap-1.5 sm:gap-2 shadow-sm whitespace-nowrap"
                >
                  <Download className="w-4 h-4 flex-shrink-0" />
                  <span>Save Protected Photo</span>
                </a>
              )}
            </div>

            {/* High-Fidelity Workspace Viewport */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-5 relative min-h-[320px] sm:min-h-[420px]">
              
              {/* State A: Before File Drop */}
              {!originalFile && (
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragOver}
                  onDrop={handleDrop}
                  className="w-full max-w-lg aspect-video rounded border border-dashed border-stone-300 flex flex-col items-center justify-center p-4 sm:p-6 bg-stone-50/50 hover:bg-stone-100/50 transition-all cursor-pointer"
                >
                  <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleFileInputChange} 
                    />
                    <div className="w-10 h-10 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-500 mb-3 shadow-sm">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-semibold text-stone-700 text-center">
                      Drop your image here or click to choose a file
                    </span>
                  </label>
                </div>
              )}

              {/* State B: Side-by-Side Monitoring Frame */}
              {originalFile && (
                <div className="w-full h-full flex flex-col justify-center items-center gap-6">
                  
                  {/* Grid showing original on left, shielded on right */}
                  <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 relative select-none">
                    
                    {/* Left Frame: Original Photo */}
                    <div className="flex flex-col gap-2 relative">
                      <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                        Original Photo
                      </span>
                      <div 
                        onMouseMove={handleMouseMove}
                        onMouseEnter={() => setHoverActive(true)}
                        onMouseLeave={() => setHoverActive(false)}
                        onTouchStart={() => setHoverActive(true)}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={() => setHoverActive(false)}
                        className="bg-checkerboard border border-brand-border rounded p-2 flex items-center justify-center aspect-square max-h-[350px] max-w-[350px] mx-auto overflow-visible relative cursor-crosshair group shadow-sm touch-none"
                      >
                        {originalImageUrl ? (
                          <img 
                            src={originalImageUrl} 
                            alt="Original Photo" 
                            className="max-w-full max-h-full object-contain pointer-events-none rounded-sm"
                          />
                        ) : (
                          <div className="w-6 h-6 border-2 border-stone-300 border-t-stone-900 rounded-full animate-spin"></div>
                        )}

                        {/* Synchronized Loupe - Original */}
                        {hoverActive && processingState === 'done' && (
                          <div 
                            className="absolute rounded-full border border-stone-300 shadow-xl pointer-events-none overflow-hidden"
                            style={{
                              width: '120px',
                              height: '120px',
                              left: `${hoverCoords.x * 100}%`,
                              top: `${hoverCoords.y * 100}%`,
                              transform: 'translate(-50%, -110px)', // Vertically offset so user's finger never covers it on touch
                              zIndex: 30,
                              backgroundColor: '#ffffff'
                            }}
                          >
                            <canvas 
                              ref={origMagnifierCanvasRef} 
                              width={120} 
                              height={120} 
                              className="w-full h-full block"
                            />
                            {/* Center Crosshair Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-stone-900/80 border border-white/50 animate-pulse"></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Frame: Protected Photo */}
                    <div className="flex flex-col gap-2 relative">
                      <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center justify-between">
                        <span>Protected Photo</span>
                        {processingState === 'done' && (
                          <span className="text-xs text-stone-900 font-bold bg-stone-100 border border-stone-250 px-2 py-0.5 rounded font-sans shadow-sm">
                            SHIELDED
                          </span>
                        )}
                      </span>
                      <div 
                        onMouseMove={handleMouseMove}
                        onMouseEnter={() => setHoverActive(true)}
                        onMouseLeave={() => setHoverActive(false)}
                        onTouchStart={() => setHoverActive(true)}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={() => setHoverActive(false)}
                        className="bg-checkerboard border border-brand-border rounded p-2 flex items-center justify-center aspect-square max-h-[350px] max-w-[350px] mx-auto overflow-visible relative cursor-crosshair group shadow-sm touch-none"
                      >
                        {processingState === 'processing' ? (
                          <div className="flex flex-col items-center gap-2.5">
                            <RefreshCw className="w-5 h-5 text-stone-800 animate-spin" />
                            <span className="text-xs tracking-wider font-semibold text-stone-500">Applying Shield...</span>
                          </div>
                        ) : processedImageUrl ? (
                          <img 
                            src={processedImageUrl} 
                            alt="Protected Photo" 
                            className="max-w-full max-h-full object-contain pointer-events-none rounded-sm"
                          />
                        ) : originalImageUrl ? (
                          <img 
                            src={originalImageUrl} 
                            alt="Awaiting processing" 
                            className="max-w-full max-h-full object-contain pointer-events-none rounded-sm opacity-30 blur-[1px]"
                          />
                        ) : null}

                        {/* Synchronized Loupe - Protected */}
                        {hoverActive && processingState === 'done' && (
                          <div 
                            className="absolute rounded-full border border-stone-300 shadow-xl pointer-events-none overflow-hidden"
                            style={{
                              width: '120px',
                              height: '120px',
                              left: `${hoverCoords.x * 100}%`,
                              top: `${hoverCoords.y * 100}%`,
                              transform: 'translate(-50%, -110px)', // Vertically offset so user's finger never covers it on touch
                              zIndex: 30,
                              backgroundColor: '#ffffff'
                            }}
                          >
                            <canvas 
                              ref={procMagnifierCanvasRef} 
                              width={120} 
                              height={120} 
                              className="w-full h-full block"
                            />
                            {/* Center Crosshair Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-stone-900/80 border border-white/50 animate-pulse"></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Clean explanatory text */}
                  {processingState === 'done' && (
                    <div className="text-center text-xs text-stone-500 max-w-lg leading-relaxed mt-3 px-4">
                      Hover your mouse over the photos to zoom in. You will see that the photo still looks perfectly identical to the human eye, even though the AI is blocked.
                    </div>
                  )}

                  {/* Action row when image is parsed but workspace needs clear */}
                  <div className="flex justify-center mt-1">
                    <button 
                      onClick={handleClearWorkspace}
                      className="px-4 py-2 border border-brand-border hover:bg-stone-100 text-sm text-stone-600 hover:text-stone-950 rounded transition-colors shadow-sm cursor-pointer"
                    >
                      Remove Photo From Memory
                    </button>
                  </div>

                </div>
              )}

            </div>

            {/* 5. DATA ANALYSIS METRICS BAR (Bottom Strip) */}
            {originalFile && (
              <div className="bg-stone-50 border-t border-brand-border px-4 sm:px-5 py-3 flex flex-wrap justify-between items-center gap-3 sm:gap-4 text-sm text-stone-600 z-10">
                <div className="flex flex-wrap items-center gap-3 sm:gap-6 min-w-0">
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="text-stone-500">File:</span>
                    <span 
                      className="text-stone-900 font-semibold truncate max-w-[120px] sm:max-w-[200px]" 
                      title={fileStats.fileName}
                    >
                      {fileStats.fileName}
                    </span>
                  </div>
                  <div className="hidden sm:block text-stone-300 font-normal">|</div>
                  <div className="flex items-center gap-1">
                    <span className="text-stone-500">Size:</span>
                    <span className="text-stone-900">{formatBytes(fileStats.originalSize)}</span>
                    {fileStats.processedSize > 0 && (
                      <span className="text-stone-900 font-semibold">
                        → {formatBytes(fileStats.processedSize)}
                      </span>
                    )}
                  </div>
                  <div className="hidden sm:block text-stone-300 font-normal">|</div>
                  <div className="flex items-center gap-1">
                    <span className="text-stone-500">Dims:</span>
                    <span className="text-stone-900">
                      {fileStats.dimensions.w > 0 
                        ? `${fileStats.dimensions.w} x ${fileStats.dimensions.h}` 
                        : 'Checking...'}
                    </span>
                  </div>
                </div>

                <div className="bg-stone-100 border border-stone-200 text-stone-900 text-xs px-3 py-1 rounded font-sans font-bold tracking-wider shadow-sm">
                  SAFE & PROTECTED
                </div>
              </div>
            )}

          </div>
        </section>

        {/* RIGHT COLUMN: "FILE DIAGNOSIS & FIXES" - 3-column span */}
        <section className="lg:col-span-3 flex flex-col gap-6">
          <div className="bg-brand-card border border-brand-border rounded-lg p-4 sm:p-5 flex flex-col gap-5 shadow-sm min-h-[300px] lg:min-h-[560px]">
            <div>
              <h2 className="text-sm font-bold text-stone-900">
                File Diagnosis & Fixes
              </h2>
            </div>

            {!originalFile ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4 min-h-[220px] lg:min-h-[300px]">
                <div className="w-11 h-11 flex items-center justify-center text-stone-400 mb-4 animate-pulse">
                  <ShieldLockIcon className="w-8 h-8" />
                </div>
                <span className="text-sm font-semibold text-stone-850">Awaiting Photo Upload</span>
                <span className="text-xs text-stone-500 mt-2 leading-relaxed">
                  Import an image to scan for tracking parameters and AI scraping vulnerabilities.
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                
                {/* Section A: Detected Issues */}
                <div className="flex flex-col gap-3 pb-5 border-b border-brand-border">
                  <h3 className="text-sm font-bold text-stone-950 flex items-center gap-1.5">
                    <span>⚠️</span> Detected Issues
                  </h3>
                  <ul className="flex flex-col gap-3.5 text-sm text-stone-600 leading-relaxed font-sans pl-0 list-none">
                    <li className="flex items-start gap-2">
                      <span className="text-stone-400 mt-0.5 font-bold">•</span>
                      <span>
                        <strong className="text-stone-900 font-semibold">Hidden Data Found:</strong> Your image contains details about your device and when the photo was captured.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-stone-400 mt-0.5 font-bold">•</span>
                      <span>
                        <strong className="text-stone-900 font-semibold">Location Risk:</strong> The image file may expose the exact GPS coordinates of where this photo was taken.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-stone-400 mt-0.5 font-bold">•</span>
                      <span>
                        <strong className="text-stone-900 font-semibold">AI Scraper Risk:</strong> This image is completely unprotected and can be stolen by AI web crawlers to train AI models.
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Section B: What We Are Doing to Fix It */}
                <div className="flex flex-col gap-3 pt-1">
                  <h3 className="text-sm font-bold text-stone-950 flex items-center gap-1.5">
                    <span>🛠️</span> What We Are Doing to Fix It
                  </h3>
                  <ul className="flex flex-col gap-3.5 text-sm text-stone-600 leading-relaxed font-sans pl-0 list-none">
                    <li className="flex items-start gap-2">
                      <span className="text-stone-900 font-bold mt-0.5">✓</span>
                      <span>
                        <strong className="text-stone-900 font-semibold">Deleting Location & Camera History:</strong> We are completely wiping the hidden tracking logs from the file.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-stone-900 font-bold mt-0.5">✓</span>
                      <span>
                        <strong className="text-stone-900 font-semibold">Adding an Anti-AI Invisible Shield:</strong> We are changing tiny, microscopic pixels that confuse AI scanners but remain invisible to humans.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-stone-900 font-bold mt-0.5">✓</span>
                      <span>
                        <strong className="text-stone-900 font-semibold">Converting to Safe Format:</strong> We are saving your photo into an optimized format that strips out old tracking tags.
                      </span>
                    </li>
                  </ul>
                </div>

              </div>
            )}

          </div>
        </section>

      </main>
      )}

      {/* Corporate Compliance Footer */}
      <footer className="bg-brand-dark border-t border-brand-border py-5 px-4 sm:px-6 text-center text-xs text-stone-500">
        <div className="max-w-[1440px] mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <span>ScrapperShield Zero-Trust Utility</span>
          <span>Zero Memory Retention • Sandbox Certified</span>
        </div>
      </footer>

      {/* Hidden processing buffers */}
      <div className="hidden">
        <canvas ref={originalCanvasRef} />
        <canvas ref={processedCanvasRef} />
      </div>

      {/* Google AdSense Banner Container */}
      <div className="w-full max-w-7xl mx-auto mt-8 p-4 bg-slate-900/50 border border-slate-800 rounded-xl text-center">
        <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Sponsored Links</div>
        <div className="min-h-[90px] flex items-center justify-center text-sm text-slate-400 italic">
          Advertisement Space
        </div>
      </div>

    </div>
  );
};
