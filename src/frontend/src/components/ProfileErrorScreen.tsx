import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, LogOut } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';

interface ProfileErrorScreenProps {
  error?: Error;
}

export default function ProfileErrorScreen({ error }: ProfileErrorScreenProps) {
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-white border-gray-200 shadow-lg">
          <CardHeader className="px-4 sm:px-6 py-5">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl text-black">
              <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-destructive" />
              Error de Perfil
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-gray-600">
              No se pudo cargar su perfil de usuario
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-6 space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs sm:text-sm">
                {error?.message || 'Ocurrió un error al cargar su perfil. Por favor, intente iniciar sesión nuevamente.'}
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full h-11 sm:h-12 text-sm sm:text-base"
              size="lg"
            >
              <LogOut className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Volver a iniciar sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
