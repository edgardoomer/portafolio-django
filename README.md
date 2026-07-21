# CV Web — Edgar Izurieta

Sitio web personal desarrollado con Django 5.2: currículum, portafolio de
proyectos, blog de recomendaciones y un asistente de IA que responde preguntas
sobre mi perfil profesional.

## Características

- **Multiidioma** (español, inglés, ruso) con `django-modeltranslation` e `i18n_patterns`.
- **AskEdgar.IA** — chatbot sobre el CV, con arquitectura de coste en tres capas.
- **Portafolio** de proyectos gestionable desde el admin de Django.
- **Blog de recomendaciones** con respuestas y likes.
- **Autenticación** con usuario personalizado y reCAPTCHA v2.

## Stack

| Capa | Tecnología |
|---|---|
| Backend | Django 5.2, Python 3.13 |
| Base de datos | PostgreSQL |
| IA | OpenAI API (gpt-4o-mini) |
| Frontend | HTML, CSS, JavaScript, Bootstrap 5, GSAP |
| Estáticos | WhiteNoise |

## Arquitectura del chatbot

Para mantener el coste bajo control, cada mensaje atraviesa tres capas y solo
llega a la API de pago si es una pregunta genuinamente nueva:

```
Mensaje del usuario
   │
   ├─ 1. Caché de respuestas   → $0.00   ~1 ms
   ├─ 2. Reglas estáticas      → $0.00   ~1 ms
   └─ 3. OpenAI gpt-4o-mini    → coste   ~1-2 s
```

Protecciones del endpoint: límite de 5 peticiones/minuto y 40/día por IP,
mensajes truncados a 300 caracteres, token CSRF obligatorio y timeout de 15 s.

## Instalación local

### Requisitos

- Python 3.13+
- PostgreSQL 14+

### Pasos

```bash
# 1. Clonar
git clone https://github.com/<tu-usuario>/mi-cv-web.git
cd mi-cv-web

# 2. Entorno virtual
python -m venv .venv
.venv\Scripts\activate        # Windows
source .venv/bin/activate     # Linux / macOS

# 3. Dependencias
pip install -r requirements.txt

# 4. Variables de entorno
copy .env.example .env        # Windows
cp .env.example .env          # Linux / macOS
```

```bash
# 5. Base de datos
createdb cv_edgar
python manage.py migrate
python manage.py createsuperuser

# 6. Traducciones
python manage.py compilemessages

# 7. Arrancar
python manage.py runserver
```

El sitio queda en http://127.0.0.1:8000/

## Estructura

```
mi_cv/
├── mi_cv/           # Configuración del proyecto
├── site_app/        # Home, currículum, contacto
├── iachat_app/      # Chatbot de IA
├── portafolio_app/  # Proyectos
├── blog_app/        # Recomendaciones y respuestas
├── user_app/        # Usuario personalizado y autenticación
├── templates/       # Plantillas base
├── static/          # CSS, JS, fuentes
└── locale/          # Traducciones es / en / ru
```

## Licencia

Proyecto personal. El código puede consultarse libremente; el contenido del
currículum y las imágenes son de uso restringido.
