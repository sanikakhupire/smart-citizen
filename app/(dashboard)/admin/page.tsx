// app/(dashboard)/admin/page.tsx
'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/layout/ProtectedRoute';

export default function AdminDashboard() {
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    try {
      const res = await fetch('/api/issues');
      const data = await res.json();
      if (data.success) setIssues(data.issues);
    } catch (error) {
      console.error('Error fetching issues', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdating(id);
    try {
      const res = await fetch(`/api/issues/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        // Update local state to reflect change instantly
        setIssues(issues.map(issue => issue._id === id ? { ...issue, status: newStatus } : issue));
      }
    } catch (error) {
      console.error('Failed to update status', error);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <ProtectedRoute adminOnly={true}>
      <div className="p-8 max-w-full mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Admin Control Center</h1>
          <p className="text-slate-500 mt-1">Manage, triage, and resolve city-wide civic issues.</p>
        </div>

        {loading ? (
           <div className="p-10 text-slate-500 animate-pulse bg-white rounded-xl border border-slate-200">Loading master database...</div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                    <th className="p-4 font-bold">Issue Details</th>
                    <th className="p-4 font-bold">Category</th>
                    <th className="p-4 font-bold">AI Assessment</th>
                    <th className="p-4 font-bold">Status</th>
                    <th className="p-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {issues.map(issue => (
                    <tr key={issue._id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-4">
                          <img src={issue.imageUrl} alt="issue" className="w-12 h-12 rounded object-cover border border-slate-200" />
                          <div>
                            <p className="font-bold text-sm text-slate-900">{issue.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{new Date(issue.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-xs font-medium text-slate-700 capitalize bg-slate-100 px-2.5 py-1 rounded-md">
                          {issue.category}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <span className={`text-xs font-bold ${issue.priority === 'high' ? 'text-red-600' : 'text-slate-600'}`}>
                            {issue.priority.toUpperCase()} Priority
                          </span>
                          {/* Display AI deduplication logic if applicable */}
                          {issue.status === 'duplicate' && (
                            <span className="text-[10px] text-orange-600 font-medium bg-orange-50 px-1.5 py-0.5 rounded w-max">
                              Identified as Duplicate
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <select
                          disabled={updating === issue._id}
                          value={issue.status}
                          onChange={(e) => updateStatus(issue._id, e.target.value)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-full border outline-none appearance-none cursor-pointer ${
                            issue.status === 'resolved' ? 'bg-green-50 text-green-700 border-green-200' :
                            issue.status === 'in-progress' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                            'bg-red-50 text-red-700 border-red-200'
                          } disabled:opacity-50`}
                        >
                          <option value="pending">Pending</option>
                          <option value="in-progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="duplicate">Duplicate</option>
                        </select>
                      </td>
                      <td className="p-4 text-right">
                        <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                          View details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}