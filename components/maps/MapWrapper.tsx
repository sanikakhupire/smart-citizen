// components/maps/MapWrapper.tsx
'use client';

import dynamic from 'next/dynamic';

// Dynamically import the map, disabling Server Side Rendering (SSR)
const LeafletPicker = dynamic(() => import('./LeafletPicker'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-slate-100 rounded-lg animate-pulse text-slate-500">
      Loading map...
    </div>
  ),
});

interface MapWrapperProps {
  position: [number, number];
  setPosition: (pos: [number, number]) => void;
}

export default function MapWrapper({ position, setPosition }: MapWrapperProps) {
  return <LeafletPicker position={position} setPosition={setPosition} />;
}