import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { UserPlus, Trash2, Edit, Loader2 } from 'lucide-react';
import { UserRole } from '@/backend';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const roleLabels: Record<UserRole, string> = {
  [UserRole.admin]: 'Administrador',
  [UserRole.user]: 'Usuario',
  [UserRole.guest]: 'Invitado',
};

const roleColors: Record<UserRole, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  [UserRole.admin]: 'destructive',
  [UserRole.user]: 'default',
  [UserRole.guest]: 'secondary',
};

export default function GestionUsuarios() {
  const [nombre, setNombre] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState<UserRole>(UserRole.user);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  // Mock users data - in real implementation, this would come from backend
  const [usuarios] = useState([
    { id: '1', nombre: 'Admin Principal', rol: UserRole.admin },
    { id: '2', nombre: 'Juan Pérez', rol: UserRole.user },
    { id: '3', nombre: 'María García', rol: UserRole.user },
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nombre || !password) {
      toast.error('Por favor complete todos los campos');
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: Implement backend call to create user
      // await createUser({ nombre, password, rol });
      
      toast.success('Usuario creado correctamente');
      setNombre('');
      setPassword('');
      setRol(UserRole.user);
    } catch (error: any) {
      console.error('Error al crear usuario:', error);
      toast.error(error.message || 'Error al crear usuario');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;

    try {
      // TODO: Implement backend call to delete user
      // await deleteUser(userToDelete);
      
      toast.success('Usuario eliminado correctamente');
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (error: any) {
      console.error('Error al eliminar usuario:', error);
      toast.error(error.message || 'Error al eliminar usuario');
    }
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="w-full py-3 sm:py-4 md:py-6 lg:py-8 px-2 sm:px-3 md:px-4">
        <div className="mb-3 sm:mb-4 md:mb-6 lg:mb-8">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2 text-black">Gestión de Usuarios</h1>
          <p className="text-xs sm:text-sm text-gray-600">
            Administre los usuarios del sistema y sus roles de acceso
          </p>
        </div>

        <div className="grid gap-3 sm:gap-4 md:gap-6 lg:grid-cols-2">
          {/* Create User Form */}
          <Card className="bg-white border-gray-200">
            <CardHeader className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg text-black">
                <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="truncate">Crear Nuevo Usuario</span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-gray-600">
                Agregue un nuevo usuario al sistema con su rol correspondiente
              </CardDescription>
            </CardHeader>
            <CardContent className="px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="nombre" className="text-xs sm:text-sm text-black">Nombre Completo</Label>
                  <Input
                    id="nombre"
                    type="text"
                    placeholder="Ej: Juan Pérez"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    disabled={isSubmitting}
                    className="bg-white border-gray-300 text-black h-10 text-sm"
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="password" className="text-xs sm:text-sm text-black">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Contraseña segura"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting}
                    className="bg-white border-gray-300 text-black h-10 text-sm"
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="rol" className="text-xs sm:text-sm text-black">Rol de Usuario</Label>
                  <Select
                    value={rol}
                    onValueChange={(value) => setRol(value as UserRole)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="rol" className="bg-white border-gray-300 text-black h-10 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-300">
                      <SelectItem value={UserRole.admin}>
                        {roleLabels[UserRole.admin]}
                      </SelectItem>
                      <SelectItem value={UserRole.user}>
                        {roleLabels[UserRole.user]}
                      </SelectItem>
                      <SelectItem value={UserRole.guest}>
                        {roleLabels[UserRole.guest]}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full text-xs sm:text-sm h-10" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      Crear Usuario
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Users List */}
          <Card className="bg-white border-gray-200">
            <CardHeader className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5">
              <CardTitle className="text-sm sm:text-base md:text-lg text-black">Usuarios del Sistema</CardTitle>
              <CardDescription className="text-xs sm:text-sm text-gray-600">
                Lista de todos los usuarios registrados
              </CardDescription>
            </CardHeader>
            <CardContent className="px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
              <div className="rounded-md border border-gray-200 overflow-hidden">
                <ScrollArea className="w-full">
                  <div className="min-w-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-black text-xs sm:text-sm">Nombre</TableHead>
                          <TableHead className="text-black text-xs sm:text-sm">Rol</TableHead>
                          <TableHead className="text-right text-black text-xs sm:text-sm">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {usuarios.map((usuario) => (
                          <TableRow key={usuario.id}>
                            <TableCell className="font-medium text-black text-xs sm:text-sm">{usuario.nombre}</TableCell>
                            <TableCell>
                              <Badge variant={roleColors[usuario.rol]} className="text-[10px] sm:text-xs">
                                {roleLabels[usuario.rol]}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 sm:h-8 sm:w-8"
                                  onClick={() => {
                                    toast.info('Función de edición en desarrollo');
                                  }}
                                >
                                  <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 sm:h-8 sm:w-8"
                                  onClick={() => {
                                    setUserToDelete(usuario.id);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </div>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="bg-white border-gray-300 max-w-[95vw] sm:max-w-lg">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-sm sm:text-base text-black">¿Está seguro?</AlertDialogTitle>
              <AlertDialogDescription className="text-xs sm:text-sm text-gray-600">
                Esta acción no se puede deshacer. El usuario será eliminado permanentemente del sistema.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel className="text-xs sm:text-sm h-9 w-full sm:w-auto">Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs sm:text-sm h-9 w-full sm:w-auto">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
