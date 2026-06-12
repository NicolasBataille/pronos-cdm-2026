# --- Étape 1 : dépendances + build ---
FROM node:22-slim AS builder
WORKDIR /app

# Outils nécessaires à la compilation de better-sqlite3
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# --- Étape 2 : image d'exécution minimale ---
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Next.js standalone embarque le serveur + node_modules nécessaires
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
# better-sqlite3 est un binaire natif : on récupère le module compilé
COPY --from=builder /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3

# Les données SQLite vivent dans /app/data (à monter en volume)
RUN mkdir -p /app/data
VOLUME /app/data

EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
