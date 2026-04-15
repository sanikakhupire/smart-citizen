'use client';

import { useState } from 'react';
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Location State
  const [position, setPosition] = useState<[number, number]>([19.0760, 72.8777]); 
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle Image Selection (Camera or Gallery)
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      // Create a local URL for the preview image
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleAutoLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
        () => alert('Unable to retrieve location. Please pin manually.')
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in.');
      return;
    }
    if (!image) {
      setError('Please upload or capture an image.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Upload to Firebase
      const imageRef = ref(storage, `issues/${Date.now()}_${image.name}`);
      await uploadBytes(imageRef, image);
      const imageUrl = await getDownloadURL(imageRef);

      // 2. Save to MongoDB
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
        <p className="text-slate-500 mt-2">Upload a photo and details to notify authorities.</p>
      </div>

      {error && <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-lg text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Issue Title</label>
              <input
                type="text"
                required
                className="w-full rounded-md border border-slate-300 p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Pothole on Station Road"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Category</label>
              <select
                className="w-full rounded-md border border-slate-300 p-2.5 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="road">Road / Pothole</option>
                <option value="water">Water Leakage</option>
                <option value="electricity">Streetlight / Electricity</option>
                <option value="garbage">Garbage / Waste</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
              <textarea
                required
                rows={3}
                className="w-full rounded-md border border-slate-300 p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe the issue..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* IMAGE UPLOAD SECTION */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Evidence Photo</label>
              <div className="relative border-2 border-dashed border-slate-300 rounded-xl p-4 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment" // Suggests camera on mobile
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                
                <div className="flex flex-col items-center py-4">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="h-40 w-full object-cover rounded-lg shadow-md" />
                  ) : (
                    <>
                      <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl mb-2">📸</div>
                      <p className="text-sm font-bold text-blue-600">Click to Take Photo or Upload</p>
                      <p className="text-xs text-slate-400 mt-1">PNG, JPG up to 10MB</p>
                    </>
                  )}
                </div>
              </div>
              {previewUrl && (
                <button 
                  type="button" 
                  onClick={() => {setImage(null); setPreviewUrl(null);}}
                  className="text-xs text-red-500 font-semibold mt-2 underline"
                >
                  Remove photo and try again
                </button>
              )}
            </div>
          </div>

          {/* MAP SECTION */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold text-slate-700">Location Details</label>
              <button
                type="button"
                onClick={handleAutoLocation}
                className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg"
              >
                📍 Use GPS
              </button>
            </div>
            <div className="w-full h-[350px] border border-slate-200 rounded-xl overflow-hidden shadow-sm">
               <MapWrapper position={position} setPosition={setPosition} />
            </div>
            <p className="text-[10px] text-slate-400 text-center font-mono">
              Coordinates: {position[0].toFixed(5)}, {position[1].toFixed(5)}
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100">
          <button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto px-10 py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-lg active:scale-95 transition-all"
          >
            {loading ? 'Submitting...' : 'Submit Official Report'}
          </button>
        </div>
      </form>
    </div>
  );
}