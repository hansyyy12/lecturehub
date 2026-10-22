import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Share2,
  Smartphone,
  Laptop,
  ExternalLink,
  Globe,
  Github,
  QrCode,
  Sparkles,
} from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'link' | 'qr' | 'github'>('link');

  if (!isOpen) return null;

  // Prefer shared production preview URL or fallback to current origin
  const sharedUrl =
    typeof window !== 'undefined' && window.location.origin.includes('ais-')
      ? window.location.origin.replace('ais-dev-', 'ais-pre-')
      : 'https://ais-pre-dmftbbri4mtrxcg7wm5wxp-471622485586.europe-west3.run.app';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(sharedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = sharedUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'LectureHub - Campus Learning & Budgeting Portal',
          text: 'Try LectureHub live! Real-time Firestore courses, live quizzes, continuous assessments, and budget tracking.',
          url: sharedUrl,
        });
      } catch {}
    } else {
      handleCopyLink();
    }
  };

  // Generate an instant dynamic SVG QR code using api.qrserver.com or simple fallback
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    sharedUrl
  )}&margin=10`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0c183d] border border-slate-200 dark:border-blue-900/60 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden transition-all text-slate-900 dark:text-white">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-gradient-to-r from-blue-600/10 via-amber-500/10 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                Share Live Site with Another Device
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                100% Free trial link powered by Google Cloud Run & Firebase
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-100 dark:border-white/10 px-5 pt-3 gap-2 bg-slate-50 dark:bg-white/[0.02]">
          <button
            onClick={() => setActiveTab('link')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'link'
                ? 'border-blue-600 text-blue-600 dark:text-amber-400 dark:border-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            Direct Live Link
          </button>
          <button
            onClick={() => setActiveTab('qr')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'qr'
                ? 'border-blue-600 text-blue-600 dark:text-amber-400 dark:border-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            Mobile QR Code
          </button>
          <button
            onClick={() => setActiveTab('github')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'github'
                ? 'border-blue-600 text-blue-600 dark:text-amber-400 dark:border-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <Github className="w-3.5 h-3.5" />
            GitHub & Free Hosting
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {activeTab === 'link' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs space-y-1.5">
                <div className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Why did you see "Site Not Found"?
                </div>
                <p className="text-amber-800 dark:text-amber-200/90 leading-relaxed">
                  The default <code>ai-studio-*.web.app</code> domain is reserved for Firebase Hosting, but static files must be deployed from a linked repository or terminal. Additionally, the development server is protected by your Google workspace session.
                </p>
                <p className="text-amber-800 dark:text-amber-200/90 font-medium">
                  👉 To open and test LectureHub on your <strong>phone</strong>, <strong>tablet</strong>, or <strong>external devices</strong> without restrictions, follow the <strong>GitHub Pages</strong> or <strong>1-Click Free Hosting</strong> tabs above!
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Development Workspace URL:
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-2.5 rounded-xl border border-slate-200 dark:border-blue-900/60 bg-slate-50 dark:bg-black/30 font-mono text-xs text-blue-600 dark:text-blue-300 truncate select-all">
                    {sharedUrl}
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition ${
                      copied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => setActiveTab('github')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-amber-400 hover:underline"
                >
                  <Github className="w-3.5 h-3.5" />
                  View GitHub Pages & Free Hosting Setup Guide →
                </button>
              </div>
            </div>
          )}

          {activeTab === 'qr' && (
            <div className="flex flex-col items-center text-center space-y-3 py-2">
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-left w-full">
                <p className="text-amber-800 dark:text-amber-200 leading-relaxed font-medium">
                  <strong>Notice:</strong> For mobile phones that are not logged into your Google AI Studio account, use the <strong>GitHub Pages</strong> or <strong>Vercel</strong> link so any mobile browser opens it without requiring Google workspace login!
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-md">
                <img
                  src={qrCodeUrl}
                  alt="Scan to open on phone"
                  className="w-44 h-44 rounded-lg"
                  loading="lazy"
                />
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-extrabold flex items-center justify-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-blue-500" />
                  Scan to Open Workspace Link
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
                  Works on any phone where your Google account is logged in, or deploy to GitHub Pages for instant public access.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'github' && (
            <div className="space-y-4 text-xs leading-relaxed">
              {/* Method 1: GitHub Pages */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-2.5">
                <div className="font-extrabold text-sm flex items-center justify-between text-slate-900 dark:text-white">
                  <span className="flex items-center gap-2">
                    <Github className="w-4 h-4 text-purple-500" />
                    Method 1: GitHub Pages (100% Free Forever)
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300">
                    Configured & Ready
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300">
                  The automated GitHub deployment workflow (<code>.github/workflows/deploy.yml</code>) and Vite relative base path are already set up. To publish:
                </p>
                <div className="bg-slate-900 text-slate-200 p-3 rounded-lg font-mono text-[11px] space-y-1 select-all overflow-x-auto">
                  <div className="text-slate-400"># 1. Create a new repository on github.com (e.g. lecturehub)</div>
                  <div className="text-slate-400"># 2. In your terminal, run:</div>
                  <div>git remote add origin https://github.com/&lt;YOUR_USERNAME&gt;/lecturehub.git</div>
                  <div>git push -u origin main</div>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                  <strong>Then in your GitHub repository:</strong> Go to <strong>Settings</strong> → <strong>Pages</strong> → under <em>Build and deployment Source</em>, select <strong>GitHub Actions</strong>. It will build and give you a free live URL: <code>https://&lt;your-username&gt;.github.io/lecturehub/</code>!
                </p>
              </div>

              {/* Method 2: Vercel / Netlify */}
              <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 space-y-2.5">
                <div className="font-extrabold text-sm flex items-center justify-between text-blue-900 dark:text-blue-200">
                  <span className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    Method 2: Vercel / Netlify (Fastest 1-Click Free Hosting)
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                    Easiest
                  </span>
                </div>
                <ol className="list-decimal pl-4 space-y-1.5 text-slate-700 dark:text-blue-200/90 text-[11px]">
                  <li>
                    Go to <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-amber-400 font-bold underline">vercel.com</a> (or <a href="https://netlify.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-amber-400 font-bold underline">netlify.com</a>).
                  </li>
                  <li>
                    Click <strong>Add New Project</strong> and connect your GitHub repository.
                  </li>
                  <li>
                    Click <strong>Deploy</strong> (we already configured <code>vercel.json</code>).
                  </li>
                  <li>
                    You will get an instant public link like <code>https://lecturehub-preview.vercel.app</code> that works on all phones, tablets, and devices worldwide!
                  </li>
                </ol>
              </div>

              {/* Method 3: Netlify Drop (Zero Git required) */}
              <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 space-y-2">
                <div className="font-extrabold text-sm flex items-center gap-2 text-emerald-900 dark:text-emerald-200">
                  <Laptop className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Method 3: Netlify Drop (Instant Drag & Drop without Git)
                </div>
                <p className="text-slate-700 dark:text-emerald-200/90 text-[11px]">
                  The production build (<code>/dist</code> folder) has already been compiled. You can upload the <code>dist</code> folder directly to <a href="https://app.netlify.com/drop" target="_blank" rel="noopener noreferrer" className="text-emerald-700 dark:text-emerald-300 font-bold underline">app.netlify.com/drop</a> for an immediate public URL in 15 seconds with zero command-line work!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[11px] text-slate-400 bg-slate-50 dark:bg-white/[0.02]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Cloud Run & Firestore Live
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
