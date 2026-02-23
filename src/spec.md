# Rimonim Control de calidad (Version 98   Zona Horaria UTC 3)

Una aplicación PWA para el control de calidad de granadas de la variedad Wonderful con sistema de autenticación basado en roles, instalable en dispositivos Android e iOS, operando completamente en zona horaria UTC-3.

## Sistema de Autenticación y Roles

### Perfiles de Usuario
- **Lectura (Read-only)**: Usuarios con acceso de solo lectura que pueden visualizar datos en Reportes e Historial pero no pueden modificar ni crear registros
- **Carga (Data Entry)**: Usuarios que pueden registrar nuevos controles de calidad pero no pueden acceder a gestión de usuarios ni modificar datos existentes
- **Administrador (Administrator)**: Acceso completo que puede agregar/editar/eliminar datos, gestionar usuarios y asignar roles

### Control de Acceso por Sección
- **RegistroControl**: Acceso restringido a usuarios con rol "Carga" o "Administrador"
- **Reportes**: Visualización permitida para todos los roles, edición/eliminación restringida a "Administrador"
- **Historial**: Visualización permitida para todos los roles, eliminación restringida a "Administrador"
- **Configuración**: Acceso exclusivo para "Administrador"
- **Gestión de Usuarios**: Acceso exclusivo para "Administrador"
- **Roles de Usuario**: Acceso exclusivo para "Administrador"

### Autenticación
- **Login obligatorio** con validación de credenciales
- **Gestión de sesiones** con persistencia segura
- **Validación de roles** en cada operación
- **Logout funcional** con limpieza de sesión

## Configuración de Zona Horaria

### Operación en UTC-3
- **Zona horaria fija UTC-3** para todas las operaciones de fecha y hora en el sistema
- **Timestamps en UTC-3**: Todos los timestamps se generan, almacenan y procesan usando UTC-3
- **Identificadores de muestra en UTC-3**: Los identificadores HH:MM:SS se generan basados en la hora UTC-3
- **Reinicios diarios en UTC-3**: Los ciclos diarios para identificadores únicos se basan en medianoche UTC-3
- **Reportes en UTC-3**: Toda la generación de reportes diarios y por rango usa fechas y horas UTC-3
- **Visualización consistente**: Todas las fechas y horas mostradas al usuario están en UTC-3
- **Validación de unicidad en UTC-3**: Las verificaciones de duplicados de identificadores se basan en días UTC-3
- **Conversión correcta de zona horaria**: La función `getCurrentDateUTC3` debe convertir correctamente `Time.now()` (nanosegundos) a UTC-3, ajustando por la diferencia horaria (-3 horas = -10800 segundos = -10800000000000 nanosegundos) para evitar desfases de un día
- **Sincronización de fechas exactas**: El registro de control, reportes e historial deben mostrar la fecha exacta del día de trabajo UTC-3 sin adelantarse ni atrasarse

## Funcionalidades PWA

