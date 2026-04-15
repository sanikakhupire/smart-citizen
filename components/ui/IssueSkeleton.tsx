// components/ui/IssueSkeleton.tsx
export function IssueCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm animate-pulse">
      {/* Image Placeholder */}
      <div className="h-48 w-full bg-slate-200" />
      
      <div className="p-5 space-y-4">
        {/* Badges */}
        <div className="flex justify-between items-center">
          <div className="h-6 w-20 bg-slate-200 rounded-full" />
          <div className="h-4 w-24 bg-slate-200 rounded" />
        </div>
        
        {/* Title */}
        <div className="h-6 w-3/4 bg-slate-200 rounded" />
        
        {/* Description Lines */}
        <div className="space-y-2">
          <div className="h-4 w-full bg-slate-200 rounded" />
          <div className="h-4 w-5/6 bg-slate-200 rounded" />
        </div>
        
        {/* Footer/Date */}
        <div className="pt-2">
          <div className="h-3 w-1/3 bg-slate-200 rounded" />
        </div>
      </div>
    </div>
  );
}