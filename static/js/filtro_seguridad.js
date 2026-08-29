/* =====================================================================
 *  FILTRO DE SEGURIDAD DEL CHAT (lado del cliente)
 * =====================================================================
 *
 *  Este diccionario da un AVISO INMEDIATO cuando alguien intenta sacar
 *  información interna (claves, contraseñas, base de datos, el prompt...)
 *  o hacer inyección de instrucciones.
 *
 *  IMPORTANTE: esto es solo la primera línea, por comodidad. La defensa
 *  REAL está en el servidor (iachat_app/guardrails.py), porque el
 *  JavaScript del navegador siempre se puede saltar. Si añades un caso
 *  aquí, añádelo también allí para que quede protegido de verdad.
 *
 *  Puedes ampliar las listas de abajo con más términos prohibidos.
 * ===================================================================== */

window.FILTRO_SEGURIDAD = {

  // Respuesta que se muestra ante cualquier intento.
  respuesta:
    "Lo siento, no puedo ayudarte con eso. Solo respondo preguntas sobre el " +
    "perfil profesional de Edgar (experiencia, formación, proyectos y habilidades).",

  // Objetivos sensibles que nunca deben revelarse.
  sensibles: [
    "api key", "apikey", "api_key", "clave api", "secret key", "secret_key",
    ".env", "settings.py", "variable de entorno", "variables de entorno",
    "contraseña", "contrasena", "password", "credencial", "credenciales",
    "base de datos", "database", "postgres", "clave secreta",
    "system prompt", "prompt del sistema", "instrucciones del sistema",
  ],

  // Verbos/estructuras de extracción o de inyección de instrucciones.
  extraer: [
    "revela", "revélame", "revelame", "muéstrame", "muestrame", "enséñame",
    "ensename", "dame", "dime cuál", "dime cual", "cuál es tu", "cual es tu",
    "imprime", "dump", "exporta", "ignora", "olvida", "salta", "omite",
    "desactiva", "actúa como", "actua como", "hazte pasar", "pretende ser",
    "tus instrucciones", "tu prompt", "reveal your", "ignore previous",
  ],

  // Firmas típicas de inyección SQL.
  sqli: [
    "union select", "drop table", "delete from", "insert into",
    "' or '1'='1", "or 1=1", "--", "xp_cmdshell", "information_schema",
  ],

  /* Devuelve true si el texto parece un intento de ataque/fuga. */
  esPeligroso(texto) {
    if (!texto) return false;
    const t = texto.toLowerCase();

    if (this.sqli.some((s) => t.includes(s))) return true;

    const tocaSensible = this.sensibles.some((s) => t.includes(s));
    const intentaExtraer = this.extraer.some((v) => t.includes(v));
    if (tocaSensible && intentaExtraer) return true;

    // Inyección de instrucciones aunque no nombre un dato concreto.
    if (/(ignora|olvida|salta|omite).{0,20}(instrucci|reglas|prompt)/.test(t)) return true;
    if (/(actúa|actua) como|hazte pasar por|pretende ser/.test(t)) return true;

    return false;
  },
};
