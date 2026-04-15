// app/(dashboard)/citizen/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import Link from 'next/link';
import { useSocket } from '@/components/providers/SocketProvider';
import { AnimatePresence, motion } from 'framer-motion';
import PageTransition from '@/components/layout/PageTransition';
import { IssueCardSkeleton } from '@/components/ui/IssueSkeleton';

export default function CitizenDashboard() {
  const { user } = useAuth();
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Socket Context & Notification State
  const { socket } = useSocket();
  const [notification, setNotification] = useState<{ title: string; status: string; message: string } | null>(null);

  // 1. Fetch Issues on Load
  useEffect(() => {
    if (!user) return;
    
    const fetchMyIssues = async () => {
      try {
        const res = await fetch(`/api/issues?userId=${user.uid}`);
        const data = await res.json();
        if (data.success) setIssues(data.issues);
      } catch (error) {
        console.error('Error fetching issues', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyIssues();
  }, [user]);

  // 2. Handle Real-Time Socket Events
  useEffect(() => {
    if (!socket) return;

    // Listen for the specific event emitted by our API
    socket.on('issue_updated', (data) => {
      // Show Toast Notification
      setNotification(data);
      
      // Update the local state instantly so the UI reflects the new status
      setIssues((prevIssues) => 
        prevIssues.map(issue => 
          issue._id === data.issueId ? { ...issue, status: data.status } : issue
        )
      );

      // Auto-hide toast after 5 seconds
      const timer = setTimeout(() => setNotification(null), 5000);
      
      // Cleanup timer if the component unmounts or a new notification arrives
      return () => clearTimeout(timer);
    });

    // Cleanup socket listener on unmount
    return () => {
      socket.off('issue_updated');
    };
  }, [socket]);

  return (
    <PageTransition>
      <div className="p-4 md:p-8 max-w-7xl mx-auto relative min-h-[calc(100vh-4rem)]">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">My Reports</h1>
            <p className="text-slate-500 mt-1">Track the status of the civic issues you have reported.</p>
          </div>
          <Link href="/report" className="w-full sm:w-auto text-center px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
            + New Report
          </Link>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <IssueCardSkeleton />
            <IssueCardSkeleton />
            <IssueCardSkeleton />
          </div>
        ) : issues.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
            <h3 className="text-lg font-medium text-slate-900 mb-2">No reports yet</h3>
            <p className="text-slate-500">You haven't reported any issues. Help improve the city by reporting one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {issues.map(issue => (
              <div key={issue._id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div 
                  className="h-48 w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${issue.imageUrl})` }}
                />
                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                      issue.status === 'resolved' ? 'bg-green-100 text-green-700' :
                      issue.status === 'in-progress' ? 'bg-yellow-100 text-yellow-700' :
                      issue.status === 'duplicate' ? 'bg-slate-100 text-slate-600' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {issue.status}
                    </span>
                    {/* AI Priority Badge */}
                    <span className={`text-xs font-semibold flex items-center gap-1 ${
                      issue.priority === 'high' ? 'text-red-600' : issue.priority === 'medium' ? 'text-orange-500' : 'text-blue-500'
                    }`}>
                      Priority: {issue.priority}
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-slate-900 text-lg mb-1 truncate">{issue.title}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-4">{issue.description}</p>
                  
                  <div className="text-xs text-slate-400">
                    Reported on {new Date(issue.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Real-time Notification Toast using Framer Motion */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="fixed bottom-8 right-8 z-50 bg-slate-900 text-white p-4 rounded-xl shadow-2xl border border-slate-700 w-80"
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full mt-1 ${
                  notification.status === 'resolved' ? 'bg-green-500/20 text-green-400' : 
                  notification.status === 'in-progress' ? 'bg-yellow-500/20 text-yellow-400' : 
                  'bg-blue-500/20 text-blue-400'
                }`}>
                  🔔
                </div>
                <div>
                  <h4 className="font-bold text-sm">Status Updated</h4>
                  <p className="text-xs text-slate-300 mt-1">{notification.message}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </PageTransition>
  );
}