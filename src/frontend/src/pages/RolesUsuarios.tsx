import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { UserCog, Save, AlertCircle, Shield, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { UserRole } from '../backend';
import { useGetAllUserRoles, useAssignUserRole } from '../hooks/useQueries';
import { Principal } from '@icp-sdk/core/principal';

const roleLabels: Record<UserRole, string> = {
  [UserRole.admin]: 'Administrador',
  [UserRole.user]: 'Carga',
  [UserRole.guest]: 'Solo lectura',
};

const roleColors: Record<UserRole, 'default' | 'secondary' | 'destructive'> = {
  [UserRole.admin]: 'destructive',
  [UserRole.user]: 'default',
  [UserRole.guest]: 'secondary',
};

const roleDescriptions: Record<UserRole, string> = {
  [UserRole.admin]: 'Acceso completo: registro, reportes, configuración, usuarios y roles',
  [UserRole.user]: 'Puede registrar controles y ver reportes e historial',
  [UserRole.guest]: 'Solo puede visualizar reportes e historial',
};

export default function RolesUsuarios() {
  const { data: users = [], isLoading, isError } = useGetAllUserRoles();
  const [pendingChanges, setPendingChanges] = useState<Map<string, UserRole>>(new Map());
  const assignUserRole = useAssignUserRole();

  const handleRoleChange = (principalStr: string, newRole: UserRole) => {
    const newChanges = new Map(pendingChanges);
    newChanges.set(principalStr, newRole);
    setPendingChanges(newChanges);
  };

  const handleSaveChanges = async () => {
    if (pendingChanges.size === 0) {
      toast.info('No hay cambios para guardar');
      return;
    }

    const changes = Array.from(pendingChanges.entries());
    let successCount = 0;
    let errorCount = 0;

    for (const [principalStr, role] of changes) {
      try {
        const principal = Principal.fromText(principalStr);
        await assignUserRole.mutateAsync({ user: principal, role });
        successCount++;
      } catch (error: any) {
        console.error(`Error al actualizar rol para ${principalStr}:`, error);
        errorCount++;
        
        const errorMessage = error?.message || 'Error desconocido';
        toast.error(`Error al actualizar usuario`, {
          description: errorMessage,
        });
      }
    }

    if (successCount > 0) {
      setPendingChanges(new Map());
      
      toast.success('Roles actualizados correctamente', {
        description: `Se actualizaron ${successCount} usuario(s)${errorCount > 0 ? `, ${errorCount} fallaron` : ''}`,
      });
    }
  };

  const getCurrentRole = (principalStr: string): UserRole => {
    return pendingChanges.get(principalStr) ?? users.find(u => u.principal.toString() === principalStr)?.role ?? UserRole.guest;
  };

  const hasChanges = pendingChanges.size > 0;
  const isSaving = assignUserRole.isPending;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white text-black p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-white text-black p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-sm text-red-800 ml-2">
              <strong>Error al cargar usuarios:</strong> No se pudo obtener la lista de usuarios del sistema.
              Por favor, intenta recargar la página.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-[#BFA76F]/10 flex items-center justify-center">
            <UserCog className="h-6 w-6 text-[#BFA76F]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-black">Roles de Usuario</h1>
            <p className="text-sm text-gray-600">Gestiona los permisos de acceso de los usuarios del sistema</p>
          </div>
        </div>

        {/* Main Card */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-200 bg-gray-50">
            <CardTitle className="text-xl text-black flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#BFA76F]" />
              Usuarios del Sistema
            </CardTitle>
            <CardDescription className="text-gray-600">
              {users.length > 0 
                ? 'Selecciona el rol apropiado para cada usuario y guarda los cambios'
                : 'No hay usuarios registrados en el sistema'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {users.length === 0 ? (
              <div className="text-center py-12">
                <UserCog className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  No hay usuarios registrados
                </h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto">
                  Cuando los usuarios inicien sesión por primera vez, aparecerán aquí y podrás asignarles roles.
                </p>
              </div>
            ) : (
              <>
                {/* Changes indicator */}
                {hasChanges && (
                  <Alert className="mb-4 border-blue-200 bg-blue-50">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-sm text-blue-800 ml-2">
                      Tienes {pendingChanges.size} cambio(s) pendiente(s). Haz clic en "Guardar cambios" para aplicarlos.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Users Table */}
                <div className="rounded-md border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="text-black font-semibold">Usuario</TableHead>
                          <TableHead className="text-black font-semibold">Principal ID</TableHead>
                          <TableHead className="text-black font-semibold">Rol Actual</TableHead>
                          <TableHead className="text-black font-semibold">Nuevo Rol</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => {
                          const principalStr = user.principal.toString();
                          const currentRole = getCurrentRole(principalStr);
                          const hasChange = pendingChanges.has(principalStr);
                          
                          return (
                            <TableRow key={principalStr} className={hasChange ? 'bg-blue-50/50' : ''}>
                              <TableCell>
                                {user.profile?.name ? (
                                  <div className="font-semibold text-black">{user.profile.name}</div>
                                ) : (
                                  <div className="text-gray-500 text-sm italic">Sin nombre</div>
                                )}
                              </TableCell>
                              <TableCell className="font-mono text-xs text-gray-600">
                                <div className="max-w-[200px] truncate" title={principalStr}>
                                  {principalStr}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={roleColors[user.role]} className="text-xs">
                                  <Shield className="h-3 w-3 mr-1" />
                                  {roleLabels[user.role]}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={currentRole}
                                  onValueChange={(value) => handleRoleChange(principalStr, value as UserRole)}
                                  disabled={isSaving}
                                >
                                  <SelectTrigger className="w-full sm:w-[200px] bg-white border-gray-300">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-white">
                                    <SelectItem value={UserRole.admin}>
                                      <span className="flex items-center gap-2">
                                        <Shield className="h-3 w-3 text-red-600" />
                                        Administrador
                                      </span>
                                    </SelectItem>
                                    <SelectItem value={UserRole.user}>
                                      <span className="flex items-center gap-2">
                                        <Shield className="h-3 w-3 text-blue-600" />
                                        Carga
                                      </span>
                                    </SelectItem>
                                    <SelectItem value={UserRole.guest}>
                                      <span className="flex items-center gap-2">
                                        <Shield className="h-3 w-3 text-gray-600" />
                                        Solo lectura
                                      </span>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Save Button */}
                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={handleSaveChanges}
                    disabled={!hasChanges || isSaving}
                    className="bg-[#BFA76F] hover:bg-[#A89660] text-white gap-2"
                    size="lg"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Guardar cambios
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Role Descriptions */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-200 bg-gray-50">
            <CardTitle className="text-lg text-black">Descripción de Roles</CardTitle>
            <CardDescription className="text-gray-600">
              Permisos y capacidades de cada rol en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start gap-3">
              <Badge variant="destructive" className="mt-1 flex-shrink-0">
                <Shield className="h-3 w-3 mr-1" />
                Administrador
              </Badge>
              <div className="flex-1">
                <p className="text-sm text-gray-700 font-medium mb-1">Acceso completo al sistema</p>
                <p className="text-sm text-gray-600">
                  {roleDescriptions[UserRole.admin]}. Puede eliminar registros del historial y gestionar todos los aspectos del sistema.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="default" className="mt-1 flex-shrink-0">
                <Shield className="h-3 w-3 mr-1" />
                Carga
              </Badge>
              <div className="flex-1">
                <p className="text-sm text-gray-700 font-medium mb-1">Usuario operativo</p>
                <p className="text-sm text-gray-600">
                  {roleDescriptions[UserRole.user]}. No puede modificar configuración ni gestionar usuarios.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="secondary" className="mt-1 flex-shrink-0">
                <Shield className="h-3 w-3 mr-1" />
                Solo lectura
              </Badge>
              <div className="flex-1">
                <p className="text-sm text-gray-700 font-medium mb-1">Acceso de consulta</p>
                <p className="text-sm text-gray-600">
                  {roleDescriptions[UserRole.guest]}. No puede crear, modificar ni eliminar registros.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
