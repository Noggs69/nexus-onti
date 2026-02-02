import React, { useState } from 'react';
import { Search, X, Image, File, Video } from 'lucide-react';

interface ChatSearchProps {
  conversationId: string;
  onClose: () => void;
}

export function ChatSearch({ conversationId, onClose }: ChatSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'messages' | 'media' | 'files'>('messages');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (term.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    // TODO: Implementar búsqueda en la base de datos usando full-text search
    // Por ahora solo simulamos
    setTimeout(() => {
      setSearchResults([]);
      setLoading(false);
    }, 500);
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Buscar en el chat</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-full transition"
        >
          <X size={20} className="text-gray-600" />
        </button>
      </div>

      {/* Search input */}
      <div className="p-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Buscar mensajes..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('messages')}
          className={`flex-1 py-2 text-sm font-medium ${
            activeTab === 'messages'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Mensajes
        </button>
        <button
          onClick={() => setActiveTab('media')}
          className={`flex-1 py-2 text-sm font-medium ${
            activeTab === 'media'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Multimedia
        </button>
        <button
          onClick={() => setActiveTab('files')}
          className={`flex-1 py-2 text-sm font-medium ${
            activeTab === 'files'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Archivos
        </button>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : activeTab === 'messages' ? (
          searchResults.length > 0 ? (
            <div className="space-y-2">
              {searchResults.map((result) => (
                <div
                  key={result.id}
                  className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition"
                >
                  <p className="text-sm text-gray-900">{result.content}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(result.created_at).toLocaleString('es-ES')}
                  </p>
                </div>
              ))}
            </div>
          ) : searchTerm.length > 0 ? (
            <div className="text-center text-gray-500 text-sm">
              No se encontraron resultados
            </div>
          ) : (
            <div className="text-center text-gray-400 text-sm">
              Escribe para buscar
            </div>
          )
        ) : activeTab === 'media' ? (
          <div className="grid grid-cols-3 gap-2">
            {/* TODO: Mostrar galería de imágenes y videos */}
            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
              <Image size={24} className="text-gray-400" />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {/* TODO: Mostrar lista de archivos */}
            <div className="text-center text-gray-400 text-sm">
              No hay archivos compartidos
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
