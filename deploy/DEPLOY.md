# Despliegue en una VM gratis de Google Cloud (e2-micro "Always Free")

Guía para publicar el CV en una máquina virtual **gratis para siempre** de
Google Cloud. Stack: **Debian/Ubuntu + Python + Gunicorn + Nginx + SQLite +
HTTPS (Let's Encrypt)**. Coste del hosting: **$0/año**.

> Requisito de la capa gratuita: la VM **e2-micro** solo es *Always Free* en
> las regiones **us-west1, us-central1 o us-east1**, con disco estándar de
> hasta 30 GB. Fuera de ahí sí cobra.

---

## FASE 1 · Crear la VM en Google Cloud

1. Entra en <https://console.cloud.google.com>, crea una cuenta (pide tarjeta
   para verificar, pero **la capa Always Free no cobra**) y crea un proyecto.
2. Menú → **Compute Engine → Instancias de VM → Crear instancia**.
3. Configura:
   - **Región:** `us-central1` (o `us-west1` / `us-east1`).
   - **Serie:** E2 · **Tipo de máquina:** `e2-micro`.
   - **Disco de arranque:** Debian 12 (o Ubuntu 24.04 LTS), **30 GB estándar**.
   - **Firewall:** marca **Permitir tráfico HTTP** y **Permitir tráfico HTTPS**.
4. **Crear.** Anota la **IP externa** que aparece en la lista.
5. (Opcional pero recomendado) Reserva esa IP como **estática** para que no
   cambie: VPC network → IP addresses → reservar la IP externa de la VM.

---

## FASE 2 · Conectarte y preparar el servidor

Pulsa el botón **SSH** junto a la VM (abre una terminal en el navegador, sin
configurar claves). Dentro:

```bash
# Actualizar el sistema
sudo apt update && sudo apt upgrade -y

# Un poco de swap ayuda en 1 GB de RAM (al instalar paquetes)
sudo fallocate -l 1G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Paquetes necesarios (NO hace falta PostgreSQL: usamos SQLite)
sudo apt install -y python3 python3-venv python3-pip git nginx gettext
```

---

## FASE 3 · Traer el código y configurarlo

```bash
# El repo es publico, no necesitas credenciales
cd ~
git clone https://github.com/edgardoomer/portafolio-django.git
cd portafolio-django

# Entorno virtual e instalar dependencias
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

Crea el archivo `.env` de **producción**:

```bash
nano .env
```

Pega esto (ajusta la IP y, si tienes, el dominio):

```
SECRET_KEY=PEGA_UNA_CLAVE_NUEVA
DEBUG=False
ALLOWED_HOSTS=TU_IP_EXTERNA,tudominio.com,www.tudominio.com
CSRF_TRUSTED_ORIGINS=https://tudominio.com,https://www.tudominio.com

# Aun sin HTTPS: no redirijas todavia (lo pondras en True tras Certbot)
SECURE_SSL_REDIRECT=False

# Base de datos: SQLite (un archivo, cero configuracion)
DB_ENGINE=sqlite

# IA del chat
IACHAT_PROVIDER=deepseek
DEEPSEEK_API_KEY=tu-clave-de-deepseek
DEEPSEEK_MODEL=deepseek-v4-flash
DEEPSEEK_BASE_URL=https://api.deepseek.com

# reCAPTCHA (claves para tu dominio) y captcha del chat
RECAPTCHA_PUBLIC_KEY=tu-clave-publica
RECAPTCHA_PRIVATE_KEY=tu-clave-privada
IACHAT_CAPTCHA_ENABLED=True
```

Genera la `SECRET_KEY` (copia el resultado al `.env`):

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Prepara la aplicación:

```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py collectstatic --noinput
python manage.py compilemessages
```

> Los proyectos del portafolio se crean luego desde el admin
> (`/es/admin/`). Las imágenes del repo ya están; súbelas o referéncialas
> al crear cada proyecto.

Prueba rápida (Ctrl+C para salir):

```bash
python manage.py runserver 0.0.0.0:8000
```

---

## FASE 4 · Gunicorn como servicio (systemd)

```bash
# Copia la plantilla y ajusta usuario/rutas (cambia CAMBIA_USUARIO por tu
# usuario, mira cual es con:  whoami )
sudo cp deploy/gunicorn.service /etc/systemd/system/gunicorn.service
sudo nano /etc/systemd/system/gunicorn.service   # edita User= y las rutas

sudo systemctl daemon-reload
sudo systemctl enable --now gunicorn
sudo systemctl status gunicorn      # debe decir "active (running)"
```

---

## FASE 5 · Nginx por delante

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/askedgar
sudo nano /etc/nginx/sites-available/askedgar   # pon server_name y las rutas

sudo ln -s /etc/nginx/sites-available/askedgar /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx
```

Abre `http://TU_IP_EXTERNA` en el navegador: ya debería verse el CV.

---

## FASE 6 · HTTPS gratis (necesita un dominio)

Let's Encrypt **no emite certificados para una IP**, hace falta un nombre.
Opciones para un subdominio **gratis**: [DuckDNS](https://www.duckdns.org),
[js.org], o [FreeDNS]. Apunta un registro **A** de tu dominio a la IP de la VM.

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d tudominio.com -d www.tudominio.com
```

Certbot edita Nginx, activa HTTPS y programa la renovación automática.
Después, activa la redirección forzada a HTTPS:

```bash
nano .env        # cambia a  SECURE_SSL_REDIRECT=True
sudo systemctl restart gunicorn
```

---

## Actualizar el sitio más adelante

Cada vez que subas cambios a GitHub:

```bash
cd ~/portafolio-django
source .venv/bin/activate
git pull
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py compilemessages
sudo systemctl restart gunicorn
```

---

## Notas y solución de problemas

- **Logs de la app:** `sudo journalctl -u gunicorn -n 50 --no-pager`
- **Logs de Nginx:** `sudo tail -n 50 /var/log/nginx/error.log`
- **La BD (SQLite) y las imágenes** viven en el disco de la VM: **persisten**
  entre reinicios. Haz copia de seguridad de vez en cuando:
  `cp db.sqlite3 ~/backup_$(date +%F).sqlite3`
- **DeepSeek** necesita saldo en la cuenta para responder; si no, el chat usa
  solo las respuestas preparadas. Es pago por uso, céntimos con tu tráfico.
- **reCAPTCHA:** genera claves para tu dominio en
  <https://www.google.com/recaptcha/admin>. Si aún no las tienes, puedes
  desactivar el captcha del chat con `IACHAT_CAPTCHA_ENABLED=False` (pero el
  registro/login seguirán pidiendo claves válidas).
- **Migrar tus datos locales** (opcional): en tu PC
  `python manage.py dumpdata portafolio_app --indent 2 > portafolio.json`,
  súbelo a la VM y `python manage.py loaddata portafolio.json`.
