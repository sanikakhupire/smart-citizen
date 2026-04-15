'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter } from 'next/navigation';
import MapWrapper from '@/components/maps/MapWrapper';

export default function ReportIssuePage() {
  const { user } = useAuth();
  const router = useRouter();

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('road');
  const [image, setImage] = useState<File | null>(null);
  
  // Location State
  const [position, setPosition] = useState<[number, number]>([19.0760, 72.8777]); 
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // --- WebRTC Camera State ---
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Clean up camera stream if component unmounts
  useEffect(() => {
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [mediaStream]);

  // Start the in-app camera
  const startCamera = async () => {
    setError('');
    setIsInitializing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // CRITICAL FIX: Ensure the video actually starts playing
        await videoRef.current.play();
      }
      
      setMediaStream(stream);
      setIsCameraActive(true);
      setImage(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    } catch (err) {
      console.error("Camera access error:", err);
      setError("Camera access denied or not found. Please ensure you are on HTTPS and have granted permissions.");
    } finally {
      setIsInitializing(false);
    }
  };

  // Capture frame from video and convert to File
  const capturePhoto = () => {
    // CRITICAL FIX: Check if video is actually ready to be captured
    if (videoRef.current && canvasRef.current && videoRef.current.readyState === 4) {
      const context = canvasRef.current.getContext('2d');
      const video = videoRef.current;
      const canvas = canvasRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      context?.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `live_capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
          setImage(file);
          setPreviewUrl(URL.createObjectURL(blob));
          stopCamera();
        }
      }, 'image/jpeg', 0.85);
    } else {
      setError("Camera is still warming up. Please try again in a second.");
    }
  };

  const stopCamera = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
    }
    setIsCameraActive(false);
    setMediaStream(null);
  };

  const handleAutoLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
        () => alert('Unable to retrieve your location. Please select it on the map manually.')
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to report an issue.');
      return;
    }
    if (!image) {
      setError('Please capture a live image of the issue.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const imageRef = ref(storage, `issues/${Date.now()}_${image.name}`);
      await uploadBytes(imageRef, image);
      const imageUrl = await getDownloadURL(imageRef);

      const response = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          imageUrl,
          location: { lat: position[0], lng: position[1] },
          reportedBy: user.uid,
        }),
      });

      if (!response.ok) throw new Error('Failed to submit issue');
      router.push('/citizen?success=true');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-slate-200 mt-10">
      <div className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold text-slate-900">Report a Civic Issue</h1>
        <p className="text-slate-500 mt-2">Help us keep the city clean and functional by reporting issues directly.</p>
      </div>

      {error && <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-lg text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Issue Title</label>
              <input
                type="text"
                required
                className="w-full rounded-md border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g., Pothole on Main Street"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select
                className="w-full rounded-md border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="road">Road / Pothole</option>
                <option value="water">Water Leak / Supply</option>
                <option value="electricity">Streetlight / Power</option>
                <option value="garbage">Waste Management</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea
                required
                rows={3}
                className="w-full rounded-md border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Describe the issue in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-700">Capture Live Evidence</label>
                <span className="text-[10px] uppercase font-bold tracking-wider text-red-500 bg-red-50 px-2 py-0.5 rounded">Live Camera Only</span>
              </div>
              
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-2 text-center bg-slate-50 relative overflow-hidden flex flex-col items-center justify-center min-h-[220px]">
                
                {!isCameraActive && !image && (
                  <button
                    type="button"
                    disabled={isInitializing}
                    onClick={startCamera}
                    className="flex flex-col items-center justify-center space-y-2 hover:opacity-80 transition-opacity p-6"
                  >
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl">
                      {isInitializing ? '⏳' : '📷'}
                    </div>
                    <span className="text-sm font-medium text-blue-600">
                      {isInitializing ? 'Initializing Camera...' : 'Tap to Start Camera'}
                    </span>
                    <span className="text-xs text-slate-500">Gallery uploads are strictly disabled.</span>
                  </button>
                )}

                {isCameraActive && (
                  <div className="relative w-full h-full flex flex-col items-center bg-black rounded-md overflow-hidden">
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      className="w-full h-48 object-cover" 
                    />
                    <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-4">
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="bg-slate-800/80 text-white px-4 py-2 rounded-full text-xs font-semibold backdrop-blur-sm"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="bg-white text-blue-600 px-6 py-2 rounded-full shadow-lg font-bold text-sm hover:bg-slate-100 transition-colors"
                      >
                        📸 Capture
                      </button>
                    </div>
                  </div>
                )}

                {image && previewUrl && !isCameraActive && (
                  <div className="relative w-full h-full flex flex-col items-center group">
                    <img src={previewUrl} alt="Captured" className="w-full h-48 object-cover rounded-md" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md">
                      <button
                        type="button"
                        onClick={startCamera}
                        className="bg-white text-slate-900 px-6 py-2 rounded-full shadow-lg font-bold text-sm"
                      >
                        🔄 Retake
                      </button>
                    </div>
                  </div>
                )}
                <canvas ref={canvasRef} className="hidden" />
              </div>
            </div>
          </div>

          <div className="space-y-4 flex flex-col">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-700">Pin Location</label>
              <button
                type="button"
                onClick={handleAutoLocation}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
              >
                📍 Auto-detect
              </button>
            </div>
            <div className="w-full h-[320px] border border-slate-300 rounded-lg overflow-hidden bg-slate-50 relative z-0">
               <MapWrapper position={position} setPosition={setPosition} />
            </div>
            <div className="text-xs text-slate-500 text-right">
              Lat: {position[0].toFixed(4)}, Lng: {position[1].toFixed(4)}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <button
            type="submit"
            disabled={loading || isCameraActive}
            className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </form>
    </div>
  );
}