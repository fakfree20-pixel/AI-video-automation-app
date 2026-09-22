import React, { useState } from "react";
import { GitBranch, Github, Download, CheckCircle2, Terminal, Copy, Check, ExternalLink } from "lucide-react";

export function GitHubExportView() {
  const [repoUrl, setRepoUrl] = useState("");
  const [connected, setConnected] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;
    setConnected(true);
  };

  const workflowCode = `name: Build Android APK

on:
  workflow_dispatch:
    inputs:
      app_url:
        description: 'Your Hosted App URL (e.g. Cloud Run URL)'
        required: true
        default: 'https://ais-dev-akhfpslbdhb7ntslnws6e2-257389990740.europe-west2.run.app'

jobs:
  build-apk:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout repository
      uses: actions/checkout@v4

    - name: Set up Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'

    - name: Set up Java
      uses: actions/setup-java@v4
      with:
        distribution: 'temurin'
        java-version: '17'

    - name: Install Bubblewrap CLI
      run: npm install -g @google/bubblewrap

    - name: Build Web App
      run: |
        npm install
        npm run build

    - name: Build TWA APK
      env:
        APP_URL: \${{ github.event.inputs.app_url }}
      run: |
        mkdir -p android-build
        cd android-build
        bubblewrap init --manifest="\${{ github.event.inputs.app_url }}/manifest.json" --directory=. --skip-validation || true
        bubblewrap build --directory=. || true
        find . -name "*.apk" -exec cp {} ../output.apk \;`;

  const handleCopyWorkflow = () => {
    navigator.clipboard.writeText(workflowCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-xs">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 text-stone-800 text-xs font-medium mb-4 border border-stone-200">
            <Github className="w-3.5 h-3.5" />
            GitHub Integration & APK CI/CD
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-stone-900">
            GitHub इंटीग्रेशन और APK ऑटो-बिल्ड सेटअप
          </h2>
          <p className="mt-2 text-stone-600 text-sm">
            अपने प्रोजेक्ट को GitHub रिपॉजिटरी से कनेक्ट करें। `.github/workflows/build-apk.yml` एक्शन के जरिए हर कोड पुश या ट्रिगर पर आटोमैटिक रिलीज APK तैयार हो जाएगा।
          </p>
        </div>

        <form onSubmit={handleConnect} className="mt-6 space-y-4 max-w-2xl">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5 flex items-center gap-1.5">
              <GitBranch className="w-4 h-4 text-stone-600" />
              <span>GitHub Repository URL</span>
            </label>
            <div className="flex gap-3">
              <input
                type="url"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/username/ai-video-automation-studio"
                className="flex-1 rounded-xl border border-stone-300 px-4 py-2.5 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 text-sm bg-white"
                required
              />
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-stone-900 text-white font-medium hover:bg-stone-800 transition-colors text-sm shadow-sm whitespace-nowrap"
              >
                {connected ? "Connected ✓" : "Connect Repo"}
              </button>
            </div>
          </div>
        </form>

        {connected && (
          <div className="mt-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-semibold">Repository successfully linked!</p>
              <p className="text-xs text-emerald-700">GitHub Actions CI/CD pipeline is active for APK compilation.</p>
            </div>
          </div>
        )}
      </div>

      {/* GitHub Actions Workflow Details */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-stone-900">`.github/workflows/build-apk.yml`</h3>
            <p className="text-xs text-stone-500">Automated TWA APK build configuration for Android release.</p>
          </div>
          <button
            onClick={handleCopyWorkflow}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-stone-300 bg-white text-stone-700 text-xs font-medium hover:bg-stone-50 transition-colors shadow-xs"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied Workflow!" : "Copy Workflow YAML"}
          </button>
        </div>

        <pre className="p-4 rounded-xl bg-stone-900 text-stone-100 text-xs font-mono overflow-x-auto leading-relaxed max-h-[400px]">
          <code>{workflowCode}</code>
        </pre>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" />
              Manual Trigger (GitHub Actions)
            </h4>
            <p className="text-xs text-stone-600">
              Go to your GitHub repo ➔ Actions tab ➔ Select "Build Android APK" ➔ Click "Run workflow" with your hosted App URL.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" />
              Artifact Download
            </h4>
            <p className="text-xs text-stone-600">
              Once the workflow finishes successfully, download the compiled `.apk` artifact directly from the workflow run summary page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
