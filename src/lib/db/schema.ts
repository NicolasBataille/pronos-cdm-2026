import {
  sqliteTable,
  text,
  integer,
  uniqueIndex,
  index,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
  avatar: text("avatar").notNull().default("⚽"),
  passwordHash: text("password_hash").notNull(),
  isAdmin: integer("is_admin", { mode: "boolean" }).notNull().default(false),
  doublesLeft: integer("doubles_left").notNull().default(4),
  bancosLeft: integer("bancos_left").notNull().default(1),
  onboardedAt: integer("onboarded_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const teams = sqliteTable("teams", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  extId: integer("ext_id").unique(),
  name: text("name").notNull(),
  shortName: text("short_name").notNull(),
  tla: text("tla").notNull().default("???"),
  emblem: text("emblem"),
  groupName: text("group_name"),
});

export const matches = sqliteTable(
  "matches",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    extId: integer("ext_id").unique(),
    stage: text("stage").notNull(),
    groupName: text("group_name"),
    kickoff: integer("kickoff", { mode: "timestamp" }).notNull(),
    homeTeamId: integer("home_team_id").references(() => teams.id),
    awayTeamId: integer("away_team_id").references(() => teams.id),
    // SCHEDULED | TIMED | IN_PLAY | PAUSED | FINISHED | POSTPONED | CANCELLED
    status: text("status").notNull().default("TIMED"),
    homeScore: integer("home_score"),
    awayScore: integer("away_score"),
    // HOME_TEAM | AWAY_TEAM | DRAW (résultat officiel, prolongations/tab inclus)
    winner: text("winner"),
    minute: text("minute"),
    settled: integer("settled", { mode: "boolean" }).notNull().default(false),
  },
  (t) => [index("idx_matches_kickoff").on(t.kickoff), index("idx_matches_status").on(t.status)],
);

export const predictions = sqliteTable(
  "predictions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    matchId: integer("match_id")
      .notNull()
      .references(() => matches.id),
    homeScore: integer("home_score").notNull(),
    awayScore: integer("away_score").notNull(),
    // Vainqueur choisi si score nul prédit en phase à élimination directe
    koWinnerTeamId: integer("ko_winner_team_id"),
    // none | double | banco
    boost: text("boost").notNull().default("none"),
    points: integer("points"),
    breakdown: text("breakdown"),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [uniqueIndex("uq_prediction_user_match").on(t.userId, t.matchId)],
);

export const bonusQuestions = sqliteTable("bonus_questions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  // champion | top_scorer | france_stage | total_goals_final
  kind: text("kind").notNull().unique(),
  label: text("label").notNull(),
  description: text("description").notNull(),
  points: integer("points").notNull(),
  deadline: integer("deadline", { mode: "timestamp" }).notNull(),
  answer: text("answer"),
  settled: integer("settled", { mode: "boolean" }).notNull().default(false),
});

export const bonusAnswers = sqliteTable(
  "bonus_answers",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    questionId: integer("question_id")
      .notNull()
      .references(() => bonusQuestions.id),
    answer: text("answer").notNull(),
    points: integer("points"),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [uniqueIndex("uq_bonus_user_question").on(t.userId, t.questionId)],
);

export const badges = sqliteTable(
  "badges",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    badgeId: text("badge_id").notNull(),
    awardedAt: integer("awarded_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [uniqueIndex("uq_badge_user").on(t.userId, t.badgeId)],
);

export const events = sqliteTable(
  "events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    // badge | boost_used | match_settled | exact_score | overtake | streak
    type: text("type").notNull(),
    payload: text("payload").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [index("idx_events_created").on(t.createdAt)],
);

export const standingsSnapshots = sqliteTable(
  "standings_snapshots",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    day: text("day").notNull(),
    userId: integer("user_id").notNull(),
    rank: integer("rank").notNull(),
    points: integer("points").notNull(),
  },
  (t) => [uniqueIndex("uq_snapshot_day_user").on(t.day, t.userId)],
);

export const meta = sqliteTable("meta", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
