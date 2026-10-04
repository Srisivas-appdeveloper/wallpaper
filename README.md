# DOTSCAPE — Independent wallpaper app for Nothing phones

Monorepo:

| Folder              | What                                                        |
|---------------------|-------------------------------------------------------------|
| `dotscape-backend/` | Node.js 20+, TypeScript, Fastify 5, PostgreSQL, sharp        |
| `dotscape-app/`     | Flutter (Android), Riverpod, GoRouter, Dio, flavors          |

## 1. Run the backend

```bash
docker compose up -d                 # PostgreSQL on :5432
cd dotscape-backend
cp .env.example .env                 # edit JWT_SECRET + admin password
npm install
npm run setup                        # migrations + seed (devices, categories, admin, 30 wallpapers)
npm run dev                          # http://localhost:8080/health
```

`PUBLIC_BASE_URL` decides the image URLs the app receives:
- Android emulator → `http://10.0.2.2:8080` (default)
- Real phone on Wi-Fi → `http://<your-LAN-IP>:8080`

## 2. Run the app

```bash
cd dotscape-app
flutter run --flavor dev -t lib/main_dev.dart
# real device:
flutter run --flavor dev -t lib/main_dev.dart --dart-define=API_BASE_URL=http://192.168.1.20:8080
```

Builds:
```bash
flutter build appbundle --flavor prod -t lib/main_prod.dart --dart-define=API_BASE_URL=https://api.yourdomain.com
```

## 3. Admin API (Admin Studio will consume this)

```bash
TOKEN=$(curl -s localhost:8080/admin/auth/login -H 'content-type: application/json' \
  -d '{"email":"admin@dotscape.local","password":"ChangeMe!2026"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).token')

curl -s localhost:8080/admin/stats -H "authorization: Bearer $TOKEN"

curl -s localhost:8080/admin/wallpapers/generate-batch -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' \
  -d '{"count":6,"styles":["liquid","dots"],"colors":["purple","cyan","orange"]}'

curl -s localhost:8080/admin/wallpapers/upload -H "authorization: Bearer $TOKEN" \
  -F title="My Upload" -F tags="minimal,black" -F file=@wallpaper.jpg     # fields BEFORE file
```

Content lifecycle: `draft → review → scheduled → published → unpublished`. User creations are `private`.

## Device codes
`devices.model_codes` in `src/db/seed.ts` are placeholders — verify `Build.MODEL` on real hardware.

## Not affiliated with Nothing
DOTSCAPE is an independent app. Do not ship Nothing-owned artwork, logos, or naming that implies affiliation.
