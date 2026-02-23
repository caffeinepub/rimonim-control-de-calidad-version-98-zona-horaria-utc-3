import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useCamera } from '../camera/useCamera';
import { useRegistrarControl, useObtenerEmpacadoresActivos, useObtenerControladoresActivos, useObtenerProximoIdentificador } from '../hooks/useQueries';
import { Defecto, DefectoCantidad } from '../backend';
import { Camera, CheckCircle, AlertCircle, Package, Scale, UserCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

const DEFECTO_LABELS: Record<Defecto, string> = {
  [Defecto.raset]: 'Raset',
  [Defecto.cracking]: 'Cracking',
  [Defecto.golpeSol]: 'Golpe de sol',
  [Defecto.podredumbre]: 'Podredumbre',
};

// Helper function to compress image
async function compressImage(file: File, maxSizeMB: number = 1, quality: number = 0.85): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        const maxDimension = 1920;
        if (width > height && width > maxDimension) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        } else if (height > maxDimension) {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas to Blob conversion failed'));
              return;
            }

            // Check if compressed size is acceptable
            const compressedSizeMB = blob.size / (1024 * 1024);
            if (compressedSizeMB <= maxSizeMB) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              // If still too large, try with lower quality
              const newQuality = Math.max(0.5, quality - 0.1);
              if (newQuality < quality) {
                canvas.toBlob(
                  (blob2) => {
                    if (!blob2) {
                      reject(new Error('Canvas to Blob conversion failed'));
                      return;
                    }
                    const compressedFile = new File([blob2], file.name, {
                      type: 'image/jpeg',
                      lastModified: Date.now(),
                    });
                    resolve(compressedFile);
                  },
                  'image/jpeg',
                  newQuality
                );
              } else {
                resolve(file);
              }
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('Image load failed'));
    };
    reader.onerror = () => reject(new Error('File read failed'));
  });
}

