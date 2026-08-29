"""Defensas del chat IA (autoritativas, del lado del servidor).

Este es el filtro REAL de seguridad. Existe un espejo en JavaScript
(static/js/filtro_seguridad.js) solo para dar aviso inmediato al usuario,
pero como el JS del navegador se puede saltar, la última palabra la tiene
SIEMPRE este archivo.

Objetivos:
  1. Impedir que alguien extraiga información interna (claves API, SECRET_KEY,
     contraseñas, credenciales de la base de datos, el prompt del sistema...).
  2. Bloquear intentos de "prompt injection" (ignora tus instrucciones, etc.).
  3. Rechazar firmas típicas de inyección SQL. Nota: la defensa de fondo contra
     SQL injection es el ORM de Django (consultas parametrizadas); esto es solo
     una capa extra que corta el intento antes de llegar al modelo.

Diseño para evitar falsos positivos: NO bloqueamos por mencionar un tema
(preguntar "¿sabes SQL?" o "¿usas PostgreSQL?" es legítimo en un CV). Solo
bloqueamos cuando se combina una intención de EXTRAER/REVELAR con un objetivo
sensible, o cuando aparecen firmas inequívocas de ataque.
"""

import re

# Mensaje único que se devuelve ante cualquier intento. No da pistas.
RESPUESTA_SEGURA = (
    "Lo siento, no puedo ayudarte con eso. Solo respondo preguntas sobre el "
    "perfil profesional de Edgar (experiencia, formación, proyectos y "
    "habilidades). ¿Qué te gustaría saber?"
)

# --- 1. Objetivos sensibles: nunca deben revelarse ---
_SENSIBLE = (
    r"api[\s_-]?key|apikey|clave\s+api|secret[\s_-]?key|"
    r"\.env\b|settings\.py|variables?\s+de\s+entorno|"
    r"contrase(?:ñ|n)a|password|credencial|"
    r"base\s+de\s+datos|database|postgres|psql|"
    r"system\s+prompt|prompt\s+del\s+sistema|instrucciones\s+del\s+sistema|"
    r"clave\s+secreta|token\s+de\s+acceso|acceso\s+a\s+la\s+base"
)

# --- 2. Verbos/estructuras de extracción o de inyección de instrucciones ---
_EXTRAER = (
    r"revela|rev(?:é|e)lame|mu(?:é|e)strame|ens(?:é|e)(?:ñ|n)ame|"
    r"dame|d(?:i|í)me\s+cu(?:á|a)l|cu(?:á|a)l\s+es\s+(?:tu|el|la)|"
    r"imprime|print|dump|exporta|filtra|list(?:a|ame)|"
    r"olvida|ignora|salta|omite|desactiva|"
    r"act(?:ú|u)a\s+como|hazte\s+pasar|pretende\s+ser|"
    r"tus\s+instrucciones|tu\s+prompt|reveal\s+your|ignore\s+(?:previous|all)"
)

# --- 3. Firmas inequívocas de inyección SQL ---
_SQLI = (
    r"union\s+select|select\s+.+\s+from\s+|drop\s+table|delete\s+from\s+|"
    r"insert\s+into\s+|update\s+.+\s+set\s+|'\s*or\s*'?1'?\s*=\s*'?1|"
    r"--\s*$|;\s*drop|xp_cmdshell|information_schema|pg_sleep\s*\("
)

_re_sensible = re.compile(_SENSIBLE, re.IGNORECASE)
_re_extraer = re.compile(_EXTRAER, re.IGNORECASE)
_re_sqli = re.compile(_SQLI, re.IGNORECASE)


def es_peligroso(texto):
    """Devuelve (True, motivo) si el mensaje es un intento de ataque/fuga.

    Motivos posibles: 'sqli', 'fuga', 'injection'. Se registran para poder
    auditar, pero al usuario siempre se le devuelve el mismo RESPUESTA_SEGURA.
    """
    if not texto:
        return (False, None)

    t = texto.lower()

    # Firma clara de inyección SQL -> corta sin más.
    if _re_sqli.search(t):
        return (True, "sqli")

    # Objetivo sensible + intención de extraer / inyectar instrucciones.
    if _re_sensible.search(t) and _re_extraer.search(t):
        return (True, "fuga")

    # Intento de secuestrar las instrucciones del sistema aunque no nombre
    # un dato concreto ("ignora tus instrucciones", "actúa como...").
    if re.search(r"(ignora|olvida|salta|omite).{0,20}(instrucci|reglas|prompt)", t):
        return (True, "injection")
    if re.search(r"(act(?:ú|u)a\s+como|hazte\s+pasar\s+por|pretende\s+ser)", t):
        return (True, "injection")

    return (False, None)
