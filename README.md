# Pablo Climent — Portfolio

Portfolio personal desarrollado con **Astro 5** y desplegado en **Vercel**. Diseño con estética terminal/hacker, soporte bilingüe (ES/EN) y formulario de contacto funcional.

---

## Características

- **Modo oscuro / claro** con persistencia en `localStorage`
- **Internacionalización (i18n)** — Español e Inglés (`/es/`, `/en/`)
- **Terminal interactiva** con sistema de ficheros simulado, historial de comandos y autocompletado con `Tab`
- **Animaciones** con AOS (Animate On Scroll) y efecto typewriter en el héroe
- **Proyectos** con tarjetas flip en 3D
- **Formulario de contacto** con envío real via Resend, rate limiting, honeypot y sanitización de inputs
- **Diseño responsive** adaptado a móvil, tablet y escritorio

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | [Astro 5](https://astro.build) — output `hybrid` |
| Estilos | [Tailwind CSS 4](https://tailwindcss.com) |
| Email | [Resend](https://resend.com) |
| Hosting | [Vercel](https://vercel.com) |
| Tipografías | Onest Variable, Space Mono |

---

## Secciones

1. **Hero** — Presentación con efecto typewriter y badge de disponibilidad
2. **Terminal interactiva** — Shell funcional con comandos `help`, `ls`, `cd`, `cat`, `whoami`, `date`, `sudo`, `clear`
3. **Sobre mí** — Bio, redes sociales y descarga del CV
4. **Tecnologías** — Grid con 4 categorías: Frontend, Backend, Infraestructura, Seguridad
5. **Proyectos** — Tarjetas flip con descripción, stack y enlace a GitHub
6. **Contacto** — Formulario terminal con validación en cliente y servidor

---

## Proyectos incluidos

| Proyecto | Stack | Estado |
|---|---|---|
| [Star WikiWars](https://github.com/pablo7843/StarWarsApp) | Kotlin | ✅ Publicado |
| [Qr-Shield](https://github.com/pablo7843/qr_shield) | Flutter, Supabase | ✅ Publicado |
| [HarmoniQ](https://github.com/pablo7843/HarmoniQ) | React, Supabase | ✅ Publicado |
| HarmoniQ v2 | React, Supabase | 🚧 En desarrollo |

---

## Instalación local

```bash
# 1. Clonar el repositorio
git clone https://github.com/pablo7843/portfolio-pablo.git
cd portfolio-pablo

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus valores

# 4. Arrancar el servidor de desarrollo
npm run dev
```

Abre [http://localhost:4321](http://localhost:4321) en el navegador.

---

## Variables de entorno

Crea un archivo `.env.local` en la raíz con:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
CONTACT_EMAIL=tu@email.com
```

| Variable | Descripción |
|---|---|
| `RESEND_API_KEY` | API key de [Resend](https://resend.com) para el envío de emails |
| `CONTACT_EMAIL` | Dirección donde recibirás los mensajes del formulario |

> En producción, añade estas variables en **Vercel → Settings → Environment Variables**.

---

## Comandos

| Comando | Acción |
|---|---|
| `npm run dev` | Servidor de desarrollo en `localhost:4321` |
| `npm run build` | Build de producción en `./dist/` |
| `npm run preview` | Preview del build en local |

---

## Despliegue en Vercel

El proyecto está configurado con `@astrojs/vercel` en modo `hybrid`: las páginas se generan de forma estática y las rutas API (`/api/contact`) se despliegan como funciones serverless.

Para desplegar tu propia instancia:

1. Conecta el repositorio en [vercel.com](https://vercel.com)
2. Añade `RESEND_API_KEY` y `CONTACT_EMAIL` en las variables de entorno del proyecto
3. Despliega — Vercel detecta Astro automáticamente

---

## Estructura del proyecto

```
/
├── public/               # Assets estáticos (CV, fotos, favicon)
├── src/
│   ├── components/       # Componentes Astro (Header, Footer, ContactForm…)
│   ├── i18n/             # Traducciones ES/EN
│   ├── layouts/          # Layout principal
│   ├── pages/
│   │   ├── [lang]/       # Rutas dinámicas /es/ y /en/
│   │   └── api/
│   │       └── contact.ts  # Endpoint serverless del formulario
│   └── styles/           # CSS global y estilos del terminal
├── astro.config.mjs
└── package.json
```
