// app/(dashboard)/map/page.tsx
'use client';

import { useState, useEffect } from 'react';
import GlobalMapWrapper from '@/components/maps/GlobalMapWrapper';

export default function MapDashboardPage() {
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const res = await fetch('/api/issues');
        const data = await res.json();
        if (data.success) {
          setIssues(data.issues);
        }
      } catch (error) {
        console.error('Error fetching issues:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchIssues();
  }, []);

  // Compute filtered issues
  const filteredIssues = issues.filter(issue => {
    const matchStatus = statusFilter === 'all' || issue.status === statusFilter;
    const matchCategory = categoryFilter === 'all' || issue.category === categoryFilter;
    return matchStatus && matchCategory;
  });

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row bg-slate-50">
      
      {/* Sidebar Filters */}
      <div className="w-full md:w-80 bg-white border-r border-slate-200 p-6 flex flex-col overflow-y-auto shrink-0 z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1">City Map</h2>
          <p className="text-sm text-slate-500 mb-8">Real-time civic intelligence.</p>
        </div>

        <div className="space-y-6">
          {/* Status Filter */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 block">Filter by Status</label>
            <div className="flex flex-col gap-2">
              {[
                { id: 'all', label: 'All Issues', color: 'bg-slate-200' },
                { id: 'pending', label: 'Pending', color: 'bg-red-500' },
                { id: 'in-progress', label: 'In Progress', color: 'bg-yellow-500' },
                { id: 'resolved', label: 'Resolved', color: 'bg-green-500' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setStatusFilter(opt.id)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    statusFilter === opt.id ? 'bg-slate-100 shadow-sm border border-slate-200 text-slate-900' : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <span className={`w-3 h-3 rounded-full ${opt.color}`}></span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Category Filter */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 block">Filter by Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full rounded-md border border-slate-300 p-2.5 bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">All Categories</option>
              <option value="road">Road / Pothole</option>
              <option value="water">Water Leak / Supply</option>
              <option value="electricity">Streetlight / Power</option>
              <option value="garbage">Waste Management</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="mt-auto pt-8">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <h4 className="text-sm font-bold text-blue-900 mb-1">Total Showing</h4>
            <p className="text-3xl font-black text-blue-600">{filteredIssues.length}</p>
          </div>
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative bg-slate-200 z-0">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <GlobalMapWrapper issues={filteredIssues} />
        )}
      </div>
    </div>
  );
}