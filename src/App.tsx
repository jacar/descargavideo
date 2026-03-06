import React, { useState } from "react";
import { Download, Link as LinkIcon, Video, Music, Loader2, AlertCircle, CheckCircle2, Github } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface VideoFormat {
  quality: string;
  container: string;
  itag: number;
}

interface VideoInfo {
  title: string;
  thumbnail: string;
  duration: string;
  author: string;
  formats: VideoFormat[];
  audioFormats: any[];
}

export default function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [downloading, setDownloading] = useState(false);

  const fetchVideoInfo = async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    setVideoInfo(null);

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
      const response = await fetch(`${backendUrl}/api/info?url=${encodeURIComponent(url)}`);
      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.details ? `${data.error}: ${data.details}` : (data.error || "Failed to fetch video info");
        throw new Error(errorMsg);
      }

      setVideoInfo(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (format: 'mp4' | 'mp3', itag?: number) => {
    if (!url || !videoInfo) return;

    setDownloading(true);
    const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
    const downloadUrl = `${backendUrl}/api/download?url=${encodeURIComponent(url)}&format=${format}&title=${encodeURIComponent(videoInfo.title)}${itag ? `&itag=${itag}` : ''}`;

    // Create a temporary link and click it to trigger download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', '');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Reset downloading state after a short delay
    setTimeout(() => setDownloading(false), 2000);
  };

  const formatDuration = (seconds: string) => {
    const s = parseInt(seconds);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const rs = s % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${rs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-emerald-500/30">
      {/* Navbar */}
      <nav className="border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Download className="w-5 h-5 text-black" />
            </div>
            <span className="font-bold text-xl tracking-tight">StreamDown</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
            <a href="#" className="hover:text-white transition-colors">How it works</a>
            <a href="#" className="hover:text-white transition-colors">Supported Sites</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
          </div>
          <button className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <Github className="w-5 h-5 text-white/60" />
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-20">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent"
          >
            Descarga cualquier video. <br />
            En segundos.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-white/40 text-lg md:text-xl max-w-2xl mx-auto"
          >
            Pega el enlace de YouTube abajo para descargar videos en alta calidad (MP4) o solo el audio (MP3). Sin anuncios, sin complicaciones.
          </motion.p>
        </div>

        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="relative group mb-12"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative flex flex-col md:flex-row gap-3 bg-neutral-900 border border-white/10 p-2 rounded-2xl shadow-2xl">
            <div className="flex-1 flex items-center px-4 gap-3">
              <LinkIcon className="w-5 h-5 text-white/30" />
              <input
                type="text"
                placeholder="Pega el link de YouTube aquí..."
                className="w-full bg-transparent border-none focus:ring-0 text-white placeholder:text-white/20 py-4"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchVideoInfo()}
              />
              {url && (
                <button
                  onClick={() => setUrl("")}
                  className="p-1 hover:bg-white/10 rounded-full transition-colors text-white/30 hover:text-white"
                >
                  <AlertCircle className="w-4 h-4 rotate-45" />
                </button>
              )}
            </div>
            <button
              onClick={fetchVideoInfo}
              disabled={loading || !url}
              className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/50 disabled:cursor-not-allowed text-black font-bold px-8 py-4 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Analizar"}
            </button>
          </div>
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tip for restricted videos */}
        {error && (error.includes("403") || error.includes("bot")) && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-white/20 text-center mb-8 px-4"
          >
            {error.includes("bot")
              ? "YouTube ha detectado tráfico automatizado. Esto sucede a veces debido a las protecciones de Google. Intenta de nuevo en unos minutos o con un video diferente."
              : error.includes("parsing watch.html")
                ? "YouTube ha actualizado su diseño y el motor de descarga necesita una actualización. Estamos trabajando en ello. Por favor, intenta con otro video o vuelve más tarde."
                : "Tip: Algunos videos están restringidos por YouTube. Intenta con otro enlace o asegúrate de que el video sea público."}
          </motion.p>
        )}

        {/* Video Info Card */}
        <AnimatePresence>
          {videoInfo && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-neutral-900/50 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-sm"
            >
              <div className="flex flex-col md:flex-row">
                <div className="md:w-2/5 relative aspect-video md:aspect-auto">
                  <img
                    src={videoInfo.thumbnail}
                    alt={videoInfo.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur px-2 py-1 rounded text-xs font-mono">
                    {formatDuration(videoInfo.duration)}
                  </div>
                </div>
                <div className="md:w-3/5 p-8 flex flex-col justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-2 line-clamp-2">{videoInfo.title}</h2>
                    <p className="text-white/40 text-sm mb-6 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {videoInfo.author}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {videoInfo.formats && videoInfo.formats.length > 0 ? (
                      <>
                        <button
                          onClick={() => handleDownload('mp4')}
                          disabled={downloading}
                          className="flex items-center justify-center gap-3 bg-white text-black font-bold py-4 rounded-2xl hover:bg-neutral-200 transition-colors active:scale-95 disabled:opacity-50"
                        >
                          <Video className="w-5 h-5" />
                          Descargar MP4
                        </button>
                        <button
                          onClick={() => handleDownload('mp3')}
                          disabled={downloading}
                          className="flex items-center justify-center gap-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold py-4 rounded-2xl hover:bg-emerald-500/20 transition-colors active:scale-95 disabled:opacity-50"
                        >
                          <Music className="w-5 h-5" />
                          Descargar MP3
                        </button>
                      </>
                    ) : (
                      <div className="col-span-2 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-500 text-sm text-center">
                        No se pudieron obtener los enlaces de descarga directa debido a cambios en YouTube. Intenta con otro video.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Formats List (Optional/Advanced) */}
              {videoInfo.formats && videoInfo.formats.length > 0 && (
                <div className="border-t border-white/5 p-6 bg-black/20">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white/20 mb-4">Formatos Disponibles</h3>
                  <div className="flex flex-wrap gap-2">
                    {videoInfo.formats.filter(f => f.quality).map((format, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleDownload('mp4', format.itag)}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-xs font-medium transition-colors"
                      >
                        {format.quality} ({format.container})
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Features Grid */}
        {!videoInfo && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
            {[
              { icon: CheckCircle2, title: "Alta Calidad", desc: "Soporta descargas hasta 4K dependiendo de la fuente." },
              { icon: Music, title: "Audio Puro", desc: "Extrae el audio en la mejor calidad posible para tus dispositivos." },
              { icon: Download, title: "Sin Límites", desc: "Descarga tantos videos como quieras, totalmente gratis." }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + (i * 0.1) }}
                className="p-6 rounded-2xl bg-white/5 border border-white/5"
              >
                <feature.icon className="w-8 h-8 text-emerald-500 mb-4" />
                <h3 className="font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-white/5 text-center text-white/20 text-sm">
        <p>&copy; 2024 StreamDown. Hecho con ❤️ para la web abierta.</p>
      </footer>

      {/* Downloading Toast */}
      <AnimatePresence>
        {downloading && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-emerald-500 text-black px-6 py-3 rounded-full font-bold shadow-2xl flex items-center gap-3 z-[100]"
          >
            <Loader2 className="w-5 h-5 animate-spin" />
            Iniciando descarga...
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
