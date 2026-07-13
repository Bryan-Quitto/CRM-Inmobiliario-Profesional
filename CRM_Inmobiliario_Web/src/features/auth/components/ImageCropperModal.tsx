import React, { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { X, Crop, Loader2 } from 'lucide-react';
import { getCroppedImg } from '../utils/cropImage';

import type { Area } from 'react-easy-crop';

interface ImageCropperModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string | null;
  onCropComplete: (croppedBlob: Blob) => void;
  isProcessing?: boolean;
  aspectRatio?: number;
  cropShape?: 'rect' | 'round';
  title?: string;
  allowRatioSelection?: boolean;
}

const RATIO_PRESETS = [
  { label: 'Cuadrado (1:1)', value: 1, shape: 'rect' as const },
  { label: 'Círculo (1:1)', value: 1, shape: 'round' as const },
  { label: 'Apaisado (3:1)', value: 3, shape: 'rect' as const },
  { label: 'Banner (16:9)', value: 16/9, shape: 'rect' as const },
  { label: 'Horizontal (4:3)', value: 4/3, shape: 'rect' as const }
];

const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  isOpen,
  onClose,
  imageSrc,
  onCropComplete,
  isProcessing = false,
  aspectRatio = 1,
  cropShape = 'round',
  title = 'Ajustar foto',
  allowRatioSelection = false
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const [activeAspect, setActiveAspect] = useState(aspectRatio);
  const [activeShape, setActiveShape] = useState(cropShape);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveAspect(aspectRatio);
      setActiveShape(cropShape);
    }
  }, [isOpen, aspectRatio, cropShape]);

  const onCropCompleteHandler = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, activeShape);
      if (croppedImage) {
        onCropComplete(croppedImage);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-800">
            <Crop className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-lg">{title}</h3>
          </div>
          <button 
            onClick={onClose}
            disabled={isProcessing}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cropper Container */}
        <div className="relative w-full h-64 sm:h-80 bg-slate-100">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={activeAspect}
            cropShape={activeShape}
            showGrid={false}
            onCropChange={setCrop}
            onCropComplete={onCropCompleteHandler}
            onZoomChange={setZoom}
          />
        </div>

        {/* Controls & Actions */}
        <div className="p-4 sm:p-6 bg-white space-y-6 overflow-y-auto">
          {allowRatioSelection && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">Formato de Recorte</span>
              <div className="flex flex-col items-center gap-2 w-full">
                {/* Primera fila: 3 opciones */}
                <div className="flex flex-wrap justify-center gap-2 w-full">
                  {RATIO_PRESETS.slice(0, 3).map(preset => (
                    <button
                      key={preset.label}
                      onClick={() => {
                        setActiveAspect(preset.value);
                        setActiveShape(preset.shape);
                      }}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                        activeAspect === preset.value && activeShape === preset.shape
                          ? 'bg-indigo-600 text-white shadow-sm' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                {/* Segunda fila: 2 opciones */}
                <div className="flex flex-wrap justify-center gap-2 w-full">
                  {RATIO_PRESETS.slice(3, 5).map(preset => (
                    <button
                      key={preset.label}
                      onClick={() => {
                        setActiveAspect(preset.value);
                        setActiveShape(preset.shape);
                      }}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                        activeAspect === preset.value && activeShape === preset.shape
                          ? 'bg-indigo-600 text-white shadow-sm' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">Zoom</span>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={isProcessing}
              className="px-6 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-70 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                'Recortar y Subir'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCropperModal;
