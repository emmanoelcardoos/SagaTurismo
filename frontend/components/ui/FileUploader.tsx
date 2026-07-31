// components/ui/FileUploader.tsx
'use client';
import { useCallback, useState, DragEvent, ChangeEvent } from 'react';
import { UploadCloud, FileImage, FileText, X } from 'lucide-react'; // Adicionámos FileText para o ícone de PDF

interface Props {
  onFileSelect: (file: File | null) => void;
  error?: string;
  accept?: string; // ◄── Agora o componente aceita formatos dinâmicos
}

export default function FileUploader({ onFileSelect, error, accept = 'image/jpeg, image/png' }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const processFile = useCallback((file: File | null) => {
    if (!file) return;
    
    // ◄── Validação dinâmica baseada na propriedade 'accept' passada pelo page.tsx
    const isAccepted = accept.includes(file.type);
    if (!isAccepted) {
      alert(`Formato inválido. Formatos aceites: ${accept}`);
      return;
    }

    setFileName(file.name);
    setPreview(URL.createObjectURL(file));
    onFileSelect(file);
  }, [onFileSelect, accept]);

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

  // Verifica se o ficheiro atual ou o accept permitem PDF para mudar os ícones/textos
  const isPdfFile = fileName?.toLowerCase().endsWith('.pdf') || fileName?.toLowerCase().endsWith('.pdf');
  const allowsPdf = accept.includes('pdf');

  return (
    <div className="space-y-1">
      {/* ◄── Removi a label rígida "Foto do Documento", pois o teu page.tsx já tem labels melhores acima do componente */}

      {preview ? (
        <div className="relative rounded-xl overflow-hidden border-2 border-slate-300 h-40 bg-slate-50 flex items-center justify-center">
          
          {/* ◄── Lógica para mostrar a imagem OU um ícone de PDF se for documento */}
          {isPdfFile ? (
            <div className="flex flex-col items-center text-slate-500">
              <FileText className="w-12 h-12 mb-2 text-[#00577C]" />
              <span className="text-sm font-semibold">Documento PDF Anexado</span>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="preview" className="w-full h-full object-cover" />
          )}

          <div className="absolute inset-x-0 bottom-0 bg-black/50 flex items-end p-3">
            <span className="text-white text-xs font-semibold flex-1 truncate">{fileName}</span>
          </div>
          <button
            type="button"
            onClick={clear}
            className="absolute top-2 right-2 bg-white/90 rounded-full p-1 hover:bg-white transition-colors"
          >
            <X className="w-4 h-4 text-slate-700" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            dragging
              ? 'border-[#00577C] bg-blue-50/50'
              : error
              ? 'border-red-400 bg-red-50'
              : 'border-slate-300 hover:border-[#00577C] hover:bg-slate-50'
          }`}
        >
          <input
            type="file"
            accept={accept} // ◄── Agora o HTML respeita o accept que passamos
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            onChange={handleChange}
          />
          <div className="flex flex-col items-center gap-3 pointer-events-none">
            {dragging ? (
              <FileImage className="w-10 h-10 text-[#00577C]" />
            ) : (
              <UploadCloud className="w-10 h-10 text-slate-400" />
            )}
            <div>
              <p className="font-semibold text-slate-700 text-sm">
                {dragging ? 'Solte o arquivo aqui' : 'Arraste ou clique para enviar'}
              </p>
              {/* ◄── Texto descritivo dinâmico */}
              <p className="text-xs text-slate-400 mt-1">
                {allowsPdf ? 'PDF, JPG ou PNG' : 'Apenas JPG ou PNG'} · máx. 5MB
              </p>
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-500 font-bold mt-1">{error}</p>}
    </div>
  );
}