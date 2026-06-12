# 🏆 Pronos CDM 2026

Le championnat de pronostics **entre potes** pour la Coupe du Monde de foot. Gratuit, auto-hébergé, sans pub, sans inscription publique : juste toi et tes amis qui se chambrent à coups de scores exacts et de Bancos.

- ⚡ **Validation 100% automatique et en temps réel** — les scores tombent, les points se calculent et le classement bouge tout seul.
- 🎮 **Gamification complète** — bien plus que parier le score : boosts, bonus outsider, séries, badges, questions bonus, podium animé.
- 🚀 **Déploiement en une commande** avec Docker. Base de données incluse (SQLite, zéro config).
- 📱 **UI mobile-first** soignée, en direct via Server-Sent Events.

---

## 🚀 Déploiement (le plus simple)

### Option A — Docker (recommandé)

```bash
# 1. Choisis un code d'invitation pour tes amis et lance :
INVITE_CODE="vive-les-bleus" docker compose up -d --build

# 2. C'est en ligne sur http://localhost:3000
```

Pour le rendre accessible à tes amis : déploie sur n'importe quel petit serveur (un VPS à 5€, un Raspberry Pi, [Railway](https://railway.app), [Render](https://render.com), [Fly.io](https://fly.io)...) et partage l'URL + le code d'invitation.

> **Le premier inscrit devient automatiquement l'administrateur** 👑

### Option B — Sans Docker

```bash
corepack enable
pnpm install
pnpm build
INVITE_CODE="vive-les-bleus" pnpm start   # http://localhost:3000
```

---

## ⚽ Les scores : 3 modes (tu choisis)

L'app détecte automatiquement le mode selon ta config :

| Mode | Activation | Ce qui se passe |
|------|-----------|-----------------|
| 🛰️ **API auto** | `FOOTBALL_DATA_API_KEY` renseignée | Calendrier et scores récupérés et validés **automatiquement en temps réel** depuis [football-data.org](https://www.football-data.org). Rien à faire. |
| ✍️ **Manuel** | Aucune clé | L'admin saisit le score final d'un match → les points de tout le monde sont distribués **instantanément**. Parfait si l'API ne couvre pas la compétition. |
| 🎮 **Démo** | `DEMO_MODE=1` | Un mini-tournoi de matchs **simulés en accéléré** (un match = 60 s) pour tester toute l'app tout de suite. |

### Obtenir une clé API gratuite (2 min)

1. Crée un compte sur **https://www.football-data.org/client/register**
2. Copie ton jeton API
3. Mets-le dans `FOOTBALL_DATA_API_KEY` (variable d'env ou fichier `.env`)

> Le plan gratuit fonctionne bien. Si la Coupe du Monde n'est pas couverte par ton plan, bascule simplement en **mode manuel** : l'admin entre les scores depuis l'app, et toute la gamification reste automatique.

### Tester tout de suite, sans rien configurer

```bash
DEMO_MODE=1 INVITE_CODE=test docker compose up --build
# Inscris-toi, pronostique, et regarde les matchs se jouer en direct en 1 minute.
```

---

## 🎯 Comment on marque des points

### À chaque match
| Situation | Points |
|-----------|--------|
| 🎯 **Score exact** | **5 pts** |
| Bon vainqueur **+ bon écart** de buts (ex : tu dis 2-1, c'est 3-2) | **3 pts** |
| Bonne **tendance** (victoire / nul / défaite) | **2 pts** |
| 🦄 **Bonus outsider** : tu as raison alors que ≤ 25 % du groupe y croyait | **+1 pt** |
| 🔥 **Bonus série** : à partir de 3 bonnes tendances d'affilée | **+1 pt / match** |
| Phase finale : nul prédit **+ bon qualifié** choisi | **+2 pts** |

### Les boosts (jetons limités, à placer avant le coup d'envoi)
- ✌️ **Doublé** (×2) — tu en as **4** pour tout le tournoi.
- 💰 **Banco** (×3) — tu n'en as **qu'un seul**. À garder pour LE match dont tu es sûr.

Un boost ne multiplie que des points gagnés : zéro reste zéro, aucun risque de points négatifs. Tu peux changer d'avis tant que le match n'a pas commencé (le jeton t'est rendu).

### Les questions bonus (gros points, à répondre avant le 1er match)
- 🏆 **Champion du monde** (20 pts) — validé tout seul à la finale.
- 🎟️ **Les deux finalistes** (12 pts) — moitié des points par finaliste correct, validé tout seul.
- 👟 **Meilleur buteur** (10 pts) — validé par l'admin à la fin.

### Les badges à débloquer 🏅
Sniper 🎯, Nostradamus 🔮, Madame Irma 🧙, Pyromane 🔥, Jackpot 💰, Licorne 🦄, Remontada 🚀... et quelques badges de la honte pour les nuls (Clown 🤡, Touriste 🛋️). Ils tombent automatiquement.

---

## ⚙️ Variables d'environnement

| Variable | Défaut | Description |
|----------|--------|-------------|
| `INVITE_CODE` | `allez-les-bleus` | **Obligatoire en pratique.** Le code que tes amis saisissent pour s'inscrire. |
| `FOOTBALL_DATA_API_KEY` | _(vide)_ | Clé football-data.org pour les scores automatiques. |
| `DEMO_MODE` | `0` | `1` = matchs simulés pour tester. |
| `SESSION_SECRET` | _(auto)_ | Secret des sessions. Généré et persisté dans `./data` si absent. |
| `DATABASE_PATH` | `./data/cdm.db` | Emplacement de la base SQLite. |

Voir `.env.example` pour un fichier prêt à copier.

---

## 🛠️ Stack technique

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **SQLite** via **better-sqlite3** + **Drizzle ORM** — un seul fichier, aucune base externe à gérer
- **Tailwind CSS v4**
- **Server-Sent Events** pour le temps réel (scores, classement, badges, fil d'activité)
- Un **poller** en tâche de fond synchronise les scores et règle les matchs automatiquement
- Tout démarre via `instrumentation.ts` : seed des données + lancement du poller, **zéro étape manuelle**

### Développement

```bash
pnpm install
DEMO_MODE=1 INVITE_CODE=test pnpm dev   # http://localhost:3000
pnpm test                                # tests du moteur de points
```

## 📁 Architecture

```
src/
├── instrumentation.ts        # bootstrap au démarrage (seed + poller)
├── lib/
│   ├── db/                    # schéma Drizzle + DDL SQLite
│   ├── game/                  # moteur : scoring, badges, classement, règlement auto
│   ├── sync/                  # football-data.org + mode démo + poller temps réel
│   ├── auth.ts                # sessions JWT (cookie httpOnly)
│   └── realtime.ts            # bus d'événements SSE
├── app/api/                   # routes REST + flux SSE /api/events
└── components/                # UI React (mobile-first)
```

Le cœur du jeu (`src/lib/game/scoring.ts`) est constitué de fonctions pures, couvertes par des tests unitaires (`pnpm test`).

---

Fait pour se marrer entre potes. Bon tournoi ! ⚽🇫🇷
