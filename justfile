# Watchdog greenfield

set dotenv-load := true

# Postgres + MinIO
up:
    docker compose up -d postgres minio

down:
    docker compose down

migrate:
    pnpm db:migrate

minio-init:
    bash scripts/minio-init.sh

# Empty Case Graph / Jobs / Inbox / Evidence. Keeps auth + vault. `just wipe yes` skips prompt.
wipe *args:
    bash scripts/wipe-case-data.sh {{args}}

# Create + migrate watchdog_test / watchdog_e2e
test-db:
    bash scripts/ensure-test-db.sh

# Cap Job worker
worker:
    pnpm dev:worker

# Solo bootstrap: allow signup briefly, then sign up in the UI
bootstrap-hint:
    @echo "1. Set BETTER_AUTH_ALLOW_SIGNUP=1 in .env"
    @echo "2. pnpm dev:web → http://127.0.0.1:3000/auth/sign-up"
    @echo "3. Create the first admin account"
    @echo "4. Set BETTER_AUTH_ALLOW_SIGNUP=0"