### Instalabilidad iOS Optimizada
- **Web App Manifest** (`manifest.json`) configurado específicamente para iOS con:
  - Nombre de la aplicación: "Rimonim Control de calidad"
  - Nombre corto: "Rimonim"
  - **Iconos optimizados para iOS** utilizando los assets del logo Rimonim en múltiples tamaños requeridos por iOS:
    - 180x180 (iPhone home screen)
    - 167x167 (iPad Pro)
    - 152x152 (iPad)
    - 120x120 (iPhone retina)
    - 76x76 (iPad non-retina)
    - 60x60 (iPhone non-retina)
  - URL de inicio configurada para la página principal
  - **Modo de visualización `standalone`** para experiencia de aplicación nativa completa en iOS
  - **Configuración específica para iOS**:
    - `apple-mobile-web-app-capable: yes` para modo standalone
    - `apple-mobile-web-app-status-bar-style: default` para barra de estado
    - `apple-mobile-web-app-title: "Rimonim Control de calidad"` para nombre en home screen
  - Color de fondo blanco (#FFFFFF)
  - Color de tema dorado (#BFA76F) para barra de estado iOS
  - Idioma de contenido en español (es)
- **Apple Touch Icons** específicos para iOS home screen usando los logos Rimonim existentes
- **Splash Screen iOS** configurada con:
  - Colores consistentes con la aplicación (fondo blanco, elementos dorados)
  - Logo Rimonim centrado
  - Configuración para diferentes tamaños de pantalla iOS
- **Service Worker optimizado para iOS** para:
  - Cacheo offline de recursos estáticos (HTML, CSS, JS, imágenes)
  - Estrategia de cache-first para assets y network-first para datos dinámicos
  - **Compatibilidad específica con Safari iOS** para instalabilidad
  - **Funcionamiento correcto de cámara** cuando se instala como PWA en iOS
- **Registro del Service Worker** en el punto de entrada de React con detección de iOS
- **Vinculación del manifest y meta tags iOS** en el template HTML
- **Prompt de instalación iOS** que guía al usuario para "Agregar a pantalla de inicio" desde Safari
- **Funcionamiento offline básico** para navegación entre páginas ya visitadas sin afectar funcionalidad core

### Compatibilidad Móvil PWA iOS
- **Experiencia standalone completa** cuando se instala desde Safari iOS
- **Navegación sin barras del navegador** en modo instalado iOS
- **Iconos de aplicación** en la pantalla de inicio iOS usando logos Rimonim
- **Splash screen personalizada** con colores y logo Rimonim para iOS
- **Orientación de pantalla** optimizada para uso vertical en iPhone/iPad
- **Gestión de estado** que persiste entre sesiones de la aplicación instalada en iOS
- **Acceso a cámara funcional** desde PWA instalada en iOS para captura de fotos obligatoria
- **Integración nativa iOS** que permite funcionar como aplicación independiente

## Funcionalidades Principales

### Configuración de Empacadores (Solo Administrador)
- **Operaciones CRUD completamente funcionales** para crear, leer, actualizar y eliminar empacadores:
  - **Crear nuevos empacadores** con validación de unicidad por identificador
  - **Modificar empacadores existentes** con actualización instantánea en la interfaz
  - **Eliminar empacadores** de la lista con confirmación funcional
  - **Listar empacadores activos** con carga rápida garantizada sin errores
- **Validación de unicidad** que previene duplicados basada únicamente en identificadores activos
- **Interfaz responsiva** optimizada para dispositivos móviles y escritorio con controles táctiles apropiados
- **Sincronización backend-frontend** para reflejar cambios automáticamente en formularios de registro y reportes
- **Manejo de errores robusto** con mensajes informativos en español y recuperación automática
- **Acceso restringido** exclusivamente a usuarios con rol "Administrador"

### Configuración de Controladores (Solo Administrador)
- **Operaciones CRUD completamente funcionales** para crear, leer, actualizar y eliminar controladores:
  - **Crear nuevos controladores** con validación de unicidad por identificador
  - **Modificar controladores existentes** con actualización instantánea en la interfaz
  - **Eliminar controladores** de la lista con confirmación funcional
  - **Listar controladores activos** con carga rápida garantizada sin errores
- **Validación de unicidad** que previene duplicados basada únicamente en identificadores activos
- **Interfaz responsiva** optimizada para dispositivos móviles y escritorio con controles táctiles apropiados
- **Sincronización backend-frontend** para reflejar cambios automáticamente en formularios de registro y reportes
- **Manejo de errores robusto** con mensajes informativos en español y recuperación automática
- **Acceso restringido** exclusivamente a usuarios con rol "Administrador"

### Gestión de Roles de Usuario (Solo Administrador)
- **Acceso restringido** exclusivamente a usuarios con rol "Administrador"
- **Navegación dedicada** con opción "Roles de usuario" visible solo para administradores en el menú principal de navegación
- **Enlace o pestaña "Roles de usuario"** en la navegación del encabezado que es visible únicamente para usuarios administradores
- **Página RolesUsuarios** que carga correctamente y muestra:
  - Lista completa de todos los usuarios registrados del sistema
  - Email/principal de cada usuario
  - Rol actual asignado a cada usuario
- **Modificación de roles** mediante:
  - **Selectores desplegables** junto a cada usuario con opciones:
    - "Administrador"
    - "Carga de registros" 
    - "Solo lectura"
  - **Botón "Guardar cambios"** que actualiza los roles usando la función backend `assignCallerUserRole`
- **Confirmación de estados** con:
  - **Mensajes de éxito** cuando los cambios se guardan correctamente
  - **Mensajes de error** cuando ocurren fallos en la actualización
  - **Indicadores visuales** del estado de la operación
- **Interfaz responsiva** que se adapta a dispositivos móviles y escritorio
- **Diseño consistente** con el esquema de colores blanco y dorado de la aplicación
- **Contenido en español** para todas las etiquetas, mensajes y opciones
- **Integración verificada** con la función backend de asignación de roles (`assignCallerUserRole`)

### Registro de Controles de Calidad con UTC-3 (Carga y Administrador)
- **Formulario completamente funcional** para crear nuevos registros de control con generación automática de datos en UTC-3
- **Acceso restringido** a usuarios con rol "Carga" o "Administrador"
- **Generación automática de fecha en UTC-3 corregida**: el backend asigna automáticamente la fecha actual UTC-3 (timestamp Int) al crear el registro usando conversión correcta de zona horaria
- **Sistema de identificadores basado en hora UTC-3 con segundos**:
  - **Identificador automático de hora, minuto y segundo UTC-3**: Cada registro recibe automáticamente un identificador basado en la hora exacta UTC-3 de creación en formato "HH:MM:SS"
  - **Generación en tiempo de creación UTC-3**: El backend genera automáticamente el identificador de tiempo UTC-3 al momento de crear el registro
  - **Unicidad diaria UTC-3**: Cada identificador de tiempo es único por día calendario UTC-3, evitando duplicados en la misma fecha UTC-3
  - **Formato de tiempo estándar UTC-3 con segundos**: Los identificadores se almacenan y muestran en formato "HH:MM:SS" de 24 horas UTC-3
  - **Sincronización UTC-3 entre secciones**: Los identificadores de tiempo UTC-3 aparecen de forma idéntica en Registro, Historial y Reportes
  - **Validación automática de unicidad UTC-3**: Verificación que previene la creación de registros con el mismo identificador de tiempo UTC-3 en el mismo día UTC-3
  - **Transacciones atómicas UTC-3**: Asignación de identificadores con bloqueo para prevenir conflictos en operaciones concurrentes basadas en tiempo UTC-3
- **Actualización automática en tiempo real del identificador de muestra UTC-3**: 
  - **Campo "Nombre de muestra" de solo lectura** que muestra automáticamente el próximo identificador de tiempo UTC-3 que será asignado
  - **Actualización inmediata sin recarga de página** después de cada registro guardado
  - **Sincronización automática UTC-3** que obtiene el siguiente identificador UTC-3 disponible del backend después de cada guardado exitoso
  - **Funcionamiento idéntico en todos los dispositivos**: La lógica UTC-3 funciona de manera consistente en móviles y escritorio
- **Campos de solo lectura funcionales** que muestran la fecha UTC-3 y el identificador de tiempo UTC-3 de muestra que serán asignados automáticamente
- **Variedad fija**: todos los registros se crean automáticamente con variedad "Wonderful" sin opción de selección por el usuario
- **Registro de cantidad** de muestras revisadas con validación numérica
- **Selección de empacador** de la lista configurada con carga dinámica
- **Selección de controlador** de la lista configurada con carga dinámica:
  - **Campo "Controlador" obligatorio** con selector desplegable que muestra la lista de controladores activos
  - **Sincronización en tiempo real** con la configuración de controladores
  - **Validación obligatoria** que requiere selección de un controlador antes de enviar el formulario
  - **Actualización automática** de la lista cuando se agregan, modifican o eliminan controladores
- **Campo "Dentro de rango de peso"** con opciones Sí/No:
  - **Selector obligatorio** con opciones "Sí" y "No" para indicar si las granadas están dentro del rango de peso esperado
  - **Valor por defecto**: sin selección previa, requiere elección explícita del usuario
  - **Validación**: campo obligatorio que debe ser completado antes de enviar el formulario
  - **Almacenamiento**: se guarda como valor booleano (true para "Sí", false para "No")
  - **Visualización**: aparece en historial y reportes con las etiquetas "Sí" o "No"
- **Captura de fotos obligatoria funcional**:
  - **En dispositivos iOS PWA**: activación directa de cámara nativa usando `capture="environment"` con compatibilidad específica para PWA instalada
  - En dispositivos de escritorio: selector de archivos tradicional
  - Vista previa de imagen con confirmación "📸 Foto cargada correctamente"
  - **Validación obligatoria**: no se puede enviar el formulario sin foto
  - **Botón de envío deshabilitado** hasta que se cargue una foto
  - **Funcionamiento garantizado en PWA iOS** sin restricciones de permisos
- **Registro de defectos** con cantidad de frutas afectadas:
  - **Campos de defectos con comportamiento intuitivo de placeholder**:
    - **Limpieza automática de placeholder**: Los campos de defectos (Raset, Cracking, Golpe de sol, Podredumbre) automáticamente limpian el valor placeholder `0` cuando el usuario comienza a escribir
    - **Restauración automática**: Si un campo de defecto se deja vacío después de editar, automáticamente restaura el valor `0`
    - **Comportamiento consistente**: Esta funcionalidad se aplica a todos los campos de defectos en la sección de defectos del formulario
    - **Optimización móvil y escritorio**: El comportamiento funciona de manera intuitiva tanto en dispositivos móviles como de escritorio
  - Campos opcionales para: Raset, Cracking, Golpe de sol, Podredumbre
  - Validación condicional solo cuando se registren defectos
  - Permitir registro sin defectos con confirmación de guardado
- **Validaciones**:
  - Suma de defectos no excede muestras revisadas (solo cuando aplique)
  - **Foto obligatoria** antes de poder enviar el formulario
  - **Campo "Dentro de rango de peso" obligatorio** antes de poder enviar el formulario
  - **Campo "Controlador" obligatorio** antes de poder enviar el formulario
  - **Validación de unicidad de identificador UTC-3**: verificación automática contra el historial para prevenir duplicados de tiempo UTC-3 en el mismo día UTC-3
  - Manejo de errores con mensajes informativos en español
- **Guardado funcional** con confirmación inmediata que muestra claramente el identificador de tiempo UTC-3 de muestra y fecha UTC-3 asignados automáticamente
- **Mensaje de confirmación** después del registro que muestra específicamente: "Muestra [HH:MM:SS] registrada correctamente para el día [fecha UTC-3]" usando el identificador de tiempo UTC-3 asignado automáticamente
- **Mensaje de error claro** si se detecta un intento de duplicado: "Error: Ya existe una muestra con el identificador [HH:MM:SS] para esta fecha UTC-3"
- **Actualización automática post-guardado** que actualiza inmediatamente el campo "Nombre de muestra" con el siguiente identificador de tiempo UTC-3 disponible

### Generación de Reportes con UTC-3 y Filtrado Dinámico (Todos los Roles)
- **Acceso de visualización** para todos los roles (Lectura, Carga, Administrador)
- **Carga de datos en UTC-3** que obtiene todas las muestras del historial basadas en fechas UTC-3 correctas
- **Sincronización perfecta UTC-3** con las funciones backend `obtenerReporteDiario` y `obtenerReporteRango` para garantizar datos basados en días UTC-3 exactos
- **Sistema de filtrado dinámico en tiempo real**:
  - **Filtros interactivos** por rango de fechas, tipo de defecto, empacador, **controlador** y rango de peso (Sí/No)
  - **Filtro por controlador** con selector desplegable que lista todos los controladores disponibles
  - **Aplicación inmediata de filtros** que oculta registros que no coinciden con los criterios seleccionados
  - **Actualización automática de estadísticas** basada únicamente en los registros filtrados visibles
  - **Recálculo dinámico de totales** de defectos, porcentajes y métricas para reflejar solo los datos filtrados
  - **Filtrado sin recarga de página** con actualización instantánea de la interfaz
  - **Combinación de múltiples filtros** que permite aplicar varios criterios simultáneamente incluyendo controlador
  - **Indicadores visuales claros** de qué filtros están activos
  - **Opción para limpiar filtros** y volver a mostrar todos los registros
- **Visualización completa del nombre del controlador**:
  - **Mostrar nombre del controlador** en todas las tablas de reportes junto con cada muestra registrada
  - **Inclusión en reportes diarios** que muestra el nombre del controlador responsable para cada registro
  - **Inclusión en reportes por rango** que muestra el nombre del controlador para cada muestra en el período seleccionado
  - **Visualización en filtros aplicados** que mantiene la información del controlador visible cuando se aplican criterios de filtrado
  - **Diseño responsivo** que adapta la visualización del nombre del controlador en dispositivos móviles y escritorio
- **Generación de PDF del día actual**:
  - **Botón "Generar reporte PDF" prominente y claramente visible** ubicado en la parte superior de la página de Reportes
  - **Estilo distintivo del botón** con fondo blanco, borde dorado y acentos dorados consistentes con el tema de la aplicación
  - **Visibilidad garantizada** en dispositivos móviles y de escritorio con posicionamiento fijo en la parte superior
  - **Generación automática de PDF** con los datos del día actual UTC-3 usando el módulo `pdfGenerator` existente
  - **Activación inmediata** al hacer clic que dispara la generación del PDF para los datos filtrados del reporte actual
  - **Contenido del PDF** que incluye:
    - Fecha del reporte en UTC-3
    - Totales de muestras, frutas afectadas, frutas sin defectos
    - Porcentajes de defectos y sin defectos
    - Totales y porcentajes dentro/fuera de rango de peso
    - **Tabla condensada de controles registrados** (empacador, **nombre del controlador**, defectos principales, cantidad de muestras, hora de registro)
  - **Diseño del PDF** usando el esquema de colores blanco y dorado de la aplicación
  - **Descarga automática** del archivo PDF con nombre `Reporte_Diario_[fecha].pdf`
  - **Formato profesional** con logo de Rimonim y estructura clara
- **Manejo robusto de errores** que previene fallos de carga y muestra mensajes informativos en español
- **Inclusión completa** de todas las muestras registradas del día UTC-3 o rango UTC-3 seleccionado antes del filtrado
- **Visualización de identificadores de tiempo UTC-3 con segundos**: Mostrar los identificadores de tiempo UTC-3 (HH:MM:SS) exactamente como aparecen en el historial
- **Visualización del campo "Dentro de rango de peso"**: Mostrar el estado "Sí" o "No" para cada muestra en los reportes
- **Cálculos matemáticos dinámicos correctos**:
  - **Totales de defectos filtrados** calculados sumando solo las muestras visibles después del filtrado
  - **Porcentaje de defectos filtrado**: (total_defectos_filtrados / total_muestras_filtradas) * 100
  - **Frutos sin defectos filtrados**: total_muestras_filtradas - total_defectos_filtrados
  - **Porcentaje de frutos sin defectos filtrados**: ((total_muestras_filtradas - total_defectos_filtrados) / total_muestras_filtradas) * 100
  - **Estadísticas de rango de peso filtradas**: conteo y porcentaje de muestras dentro y fuera del rango de peso solo de registros visibles
  - **Actualización en tiempo real** de todas las métricas al cambiar filtros
- **Visualización correcta** en dispositivos móviles y escritorio con fondo blanco consistente
- **Selectores de fecha UTC-3** para reportes diarios y por rango con validación robusta
- **Reportes diarios UTC-3** que incluyen:
  - **Inclusión de todas las muestras** del día UTC-3 seleccionado que aparecen en el historial
  - **Aplicación de filtros dinámicos** sobre los datos del día seleccionado incluyendo filtro por controlador
  - **Cálculos de totales de defectos filtrados** por tipo usando solo datos visibles
  - **Distribución por empacador y controlador filtrada** sincronizada con los registros visibles
  - **Estadísticas generales filtradas** incluyendo conteo exacto de registros visibles
  - **Visualización de identificadores de tiempo UTC-3 con segundos** mostrando el formato HH:MM:SS
  - **Estadísticas de rango de peso filtradas** mostrando conteo de muestras "Sí" y "No" solo de registros visibles
  - **Visualización del nombre del controlador** para cada muestra registrada en el día
- **Reportes por rango de fechas UTC-3**:
  - **Consolidación completa** de datos del período UTC-3 seleccionado
  - **Aplicación de filtros** sobre el conjunto completo de datos del rango incluyendo filtro por controlador
  - **Agregación matemática correcta** de métricas filtradas entre múltiples días UTC-3
  - **Cálculos de promedios y totales filtrados** con validación matemática basada en registros visibles
  - **Desglose detallado por día UTC-3** dentro del rango aplicando filtros
  - **Visualización de identificadores de tiempo UTC-3 por día** mostrando el formato HH:MM:SS para registros filtrados
  - **Agregación de estadísticas de rango de peso filtradas** por período seleccionado
  - **Visualización del nombre del controlador** para cada muestra en el rango de fechas seleccionado
- **Interfaz de reportes responsiva** sin scroll horizontal y con fondo blanco consistente
- **Recuperación automática** de errores de carga con reintentos y mensajes informativos específicos en español

### Historial y Filtros con UTC-3 (Todos los Roles con Restricciones)
- **Acceso de visualización** para todos los roles (Lectura, Carga, Administrador)
- **Eliminación restringida** exclusivamente a usuarios con rol "Administrador"
- **Carga optimizada** del historial completo de controles basado en fechas y horas UTC-3 correctas
- **Visualización funcional** con información completa de cada registro incluyendo identificadores de tiempo UTC-3 con formato HH:MM:SS, estado de rango de peso y **nombre del controlador**
- **Visualización completa del nombre del controlador**:
  - **Mostrar nombre del controlador** en todas las entradas del historial junto con cada muestra registrada
  - **Información del controlador** visible en el listado completo del historial
  - **Visualización en filtros aplicados** que mantiene la información del controlador visible cuando se aplican criterios de filtrado
  - **Diseño responsivo** que adapta la visualización del nombre del controlador en dispositivos móviles y escritorio
- **Fuente de verdad para identificadores UTC-3**: El historial sirve como la referencia principal para verificar los identificadores de tiempo UTC-3 diarios y prevenir duplicados
- **Filtros funcionales** por fecha UTC-3, tipo de defecto, empacador, **controlador** y rango de peso (Sí/No):
  - **Filtro por controlador** con selector desplegable que lista todos los controladores disponibles
  - **Aplicación inmediata del filtro por controlador** que muestra solo registros del controlador seleccionado
  - **Combinación del filtro por controlador** con otros filtros existentes
- **Función de eliminación (Solo Administrador)**:
  - Botón "Eliminar" visible solo para usuarios con rol "Administrador"
  - Confirmación con diálogo "¿Seguro que deseas eliminar este lote?"
  - Eliminación del backend con actualización inmediata de la lista
  - **Mantenimiento de integridad UTC-3**: Después de eliminar un registro, el sistema mantiene la integridad de los identificadores de tiempo UTC-3 para nuevos registros
  - Funcionamiento correcto en dispositivos móviles y escritorio
- **Interfaz responsiva** con diseño de tarjetas para móviles
- **Manejo de errores robusto** con recuperación automática de fallos de carga
- **Visualización correcta** de fechas UTC-3, identificadores de tiempo UTC-3 generados automáticamente por día, estado de rango de peso y nombre del controlador
- **Renderizado optimizado** que mejora el rendimiento y reduce lag en dispositivos móviles

### Gestión de Usuarios (Solo Administrador)
- **Operaciones CRUD completamente funcionales** para usuarios del sistema
- **Acceso restringido** exclusivamente a usuarios con rol "Administrador"
- **Validación funcional** de nombres de usuario únicos
- **Interfaz** para crear, modificar y eliminar usuarios
- **Asignación de roles** con validación y persistencia correcta:
  - Rol "Lectura" para acceso de solo lectura
  - Rol "Carga" para registro de datos
  - Rol "Administrador" para acceso completo
- **Sincronización funcional** entre frontend y backend
- **Manejo de errores** con mensajes informativos y recuperación automática

## Datos Almacenados en el Backend

### Estructura de Datos con UTC-3 y Roles
- **Usuarios del sistema** con integridad de datos, operaciones CRUD funcionales y roles asignados:
  - **Información de usuario**: nombre de usuario, contraseña hasheada, rol asignado
  - **Roles disponibles**: "Lectura", "Carga", "Administrador"
  - **Validación de roles** en cada operación del backend
- **Configuración de empacadores** con:
  - **Validación de unicidad** basada únicamente en identificadores activos
  - **Estado de empacadores** que distingue correctamente entre activos e inactivos
  - **Integridad referencial** con otros módulos del sistema
- **Configuración de controladores** con:
  - **Validación de unicidad** basada únicamente en identificadores activos
  - **Estado de controladores** que distingue correctamente entre activos e inactivos
  - **Integridad referencial** con otros módulos del sistema
- **Registros de control de calidad** con estructura optimizada, incluyendo:
  - Fecha automática UTC-3 (timestamp Int) con conversión correcta de zona horaria
  - **Identificador de tiempo único UTC-3 con segundos** generado automáticamente en formato HH:MM:SS consultando el historial
  - **Variedad fija "Wonderful"** asignada automáticamente por el backend
  - **Campo "Dentro de rango de peso"** almacenado como valor booleano (Bool)
  - **Campo "Controlador"** almacenado como identificador del controlador responsable
  - Foto obligatoria con validación funcional
- **Historial completo** con indexación para consultas eficientes basadas en UTC-3 y como fuente de verdad para la generación de identificadores de tiempo UTC-3
- **Gestión de fotos** con almacenamiento optimizado y recuperación rápida

### Integridad y Consistencia UTC-3
- **Verificación automática** de integridad de datos al inicializar con timestamps UTC-3 correctos
- **Corrección automática** de inconsistencias en identificadores de tiempo UTC-3 entre frontend y backend
- **Validaciones de esquema** para prevenir corrupción de datos con fechas UTC-3
- **Validación de foto obligatoria** en todos los registros de control de calidad
- **Validación de campo "Dentro de rango de peso" obligatorio** en todos los registros de control de calidad
- **Validación de campo "Controlador" obligatorio** en todos los registros de control de calidad
- **Generación automática robusta** de fechas UTC-3 e identificadores de tiempo UTC-3 basada en consultas directas al historial con conversión correcta de zona horaria
- **Transacciones atómicas UTC-3** para prevenir estados inconsistentes durante operaciones críticas basadas en tiempo UTC-3
- **Sistema de recuperación** que detecta y corrige automáticamente cualquier duplicación consultando el historial basado en días UTC-3
- **Validación cruzada continua UTC-3** entre nuevos identificadores de tiempo UTC-3 y registros existentes en el historial

## Operaciones del Backend

### Autenticación y Control de Acceso
- **Login de usuarios** con validación de credenciales y generación de sesión
- **Validación de roles** en cada endpoint del backend
- **Middleware de autenticación** que verifica permisos antes de ejecutar operaciones
- **Gestión de sesiones** con tokens seguros y expiración
- **Logout funcional** con invalidación de sesión
- **Endpoints protegidos** según el rol del usuario:
  - Endpoints de solo lectura: accesibles para todos los roles autenticados
  - Endpoints de creación de registros: accesibles para "Carga" y "Administrador"
  - Endpoints de eliminación: accesibles solo para "Administrador"
  - Endpoints de configuración: accesibles solo para "Administrador"
  - Endpoints de gestión de usuarios: accesibles solo para "Administrador"
  - Endpoints de gestión de roles: accesibles solo para "Administrador"

### Gestión de Roles de Usuario (Solo Administrador)
- **Validación de rol "Administrador"** antes de permitir cualquier operación de gestión de roles
- **Listar todos los usuarios** con:
  - **Obtención completa** de la lista de usuarios del sistema
  - **Información de usuario** incluyendo email/principal y rol actual
  - **Respuesta optimizada** con datos estructurados para la tabla de usuarios
- **Actualización de roles** mediante:
  - **Función `assignCallerUserRole`** para modificar roles de usuarios
  - **Validación de roles válidos** ("Administrador", "Carga", "Solo lectura")
  - **Actualización atómica** que garantiza consistencia de datos
  - **Respuesta con confirmación** de éxito o error de la operación
- **Validación de permisos** que verifica que solo administradores pueden modificar roles
- **Manejo de errores** con mensajes específicos para diferentes tipos de fallos
- **Auditoría de cambios** para registrar modificaciones de roles

### Gestión de Empacadores (Solo Administrador)
- **Crear empacadores** con:
  - **Validación de rol "Administrador"** antes de permitir la operación
  - **Validación robusta** que previene duplicados por identificador activo únicamente
  - **Algoritmo de unicidad** que evita falsos positivos de duplicación
  - **Respuesta instantánea** con actualización inmediata del estado
  - **Manejo de errores** con mensajes claros en español
- **Actualizar empacadores** con sincronización en tiempo real y validación de rol
- **Eliminar empacadores** con manejo de dependencias, validación de integridad y validación de rol
- **Listar empacadores** con:
  - **Carga optimizada** y cache inteligente
  - **Filtrado eficiente** de empacadores activos vs inactivos
  - **Respuesta rápida** para dispositivos móviles y escritorio
  - **Ordenamiento consistente** para interfaz predecible

### Gestión de Controladores (Solo Administrador)
- **Crear controladores** con:
  - **Validación de rol "Administrador"** antes de permitir la operación
  - **Validación robusta** que previene duplicados por identificador activo únicamente
  - **Algoritmo de unicidad** que evita falsos positivos de duplicación
  - **Respuesta instantánea** con actualización inmediata del estado
  - **Manejo de errores** con mensajes claros en español
- **Actualizar controladores** con sincronización en tiempo real y validación de rol
- **Eliminar controladores** con manejo de dependencias, validación de integridad y validación de rol
- **Listar controladores** con:
  - **Carga optimizada** y cache inteligente
  - **Filtrado eficiente** de controladores activos vs inactivos
  - **Respuesta rápida** para dispositivos móviles y escritorio
  - **Ordenamiento consistente** para interfaz predecible

### Operaciones de Control de Calidad con UTC-3 (Carga y Administrador)
- **Validación de rol** "Carga" o "Administrador" antes de permitir operaciones de creación
- **Función de conversión de zona horaria corregida**: `getCurrentDateUTC3` debe convertir correctamente `Time.now()` (nanosegundos desde epoch) a UTC-3 ajustando por -10800000000000 nanosegundos (-3 horas) para evitar desfases de fecha
- **Obtener próximo identificador de muestra UTC-3**:
  - **Endpoint específico** que genera el próximo identificador de tiempo UTC-3 disponible basado en la hora actual UTC-3 correcta
  - **Generación en tiempo real UTC-3** del identificador HH:MM:SS para vista previa
  - **Validación contra historial UTC-3** para asegurar unicidad en el día actual UTC-3
  - **Respuesta rápida** para actualización inmediata del formulario
  - **Actualización automática** después de cada registro guardado
- **Crear registros con UTC-3** con generación automática robusta de fecha UTC-3 e identificador de tiempo UTC-3:
  - Asignación automática de fecha actual UTC-3 como timestamp Int usando conversión correcta
  - **Asignación automática de variedad "Wonderful"** para todos los registros
  - **Almacenamiento del campo "Dentro de rango de peso"** como valor booleano en el tipo ControlCalidad
  - **Almacenamiento del campo "Controlador"** como identificador del controlador en el tipo ControlCalidad
  - **Sistema de generación de identificadores de tiempo UTC-3 basado en hora de creación con segundos**:
    - **Generación automática de identificador HH:MM:SS UTC-3**: Crear automáticamente el identificador basado en la hora exacta UTC-3 de creación del registro incluyendo segundos
    - **Consulta al historial para validación UTC-3**: Verificar que no existe ningún registro con el mismo identificador de tiempo UTC-3 para la fecha actual UTC-3
    - **Validación de unicidad absoluta UTC-3**: Confirmación automática que el identificador de tiempo UTC-3 es único para el día UTC-3
    - **Prevención de duplicados UTC-3**: Rechazo automático de cualquier intento de crear un registro con un identificador de tiempo UTC-3 ya existente en el mismo día UTC-3
    - **Transacciones atómicas UTC-3**: Bloqueo durante la generación y validación para prevenir conflictos concurrentes basados en tiempo UTC-3
    - **Sincronización garantizada UTC-3**: Backend y frontend usan la misma lógica basada en tiempo UTC-3 de creación
    - **Respuesta con próximo identificador UTC-3**: Después de crear un registro, el backend devuelve el siguiente identificador de tiempo UTC-3 disponible
    - **Formato de tiempo estándar UTC-3 con segundos**: Los identificadores se almacenan y devuelven en formato HH:MM:SS UTC-3
  - **Funcionamiento idéntico en todos los dispositivos**: La lógica UTC-3 funciona de manera consistente en móviles y escritorio
- **Validación obligatoria de foto** que rechaza registros sin imagen
- **Validación obligatoria del campo "Dentro de rango de peso"** que rechaza registros sin selección
- **Validación obligatoria del campo "Controlador"** que rechaza registros sin selección
- **Validación de unicidad de identificador de tiempo UTC-3** que consulta el historial antes de crear registros
- **Validación flexible** que permite registros sin defectos
- **Almacenamiento de fotos optimizado** con compresión automática
- **Consultas eficientes UTC-3** para reportes y historial basadas en fechas UTC-3 correctas
- **Eliminación segura (Solo Administrador)** de registros con verificación de integridad, validación de rol y actualización del historial

### Generación de Reportes con UTC-3 y Filtrado Backend (Todos los Roles)
- **Acceso de solo lectura** para todos los roles autenticados
- **Funciones backend UTC-3** `obtenerReporteDiario` y `obtenerReporteRango` que garantizan datos completos basados en fechas UTC-3 correctas:
  - **Consultas de base de datos UTC-3** que manejan errores y garantizan recuperación de todos los registros del período UTC-3
  - **Inclusión del campo "Dentro de rango de peso"** en todas las consultas y respuestas de reportes
  - **Inclusión del nombre del controlador** en todas las consultas y respuestas de reportes mediante joins con la tabla de controladores
  - **Validación de integridad UTC-3** que verifica que todos los registros del historial UTC-3 aparecen en los reportes
  - **Manejo de errores** con logging detallado y respuestas informativas
  - **Optimización de consultas UTC-3** para prevenir timeouts y fallos de carga
- **Generación de datos para PDF**:
  - **Endpoint específico** para obtener datos del día actual UTC-3 formateados para PDF
  - **Estructura de datos optimizada** que incluye todos los elementos necesarios para el PDF incluyendo nombres de controladores
  - **Cálculos agregados** de totales, porcentajes y estadísticas para el día actual
  - **Formato de datos** preparado para la generación del PDF en el frontend con información completa del controlador
- **Endpoints de filtrado dinámico**:
  - **Funciones de filtrado backend** que aplican criterios múltiples sobre los datos completos
  - **Filtrado por rango de fechas UTC-3** con validación de períodos
  - **Filtrado por tipo de defecto** que incluye/excluye registros según defectos específicos
  - **Filtrado por empacador** que filtra por identificador de empacador
  - **Filtrado por controlador** que filtra por identificador de controlador con soporte completo para consultas backend
  - **Filtrado por rango de peso** que filtra por estado "Sí"/"No"
  - **Combinación de filtros múltiples** aplicados simultáneamente incluyendo controlador
  - **Respuestas optimizadas** que incluyen solo los registros que cumplen todos los criterios con información completa del controlador
  - **Cálculos agregados filtrados** realizados en el backend para mejor rendimiento
- **Endpoints de reportes sincronizados UTC-3** que garantizan datos idénticos al historial:
  - **Consultas idénticas UTC-3** a las usadas para el historial sin variaciones ni filtros adicionales
  - **Validación cruzada automática UTC-3** entre datos de reportes y datos del historial antes de enviar respuestas
  - **Verificación de integridad UTC-3** que confirma que cada registro del historial UTC-3 aparece en los reportes
  - **Respuestas unificadas UTC-3** que usan exactamente la misma fuente de datos para reportes e historial
  - **Manejo robusto de errores** que previene respuestas vacías o incompletas
- **Consultas agregadas UTC-3**:
  - **Consultas de base de datos unificadas UTC-3** que usan exactamente los mismos criterios que el historial
  - **Agregaciones matemáticas verificadas UTC-3** contra la suma manual de registros del historial
  - **Joins correctos UTC-3** entre tablas de control de calidad y controladores sin pérdida de datos y sincronizados con el historial
  - **Filtrado eficiente UTC-3** que no excluye registros que aparecen en el historial
  - **Validación de resultados UTC-3** antes de enviar respuestas al frontend
- **Cálculos de métricas verificados UTC-3**:
  - **Conteo exacto UTC-3** de defectos por tipo usando exactamente los mismos registros del historial
  - **Cálculo correcto UTC-3** de porcentajes verificado contra datos reales del historial
  - **Totales agregados UTC-3** que coinciden exactamente con la suma de registros del historial
  - **Promedios ponderados UTC-3** calculados con los mismos datos que aparecen en el historial
  - **Estadísticas de rango de peso UTC-3** calculando conteos y porcentajes de muestras "Sí" y "No"
  - **Validación matemática UTC-3** de todos los cálculos antes de enviar al frontend
  - **Cálculos dinámicos filtrados** que recalculan métricas basadas solo en registros que cumplen criterios de filtro incluyendo filtro por controlador
- **Soporte completo UTC-3** para identificadores de tiempo con segundos en todos los endpoints
- **Validación de integridad UTC-3** de datos entre reportes e historial antes de enviar respuestas

### Gestión de Usuarios (Solo Administrador)
- **Validación de rol "Administrador"** antes de permitir cualquier operación de gestión de usuarios
- **Operaciones CRUD completamente funcionales** con validación completa y manejo de errores
- **Autenticación segura** con hash de contraseñas
- **Gestión de roles** con validación y persistencia:
  - Asignación de rol "Lectura" para acceso de solo lectura
  - Asignación de rol "Carga" para registro de datos
  - Asignación de rol "Administrador" para acceso completo
- **Auditoría de cambios** para trazabilidad

## Interfaz de Usuario PWA

### Inicialización PWA iOS con Autenticación
- **Pantalla de login** como punto de entrada obligatorio
- **Validación de credenciales** con manejo de errores robusto
- **Carga garantizada** de la aplicación después del login sin pantallas vacías, bloqueos o errores en PWA iOS
- **Montaje correcto** del componente principal con manejo de errores robusto específico para iOS
- **Navegación fluida** entre pestañas permitidas según el rol del usuario en modo standalone iOS
- **Recuperación automática** de fallos de inicialización específicos de PWA iOS
- **Detección de instalación PWA** para optimizar experiencia en modo standalone
- **Configuración específica iOS** para barra de estado y navegación nativa

### Diseño Responsive PWA
- **Compatibilidad móvil iOS** con diseño prioritario para dispositivos táctiles iPhone/iPad
- **Eliminación total** de scroll horizontal en todas las páginas, especialmente en reportes para PWA iOS
- **Navegación adaptativa** que se reorganiza apropiadamente en pantallas iPhone/iPad en modo standalone
- **Formularios optimizados** con campos apilados verticalmente y botones táctiles para iOS
- **Tablas de reportes responsivas** con formato de tarjetas automático en iPhone/iPad sin desbordamientos
- **Gráficos de reportes adaptativos** que se redimensionan manteniendo legibilidad perfecta en iOS
- **Controles de filtros optimizados** para interacción táctil iOS en reportes sin problemas de usabilidad
- **Adaptación a safe areas iOS** para dispositivos con notch o Dynamic Island
- **Orientación optimizada** para uso vertical en iPhone y horizontal/vertical en iPad

### Componentes Optimizados con UTC-3, PWA iOS y Control de Acceso
- **Pantalla de login** con:
  - **Formulario de autenticación** con campos de usuario y contraseña
  - **Validación en tiempo real** de credenciales
  - **Mensajes de error claros** en español
  - **Diseño responsivo** optimizado para dispositivos iOS
  - **Integración PWA** que funciona correctamente en modo standalone
- **Navegación basada en roles** que muestra/oculta pestañas según el rol del usuario:
  - **Todos los roles**: acceso a Reportes e Historial (solo visualización)
  - **Carga y Administrador**: acceso a RegistroControl
  - **Solo Administrador**: acceso a Configuración, Gestión de Usuarios y **Roles de Usuario**
- **Sección de Roles de Usuario (Solo Administrador)** con:
  - **Acceso restringido** exclusivamente a usuarios con rol "Administrador"
  - **Enlace o pestaña "Roles de usuario"** en la navegación del encabezado visible únicamente para usuarios administradores
  - **Página RolesUsuarios** que carga correctamente y muestra:
    - Lista completa de todos los usuarios registrados del sistema
    - Email/principal de cada usuario
    - Rol actual asignado a cada usuario
  - **Selectores desplegables** junto a cada usuario con opciones:
    - "Administrador"
    - "Carga de registros"
    - "Solo lectura"
  - **Botón "Guardar cambios"** que actualiza los roles usando la función backend `assignCallerUserRole`
  - **Mensajes de confirmación** que indican éxito o error de las operaciones
  - **Interfaz responsiva** optimizada para dispositivos móviles y escritorio
  - **Diseño consistente** con el esquema de colores blanco y dorado de la aplicación
  - **Contenido en español** para todas las etiquetas, mensajes y opciones
  - **Integración verificada** con la función backend de asignación de roles (`assignCallerUserRole`)
- **Formulario de registro UTC-3 (Carga y Administrador)** con:
  - **Acceso restringido** basado en rol del usuario
  - **Campo "Nombre de muestra" con actualización automática UTC-3** que muestra el próximo identificador de tiempo UTC-3 (HH:MM:SS) que será asignado
  - **Carga automática inicial UTC-3** del próximo identificador de tiempo UTC-3 desde el backend al abrir el formulario
  - **Actualización automática post-guardado UTC-3** que obtiene y muestra el siguiente identificador de tiempo UTC-3 disponible después de guardar
  - **Posicionamiento prominente** del campo de nombre de muestra antes de los campos de defectos
  - Campos de solo lectura para fecha UTC-3 e identificador de tiempo UTC-3 de muestra que serán asignados con conversión correcta
  - **Etiqueta fija "Variedad: Wonderful"** sin campo de selección
  - **Campo "Dentro de rango de peso"** con selector Sí/No obligatorio
  - **Campo "Controlador"** con selector desplegable obligatorio que muestra la lista de controladores activos
  - **Campos de defectos con comportamiento intuitivo de placeholder**:
    - **Limpieza automática de placeholder**: Los campos de defectos (Raset, Cracking, Golpe de sol, Podredumbre) automáticamente limpian el valor placeholder `0` cuando el usuario comienza a escribir
    - **Restauración automática**: Si un campo de defecto se deja vacío después de editar, automáticamente restaura el valor `0`
    - **Comportamiento consistente**: Esta funcionalidad se aplica a todos los campos de defectos en la sección de defectos del formulario
    - **Optimización móvil y escritorio**: El comportamiento funciona de manera intuitiva tanto en dispositivos móviles como de escritorio
  - Validación en tiempo real y guardado instantáneo
  - **Foto obligatoria con soporte PWA iOS**: Activación directa de cámara nativa en PWA instalada con permisos apropiados
  - **Mensaje de confirmación con datos UTC-3** mostrando: "Muestra [HH:MM:SS] registrada correctamente para el día [fecha UTC-3]" usando el identificador de tiempo UTC-3 específico
  - **Mensaje de error claro para duplicados UTC-3**: "Error: Ya existe una muestra con el identificador [HH:MM:SS] para esta fecha UTC-3"
  - **Sincronización automática UTC-3** que previene bloqueos y mantiene los identificadores UTC-3 correctos
  - **Funcionamiento idéntico en PWA iOS**: La lógica UTC-3 funciona de manera consistente en PWA instalada
- **Configuración de empacadores (Solo Administrador)** con:
  - **Acceso restringido** exclusivamente a usuarios con rol "Administrador"
  - **Interfaz fluida** y actualizaciones inmediatas sin recargas en PWA iOS
  - **Formulario de creación** que funciona correctamente en todos los casos
  - **Validación en tiempo real** que previene duplicados sin errores falsos
  - **Mensajes de éxito y error claros** en español con feedback visual inmediato
  - **Actualización automática** de la lista después de agregar nuevos empacadores
  - **Controles táctiles optimizados** para dispositivos iOS
- **Configuración de controladores (Solo Administrador)** con:
  - **Acceso restringido** exclusivamente a usuarios con rol "Administrador"
  - **Interfaz fluida** y actualizaciones inmediatas sin recargas en PWA iOS
  - **Formulario de creación** que funciona correctamente en todos los casos
  - **Validación en tiempo real** que previene duplicados sin errores falsos
  - **Mensajes de éxito y error claros** en español con feedback visual inmediato
  - **Actualización automática** de la lista después de agregar nuevos controladores
  - **Controles táctiles optimizados** para dispositivos iOS
- **Vista de reportes con filtrado dinámico y generación de PDF UTC-3 (Todos los Roles)** con:
  - **Acceso de visualización** para todos los roles autenticados
  - **Carga garantizada UTC-3** que previene errores de inicialización y muestra datos completos basados en fechas UTC-3 correctas
  - **Botón "Generar reporte PDF" prominente** ubicado en la parte superior de la página con estilo distintivo (fondo blanco, borde dorado) y visibilidad garantizada en PWA iOS
  - **Activación inmediata del PDF** que usa el módulo `pdfGenerator` existente para generar y abrir el PDF del día actual con datos filtrados
  - **Sistema de filtros interactivos** con controles intuitivos para rango de fechas, defectos, empacadores, **controladores** y rango de peso optimizados para iOS
  - **Filtro por controlador** con selector desplegable que lista todos los controladores disponibles con diseño responsivo
  - **Aplicación inmediata de filtros** que oculta registros no coincidentes sin recarga de página incluyendo filtro por controlador
  - **Actualización automática de estadísticas** que recalcula totales, porcentajes y métricas basándose solo en registros filtrados visibles
  - **Indicadores visuales de filtros activos** que muestran claramente qué criterios están aplicados incluyendo controlador seleccionado
  - **Botón para limpiar filtros** que restaura la vista completa de datos
  - **Combinación de múltiples filtros** aplicados simultáneamente con lógica AND incluyendo controlador
  - **Visualización del nombre del controlador** en todas las tablas de reportes junto con cada muestra registrada con diseño responsivo para móviles
  - **Funcionalidad de PDF** que incluye:
    - Fecha del reporte en UTC-3
    - Totales y porcentajes de defectos
    - Estadísticas de rango de peso
    - **Tabla condensada de controles registrados** (empacador, **nombre del controlador**, defectos principales, cantidad de muestras, hora de registro)
    - Diseño profesional con colores blanco y dorado
    - Nombre de archivo automático `Reporte_Diario_[fecha].pdf`
  - **Sincronización perfecta obligatoria UTC-3** con el historial sin discrepancias de ningún tipo
  - **Carga de exactamente las mismas muestras UTC-3** que aparecen en el historial antes del filtrado
  - **Validación automática continua UTC-3** que verifica que reportes e historial muestren datos idénticos basados en fechas UTC-3
  - **Cálculos matemáticos dinámicos verificados UTC-3** contra los datos filtrados en tiempo real
  - **Visualización del campo "Dentro de rango de peso"** en todos los reportes con etiquetas "Sí"/"No"
  - **Interfaz responsiva** que funciona perfectamente en iPhone/iPad y computadoras con fondo blanco consistente
  - **Indicadores y métricas correctos UTC-3** verificados contra el historial en tiempo real
  - **Visualización consistente UTC-3** de identificadores de tiempo con segundos
  - **Manejo robusto de errores** con mensajes informativos en español y recuperación automática
  - **Renderizado optimizado** que reduce lag y mejora el rendimiento en dispositivos iOS
- **Historial interactivo UTC-3 (Todos los Roles con Restricciones)** con:
  - **Acceso de visualización** para todos los roles autenticados
  - **Eliminación restringida** exclusivamente a usuarios con rol "Administrador"
  - Eliminación segura y filtros eficientes (incluyendo filtro por rango de peso y **controlador**)
  - **Filtro por controlador** con selector desplegable que lista todos los controladores disponibles con diseño responsivo
  - **Aplicación inmediata del filtro por controlador** que muestra solo registros del controlador seleccionado
  - **Combinación del filtro por controlador** con otros filtros existentes
  - Visualización de identificadores de tiempo UTC-3 automáticos por día como fuente de verdad
  - **Visualización del nombre del controlador** en todas las entradas del historial junto con cada muestra registrada con diseño responsivo para móviles
  - **Botón "Eliminar" visible solo para Administradores** con confirmación apropiada
- **Gestión de usuarios (Solo Administrador)** con:
  - **Acceso restringido** exclusivamente a usuarios con rol "Administrador"
  - Operaciones CRUD totalmente funcionales
  - **Asignación de roles** con selector desplegable que incluye "Lectura", "Carga" y "Administrador"
  - **Validación de roles** en tiempo real
  - **Interfaz optimizada** para dispositivos iOS

### Rendimiento y Estabilidad PWA
- **Carga rápida** de componentes con lazy loading inteligente, especialmente en reportes para PWA iOS
- **Actualizaciones en tiempo real** sin recargas de página y sin errores de estado en PWA instalada
- **Manejo de errores robusto** con recuperación automática y mensajes informativos específicos en español
- **Cache inteligente** para reducir latencia, especialmente en reportes con invalidación apropiada para PWA
- **Optimización de memoria** para prevenir degradación de rendimiento en reportes con grandes volúmenes en iOS
- **Validación de rendimiento** para mantener responsividad en iPhone/iPad y computadoras
- **Prevención de bloqueos UTC-3** durante la actualización automática de identificadores de muestra
- **Mejoras generales de rendimiento frontend** que reducen lag y aseguran actualizaciones consistentes de UI en dispositivos iOS
- **Renderizado optimizado** en todas las páginas principales (RegistroControl, Reportes, Historial, Roles de Usuario) para mejor rendimiento en PWA
- **Optimización de filtrado dinámico** que mantiene fluidez al aplicar múltiples criterios simultáneamente incluyendo filtro por controlador
- **Optimización de generación de PDF** que no bloquea la interfaz durante el proceso en PWA iOS
- **Gestión eficiente de Service Worker** para funcionamiento offline sin afectar funcionalidad core
- **Gestión de sesiones** optimizada que mantiene el estado de autenticación en PWA instalada

## Diseño Visual PWA

### Esquema de Colores Unificado PWA iOS
- **Fondo principal**: blanco puro (#FFFFFF) en todas las páginas y componentes, especialmente garantizado en reportes para PWA iOS
- **Texto principal**: negro (#000000) para máximo contraste y legibilidad en iOS
- **Elementos de acento**: dorado/beige (#BFA76F) para botones y resaltados consistente con tema iOS
- **Bordes y divisores**: gris claro (#E5E5E5) para separación visual
- **Encabezado**: fondo carbón suave (#1A1A1A) con elementos dorados
- **Barra de estado iOS**: configurada con color de tema dorado para PWA instalada
- **Splash screen iOS**: fondo blanco con logo Rimonim dorado centrado

### Optimización Visual PWA iOS
- **Eliminación completa** de temas oscuros y fondos inconsistentes para PWA iOS
- **Tipografía responsiva** con escalado apropiado para dispositivos iPhone/iPad
- **Espaciado optimizado** con márgenes y padding apropiados para interacción táctil iOS
- **Contraste garantizado** en todos los elementos interactivos para accesibilidad iOS
- **Iconografía consistente** con los assets existentes de Rimonim optimizados para iOS home screen
- **Adaptación a safe areas** para dispositivos iOS con notch o Dynamic Island
- **Transiciones nativas iOS** para navegación fluida en modo standalone

### Experiencia PWA Mejorada con UTC-3, iOS y Control de Acceso
- **Pantalla de login** con diseño profesional y colores consistentes con la aplicación
- **Indicadores visuales de rol** que muestran claramente el nivel de acceso del usuario
- **Navegación adaptativa** que oculta/muestra pestañas según el rol del usuario incluyendo "Roles de usuario" para administradores
- **Enlace o pestaña "Roles de usuario"** en la navegación del encabezado visible únicamente para usuarios administradores
- **Transiciones fluidas** entre páginas y estados sin errores en PWA iOS
- **Feedback visual inmediato** para todas las interacciones táctiles iOS
- **Estados de carga informativos** sin bloquear la interfaz, especialmente en reportes con indicadores específicos de progreso y sincronización
- **Adaptación automática** a modo standalone cuando se instala en iOS
- **Consistencia visual** en todas las resoluciones iPhone/iPad y orientaciones con fondo blanco garantizado en reportes
- **Validación visual clara** para campos obligatorios como la foto, el campo "Dentro de rango de peso" y el campo "Controlador" en PWA iOS
- **Indicadores claros UTC-3** para campos generados automáticamente (fecha UTC-3 e identificador de tiempo UTC-3 único de muestra) con conversión correcta
- **Etiqueta visual clara** que muestra "Variedad: Wonderful" sin campo de selección
- **Selector visual claro** para el campo "Dentro de rango de peso" con opciones Sí/No optimizado para iOS
- **Selector visual claro** para el campo "Controlador" con lista desplegable de controladores activos optimizado para iOS
- **Indicadores visuales de filtros activos** en reportes que muestran claramente qué criterios están aplicados incluyendo controlador seleccionado
- **Selector visual claro para filtro por controlador** en reportes e historial con lista desplegable de controladores disponibles optimizado para iOS
- **Feedback visual para filtrado dinámico** que indica cuando se están aplicando o removiendo filtros incluyendo filtro por controlador
- **Botón de PDF prominente y distintivo** con fondo blanco, borde dorado y posicionamiento fijo en la parte superior de la página de reportes
- **Indicador de progreso de PDF** durante la generación y descarga en PWA iOS
- **Mensajes de error informativos UTC-3** en reportes cuando hay problemas de sincronización con el historial
- **Mensajes de error específicos UTC-3** para intentos de duplicación de identificadores: "Error: Ya existe una muestra con el identificador [HH:MM:SS] para esta fecha UTC-3"
- **Contenido de la aplicación en español** en todas las secciones y mensajes
- **Validación visual UTC-3** de identificadores de tiempo correctos y sincronización entre reportes e historial
- **Feedback visual específico** para gestión de empacadores y controladores con indicadores claros de éxito, error y progreso
- **Visualización consistente UTC-3** de identificadores de tiempo de muestra con segundos en todas las secciones (Registro, Reportes, Historial)
- **Indicadores de carga específicos UTC-3** en reportes que muestran el progreso de sincronización con el backend
- **Vista previa clara UTC-3** del nombre de muestra en el formulario de registro con etiquetado apropiado y posicionamiento prominente
- **Indicadores de actualización automática UTC-3** que muestran cuando el campo "Nombre de muestra" se actualiza en tiempo real
- **Actualizaciones de UI consistentes** optimizadas para dispositivos iOS con mejor rendimiento
- **Funcionamiento visual idéntico** en PWA iOS instalada y navegador Safari
- **Integración nativa iOS** con iconos en home screen, splash screen personalizada y modo standalone completo
- **Visualización responsiva del nombre del controlador** en reportes e historial que se adapta apropiadamente a dispositivos móviles y escritorio
- **Visualización responsiva del filtro por controlador** en reportes e historial que se adapta apropiadamente a dispositivos móviles y escritorio
- **Indicadores visuales de permisos** que muestran claramente qué acciones están disponibles según el rol del usuario
- **Botones deshabilitados** con estilo visual claro para acciones no permitidas según el rol
- **Mensajes informativos** sobre restricciones de acceso cuando corresponda
- **Interfaz de gestión de roles** con:
  - **Tabla responsiva** que se adapta a dispositivos móviles y escritorio
  - **Selectores desplegables** con estilo consistente con el tema de la aplicación
  - **Botón "Guardar cambios"** con estilo dorado distintivo
  - **Mensajes de confirmación** con colores apropiados (verde para éxito, rojo para error)
  - **Indicadores de carga** durante las operaciones de actualización de roles

## Validaciones y Pruebas de Funcionalidad

### Validaciones de Integridad del Sistema UTC-3, PWA iOS y Control de Acceso
- **Verificación de autenticación** en todas las operaciones desde PWA iOS
- **Validación de roles** en cada acción del usuario según los permisos asignados
- **Verificación de comunicación backend-frontend UTC-3** en todas las operaciones CRUD desde PWA iOS
- **Pruebas de sincronización UTC-3** entre reportes e historial para garantizar datos idénticos basados en fechas UTC-3 correctas
- **Validación de identificadores de tiempo UTC-3** únicos y consistentes en todas las secciones
- **Validación del campo "Dentro de rango de peso"** en todas las operaciones de registro, historial y reportes
- **Validación del campo "Controlador"** en todas las operaciones de registro, historial y reportes
- **Validación de visualización del nombre del controlador** en reportes e historial con diseño responsivo apropiado
- **Validación del filtro por controlador** en reportes e historial con funcionamiento correcto del selector desplegable
- **Validación de la gestión de roles de usuario** con:
  - **Verificación de acceso restringido** exclusivamente a administradores
  - **Pruebas de actualización de roles** usando la función `assignCallerUserRole`
  - **Validación de mensajes de confirmación** para éxito y error
  - **Verificación de interfaz responsiva** en dispositivos móviles y escritorio
  - **Validación de visibilidad del enlace "Roles de usuario"** en la navegación del encabezado solo para administradores
  - **Verificación de carga correcta de la página RolesUsuarios** con lista de usuarios y roles
- **Pruebas de rendimiento** en iPhone/iPad y dispositivos de escritorio
- **Verificación de carga de datos UTC-3** sin omisiones en todas las pestañas desde PWA instalada
- **Validación de conversión de zona horaria** para asegurar que las fechas mostradas corresponden exactamente al día de trabajo UTC-3
- **Pruebas de filtrado dinámico** para verificar que los filtros se aplican correctamente incluyendo filtro por controlador y las estadísticas se recalculan apropiadamente
- **Validación de generación de PDF** para verificar que el contenido es correcto, incluye nombres de controladores, la descarga funciona apropiadamente y el botón es claramente visible en PWA iOS
- **Pruebas de instalabilidad PWA** en Safari iOS para verificar proceso "Agregar a pantalla de inicio"
- **Validación de funcionamiento offline** básico sin afectar funcionalidad core
- **Pruebas de acceso a cámara** desde PWA instalada en iOS
- **Validación de iconos y splash screen** en diferentes dispositivos iOS
- **Pruebas de control de acceso** para verificar que cada rol tiene acceso solo a las funciones permitidas incluyendo la nueva sección de roles de usuario
- **Validación de sesiones** para asegurar persistencia y seguridad en PWA instalada

### Pruebas de Funcionalidad por Sección UTC-3, PWA iOS y Roles
- **Login**: Validar autenticación correcta, manejo de errores, persistencia de sesión en PWA iOS
- **Registro (Carga y Administrador)**: Validar generación automática de identificadores UTC-3 con fecha correcta, guardado de fotos desde PWA iOS, campo "Dentro de rango de peso" obligatorio, campo "Controlador" obligatorio, comportamiento intuitivo de placeholder en campos de defectos, actualización en tiempo real y restricción de acceso por rol
- **Reportes (Todos los Roles)**: Verificar carga completa de datos UTC-3 con fechas exactas, aplicación correcta de filtros dinámicos incluyendo **filtro por controlador**, cálculos matemáticos correctos de datos filtrados, visualización del campo "Dentro de rango de peso", **visualización del nombre del controlador**, generación funcional de PDF del día actual con botón prominente y claramente visible en PWA iOS, sincronización con historial y acceso de solo lectura para todos los roles
- **Historial (Todos los Roles con Restricciones)**: Confirmar visualización completa UTC-3 con fechas correctas, filtros funcionales (incluyendo filtro por rango de peso y **controlador**), **visualización del nombre del controlador**, eliminación segura solo para Administradores desde PWA iOS y acceso de visualización para todos los roles
- **Configuración (Solo Administrador)**: Probar operaciones CRUD de empacadores y controladores sin errores en PWA instalada, validar acceso restringido exclusivamente a Administradores
- **Gestión de Usuarios (Solo Administrador)**: Validar gestión completa de usuarios y roles desde PWA iOS, asignación correcta de roles, validar acceso restringido exclusivamente a Administradores
- **Roles de Usuario (Solo Administrador)**: Validar visibilidad del enlace "Roles de usuario" en la navegación del encabezado solo para administradores, carga correcta de la página RolesUsuarios, visualización de tabla de usuarios, funcionamiento de selectores desplegables, actualización correcta de roles usando `assignCallerUserRole`, mensajes de confirmación apropiados, interfaz responsiva y acceso restringido exclusivamente a Administradores
- **PWA iOS**: Verificar instalación, iconos, splash screen, modo standalone, acceso a cámara, funcionamiento offline y autenticación persistente

### Criterios de Éxito UTC-3, PWA iOS y Control de Acceso
- **Sistema de autenticación funcional** con login obligatorio y validación de credenciales
- **Control de acceso por roles** que restringe apropiadamente las funciones según el perfil del usuario
- **Navegación adaptativa** que muestra/oculta pestañas según el rol del usuario incluyendo "Roles de usuario" para administradores
- **Enlace "Roles de usuario" visible** en la navegación del encabezado únicamente para usuarios administradores
- **Página RolesUsuarios funcional** que carga correctamente y muestra la lista de usuarios registrados con sus roles
- **Gestión de roles de usuario funcional** con tabla de usuarios, selectores desplegables, actualización usando `assignCallerUserRole` y mensajes de confirmación
- **Integración verificada** con la función backend de asignación de roles (`assignCallerUserRole`)
- **Todas las pestañas permitidas cargan sin errores** ni pantallas en blanco desde PWA iOS instalada
- **Comunicación backend-frontend funcional UTC-3** en todas las operaciones desde PWA con validación de roles
- **Reportes e historial muestran datos idénticos UTC-3** sin omisiones y con fechas exactas para todos los roles
- **Sistema de filtrado dinámico funcional** que oculta registros no coincidentes y recalcula estadísticas correctamente incluyendo **filtro por controlador** para todos los roles
- **Campo "Dentro de rango de peso" funcional** en registro, historial y reportes
- **Campo "Controlador" funcional** en registro, historial y reportes
- **Visualización del nombre del controlador funcional** en reportes e historial con diseño responsivo apropiado
- **Filtro por controlador funcional** en reportes e historial con selector desplegable que lista todos los controladores disponibles
- **Campos de defectos con comportamiento intuitivo** que limpian automáticamente el placeholder `0` al escribir y restauran el valor `0` si se dejan vacíos
- **Generación de PDF funcional** con botón prominente y claramente visible, descarga automática, contenido correcto del día actual UTC-3 incluyendo nombres de controladores desde PWA iOS para todos los roles
- **Eliminación de registros restringida** exclusivamente a usuarios con rol "Administrador"
- **Configuración de empacadores y controladores restringida** exclusivamente a usuarios con rol "Administrador"
- **Gestión de usuarios restringida** exclusivamente a usuarios con rol "Administrador"
- **Gestión de roles de usuario restringida** exclusivamente a usuarios con rol "Administrador"
- **Registro de controles restringido** a usuarios con rol "Carga" o "Administrador"
- **Fechas mostradas corresponden exactamente al día de trabajo UTC-3** sin adelantarse ni atrasarse
- **Rendimiento optimizado** en iPhone/iPad y escritorio
- **Interfaz completamente en español** con mensajes de error informativos
- **Operación consistente en UTC-3** para todas las funciones de fecha y hora con conversión correcta
- **Filtros aplicados instantáneamente** sin recargas de página y con actualización automática de métricas incluyendo filtro por controlador
- **PWA completamente funcional en iOS** con instalación desde Safari, iconos apropiados, splash screen, modo standalone, acceso a cámara y autenticación persistente
- **Funcionamiento offline básico** sin afectar funcionalidad core de la aplicación
- **Experiencia nativa iOS** cuando se instala como PWA con navegación fluida y controles táctiles optimizados
- **Sesiones persistentes** que mantienen la autenticación del usuario en PWA instalada
- **Validación de permisos** en tiempo real que previene acciones no autorizadas
