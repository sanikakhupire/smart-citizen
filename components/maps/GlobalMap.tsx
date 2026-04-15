// components/maps/GlobalMap.tsx
'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Link from 'next/link';

// Types matching our Mongoose Model
interface IssueData {
  _id: string;
  title: string;
  category: string;
  status: 'pending' | 'in-progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  location: { lat: number; lng: number };
  imageUrl: string;
  createdAt: string;
}

interface GlobalMapProps {
  issues: IssueData[];
}

// Helper to generate dynamic colored markers
const createCustomIcon = (status: string) => {
  let colorClass = 'bg-red-500'; // Default: Pending / High Priority
  if (status === 'in-progress') colorClass = 'bg-yellow-500';
  if (status === 'resolved') colorClass = 'bg-green-500';

  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `
      <div class="relative flex items-center justify-center w-8 h-8">
        <div class="absolute w-6 h-6 ${colorClass} rounded-full shadow-lg border-2 border-white z-10"></div>
        <div class="absolute w-8 h-8 ${colorClass} rounded-full animate-ping opacity-40"></div>
        <div class="absolute bottom-[-6px] w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white z-0"></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

export default function GlobalMap({ issues }: GlobalMapProps) {
  // Default center (can be updated to a dynamic city center)
  const center: [number, number] = [19.0760, 72.8777]; // Mumbai

  return (
    <MapContainer 
      center={center} 
      zoom={12} 
      style={{ height: '100%', width: '100%', zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" // Cleaner basemap for data visualization
      />
      
      <MarkerClusterGroup
        chunkedLoading
        maxClusterRadius={50}
      >
        {issues.map((issue) => (
          <Marker 
            key={issue._id} 
            position={[issue.location.lat, issue.location.lng]}
            icon={createCustomIcon(issue.status)}
          >
            <Popup className="rounded-xl overflow-hidden shadow-xl p-0">
              <div className="w-64">
                <div 
                  className="h-32 w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${issue.imageUrl})` }}
                />
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{issue.category}</span>
                    <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${
                      issue.status === 'resolved' ? 'bg-green-100 text-green-700' :
                      issue.status === 'in-progress' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {issue.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 mb-1">{issue.title}</h3>
                  <p className="text-xs text-slate-500 mb-3 truncate">
                    Reported: {new Date(issue.createdAt).toLocaleDateString()}
                  </p>
                  <Link 
                    href={`/issues/${issue._id}`}
                    className="block w-full text-center py-2 bg-slate-900 text-white text-xs font-medium rounded hover:bg-slate-800 transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}