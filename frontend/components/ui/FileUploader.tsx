// components/ui/FileUploader.tsx
'use client';
import { useCallback, useState, DragEvent, ChangeEvent } from 'react';
import { UploadCloud, FileImage, X } from 'lucide-react';

interface Props {
  onFileSelect: (file: File | null) => void;
  error?: string;
}

export default function FileUploader({ onFileSelect, error }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const processFile = useCallback((file: File | null) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png'].includes(file.type)) return;
    setFileName(file.name);
    setPreview(URL.createObjectURL(file));
    onFileSelect(file);
  }, [onFileSelect]);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0] ?? null;
    processFile(file);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    processFile(e.target.files?.[0] ?? null);
  };

  const clear = () => {
    setPreview(null);
    setFileName(null);
    onFileSelect(null);
  };

  return (
    <div className="space-y-1">
      <label className="block text-sm font-bold text-stone-700">
        Foto do Documento (JPG ou PNG)
      </label>

      {preview ? (
        <div className="relative rounded-xl overflow-hidden border-2 border-leaf">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="preview" className="w-full h-40 object-cover" />
          <div className="absolute inset-0 bg-black/30 flex items-end p-3">
            <span className="text-white text-xs font-semibold flex-1 truncate">{fileName}</span>
          </div>
          <button
            type="button"
            onClick={clear}
            className="absolute top-2 right-2 bg-white/90 rounded-full p-1 hover:bg-white transition-colors"
          >
            <X className="w-4 h-4 text-stone-700" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            dragging
              ? 'border-leaf bg-leaf/10'
              : error
              ? 'border-red-400 bg-red-50'
              : 'border-stone-300 hover:border-leaf hover:bg-leaf/5'
          }`}
        >
          <input
            type="file"
            accept="image/jpeg,image/png"
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            onChange={handleChange}
          />
          <div className="flex flex-col items-center gap-3 pointer-events-none">
            {dragging ? (
              <FileImage className="w-10 h-10 text-leaf" />
            ) : (
              <UploadCloud className="w-10 h-10 text-stone-400" />
            )}
            <div>
              <p className="font-semibold text-stone-700 text-sm">
                {dragging ? 'Solte o arquivo aqui' : 'Arraste ou clique para enviar'}
              </p>
              <p className="text-xs text-stone-400 mt-1">JPG ou PNG · máx. 5MB</p>
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}