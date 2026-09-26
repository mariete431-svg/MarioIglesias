/* =========================================================
   Conexión con Supabase (compartida por todas las páginas)
   La clave "publishable" es pública a propósito: los datos
   están protegidos por las reglas (RLS) de la base de datos.
   ========================================================= */

window.SUPABASE_URL = "https://uaojfcqpdngoqpjrmttx.supabase.co";
window.SUPABASE_KEY = "sb_publishable_ZB2XOPmn8io8Dd92r2JzLw_QlrTTI5q";

window.sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_KEY);

/* ¿Hay una sesión de administrador abierta en este navegador? */
window.sbIsAdmin = async function () {
    const { data } = await window.sb.auth.getSession();
    if (!data.session) return false;
    const { data: ok, error } = await window.sb.rpc("is_admin");
    return !error && ok === true;
};

/* Fechas en la zona horaria de Canarias */
window.TZ = "Atlantic/Canary";
