import OrderedMap "mo:base/OrderedMap";
import Array "mo:base/Array";
import Iter "mo:base/Iter";
import Text "mo:base/Text";
import Int "mo:base/Int";
import Debug "mo:base/Debug";
import Principal "mo:base/Principal";
import Time "mo:base/Time";
import Float "mo:base/Float";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import AccessControl "authorization/access-control";
import Migration "migration";

(with migration = Migration.run)
actor Backend {
  let storage = Storage.new();
  include MixinStorage(storage);

  // Initialize the access control system
  let accessControlState = AccessControl.initState();

  public type Defecto = {
    #raset;
    #cracking;
    #golpeSol;
    #podredumbre;
  };

  public type DefectoCantidad = {
    defecto : Defecto;
    cantidad : Nat;
  };

  public type Empacador = {
    id : Text;
    identificador : Text;
    color : Text;
    activo : Bool;
  };

  public type Controlador = {
    id : Text;
    nombre : Text;
    activo : Bool;
  };

  public type ControlCalidad = {
    id : Text;
    lote : Text;
    fecha : Int;
    defectos : [DefectoCantidad];
    foto : ?Storage.ExternalBlob;
    cantidadMuestras : Nat;
    empacadorId : Text;
    controladorId : Text;
    horaRegistro : Text;
    dentroRangoPeso : Bool;
  };

  public type Filtro = {
    fechaInicio : ?Int;
    fechaFin : ?Int;
    defecto : ?Defecto;
    empacadorId : ?Text;
    controladorId : ?Text;
    dentroRangoPeso : ?Bool;
  };

  public type ReporteDiario = {
    fecha : Int;
    controles : [ControlCalidad];
    totalDefectosPorTipo : [(Defecto, Nat)];
    totalMuestras : Nat;
    totalFrutasAfectadas : Nat;
    totalFrutasSinDefectos : Nat;
    porcentajeDefectos : Float;
    porcentajeSinDefectos : Float;
    totalDentroRangoPeso : Nat;
    totalFueraRangoPeso : Nat;
    porcentajeDentroRangoPeso : Float;
    porcentajeFueraRangoPeso : Float;
  };

  public type ReporteRango = {
    fechaInicio : Int;
    fechaFin : Int;
    controles : [ControlCalidad];
    totalDefectosPorTipo : [(Defecto, Nat)];
    totalMuestras : Nat;
    totalFrutasAfectadas : Nat;
    totalFrutasSinDefectos : Nat;
    porcentajeDefectos : Float;
    porcentajeSinDefectos : Float;
    totalDentroRangoPeso : Nat;
    totalFueraRangoPeso : Nat;
    porcentajeDentroRangoPeso : Float;
    porcentajeFueraRangoPeso : Float;
  };

  public type MuestraPlanilla = {
    id : Text;
    lote : Text;
    fecha : Int;
    cantidadMuestras : Nat;
    empacador : Empacador;
    controlador : Controlador;
    defectos : [DefectoCantidad];
    foto : ?Storage.ExternalBlob;
    horaRegistro : Text;
    dentroRangoPeso : Bool;
  };

  public type UserProfile = {
    name : Text;
  };

  public type ControlCalidadConControlador = {
    control : ControlCalidad;
    controlador : Controlador;
  };

  public type ReporteDiarioConControlador = {
    fecha : Int;
    controles : [ControlCalidadConControlador];
    totalDefectosPorTipo : [(Defecto, Nat)];
    totalMuestras : Nat;
    totalFrutasAfectadas : Nat;
    totalFrutasSinDefectos : Nat;
    porcentajeDefectos : Float;
    porcentajeSinDefectos : Float;
    totalDentroRangoPeso : Nat;
    totalFueraRangoPeso : Nat;
    porcentajeDentroRangoPeso : Float;
    porcentajeFueraRangoPeso : Float;
  };

  public type ReporteRangoConControlador = {
    fechaInicio : Int;
    fechaFin : Int;
    controles : [ControlCalidadConControlador];
    totalDefectosPorTipo : [(Defecto, Nat)];
    totalMuestras : Nat;
    totalFrutasAfectadas : Nat;
    totalFrutasSinDefectos : Nat;
    porcentajeDefectos : Float;
    porcentajeSinDefectos : Float;
    totalDentroRangoPeso : Nat;
    totalFueraRangoPeso : Nat;
    porcentajeDentroRangoPeso : Float;
    porcentajeFueraRangoPeso : Float;
  };

  public type UserWithRole = {
    principal : Principal;
    profile : ?UserProfile;
    role : AccessControl.UserRole;
  };

  transient let textMap = OrderedMap.Make<Text>(Text.compare);
  transient let principalMap = OrderedMap.Make<Principal>(Principal.compare);
  var controles : OrderedMap.Map<Text, ControlCalidad> = textMap.empty();
  var empacadores : OrderedMap.Map<Text, Empacador> = textMap.empty();
  var controladores : OrderedMap.Map<Text, Controlador> = textMap.empty();
  var userProfiles : OrderedMap.Map<Principal, UserProfile> = principalMap.empty();

  // Required AccessControl functions
  public shared ({ caller }) func initializeAccessControl() : async () {
    AccessControl.initialize(accessControlState, caller);
    // Note: To assign admin roles to specific principals (jonysued1@hotmail.com and jonatan@rimonim.com.ar),
    // you must first obtain their actual Principal IDs through Internet Identity authentication,
    // then call setUserRole() with those principals and #admin role.
  };

  public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
    AccessControl.getUserRole(accessControlState, caller);
  };

  public query ({ caller }) func isCallerAdmin() : async Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("No autorizado: Solo usuarios pueden ver perfiles");
    };
    principalMap.get(userProfiles, caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Debug.trap("No autorizado: Solo puedes ver tu propio perfil");
    };
    principalMap.get(userProfiles, user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("No autorizado: Solo usuarios pueden guardar perfiles");
    };
    userProfiles := principalMap.put(userProfiles, caller, profile);
  };

  // Admin-only function to assign a role to a user
  public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
    // Admin-only check is performed inside AccessControl.assignRole
    AccessControl.assignRole(accessControlState, caller, user, role);
  };

  func getCurrentTimeUTC3() : Int {
    let nowNanos = Time.now();
    let nowSeconds = nowNanos / 1_000_000_000;
    let utc3Seconds = nowSeconds - 10_800;
    utc3Seconds;
  };

  func getCurrentDateUTC3() : Int {
    let utc3Seconds = getCurrentTimeUTC3();
    let daysSinceEpoch = utc3Seconds / 86_400;
    let midnightSeconds = daysSinceEpoch * 86_400;
    midnightSeconds;
  };

  func getCurrentTimeHHMMSSUTC3() : Text {
    let utc3Seconds = getCurrentTimeUTC3();
    let secondsInDay = utc3Seconds % 86_400;
    let hours = secondsInDay / 3_600;
    let minutes = (secondsInDay % 3_600) / 60;
    let secs = secondsInDay % 60;

    let hoursText = if (hours < 10) { "0" # Int.toText(hours) } else { Int.toText(hours) };
    let minutesText = if (minutes < 10) { "0" # Int.toText(minutes) } else { Int.toText(minutes) };
    let secsText = if (secs < 10) { "0" # Int.toText(secs) } else { Int.toText(secs) };

    hoursText # ":" # minutesText # ":" # secsText;
  };

  // Empacador management - Admin only
  public shared ({ caller }) func agregarEmpacador(identificador : Text, color : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("No autorizado: Solo administradores pueden agregar empacadores");
    };

    let id = Text.concat(identificador, color);
    let empacadoresExistentes = Iter.toArray(textMap.vals(empacadores));
    let existeEmpacadorActivo = Array.find<Empacador>(
      empacadoresExistentes,
      func(empacador) { empacador.identificador == identificador and empacador.activo },
    );

    switch (existeEmpacadorActivo) {
      case (?_) {
        Debug.trap("Ya existe un empacador activo con este identificador");
      };
      case (null) {
        let empacador : Empacador = {
          id;
          identificador;
          color;
          activo = true;
        };
        empacadores := textMap.put(empacadores, id, empacador);
        id;
      };
    };
  };

  public shared ({ caller }) func modificarEmpacador(id : Text, nuevoIdentificador : Text, nuevoColor : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("No autorizado: Solo administradores pueden modificar empacadores");
    };

    switch (textMap.get(empacadores, id)) {
      case (null) {
        Debug.trap("Empacador no encontrado");
      };
      case (?empacador) {
        let empacadoresExistentes = Iter.toArray(textMap.vals(empacadores));
        let existeEmpacadorActivo = Array.find<Empacador>(
          empacadoresExistentes,
          func(e) { e.identificador == nuevoIdentificador and e.id != id and e.activo },
        );

        switch (existeEmpacadorActivo) {
          case (?_) {
            Debug.trap("Ya existe un empacador activo con este identificador");
          };
          case (null) {
            let empacadorModificado : Empacador = {
              empacador with
              identificador = nuevoIdentificador;
              color = nuevoColor;
            };
            empacadores := textMap.put(empacadores, id, empacadorModificado);
            id;
          };
        };
      };
    };
  };

  public shared ({ caller }) func eliminarEmpacador(id : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("No autorizado: Solo administradores pueden eliminar empacadores");
    };

    switch (textMap.get(empacadores, id)) {
      case (null) {
        Debug.trap("Empacador no encontrado");
      };
      case (?empacador) {
        let empacadorEliminado : Empacador = {
          empacador with
          activo = false;
        };
        empacadores := textMap.put(empacadores, id, empacadorEliminado);
        id;
      };
    };
  };

  public query ({ caller }) func obtenerEmpacadoresActivos() : async [Empacador] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("No autorizado: Solo usuarios pueden ver empacadores");
    };
    let todos = Iter.toArray(textMap.vals(empacadores));
    Array.filter<Empacador>(todos, func(empacador) { empacador.activo });
  };

  // Controlador management - Admin only
  public shared ({ caller }) func agregarControlador(nombre : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("No autorizado: Solo administradores pueden agregar controladores");
    };

    let id = nombre;
    let controladoresExistentes = Iter.toArray(textMap.vals(controladores));
    let existeControladorActivo = Array.find<Controlador>(
      controladoresExistentes,
      func(controlador) { controlador.nombre == nombre and controlador.activo },
    );

    switch (existeControladorActivo) {
      case (?_) {
        Debug.trap("Ya existe un controlador activo con este nombre");
      };
      case (null) {
        let controlador : Controlador = {
          id;
          nombre;
          activo = true;
        };
        controladores := textMap.put(controladores, id, controlador);
        id;
      };
    };
  };

  public shared ({ caller }) func modificarControlador(id : Text, nuevoNombre : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("No autorizado: Solo administradores pueden modificar controladores");
    };

    switch (textMap.get(controladores, id)) {
      case (null) {
        Debug.trap("Controlador no encontrado");
      };
      case (?controlador) {
        let controladoresExistentes = Iter.toArray(textMap.vals(controladores));
        let existeControladorActivo = Array.find<Controlador>(
          controladoresExistentes,
          func(c) { c.nombre == nuevoNombre and c.id != id and c.activo },
        );

        switch (existeControladorActivo) {
          case (?_) {
            Debug.trap("Ya existe un controlador activo con este nombre");
          };
          case (null) {
            let controladorModificado : Controlador = {
              controlador with
              nombre = nuevoNombre;
            };
            controladores := textMap.put(controladores, id, controladorModificado);
            id;
          };
        };
      };
    };
  };

  public shared ({ caller }) func eliminarControlador(id : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("No autorizado: Solo administradores pueden eliminar controladores");
    };

    switch (textMap.get(controladores, id)) {
      case (null) {
        Debug.trap("Controlador no encontrado");
      };
      case (?controlador) {
        let controladorEliminado : Controlador = {
          controlador with
          activo = false;
        };
        controladores := textMap.put(controladores, id, controladorEliminado);
        id;
      };
    };
  };

  public query ({ caller }) func obtenerControladoresActivos() : async [Controlador] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("No autorizado: Solo usuarios pueden ver controladores");
    };
    let todos = Iter.toArray(textMap.vals(controladores));
    Array.filter<Controlador>(todos, func(controlador) { controlador.activo });
  };

  // Quality control registration - Users and Admins only
  public shared ({ caller }) func registrarControl(defectos : [DefectoCantidad], foto : ?Storage.ExternalBlob, cantidadMuestras : Nat, empacadorId : Text, controladorId : Text, dentroRangoPeso : Bool) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("No autorizado: Solo usuarios con rol Carga o Administrador pueden registrar controles");
    };

    switch (foto) {
      case (null) {
        Debug.trap("Debes tomar una foto para continuar");
      };
      case (?_) {
        if (defectos.size() > 0) {
          let totalDefectos = Array.foldLeft<DefectoCantidad, Nat>(
            defectos,
            0,
            func(acc, defecto) { acc + defecto.cantidad },
          );

          if (totalDefectos > cantidadMuestras) {
            Debug.trap("La suma de defectos no puede exceder la cantidad de muestras");
          };
        };

        let fechaActual = getCurrentDateUTC3();
        let horaRegistro = getCurrentTimeHHMMSSUTC3();

        let controlesDia = Array.filter<ControlCalidad>(
          Iter.toArray(textMap.vals(controles)),
          func(control) { control.fecha == fechaActual },
        );

        let existeMismaHora = Array.find<ControlCalidad>(
          controlesDia,
          func(control) { control.horaRegistro == horaRegistro },
        );

        switch (existeMismaHora) {
          case (?_) {
            Debug.trap("Ya existe una muestra con el identificador " # horaRegistro # " para esta fecha");
          };
          case (null) {
            let id = Text.concat(Int.toText(fechaActual), horaRegistro);

            let control : ControlCalidad = {
              id;
              lote = horaRegistro;
              fecha = fechaActual;
              defectos;
              foto;
              cantidadMuestras;
              empacadorId;
              controladorId;
              horaRegistro;
              dentroRangoPeso;
            };
            controles := textMap.put(controles, id, control);
            id;
          };
        };
      };
    };
  };

  public shared ({ caller }) func eliminarControl(id : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("No autorizado: Solo administradores pueden eliminar controles");
    };

    switch (textMap.get(controles, id)) {
      case (null) {
        Debug.trap("Control de calidad no encontrado");
      };
      case (?_) {
        controles := textMap.delete(controles, id);
        id;
      };
    };
  };

  public query ({ caller }) func obtenerProximoIdentificador() : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("No autorizado: Solo usuarios pueden obtener identificadores");
    };
    getCurrentTimeHHMMSSUTC3();
  };

  public query ({ caller }) func obtenerIdentificadoresParaConvertir() : async [(Text, Bool)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("No autorizado: Solo usuarios pueden obtener identificadores");
    };
    let todos = Iter.toArray(textMap.vals(controles));
    let identificadores = Array.map<ControlCalidad, (Text, Bool)>(todos, func(control) { (control.id, true) });
    identificadores;
  };

  public query ({ caller }) func obtenerControl(id : Text) : async ?ControlCalidad {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("No autorizado: Solo usuarios pueden ver controles");
    };
    textMap.get(controles, id);
  };

  public query ({ caller }) func obtenerControlesFiltrados(filtro : Filtro) : async [ControlCalidadConControlador] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("No autorizado: Solo usuarios pueden ver controles");
    };
    let todos = Iter.toArray(textMap.vals(controles));
    let filtrados = Array.filter<ControlCalidad>(
      todos,
      func(control) {
        let fechaValida = switch (filtro.fechaInicio, filtro.fechaFin) {
          case (null, null) { true };
          case (?inicio, null) { control.fecha >= inicio };
          case (null, ?fin) { control.fecha <= fin };
          case (?inicio, ?fin) { control.fecha >= inicio and control.fecha <= fin };
        };

        let defectoValido = switch (filtro.defecto) {
          case (null) { true };
          case (?d) {
            Array.find<DefectoCantidad>(control.defectos, func(defecto) { defecto.defecto == d }) != null;
          };
        };

        let empacadorValido = switch (filtro.empacadorId) {
          case (null) { true };
          case (?e) { control.empacadorId == e };
        };

        let controladorValido = switch (filtro.controladorId) {
          case (null) { true };
          case (?c) { control.controladorId == c };
        };

        let rangoPesoValido = switch (filtro.dentroRangoPeso) {
          case (null) { true };
          case (?rango) { control.dentroRangoPeso == rango };
        };

        fechaValida and defectoValido and empacadorValido and controladorValido and rangoPesoValido
      },
    );

    Array.map<ControlCalidad, ControlCalidadConControlador>(
      filtrados,
      func(control) {
        let controlador = switch (textMap.get(controladores, control.controladorId)) {
          case (null) {
            {
              id = control.controladorId;
              nombre = "Desconocido";
              activo = false;
            };
          };
          case (?c) { c };
        };
        { control; controlador };
      },
    );
  };

  public query ({ caller }) func obtenerHistorial() : async [ControlCalidadConControlador] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("No autorizado: Solo usuarios pueden ver el historial");
    };
    let todos = Iter.toArray(textMap.vals(controles));
    Array.map<ControlCalidad, ControlCalidadConControlador>(
      todos,
      func(control) {
        let controlador = switch (textMap.get(controladores, control.controladorId)) {
          case (null) {
            {
              id = control.controladorId;
              nombre = "Desconocido";
              activo = false;
            };
          };
          case (?c) { c };
        };
        { control; controlador };
      },
    );
  };

  public query ({ caller }) func obtenerReporteDiario(fecha : Int) : async ?ReporteDiarioConControlador {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("No autorizado: Solo usuarios pueden ver reportes");
    };
    let controlesDia = Array.filter<ControlCalidad>(
      Iter.toArray(textMap.vals(controles)),
      func(control) { control.fecha == fecha },
    );

    if (controlesDia.size() == 0) {
      return null;
    };

    let controlesConControlador = Array.map<ControlCalidad, ControlCalidadConControlador>(
      controlesDia,
      func(control) {
        let controlador = switch (textMap.get(controladores, control.controladorId)) {
          case (null) {
            {
              id = control.controladorId;
              nombre = "Desconocido";
              activo = false;
            };
          };
          case (?c) { c };
        };
        { control; controlador };
      },
    );

    let totalDefectosPorTipo = Array.map<Defecto, (Defecto, Nat)>(
      [#raset, #cracking, #golpeSol, #podredumbre],
      func(defecto) {
        let total = Array.foldLeft<ControlCalidad, Nat>(
          controlesDia,
          0,
          func(acc, control) {
            let cantidad = switch (Array.find<DefectoCantidad>(control.defectos, func(d) { d.defecto == defecto })) {
              case (null) { 0 };
              case (?d) { d.cantidad };
            };
            acc + cantidad;
          },
        );
        (defecto, total);
      },
    );

    let totalMuestras = Array.foldLeft<ControlCalidad, Nat>(
      controlesDia,
      0,
      func(acc, control) { acc + control.cantidadMuestras },
    );

    let totalFrutasAfectadas = Array.foldLeft<ControlCalidad, Nat>(
      controlesDia,
      0,
      func(acc, control) {
        acc + Array.foldLeft<DefectoCantidad, Nat>(
          control.defectos,
          0,
          func(acc2, defecto) { acc2 + defecto.cantidad },
        );
      },
    );

    let totalFrutasSinDefectos : Nat = if (totalMuestras > totalFrutasAfectadas) {
      totalMuestras - totalFrutasAfectadas;
    } else { 0 };

    let porcentajeDefectos : Float = if (totalMuestras > 0) {
      Float.fromInt(totalFrutasAfectadas) / Float.fromInt(totalMuestras) * 100.0;
    } else { 0.0 };

    let porcentajeSinDefectos : Float = if (totalMuestras > 0) {
      Float.fromInt(totalFrutasSinDefectos) / Float.fromInt(totalMuestras) * 100.0;
    } else { 0.0 };

    let totalDentroRangoPeso = Array.foldLeft<ControlCalidad, Nat>(
      controlesDia,
      0,
      func(acc, control) {
        if (control.dentroRangoPeso) { acc + 1 } else { acc };
      },
    );

    let totalFueraRangoPeso = Array.foldLeft<ControlCalidad, Nat>(
      controlesDia,
      0,
      func(acc, control) {
        if (not control.dentroRangoPeso) { acc + 1 } else { acc };
      },
    );

    let porcentajeDentroRangoPeso : Float = if (controlesDia.size() > 0) {
      Float.fromInt(totalDentroRangoPeso) / Float.fromInt(controlesDia.size()) * 100.0;
    } else { 0.0 };

    let porcentajeFueraRangoPeso : Float = if (controlesDia.size() > 0) {
      Float.fromInt(totalFueraRangoPeso) / Float.fromInt(controlesDia.size()) * 100.0;
    } else { 0.0 };

    ?{
      fecha;
      controles = controlesConControlador;
      totalDefectosPorTipo;
      totalMuestras;
      totalFrutasAfectadas;
      totalFrutasSinDefectos;
      porcentajeDefectos;
      porcentajeSinDefectos;
      totalDentroRangoPeso;
      totalFueraRangoPeso;
      porcentajeDentroRangoPeso;
      porcentajeFueraRangoPeso;
    };
  };

  public query ({ caller }) func obtenerReporteRango(fechaInicio : Int, fechaFin : Int) : async ?ReporteRangoConControlador {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("No autorizado: Solo usuarios pueden ver reportes");
    };
    let controlesRango = Array.filter<ControlCalidad>(
      Iter.toArray(textMap.vals(controles)),
      func(control) { control.fecha >= fechaInicio and control.fecha <= fechaFin },
    );

    if (controlesRango.size() == 0) {
      return null;
    };

    let controlesConControlador = Array.map<ControlCalidad, ControlCalidadConControlador>(
      controlesRango,
      func(control) {
        let controlador = switch (textMap.get(controladores, control.controladorId)) {
          case (null) {
            {
              id = control.controladorId;
              nombre = "Desconocido";
              activo = false;
            };
          };
          case (?c) { c };
        };
        { control; controlador };
      },
    );

    let totalDefectosPorTipo = Array.map<Defecto, (Defecto, Nat)>(
      [#raset, #cracking, #golpeSol, #podredumbre],
      func(defecto) {
        let total = Array.foldLeft<ControlCalidad, Nat>(
          controlesRango,
          0,
          func(acc, control) {
            let cantidad = switch (Array.find<DefectoCantidad>(control.defectos, func(d) { d.defecto == defecto })) {
              case (null) { 0 };
              case (?d) { d.cantidad };
            };
            acc + cantidad;
          },
        );
        (defecto, total);
      },
    );

    let totalMuestras = Array.foldLeft<ControlCalidad, Nat>(
      controlesRango,
      0,
      func(acc, control) { acc + control.cantidadMuestras },
    );

    let totalFrutasAfectadas = Array.foldLeft<ControlCalidad, Nat>(
      controlesRango,
      0,
      func(acc, control) {
        acc + Array.foldLeft<DefectoCantidad, Nat>(
          control.defectos,
          0,
          func(acc2, defecto) { acc2 + defecto.cantidad },
        );
      },
    );

    let totalFrutasSinDefectos : Nat = if (totalMuestras > totalFrutasAfectadas) {
      totalMuestras - totalFrutasAfectadas;
    } else { 0 };

    let porcentajeDefectos : Float = if (totalMuestras > 0) {
      Float.fromInt(totalFrutasAfectadas) / Float.fromInt(totalMuestras) * 100.0;
    } else { 0.0 };

    let porcentajeSinDefectos : Float = if (totalMuestras > 0) {
      Float.fromInt(totalFrutasSinDefectos) / Float.fromInt(totalMuestras) * 100.0;
    } else { 0.0 };

    let totalDentroRangoPeso = Array.foldLeft<ControlCalidad, Nat>(
      controlesRango,
      0,
      func(acc, control) {
        if (control.dentroRangoPeso) { acc + 1 } else { acc };
      },
    );

    let totalFueraRangoPeso = Array.foldLeft<ControlCalidad, Nat>(
      controlesRango,
      0,
      func(acc, control) {
        if (not control.dentroRangoPeso) { acc + 1 } else { acc };
      },
    );

    let porcentajeDentroRangoPeso : Float = if (controlesRango.size() > 0) {
      Float.fromInt(totalDentroRangoPeso) / Float.fromInt(controlesRango.size()) * 100.0;
    } else { 0.0 };

    let porcentajeFueraRangoPeso : Float = if (controlesRango.size() > 0) {
      Float.fromInt(totalFueraRangoPeso) / Float.fromInt(controlesRango.size()) * 100.0;
    } else { 0.0 };

    ?{
      fechaInicio;
      fechaFin;
      controles = controlesConControlador;
      totalDefectosPorTipo;
      totalMuestras;
      totalFrutasAfectadas;
      totalFrutasSinDefectos;
      porcentajeDefectos;
      porcentajeSinDefectos;
      totalDentroRangoPeso;
      totalFueraRangoPeso;
      porcentajeDentroRangoPeso;
      porcentajeFueraRangoPeso;
    };
  };

  public query ({ caller }) func obtenerReportesPorRango(fechaInicio : Int, fechaFin : Int) : async [ReporteDiarioConControlador] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("No autorizado: Solo usuarios pueden ver reportes");
    };
    let controlesRango = Array.filter<ControlCalidad>(
      Iter.toArray(textMap.vals(controles)),
      func(control) { control.fecha >= fechaInicio and control.fecha <= fechaFin },
    );

    let fechasUnicas = Array.map<Int, Int>(
      Array.sort<Int>(
        Array.map<ControlCalidad, Int>(controlesRango, func(c) { c.fecha }),
        Int.compare,
      ),
      func(fecha) { fecha },
    );

    Array.map<Int, ReporteDiarioConControlador>(
      fechasUnicas,
      func(fecha) {
        let controlesDia = Array.filter<ControlCalidad>(controlesRango, func(c) { c.fecha == fecha });

        let controlesConControlador = Array.map<ControlCalidad, ControlCalidadConControlador>(
          controlesDia,
          func(control) {
            let controlador = switch (textMap.get(controladores, control.controladorId)) {
              case (null) {
                {
                  id = control.controladorId;
                  nombre = "Desconocido";
                  activo = false;
                };
              };
              case (?c) { c };
            };
            { control; controlador };
          },
        );

        let totalDefectosPorTipo = Array.map<Defecto, (Defecto, Nat)>(
          [#raset, #cracking, #golpeSol, #podredumbre],
          func(defecto) {
            let total = Array.foldLeft<ControlCalidad, Nat>(
              controlesDia,
              0,
              func(acc, control) {
                let cantidad = switch (Array.find<DefectoCantidad>(control.defectos, func(d) { d.defecto == defecto })) {
                  case (null) { 0 };
                  case (?d) { d.cantidad };
                };
                acc + cantidad;
              },
            );
            (defecto, total);
          },
        );

        let totalMuestras = Array.foldLeft<ControlCalidad, Nat>(
          controlesDia,
          0,
          func(acc, control) { acc + control.cantidadMuestras },
        );

        let totalFrutasAfectadas = Array.foldLeft<ControlCalidad, Nat>(
          controlesDia,
          0,
          func(acc, control) {
            acc + Array.foldLeft<DefectoCantidad, Nat>(
              control.defectos,
              0,
              func(acc2, defecto) { acc2 + defecto.cantidad },
            );
          },
        );

        let totalFrutasSinDefectos : Nat = if (totalMuestras > totalFrutasAfectadas) {
          totalMuestras - totalFrutasAfectadas;
        } else { 0 };

        let porcentajeDefectos : Float = if (totalMuestras > 0) {
          Float.fromInt(totalFrutasAfectadas) / Float.fromInt(totalMuestras) * 100.0;
        } else { 0.0 };

        let porcentajeSinDefectos : Float = if (totalMuestras > 0) {
          Float.fromInt(totalFrutasSinDefectos) / Float.fromInt(totalMuestras) * 100.0;
        } else { 0.0 };

        let totalDentroRangoPeso = Array.foldLeft<ControlCalidad, Nat>(
          controlesDia,
          0,
          func(acc, control) {
            if (control.dentroRangoPeso) { acc + 1 } else { acc };
          },
        );

        let totalFueraRangoPeso = Array.foldLeft<ControlCalidad, Nat>(
          controlesDia,
          0,
          func(acc, control) {
            if (not control.dentroRangoPeso) { acc + 1 } else { acc };
          },
        );

        let porcentajeDentroRangoPeso : Float = if (controlesDia.size() > 0) {
          Float.fromInt(totalDentroRangoPeso) / Float.fromInt(controlesDia.size()) * 100.0;
        } else { 0.0 };

        let porcentajeFueraRangoPeso : Float = if (controlesDia.size() > 0) {
          Float.fromInt(totalFueraRangoPeso) / Float.fromInt(controlesDia.size()) * 100.0;
        } else { 0.0 };

        {
          fecha;
          controles = controlesConControlador;
          totalDefectosPorTipo;
          totalMuestras;
          totalFrutasAfectadas;
          totalFrutasSinDefectos;
          porcentajeDefectos;
          porcentajeSinDefectos;
          totalDentroRangoPeso;
          totalFueraRangoPeso;
          porcentajeDentroRangoPeso;
          porcentajeFueraRangoPeso;
        };
      },
    );
  };

  public query ({ caller }) func obtenerMuestrasParaPlanilla(fechaInicio : Int, fechaFin : Int) : async [MuestraPlanilla] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("No autorizado: Solo usuarios pueden ver muestras");
    };
    let controlesFiltrados = Array.filter<ControlCalidad>(
      Iter.toArray(textMap.vals(controles)),
      func(control) { control.fecha >= fechaInicio and control.fecha <= fechaFin },
    );

    Array.map<ControlCalidad, MuestraPlanilla>(
      controlesFiltrados,
      func(control) {
        let empacador = switch (textMap.get(empacadores, control.empacadorId)) {
          case (null) {
            {
              id = control.empacadorId;
              identificador = "Desconocido";
              color = "#000000";
              activo = false;
            };
          };
          case (?e) { e };
        };

        let controlador = switch (textMap.get(controladores, control.controladorId)) {
          case (null) {
            {
              id = control.controladorId;
              nombre = "Desconocido";
              activo = false;
            };
          };
          case (?c) { c };
        };

        {
          id = control.id;
          lote = control.lote;
          fecha = control.fecha;
          cantidadMuestras = control.cantidadMuestras;
          empacador;
          controlador;
          defectos = control.defectos;
          foto = control.foto;
          horaRegistro = control.horaRegistro;
          dentroRangoPeso = control.dentroRangoPeso;
        };
      },
    );
  };

  public query ({ caller }) func obtenerDetalleMuestra(id : Text) : async ?MuestraPlanilla {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("No autorizado: Solo usuarios pueden ver detalles de muestras");
    };
    switch (textMap.get(controles, id)) {
      case (null) { null };
      case (?control) {
        let empacador = switch (textMap.get(empacadores, control.empacadorId)) {
          case (null) {
            {
              id = control.empacadorId;
              identificador = "Desconocido";
              color = "#000000";
              activo = false;
            };
          };
          case (?e) { e };
        };

        let controlador = switch (textMap.get(controladores, control.controladorId)) {
          case (null) {
            {
              id = control.controladorId;
              nombre = "Desconocido";
              activo = false;
            };
          };
          case (?c) { c };
        };

        ?{
          id = control.id;
          lote = control.lote;
          fecha = control.fecha;
          cantidadMuestras = control.cantidadMuestras;
          empacador;
          controlador;
          defectos = control.defectos;
          foto = control.foto;
          horaRegistro = control.horaRegistro;
          dentroRangoPeso = control.dentroRangoPeso;
        };
      };
    };
  };

  // Function to get all users with their roles - Admin only
  public query ({ caller }) func getAllUserRoles() : async [UserWithRole] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("No autorizado: Solo administradores pueden ver roles de usuarios");
    };

    let allUserPrincipals = Iter.toArray(principalMap.keys(userProfiles));
    Array.map<Principal, UserWithRole>(
      allUserPrincipals,
      func(p) {
        let role = AccessControl.getUserRole(accessControlState, p);
        let profile = principalMap.get(userProfiles, p);
        {
          principal = p;
          profile;
          role;
        };
      },
    );
  };

  // Function to set user role - Admin only
  public shared ({ caller }) func setUserRole(user : Principal, role : AccessControl.UserRole) : async () {
    // Admin-only check is performed inside AccessControl.assignRole
    AccessControl.assignRole(accessControlState, caller, user, role);
  };
};
