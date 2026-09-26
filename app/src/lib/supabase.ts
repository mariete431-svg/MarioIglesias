import { createClient } from "@supabase/supabase-js";

// Base de datos de Mario. La clave "publishable" es pública a propósito:
// los datos están protegidos por las reglas (RLS) de la base de datos.
export const supabase = createClient(
  "https://uaojfcqpdngoqpjrmttx.supabase.co",
  "sb_publishable_ZB2XOPmn8io8Dd92r2JzLw_QlrTTI5q",
);

/** ¿La sesión abierta en este navegador es la de un administrador? */
export async function isAdminSession() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return false;
  const { data: ok, error } = await supabase.rpc("is_admin");
  return !error && ok === true;
}

/** Ruta pública de un archivo de /public (la web vive en /MarioIglesias/). */
export const asset = (file: string) => `${import.meta.env.BASE_URL}${file}`;
