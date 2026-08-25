#!/usr/bin/env bash
# Create MinIO Evidence bucket (CORS via docker-compose MINIO_API_CORS_ALLOW_ORIGIN).
set -euo pipefail

ENDPOINT="${S3_ENDPOINT:-http://127.0.0.1:9100}"
ACCESS="${S3_ACCESS_KEY:-minioadmin}"
SECRET="${S3_SECRET_KEY:-minioadmin}"
BUCKET="${S3_BUCKET:-watchdog-evidence}"

if ! command -v mc >/dev/null 2>&1; then
  echo "minio-client (mc) required — install via nix develop / pkgs.minio-client" >&2
  exit 1
fi

mc alias set local "$ENDPOINT" "$ACCESS" "$SECRET" --api S3v4
mc mb --ignore-existing "local/${BUCKET}"
echo "Bucket ready: ${BUCKET} @ ${ENDPOINT}"
