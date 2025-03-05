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

Erstellen Sie eine `.env` Datei im Wurzelverzeichnis mit folgenden Variablen. Sie können die `.env.example` Datei als Vorlage verwenden:

```bash
cp .env.example .env
```

Dann passen Sie die Werte in der `.env` Datei an:

```env
# Datenbank
DATABASE_URL="postgresql://user:password@host:port/database"

# Session
SESSION_SECRET="ihr-session-secret"

# NZB API
NZB_API_URL="https://ihre-nzb-api-url"
NZB_USERNAME="ihr-username"
NZB_PASSWORD="ihr-password"

# Sabnzbd
SABNZBD_API_URL="http://ihre-sabnzbd-url:8080"
SABNZBD_API_KEY="ihr-api-key"

# TMDB
TMDB_API_KEY="ihr-tmdb-api-key"

# Hetzner S3 Storage
HETZNER_S3_ACCESS_KEY="ihr-s3-access-key"
HETZNER_S3_SECRET_KEY="ihr-s3-secret-key"
HETZNER_S3_BUCKET="ihr-bucket-name"
HETZNER_S3_REGION="hel1"
HETZNER_S3_ENDPOINT="https://eu-central-1.s3.hetzner.cloud"
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

Die Anwendung ist dann unter `http://localhost:3000` erreichbar.

Produktionsmodus:

```bash
npm run build
npm start
```

## Erste Anmeldung

Nach der Installation können Sie sich mit folgenden Zugangsdaten einloggen:

- Benutzername: `admin`
- Passwort: `adminpass123`

**Wichtig:** Ändern Sie das Admin-Passwort nach der ersten Anmeldung!

## Technologie-Stack

- Frontend: React.js mit shadcn/ui
- Backend: Node.js mit Express.js
- Datenbank: PostgreSQL mit Drizzle ORM
- ORM: Drizzle
- Authentifizierung: Express Session
- API Integration: TMDB, NZB, Sabnzbd, Hetzner S3

## Entwicklung

- `npm run dev` - Startet den Entwicklungsserver
- `npm run build` - Erstellt den Produktions-Build
- `npm start` - Startet die Anwendung im Produktionsmodus
- `npm run db:push` - Aktualisiert das Datenbankschema
- `npm run check` - Führt TypeScript-Checks durch

## Lizenz

MIT
