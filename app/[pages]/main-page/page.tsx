"use client";
import Image from 'next/image';
import React, { useState } from 'react';
import { MapPin, ShieldAlert, Upload, AlertTriangle } from 'lucide-react';
import dynamic from 'next/dynamic';
import Header from '@/app/components/header/header';
import Sidebar, { type NavId } from '@/app/components/sidebar/sidebar';
import WasteScanner from '@/app/components/waste-scanner/waste-scanner';
import { analyzeImage } from '@/lib/api';

type DashboardAnalysis = {
  problem: string;
  category: string;
  urgency: string;
  recommendation: string;
  status: "success" | "rejected";
  message?: string;
};

// Отключаем SSR для карты, так как Leaflet работает только в браузере
const LeafletMap = dynamic(() => import('@/app/components/Map/map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[280px] w-full items-center justify-center bg-slate-100 animate-pulse">
      Loading map…
    </div>
  ),
});

export default function Dashboard() {
  const [activeNav, setActiveNav] = useState<NavId>('waste-scanner');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  /** Клик по карте — точка выбрана (нужно для Қоқыс AI) */
  const [locationSelected, setLocationSelected] = useState(false);

  const handleNavigate = (id: NavId) => {
    setActiveNav(id);
    setSidebarOpen(false);
  };

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<DashboardAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  
  // Стартовые координаты (Шымкент)
  const [location, setLocation] = useState({ lat: 42.3417, lng: 69.5901 });
  
  // Массив для хранения всех подтвержденных инцидентов на карте
  const [incidentMarkers, setIncidentMarkers] = useState<{lat: number, lng: number, problem: string}[]>([]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      // Сбрасываем предыдущий анализ при загрузке нового фото
      setAnalysis(null);
      setRequestError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedImage) return;
    setLoading(true);
    setRequestError(null);

    try {
      const { analysis, message, status } = await analyzeImage(
        selectedImage,
        location.lat,
        location.lng
      );
      if (analysis) {
        setAnalysis({
          problem: analysis.title,
          category: analysis.category,
          urgency: analysis.urgency ?? "unknown",
          recommendation: analysis.description,
          status,
          message,
        });
        if (status === "success") {
          setIncidentMarkers((prev) => [
            ...prev,
            {
              lat: location.lat,
              lng: location.lng,
              problem: analysis.title,
            },
          ]);
        }
      } else {
        setRequestError("Не удалось разобрать ответ сервера");
      }
    } catch (err) {
      console.error("Error analyzing image:", err);
      setRequestError(
        err instanceof Error ? err.message : "Ошибка запроса"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex h-screen min-h-0 w-full bg-slate-50 font-sans text-slate-900">
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          aria-label="Закрыть меню"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <Sidebar activeId={activeNav} onNavigate={handleNavigate} mobileOpen={sidebarOpen} />
      {activeNav === 'waste-scanner' ? (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <div className="flex min-h-0 flex-1 flex-col md:flex-row">
            <div className="flex min-h-0 min-w-0 shrink-0 flex-col overflow-hidden border-b border-slate-200/90 bg-slate-50 max-md:flex-none md:w-[35%] md:min-w-[12rem] md:max-w-xl md:border-b-0 md:border-r">
              <WasteScanner
                location={location}
                locationReady={locationSelected}
                onAnalysisSuccess={(summary) =>
                  setIncidentMarkers((prev) => [
                    ...prev,
                    {
                      lat: location.lat,
                      lng: location.lng,
                      problem: summary,
                    },
                  ])
                }
              />
            </div>
            <div className="relative z-0 min-h-0 min-w-0 flex-1 max-md:min-h-[40vh]">
              <LeafletMap
                location={location}
                setLocation={setLocation}
                markers={incidentMarkers}
                onLocationSelect={() => setLocationSelected(true)}
              />
            </div>
          </div>
        </div>
      ) : (
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        {activeNav === 'dashboard' && (
        <div className="flex min-h-0 flex-1">
          <div className="relative z-0 min-h-0 flex-1">
            <LeafletMap
              location={location}
              setLocation={setLocation}
              markers={incidentMarkers}
              onLocationSelect={() => setLocationSelected(true)}
            />
          </div>

          <div className="z-10 flex h-full min-h-0 w-[450px] flex-col overflow-y-auto border-l bg-white shadow-xl">
          <div className="bg-slate-900 p-6 text-white">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <ShieldAlert className="h-6 w-6 text-red-500" />
              Smart City AI
            </h2>
            <p className="mt-1 text-sm text-slate-400">Incident Detection System</p>
          </div>

          <div className="flex flex-1 flex-col gap-6 p-6">
          {/* Блок загрузки фото */}
          <div>
            <label className="block text-sm font-semibold mb-2">Upload Evidence</label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:bg-slate-50 transition cursor-pointer relative">
              <input 
                type="file" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                onChange={handleImageChange}
                accept="image/*"
              />
              {previewUrl ? (
                <Image
                  src={previewUrl}
                  alt="Preview"
                  unoptimized
                  width={400}
                  height={300}
                  className="max-h-48 mx-auto rounded object-cover"
                />
              ) : (
                <div className="text-slate-500 flex flex-col items-center py-4">
                  <Upload className="w-8 h-8 mb-2 opacity-50" />
                  <span className="text-sm">Click or drag image here</span>
                </div>
              )}
            </div>
            <button 
              onClick={handleUpload}
              disabled={!selectedImage || loading}
              className="w-full mt-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold py-3 rounded flex justify-center items-center gap-2 transition shadow-sm"
            >
              {loading ? "Analyzing..." : "Start AI Analysis"}
            </button>
            {requestError && (
              <p className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {requestError}
              </p>
            )}
          </div>

          {/* Результаты анализа */}
          {analysis && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 border-t pt-6">
              <div
                className={`mb-4 flex items-center gap-2 font-bold ${
                  analysis.status === 'rejected' ? 'text-amber-600' : 'text-red-600'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
                {analysis.status === 'rejected' ? 'MODERATION ALERT' : 'CRITICAL ALERT'}
              </div>
              
              <div className="mb-4">
                <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Photo Analyzed</p>
                <h3 className="text-lg font-bold leading-tight">{analysis.problem}</h3>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-6">
                <div className="bg-slate-100 p-3 rounded">
                  <p className="text-[10px] uppercase text-slate-400 font-bold">Category</p>
                  <p className="text-sm font-semibold capitalize">{analysis.category}</p>
                </div>
                <div className="bg-slate-100 p-3 rounded">
                  <p className="text-[10px] uppercase text-slate-400 font-bold">Urgency</p>
                  <p className={`text-sm font-semibold uppercase ${analysis.urgency === 'high' ? 'text-red-600' : analysis.urgency === 'medium' ? 'text-orange-500' : 'text-green-600'}`}>
                    {analysis.urgency}
                  </p>
                </div>
                
                {/* Динамические координаты */}
                <div className="bg-slate-100 p-3 rounded col-span-2 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] uppercase text-slate-400 font-bold">Location Coordinates</p>
                    <p className="text-sm font-mono font-semibold mt-1">
                      {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                    </p>
                  </div>
                  <MapPin className="w-5 h-5 text-slate-400" />
                </div>
              </div>

              {analysis.message && (
                <div
                  className={`mb-4 rounded-r border-l-4 p-4 ${
                    analysis.status === 'rejected'
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-blue-500 bg-blue-50'
                  }`}
                >
                  <p
                    className={`mb-1 text-[10px] uppercase font-bold ${
                      analysis.status === 'rejected' ? 'text-amber-700' : 'text-blue-700'
                    }`}
                  >
                    Server Message
                  </p>
                  <p className="text-sm text-slate-700 leading-relaxed">{analysis.message}</p>
                </div>
              )}

              <div
                className={`mb-6 rounded-r border-l-4 p-4 ${
                  analysis.status === 'rejected'
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-red-600 bg-red-50'
                }`}
              >
                <p
                  className={`mb-1 text-[10px] uppercase font-bold ${
                    analysis.status === 'rejected' ? 'text-amber-700' : 'text-red-600'
                  }`}
                >
                  Auto-Recommendation
                </p>
                <p className="text-sm text-slate-700 leading-relaxed">{analysis.recommendation}</p>
              </div>

              {analysis.status === 'success' && (
                <div className="flex gap-2 mt-auto">
                  <button className="flex-1 bg-slate-900 text-white py-3 rounded text-sm font-bold uppercase tracking-wider hover:bg-slate-800 transition">Ignore Case</button>
                  <button className="flex-1 bg-[#007F5F] text-white py-3 rounded text-sm font-bold uppercase tracking-wider hover:bg-emerald-700 transition shadow-md">Dispatch Team</button>
                </div>
              )}
            </div>
          )}
          </div>
          </div>
        </div>
        )}
        {activeNav !== 'dashboard' && (
          <div className="flex min-h-0 flex-1 items-center justify-center bg-slate-50 p-8 text-center text-slate-500">
            <p className="text-sm font-medium">Раздел в разработке</p>
          </div>
        )}
      </div>
      )}
    </div>
  );
}
