import { describe, it, expect } from "vitest";
import { scorePrediction, tendencyOf, type MatchResult, type ScoreContext } from "./scoring";

const groupMatch = (h: number, a: number): MatchResult => ({
  homeScore: h,
  awayScore: a,
  winner: h > a ? "HOME_TEAM" : h < a ? "AWAY_TEAM" : "DRAW",
  stage: "GROUP_STAGE",
});

const noCtx: ScoreContext = { allTendencies: [], streakBefore: 0 };

describe("tendencyOf", () => {
  it("détecte victoire domicile, extérieur et nul", () => {
    expect(tendencyOf(2, 1)).toBe("HOME_TEAM");
    expect(tendencyOf(0, 3)).toBe("AWAY_TEAM");
    expect(tendencyOf(1, 1)).toBe("DRAW");
  });
});

describe("scorePrediction — base", () => {
  it("score exact = 5 pts", () => {
    const b = scorePrediction(
      { homeScore: 2, awayScore: 1, boost: "none" },
      groupMatch(2, 1),
      noCtx,
    );
    expect(b.total).toBe(5);
    expect(b.exact).toBe(true);
  });

  it("bon écart = 3 pts", () => {
    const b = scorePrediction(
      { homeScore: 2, awayScore: 1, boost: "none" },
      groupMatch(3, 2),
      noCtx,
    );
    expect(b.total).toBe(3);
    expect(b.goalDiff).toBe(true);
  });

  it("nul prédit avec autre score nul réel = tendance 2 pts (pas écart)", () => {
    const b = scorePrediction(
      { homeScore: 0, awayScore: 0, boost: "none" },
      groupMatch(1, 1),
      noCtx,
    );
    expect(b.total).toBe(2);
    expect(b.tendency).toBe(true);
  });

  it("bonne tendance seule = 2 pts", () => {
    const b = scorePrediction(
      { homeScore: 1, awayScore: 0, boost: "none" },
      groupMatch(4, 2),
      noCtx,
    );
    expect(b.total).toBe(2);
  });

  it("tout faux = 0 pt", () => {
    const b = scorePrediction(
      { homeScore: 1, awayScore: 0, boost: "none" },
      groupMatch(0, 2),
      noCtx,
    );
    expect(b.total).toBe(0);
  });
});

describe("scorePrediction — boosts", () => {
  it("double multiplie par 2", () => {
    const b = scorePrediction(
      { homeScore: 2, awayScore: 1, boost: "double" },
      groupMatch(2, 1),
      noCtx,
    );
    expect(b.total).toBe(10);
  });

  it("banco multiplie par 3", () => {
    const b = scorePrediction(
      { homeScore: 1, awayScore: 0, boost: "banco" },
      groupMatch(2, 0),
      noCtx,
    );
    expect(b.total).toBe(6);
  });

  it("boost sur un raté = toujours 0", () => {
    const b = scorePrediction(
      { homeScore: 1, awayScore: 0, boost: "banco" },
      groupMatch(0, 1),
      noCtx,
    );
    expect(b.total).toBe(0);
  });
});

describe("scorePrediction — bonus outsider", () => {
  const crowd: ScoreContext = {
    allTendencies: ["HOME_TEAM", "HOME_TEAM", "HOME_TEAM", "AWAY_TEAM"],
    streakBefore: 0,
  };

  it("+1 quand on a raison contre la foule (≤25%)", () => {
    const b = scorePrediction(
      { homeScore: 0, awayScore: 1, boost: "none" },
      groupMatch(0, 2),
      crowd,
    );
    expect(b.underdog).toBe(true);
    expect(b.total).toBe(3); // tendance 2 + outsider 1
  });

  it("pas de bonus si trop de monde a le même prono", () => {
    const b = scorePrediction(
      { homeScore: 2, awayScore: 0, boost: "none" },
      groupMatch(1, 0),
      crowd,
    );
    expect(b.underdog).toBe(false);
  });

  it("pas de bonus avec moins de 4 pronos", () => {
    const b = scorePrediction(
      { homeScore: 0, awayScore: 1, boost: "none" },
      groupMatch(0, 2),
      { allTendencies: ["HOME_TEAM", "AWAY_TEAM"], streakBefore: 0 },
    );
    expect(b.underdog).toBe(false);
  });
});

describe("scorePrediction — série", () => {
  it("+1 à partir de la 3e bonne tendance consécutive", () => {
    const b = scorePrediction(
      { homeScore: 1, awayScore: 0, boost: "none" },
      groupMatch(2, 1),
      { allTendencies: [], streakBefore: 2 },
    );
    expect(b.streak).toBe(true);
    expect(b.total).toBe(4); // écart 3 + série 1
  });

  it("pas de bonus série à la 2e", () => {
    const b = scorePrediction(
      { homeScore: 1, awayScore: 0, boost: "none" },
      groupMatch(2, 0),
      { allTendencies: [], streakBefore: 1 },
    );
    expect(b.streak).toBe(false);
  });

  it("la série ne sauve pas un prono raté", () => {
    const b = scorePrediction(
      { homeScore: 1, awayScore: 0, boost: "none" },
      groupMatch(0, 1),
      { allTendencies: [], streakBefore: 10 },
    );
    expect(b.total).toBe(0);
  });
});

describe("scorePrediction — phase finale", () => {
  const koDraw: MatchResult = {
    homeScore: 1,
    awayScore: 1,
    winner: "AWAY_TEAM", // qualifié aux TAB
    stage: "LAST_16",
  };

  it("nul prédit + bon qualifié = tendance + qualifié", () => {
    const b = scorePrediction(
      { homeScore: 1, awayScore: 1, koWinnerSide: "AWAY_TEAM", boost: "none" },
      koDraw,
      noCtx,
    );
    expect(b.koQualifier).toBe(true);
    expect(b.total).toBe(7); // exact 5 + qualifié 2
  });

  it("nul prédit + mauvais qualifié = points du score seulement", () => {
    const b = scorePrediction(
      { homeScore: 0, awayScore: 0, koWinnerSide: "HOME_TEAM", boost: "none" },
      koDraw,
      noCtx,
    );
    expect(b.koQualifier).toBe(false);
    expect(b.total).toBe(2); // tendance nul
  });

  it("pas de bonus qualifié en phase de groupes", () => {
    const b = scorePrediction(
      { homeScore: 1, awayScore: 1, koWinnerSide: "HOME_TEAM", boost: "none" },
      groupMatch(1, 1),
      noCtx,
    );
    expect(b.koQualifier).toBe(false);
    expect(b.total).toBe(5);
  });
});
