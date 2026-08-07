// ── AUTH ──
// La autenticación vive en el shell compartido (/assets/js/session.js).
// Este panel ya no tiene login propio: solo comprueba que quien llega
// traiga rol vendedor, y toma de ahí el token para hablar con Supabase.
// Si no hay sesión, o si la sesión es de un admin, el guard redirige solo.
function bootSession(){
  return SVSession.require('vendedor').then(function(s){
    AUTH_TOKEN=SVSession.token();
    CUR=s.user;
    return s;
  });
}

function doLogout(){
  // El confirm() nativo mostraba "Aceptar / Cancelar": delante de un aviso
  // que empieza por "Vas a salir", no queda claro qué acepta cada botón.
  SVUI.confirmar({
    titulo:'¿Cerrar sesión?',
    mensaje:'Tendrás que ingresar tu correo y contraseña la próxima vez que entres.',
    confirmar:'Cerrar sesión',
    cancelar:'Seguir aquí'
  }).then(function(ok){ if(ok) SVSession.logout(); });
}
