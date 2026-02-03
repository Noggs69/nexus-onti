import React, { useState, useEffect } from 'react';
import { supabase, ProductVideo } from '../lib/supabase';
import { Video, X, Send, Image } from 'lucide-react';

interface VideoSelectorModalProps {
  productId: string;
  productName: string;
  onSendVideo: (videoUrl: string, videoName: string) => void;
  onClose: () => void;
}

export function VideoSelectorModal({ productId, productName, onSendVideo, onClose }: VideoSelectorModalProps) {
  const [videos, setVideos] = useState<ProductVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<ProductVideo | null>(null);

  useEffect(() => {
    loadVideos();
  }, [productId]);

  async function loadVideos() {
    try {
      const { data, error } = await supabase
        .from('product_videos')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleSend() {
    if (!selectedVideo) return;
    onSendVideo(selectedVideo.video_url, selectedVideo.video_name);
    onClose();
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Image size={20} />
              Enviar Video/Foto del Producto
            </h3>
            <p className="text-sm text-gray-600 mt-1">{productName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-8">
              <Image size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                No hay archivos disponibles para este producto.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Sube videos o imágenes desde la sección de Gestión de Productos.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {videos.map((video) => {
                const isImage = video.video_name.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                
                return (
                <button
                  key={video.id}
                  onClick={() => setSelectedVideo(video)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition ${
                    selectedVideo?.id === video.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Preview miniatura */}
                    <div className="flex-shrink-0">
                      {isImage ? (
                        <img
                          src={video.video_url}
                          alt={video.video_name}
                          className="w-20 h-20 object-contain rounded-lg bg-gray-100"
                        />
                      ) : (
                        <video
                          src={video.video_url}
                          className="w-20 h-20 object-contain rounded-lg bg-gray-900"
                          preload="metadata"
                        />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        {isImage ? (
                          <Image size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                        ) : (
                          <Video size={16} className="text-purple-600 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{video.video_name}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                            <span>{formatFileSize(video.video_size)}</span>
                            <span>•</span>
                            <span>{new Date(video.created_at).toLocaleDateString('es-ES')}</span>
                          </div>
                          {video.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{video.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {selectedVideo?.id === video.id && (
                      <div className="text-blue-600 font-semibold text-xl">✓</div>
                    )}
                  </div>
                </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSend}
            disabled={!selectedVideo}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition"
          >
            <Send size={18} />
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
