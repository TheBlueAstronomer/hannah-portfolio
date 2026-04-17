#!/usr/bin/env bash
# bootstrap-schema.sh
# --------------------
# Idempotent Directus schema bootstrap — safe to run on every deploy.
# Creates missing collections, fields, relations, and public read permissions
# via the Directus REST API using only curl (no Node/SDK required).
#
# Usage:
#   DIRECTUS_EMAIL=admin@example.com \
#   DIRECTUS_PASSWORD=changeme123 \
#   bash bootstrap-schema.sh [DIRECTUS_URL]
#
# DIRECTUS_URL defaults to http://localhost:8055

set -euo pipefail

BASE="${1:-http://localhost:8055}"
EMAIL="${DIRECTUS_EMAIL}"
PASSWORD="${DIRECTUS_PASSWORD}"

# ── wait for Directus ─────────────────────────────────────────────────────────

echo "⏳  Waiting for Directus to be ready at ${BASE} …"
for i in $(seq 1 24); do
  if curl -sf "${BASE}/server/health" > /dev/null 2>&1; then
    echo "✅  Directus is up."
    break
  fi
  echo "   (${i}/24) not ready yet — waiting 5s…"
  sleep 5
  if [ "$i" -eq 24 ]; then
    echo "❌  Directus did not become ready after 120s." >&2
    exit 1
  fi
done

# ── helpers ───────────────────────────────────────────────────────────────────

# POST to $BASE$path with JSON body. Treats any HTTP response as success
# (4xx means already exists — idempotent). Only exits on curl transport errors.
post() {
  local path="$1"
  local body="$2"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "${BASE}${path}" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "${body}")
  echo "  ${path}  →  HTTP ${code}"
}

# ── authenticate ──────────────────────────────────────────────────────────────

echo "🔐  Logging in as ${EMAIL} …"
LOGIN_RESPONSE=$(curl -s -X POST "${BASE}/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}") || true
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4 || true)

if [ -z "$TOKEN" ]; then
  echo "❌  Authentication failed. Response: ${LOGIN_RESPONSE}" >&2
  exit 1
fi
echo "✅  Authenticated."

# ── instagram_posts collection ────────────────────────────────────────────────

echo ""
echo "📦  instagram_posts …"

post "/collections" \
  '{"collection":"instagram_posts","meta":{"icon":"photo_camera","singleton":false},"schema":{},"fields":[]}'

post "/fields/instagram_posts" \
  '{"field":"caption","type":"text","meta":{"interface":"input-multiline","required":true},"schema":{"is_nullable":false}}'

post "/fields/instagram_posts" \
  '{"field":"preview","type":"uuid","meta":{"interface":"file-image","special":["file"],"note":"Square preview image"},"schema":{"is_nullable":true}}'

post "/relations" \
  '{"collection":"instagram_posts","field":"preview","related_collection":"directus_files"}'

post "/fields/instagram_posts" \
  '{"field":"post_url","type":"string","meta":{"interface":"input","note":"Link to the Instagram post"},"schema":{"is_nullable":true}}'

post "/fields/instagram_posts" \
  '{"field":"sort","type":"integer","meta":{"interface":"input-default-value","hidden":false},"schema":{"is_nullable":true}}'

# ── articles: fix image field relation if missing ─────────────────────────────

echo ""
echo "📦  articles.image relation …"

post "/relations" \
  '{"collection":"articles","field":"image","related_collection":"directus_files"}'

# ── public read permissions ───────────────────────────────────────────────────

echo ""
echo "🔓  Public read permissions …"

PUBLIC_POLICY=$(curl -s "${BASE}/policies" \
  -H "Authorization: Bearer ${TOKEN}" \
  | python3 -c "
import sys,json
data=json.load(sys.stdin).get('data',[])
for p in data:
    if 'public' in p.get('name','').lower() or p.get('name','') == '\$t:public_label':
        print(p['id']); break
" 2>/dev/null)

if [ -z "$PUBLIC_POLICY" ]; then
  echo "  ⚠  Could not find public policy ID — skipping permissions."
else
  echo "  Public policy: ${PUBLIC_POLICY}"

  for COLLECTION in articles testimonials site_settings instagram_posts; do
    code=$(curl -s -o /dev/null -w "%{http_code}" \
      -X POST "${BASE}/permissions" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" \
      -d "{\"collection\":\"${COLLECTION}\",\"action\":\"read\",\"fields\":[\"*\"],\"policy\":\"${PUBLIC_POLICY}\"}")
    echo "  ${COLLECTION} read  →  HTTP ${code}"
  done

  # directus_files needs read too for asset URLs
  code=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "${BASE}/permissions" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"collection\":\"directus_files\",\"action\":\"read\",\"fields\":[\"*\"],\"policy\":\"${PUBLIC_POLICY}\"}")
  echo "  directus_files read  →  HTTP ${code}"
fi

echo ""
echo "✅  Bootstrap complete."
