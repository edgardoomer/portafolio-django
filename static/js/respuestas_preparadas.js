/* =====================================================================
 *  RESPUESTAS PREPARADAS DEL CHAT ASKEDGAR
 * =====================================================================
 *
 *
 *
 *  El chat busca aquí ANTES de gastar tokens con la IA. Si encuentra una
 *  coincidencia, responde al instante y con coste 0. Solo si NO hay
 *  coincidencia se llama al modelo de IA.
 *
 *  Cómo añadir respuestas:
 *
 *   1) EXACTAS  -> la pregunta del usuario debe ser EXACTAMENTE esa palabra
 *                  o frase (en minúsculas). Ideal para saludos.
 *
 *   2) POR CLAVE -> si el mensaje del usuario CONTIENE alguna de las palabras
 *                   clave, se da esa respuesta. Ideal para temas ("inglés",
 *                   "experiencia", "contacto"...). El orden importa: se usa
 *                   la primera que coincida.
 *
 *  Después de editar, guarda y recarga la página del chat. Nada más.
 * ===================================================================== */

window.RESPUESTAS_PREPARADAS = {

  /* -------- 1. COINCIDENCIAS EXACTAS -------- */
  exactas: {
    "hola": "¡Hola! Soy el asistente de Edgar. ¿Qué te gustaría saber sobre su perfil profesional?",
    "buenas": "¡Buenas! Pregúntame por la experiencia, formación o proyectos de Edgar.",
    "hello": "Hi! I'm Edgar's assistant. Ask me about his professional profile.",
    "gracias": "¡De nada! ¿Hay algo más que quieras saber?",
    "muchas gracias": "¡Con gusto! Estoy para ayudarte.",
    "adios": "¡Hasta luego! Gracias por tu interés.",
    "chao": "¡Nos vemos! Que tengas un buen día.",
  },

  /* -------- 2. COINCIDENCIAS POR PALABRA CLAVE -------- */
  /* Cada entrada: { claves: [...], respuesta: "..." }                */
  claves: [
    {
      claves: ["ingles", "inglés", "english"],
      respuesta: "Mi nivel de inglés es B2, tengo un certificado del instituto KOE, la mayoría de mi experinecia en el lenguaje es empirica y personalmente lo practico todos siempre, desde la lectura tecnica hasta en mi tiempo libre por medio de peliculas. Espero conseguir un certificado, estoy seguro de obtener un nivel aún más alto del descrito",
    },
    {
      claves: ["ruso", "russian"],
      respuesta: "Mi nivel de ruso es B1, con un curso de 1000 horas en la Universidad Estatal de San Petersburgo. Alli tuve la oportunidad de aprender ruso y mejorar aún más mi nivel de inglés",
    },
    {
      claves: ["portugués"],
      respuesta: "El portugues lo hablo a nivel B1, aproveche mi tiempo libre luego de estudiar Ruso para ingresar a un curso de 6 meses, aunque lo practico poco intento estudiarlo por medio de musica y oraciones cortas. Mi nivel es alto debido a mi lengua materna, el español",
    },
    {
      claves: ["idioma", "idiomas", "languages"],
      respuesta: "Manejo cuatro idiomas: español (nativo), inglés (B2), ruso (B1) y portugués (B1).",
    },
    {
      claves: ["experiencia", "trabajo", "experience"],
      respuesta: "Tengo 2 años de experiencia entre well testing/EPF en SERTECPET, ingeniería de datos freelance 2 años y una pasantía en Petroecuador de 1 año. La mayoría de mi experiencia es técnica y teórica y tengo un especial interés en el EOR y cada uno de sus metodos, resaltando el uso de polimeros, trazadores, geles, alkali y surfactantes; leo e investigo mucho sobre esto. Asi mismo, la programación en python es uno de mis fuertes, teniendo una especialidad en inteligencia artificial en todas sus formas conjuntamente con al estadistica, que es una de mis pasiones asi como la química. Actualmente me dedico a la investigacion y al desarrollo de proyectos dirigidos al EOR, machine learning, reservorios y de lo que se me ocurra.",
    },
    {
      claves: ["python", "programacion", "programación", "django"],
      respuesta: "Programo principalmente en Python (Django, análisis de datos, Machine Learning, inteligencia artificial en general). También manejo SQL, no SQL, R y .web.",
    },
    {
      claves: ["contacto", "correo", "email", "telefono", "teléfono"],
      respuesta: "Puedes contactarme desde la sección de Contacto de esta misma web. ¡Estaré encantado de responderte!",
    },
    {
      claves: ["estudios", "educacion", "educación", "universidad", "carrera"],
      respuesta: "Soy Ingeniero en Petróleos por la Universidad UTE (GPA 4.5/5) y tengo un Diplomado en Python Full Stack por la Universidad de los Hemisferios. Y estoy estudiando una maestría en inteligencia artificial  que acabaría en marzo del 2027. Si ya paso esa fecha entonces ya me gradué, Dios mediante",
    },
    {
      claves: ["eor", "recuperacion mejorada", "waterflooding", "reservorios"],
      respuesta: "Mis áreas de especialidad incluyen ingeniería de reservorios, recuperación mejorada (EOR) y waterflooding. Cuando uno entra a una profesion, para mi es como Howarts, es necesario escoger una casa y ser parte de ella toda la vida. Escogi el EOR, es la area que en principio me quiero dedicar. Y lo intento, lo intento mucho. ",
    },
  ],
};
