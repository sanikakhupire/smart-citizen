// components/maps/GlobalMapWrapper.tsx
'use client';

import dynamic from 'next/dynamic';

const GlobalMap = dynamic(() => import('./GlobalMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-slate-100 animate-pulse text-slate-500">
      Loading city map and issues...
    </div>
  ),
});

export default function GlobalMapWrapper({ issues }: { issues: any[] }) {
  return <GlobalMap issues={issues} />;
}