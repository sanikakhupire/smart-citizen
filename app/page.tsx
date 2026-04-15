// app/page.tsx
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-3xl w-full text-center space-y-8">
        
        {/* Logo Area */}
        <h1 className="text-5xl md:text-6xl font-black tracking-tight text-slate-900">
          Smart<span className="text-blue-600">Citizen</span>
        </h1>
        
        {/* Tagline */}
        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          The intelligent civic management platform. Report issues, track maintenance in real-time, and help build a better city together.
        </p>

        {/* Call to Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
          <Link 
            href="/signup" 
            className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 text-white font-semibold rounded-xl shadow-sm hover:bg-blue-700 hover:shadow transition-all text-lg"
          >
            Report an Issue
          </Link>
          <Link 
            href="/login" 
            className="w-full sm:w-auto px-8 py-3.5 bg-white text-slate-700 font-semibold rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-all text-lg"
          >
            Admin Login
          </Link>
        </div>

        {/* Feature Teasers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 text-left">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-2xl mb-3">📍</div>
            <h3 className="font-bold text-slate-900 mb-2">Live Geotagging</h3>
            <p className="text-sm text-slate-500">Pinpoint exact locations of civic issues using our interactive maps.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-2xl mb-3">🤖</div>
            <h3 className="font-bold text-slate-900 mb-2">AI Prioritization</h3>
            <p className="text-sm text-slate-500">Smart algorithms automatically categorize and route issues to the right department.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-2xl mb-3">⚡</div>
            <h3 className="font-bold text-slate-900 mb-2">Real-time Updates</h3>
            <p className="text-sm text-slate-500">Get instant notifications the moment your reported issue is resolved.</p>
          </div>
        </div>

      </div>
    </div>
  );
}