export default function RegistroControl() {
  const [cantidadMuestras, setCantidadMuestras] = useState<string>('');
  const [empacadorId, setEmpacadorId] = useState<string>('');
  const [controladorId, setControladorId] = useState<string>('');
  const [dentroRangoPeso, setDentroRangoPeso] = useState<string>('');
  const [defectos, setDefectos] = useState<Record<Defecto, string>>({
    [Defecto.raset]: '0',
    [Defecto.cracking]: '0',
    [Defecto.golpeSol]: '0',
    [Defecto.podredumbre]: '0',
  });
  const [capturedPhoto, setCapturedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  const { data: empacadores, isLoading: isLoadingEmpacadores } = useObtenerEmpacadoresActivos();
  const { data: controladores, isLoading: isLoadingControladores } = useObtenerControladoresActivos();
  const { data: proximoIdentificador, isLoading: isLoadingIdentificador } = useObtenerProximoIdentificador();
  const registrarMutation = useRegistrarControl();

  const {
    isActive: isCameraActive,
    isSupported: isCameraSupported,
    error: cameraError,
    isLoading: isCameraLoading,
    startCamera,
    stopCamera,
    capturePhoto,
    videoRef,
    canvasRef,
  } = useCamera({
    facingMode: 'environment',
    width: 1920,
    height: 1080,
    quality: 0.85,
    format: 'image/jpeg',
  });

  useEffect(() => {
    if (showCamera && !isCameraActive && !isCameraLoading) {
      startCamera();
    }
  }, [showCamera]);

  const handleOpenCamera = async () => {
    setShowCamera(true);
  };

  const handleCloseCamera = async () => {
    await stopCamera();
    setShowCamera(false);
  };

  const handleCapturePhoto = async () => {
    const photo = await capturePhoto();
    if (photo) {
      try {
        // Compress the image before storing
        const compressedPhoto = await compressImage(photo, 1, 0.85);
        const originalSizeMB = (photo.size / (1024 * 1024)).toFixed(2);
        const compressedSizeMB = (compressedPhoto.size / (1024 * 1024)).toFixed(2);
        
        console.log(`Image compressed: ${originalSizeMB}MB → ${compressedSizeMB}MB`);
        
        setCapturedPhoto(compressedPhoto);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotoPreview(reader.result as string);
        };
        reader.readAsDataURL(compressedPhoto);
        await handleCloseCamera();
        toast.success(`Foto capturada y comprimida (${compressedSizeMB}MB)`);
      } catch (error) {
        console.error('Error compressing image:', error);
        toast.error('Error al comprimir la imagen');
      }
    }
  };

  const handleDefectoChange = (defecto: Defecto, value: string) => {
    if (value === '') {
      setDefectos(prev => ({ ...prev, [defecto]: '' }));
    } else {
      const numValue = parseInt(value);
      if (!isNaN(numValue) && numValue >= 0) {
        setDefectos(prev => ({ ...prev, [defecto]: numValue.toString() }));
      }
    }
  };

  const handleDefectoBlur = (defecto: Defecto) => {
    if (defectos[defecto] === '') {
      setDefectos(prev => ({ ...prev, [defecto]: '0' }));
    }
  };

  const handleDefectoFocus = (defecto: Defecto) => {
    if (defectos[defecto] === '0') {
      setDefectos(prev => ({ ...prev, [defecto]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!capturedPhoto) {
      toast.error('Debes tomar una foto para continuar');
      return;
    }

    if (!empacadorId) {
      toast.error('Debes seleccionar un empacador');
      return;
    }

    if (!controladorId) {
      toast.error('Debes seleccionar un controlador');
      return;
    }

    if (!dentroRangoPeso) {
      toast.error('Debes indicar si está dentro del rango de peso');
      return;
    }

    const cantidad = parseInt(cantidadMuestras);
    if (isNaN(cantidad) || cantidad <= 0) {
      toast.error('La cantidad de muestras debe ser mayor a 0');
      return;
    }

    const defectosArray: DefectoCantidad[] = Object.entries(defectos)
      .map(([defecto, cantidad]) => ({
        defecto: defecto as Defecto,
        cantidad: BigInt(parseInt(cantidad) || 0),
      }))
      .filter(d => Number(d.cantidad) > 0);

    const totalDefectos = defectosArray.reduce((sum, d) => sum + Number(d.cantidad), 0);
    if (totalDefectos > cantidad) {
      toast.error('La suma de defectos no puede exceder la cantidad de muestras');
      return;
    }

    try {
      const result = await registrarMutation.mutateAsync({
        defectos: defectosArray,
        foto: capturedPhoto,
        cantidadMuestras: cantidad,
        empacadorId,
        controladorId,
        dentroRangoPeso: dentroRangoPeso === 'si',
      });

      toast.success(`Control registrado exitosamente: ${result.sampleTime}`);

      // Reset form
      setCantidadMuestras('');
      setEmpacadorId('');
      setControladorId('');
      setDentroRangoPeso('');
      setDefectos({
        [Defecto.raset]: '0',
        [Defecto.cracking]: '0',
        [Defecto.golpeSol]: '0',
        [Defecto.podredumbre]: '0',
      });
      setCapturedPhoto(null);
      setPhotoPreview(null);
    } catch (error: any) {
      console.error('Error registrando control:', error);
      toast.error(error?.message || 'Error al registrar el control');
    }
  };

  if (isLoadingEmpacadores || isLoadingControladores) {
    return (
      <div className="min-h-screen bg-white">
        <div className="w-full py-4 sm:py-6 md:py-8 px-3 sm:px-4">
          <div className="space-y-4 sm:space-y-6">
            <Skeleton className="h-24 sm:h-32 w-full" />
            <Skeleton className="h-64 sm:h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="w-full py-4 sm:py-6 md:py-8 px-3 sm:px-4">
        <div className="mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-black">Registro de Control de Calidad</h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">Variedad: Wonderful • Zona horaria: UTC-3</p>
        </div>

        {/* Next Identifier Preview */}
        {!isLoadingIdentificador && proximoIdentificador && (
          <Alert className="mb-4 sm:mb-6 bg-primary/5 border-primary/20">
            <AlertCircle className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm text-black ml-2">
              <strong>Próximo identificador:</strong> {proximoIdentificador} (UTC-3)
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Camera Section */}
          <Card className="bg-white border-gray-200">
            <CardHeader className="px-3 sm:px-4 md:px-6 py-4 sm:py-5">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-black">
                <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
                Fotografía (Obligatorio)
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-gray-600">
                Capture una foto de la muestra para el registro
              </CardDescription>
            </CardHeader>
            <CardContent className="px-3 sm:px-4 md:px-6 pb-4 sm:pb-6">
              {!showCamera && !photoPreview && (
                <Button
                  type="button"
                  onClick={handleOpenCamera}
                  className="w-full bg-primary hover:bg-primary/90 text-white"
                  disabled={isCameraSupported === false}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  {isCameraSupported === false ? 'Cámara no disponible' : 'Abrir Cámara'}
                </Button>
              )}

              {showCamera && (
                <div className="space-y-4">
                  <div className="relative w-full bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9', minHeight: '300px' }}>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                  </div>

                  {cameraError && (
                    <Alert className="bg-red-50 border-red-200">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-sm text-red-800 ml-2">
                        <strong>Error de cámara:</strong> {cameraError.message}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={handleCapturePhoto}
                      disabled={!isCameraActive || isCameraLoading}
                      className="flex-1 bg-primary hover:bg-primary/90 text-white"
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      Capturar Foto
                    </Button>
                    <Button
                      type="button"
                      onClick={handleCloseCamera}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}

              {photoPreview && !showCamera && (
                <div className="space-y-4">
                  <div className="relative w-full bg-black rounded-lg overflow-hidden">
                    <img
                      src={photoPreview}
                      alt="Foto capturada"
                      className="w-full h-auto"
                      loading="lazy"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleOpenCamera}
                    variant="outline"
                    className="w-full"
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Tomar Nueva Foto
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sample Details */}
          <Card className="bg-white border-gray-200">
            <CardHeader className="px-3 sm:px-4 md:px-6 py-4 sm:py-5">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-black">
                <Package className="h-4 w-4 sm:h-5 sm:w-5" />
                Detalles de la Muestra
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-4 md:px-6 pb-4 sm:pb-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cantidadMuestras" className="text-sm font-medium text-black">
                  Cantidad de Muestras (Frutas) *
                </Label>
                <Input
                  id="cantidadMuestras"
                  type="number"
                  min="1"
                  value={cantidadMuestras}
                  onChange={(e) => setCantidadMuestras(e.target.value)}
                  placeholder="Ej: 50"
                  required
                  className="bg-white border-gray-300 text-black"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="empacador" className="text-sm font-medium text-black">
                  Empacador *
                </Label>
                <Select value={empacadorId} onValueChange={setEmpacadorId} required>
                  <SelectTrigger id="empacador" className="bg-white border-gray-300 text-black">
                    <SelectValue placeholder="Seleccione un empacador" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {empacadores?.map((empacador) => (
                      <SelectItem key={empacador.id} value={empacador.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: empacador.color }}
                          />
                          {empacador.identificador}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="controlador" className="text-sm font-medium text-black flex items-center gap-1">
                  <UserCheck className="h-4 w-4" />
                  Controlador *
                </Label>
                <Select value={controladorId} onValueChange={setControladorId} required>
                  <SelectTrigger id="controlador" className="bg-white border-gray-300 text-black">
                    <SelectValue placeholder="Seleccione un controlador" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {controladores?.map((controlador) => (
                      <SelectItem key={controlador.id} value={controlador.id}>
                        {controlador.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dentroRangoPeso" className="text-sm font-medium text-black flex items-center gap-1">
                  <Scale className="h-4 w-4" />
                  Dentro de Rango de Peso *
                </Label>
                <Select value={dentroRangoPeso} onValueChange={setDentroRangoPeso} required>
                  <SelectTrigger id="dentroRangoPeso" className="bg-white border-gray-300 text-black">
                    <SelectValue placeholder="Seleccione una opción" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="si">Sí</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Defects */}
          <Card className="bg-white border-gray-200">
            <CardHeader className="px-3 sm:px-4 md:px-6 py-4 sm:py-5">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-black">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                Defectos Encontrados
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-gray-600">
                Ingrese la cantidad de frutas con cada tipo de defecto (0 si no hay)
              </CardDescription>
            </CardHeader>
            <CardContent className="px-3 sm:px-4 md:px-6 pb-4 sm:pb-6 space-y-4">
              {Object.entries(DEFECTO_LABELS).map(([defecto, label]) => (
                <div key={defecto} className="space-y-2">
                  <Label htmlFor={defecto} className="text-sm font-medium text-black">
                    {label}
                  </Label>
                  <Input
                    id={defecto}
                    type="number"
                    min="0"
                    value={defectos[defecto as Defecto]}
                    onChange={(e) => handleDefectoChange(defecto as Defecto, e.target.value)}
                    onFocus={() => handleDefectoFocus(defecto as Defecto)}
                    onBlur={() => handleDefectoBlur(defecto as Defecto)}
                    className="bg-white border-gray-300 text-black"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={registrarMutation.isPending || !capturedPhoto}
            className="w-full bg-primary hover:bg-primary/90 text-white py-6 text-base font-semibold"
          >
            {registrarMutation.isPending ? (
              <>Registrando...</>
            ) : (
              <>
                <CheckCircle className="mr-2 h-5 w-5" />
                Registrar Control
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
