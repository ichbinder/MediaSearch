# Cinema App

Eine umfassende Kino-Web-Anwendung für fortgeschrittene Filmsuche, Streaming-Anbieter-Erkennung und robustes Download-Management mit nahtloser NZB- und Sabnzbd-Integration.

## Features

- Filmsuche und -informationen via TMDB API
- Streaming-Anbieter-Erkennung
- NZB Integration
- Sabnzbd Download-Management
- Hetzner Cloud S3 Speicher-Integration
- Mehrsprachige Unterstützung (Deutsch)
- Benutzer-Authentifizierung
- Admin-Bereich
- Watchlist-Funktion

## Voraussetzungen

- Node.js 20 oder höher
- PostgreSQL Datenbank
- NZB API Zugang
- Sabnzbd Server
- TMDB API Key
- Hetzner Cloud S3 Zugang

## Installation

1. Repository klonen:
```bash
git clone [repository-url]
cd cinema-app
```

2. Abhängigkeiten installieren:
```bash
npm install
```

## Umgebungsvariablen

Erstellen Sie eine `.env` Datei im Wurzelverzeichnis mit folgenden Variablen:

```env
# Datenbank
DATABASE_URL="postgresql://user:password@host:port/database"

# NZB API
NZB_API_URL="https://ihre-nzb-api-url"
NZB_USERNAME="ihr-username"
NZB_PASSWORD="ihr-password"

# Sabnzbd
SABNZBD_API_URL="http://ihre-sabnzbd-url:8080"
SABNZBD_API_KEY="ihr-api-key"

# TMDB
TMDB_API_KEY="ihr-tmdb-api-key"

# Optional: S3 Storage
S3_ACCESS_KEY="ihr-s3-access-key"
S3_SECRET_KEY="ihr-s3-secret-key"
S3_BUCKET="ihr-bucket-name"
S3_REGION="eu-central-1"
```

## Datenbank initialisieren

1. Datenbank-Schema erstellen:
```bash
npm run db:push
```

2. Admin-Benutzer erstellen:
```bash
npx tsx update_admin_password.ts
```

## Anwendung starten

Entwicklungsmodus:
```bash
npm run dev
```

Die Anwendung ist dann unter `http://localhost:5000` erreichbar.

## Erste Anmeldung

Nach der Installation können Sie sich mit folgenden Zugangsdaten einloggen:

- Benutzername: `admin`
- Passwort: `adminpass123`

**Wichtig:** Ändern Sie das Admin-Passwort nach der ersten Anmeldung!

## Technologie-Stack

- Frontend: React.js mit shadcn/ui
- Backend: Node.js mit Express.js
- Datenbank: PostgreSQL mit Drizzle ORM
- API-Integration: TMDB, NZB, Sabnzbd
- Cloud Storage: Hetzner Cloud S3
- Authentifizierung: Passport.js
- Styling: Tailwind CSS

## Entwickelt mit

- [React](https://reactjs.org/)
- [Express](https://expressjs.com/)
- [PostgreSQL](https://www.postgresql.org/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
