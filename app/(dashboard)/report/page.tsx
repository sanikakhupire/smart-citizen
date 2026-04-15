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

  // Start the in-app camera with mobile-specific fixes
  const startCamera = async () => {
    setError('');
    setIsInitializing(true);
    
    // Stop any existing tracks before starting a new one
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
    }

    try {
      // Constraints optimized for mobile rear camera
      const constraints = {
        video: { 
          facingMode: { ideal: 'environment' }, // 'ideal' is more compatible than 'exact'
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Mobile browsers require these attributes for auto-play
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.muted = true; 
        
        // Explicitly play to avoid the black screen freeze
        await videoRef.current.play().catch(e => console.error("Playback error:", e));
      }
      
      setMediaStream(stream);
      setIsCameraActive(true);
      setImage(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    } catch (err: any) {
      console.error("Camera access error:", err);
      setError("Camera not accessible. Ensure you are on HTTPS, have granted permissions, and no other app is using the camera.");
    } finally {
      setIsInitializing(false);
    }
  };

  // Capture frame from video and convert to File
  const capturePhoto = () => {
    // Check if video is actually sending data (ReadyState 4 = HAVE_ENOUGH_DATA)
    if (videoRef.current && canvasRef.current && videoRef.current.readyState >= 3) {
      const context = canvasRef.current.getContext('2d');
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Match canvas to video stream resolution
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      context?.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `live_capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
          setImage(file);
          setPreviewUrl(URL.createObjectURL(blob));
          stopCamera(); // Turn off camera hardware once photo is taken
        }
      }, 'image/jpeg', 0.85);
    } else {
      setError("Camera is still loading. Please wait for the video to appear.");
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
        () => alert('Unable to retrieve location. Please pin manually.')
      );
    } else {
      alert('Geolocation not supported.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in.');
      return;
    }
    if (!image) {
      setError('Please capture a live image.');
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

      if (!response.ok) throw new Error('Submission failed');
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
        <p className="text-slate-500 mt-2">Help keep the city clean by reporting issues directly.</p>
      </div>

      {error && <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-lg text-sm font-medium">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Issue Title</label>
              <input
                type="text"
                required
                className="w-full rounded-md border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g., Water leakage near market"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Category</label>
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
              <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
              <textarea
                required
                rows={3}
                className="w-full rounded-md border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Briefly explain the problem..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-slate-700">Capture Evidence</label>
                <span className="text-[10px] uppercase font-black text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">Live Camera Only</span>
              </div>
              
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-2 text-center bg-slate-50 relative overflow-hidden flex flex-col items-center justify-center min-h-[240px]">
                
                {!isCameraActive && !image && (
                  <button
                    type="button"
                    disabled={isInitializing}
                    onClick={startCamera}
                    className="flex flex-col items-center justify-center space-y-3 p-8"
                  >
                    <div className="w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl shadow-lg">
                      {isInitializing ? '⏳' : '📷'}
                    </div>
                    <span className="text-sm font-bold text-blue-600">
                      {isInitializing ? 'Starting Camera...' : 'Tap to Open Camera'}
                    </span>
                    <p className="text-[11px] text-slate-400">Secure capture required for verification.</p>
                  </button>
                )}

                {isCameraActive && (
                  <div className="relative w-full h-full flex flex-col items-center bg-black rounded-md overflow-hidden shadow-inner">
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      className="w-full h-56 object-cover" 
                    />
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="bg-slate-900/90 text-white px-5 py-2 rounded-full text-xs font-bold backdrop-blur-md border border-slate-700"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="bg-white text-blue-700 px-8 py-2 rounded-full shadow-2xl font-black text-sm active:scale-95 transition-transform"
                      >
                        Capture Photo
                      </button>
                    </div>
                  </div>
                )}

                {image && previewUrl && !isCameraActive && (
                  <div className="relative w-full h-full flex flex-col items-center group">
                    <img src={previewUrl} alt="Captured" className="w-full h-56 object-cover rounded-md shadow-md" />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md backdrop-blur-sm">
                      <button
                        type="button"
                        onClick={startCamera}
                        className="bg-white text-slate-900 px-6 py-2 rounded-full shadow-lg font-bold text-sm"
                      >
                        🔄 Retake Photo
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
              <label className="block text-sm font-semibold text-slate-700">Pin Location</label>
              <button
                type="button"
                onClick={handleAutoLocation}
                className="text-xs text-blue-600 hover:text-blue-800 font-bold bg-blue-50 px-3 py-1.5 rounded-md transition-colors"
              >
                📍 My Location
              </button>
            </div>
            <div className="w-full h-[360px] border border-slate-200 rounded-lg overflow-hidden bg-slate-100 relative z-0 shadow-sm">
               <MapWrapper position={position} setPosition={setPosition} />
            </div>
            <div className="flex justify-between items-center px-1">
               <span className="text-[10px] text-slate-400 font-mono">LAT: {position[0].toFixed(5)}</span>
               <span className="text-[10px] text-slate-400 font-mono">LNG: {position[1].toFixed(5)}</span>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={loading || isCameraActive}
            className="w-full md:w-56 py-3.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md active:translate-y-0.5"
          >
            {loading ? '🚀 Uploading...' : 'Submit Official Report'}
          </button>
        </div>
      </form>
    </div>
  );
}