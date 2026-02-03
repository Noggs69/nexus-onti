import React, { useState, useEffect, useRef } from 'react';
import { supabase, ProductVideo } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Video, Upload, Trash2, X, Loader } from 'lucide-react';

interface ProductVideosManagerProps {
  productId: string;
  productName: string;
}

export function ProductVideosManager({ productId, productName }: ProductVideosManagerProps) {
  const { user } = useAuth();
  const [videos, setVideos] = useState<ProductVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  async function handleUpload() {
    if (!selectedFile || !user) return;

    setUploading(true);
    try {
      // Subir video a Supabase Storage
      const fileExt = selectedFile.name.split('.').pop()?.toLowerCase();
      const fileName = `product-videos/${productId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat-files')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('chat-files')
        .getPublicUrl(fileName);

      // Guardar en base de datos
      const { error: dbError } = await supabase
        .from('product_videos')
        .insert({
          product_id: productId,
          video_url: publicUrl,
          video_name: selectedFile.name,
          video_size: selectedFile.size,
          description: description || null,
          uploaded_by: user.id
        });

      if (dbError) throw dbError;

      // Limpiar y recargar
      setSelectedFile(null);
      setDescription('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      await loadVideos();
      
      alert('Video subido correctamente');
    } catch (error) {
      console.error('Error uploading video:', error);
      alert('Error al subir el video');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(videoId: string, videoUrl: string) {
    if (!confirm('¿Eliminar este video? Esta acción no se puede deshacer.')) return;

    try {
      // Extraer nombre del archivo de la URL
      const urlParts = videoUrl.split('/');
      const fileName = urlParts.slice(-3).join('/'); // product-videos/id/filename

      // Eliminar de Storage
      await supabase.storage
        .from('chat-files')
        .remove([fileName]);

      // Eliminar de base de datos
      const { error } = await supabase
        .from('product_videos')
        .delete()
        .eq('id', videoId);

      if (error) throw error;

      await loadVideos();
    } catch (error) {
      console.error('Error deleting video:', error);
      alert('Error al eliminar el video');
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Video size={20} />
        Videos Privados - {productName}
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Estos videos solo son visibles para proveedores. Puedes enviarlos a clientes desde el chat.
      </p>

      {/* Formulario de subida */}
      <div className="bg-white rounded-lg p-4 mb-4 border-2 border-dashed border-gray-300">
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
          className="hidden"
        />
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition mb-3"
        >
          <Upload size={20} />
          {selectedFile ? selectedFile.name : 'Seleccionar video'}
        </button>

        {selectedFile && (
          <>
            <input
              type="text"
              placeholder="Descripción opcional"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3"
            />
            
            <div className="flex gap-2">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader className="animate-spin" size={18} />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    Subir Video
                  </>
                )}
              </button>
              
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setDescription('');
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                disabled={uploading}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Lista de videos */}
      <div className="space-y-3">
        {videos.length === 0 ? (
          <p className="text-center text-gray-500 py-4">
            No hay videos subidos para este producto
          </p>
        ) : (
          videos.map((video) => (
            <div
              key={video.id}
              className="bg-white rounded-lg p-4 flex items-center justify-between border border-gray-200"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Video size={20} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{video.video_name}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                    <span>{formatFileSize(video.video_size)}</span>
                    <span>•</span>
                    <span>{new Date(video.created_at).toLocaleDateString('es-ES')}</span>
                  </div>
                  {video.description && (
                    <p className="text-sm text-gray-600 mt-1">{video.description}</p>
                  )}
                </div>
              </div>
              
              <button
                onClick={() => handleDelete(video.id, video.video_url)}
                className="ml-3 text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition"
                title="Eliminar video"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
