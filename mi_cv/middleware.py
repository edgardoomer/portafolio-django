"""Cabeceras de seguridad extra."""

# Content-Security-Policy en modo REPORT-ONLY: NO bloquea nada, solo avisa en
# la consola del navegador de lo que incumpliria la politica. Es el paso
# recomendado para empezar sin romper el sitio. Cuando veas que no hay avisos
# importantes, se puede pasar a modo bloqueante (cabecera sin '-Report-Only').
#
# La politica permite lo que el sitio usa hoy: CDNs (jsdelivr, cdnjs), Google
# Fonts y reCAPTCHA. 'unsafe-inline' hace falta por los muchos estilos/scripts
# en linea de la plantilla; al endurecer luego, conviene ir quitandolo.
CSP_REPORT_ONLY = (
    "default-src 'self'; "
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net "
    "https://cdnjs.cloudflare.com https://www.google.com https://www.gstatic.com; "
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; "
    "font-src 'self' data: https://fonts.gstatic.com; "
    "img-src 'self' data: https:; "
    "frame-src https://www.google.com; "
    "connect-src 'self'; "
    "base-uri 'self'; "
    "form-action 'self'"
)

# Permissions-Policy: desactiva APIs del navegador que el sitio no usa.
PERMISSIONS_POLICY = "geolocation=(), microphone=(), camera=(), payment=(), usb=()"


class SecurityHeadersMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        response.setdefault('Permissions-Policy', PERMISSIONS_POLICY)
        # No pisamos una CSP que ya exista.
        if ('Content-Security-Policy' not in response
                and 'Content-Security-Policy-Report-Only' not in response):
            response['Content-Security-Policy-Report-Only'] = CSP_REPORT_ONLY
        return response
