export interface Me {
  id: number;
  username: string;
  displayName: string;
  avatar: string;
  isAdmin: boolean;
  doublesLeft: number;
  bancosLeft: number;
  onboarded: boolean;
}

export interface TeamView {
  id: number;
  name: string;
  tla: string;
  emblem: string | null;
  groupName: string | null;
}

export interface MatchView {
  id: number;
  stage: string;
  groupName: string | null;
  kickoff: string;
  status: string;
  minute: string | null;
  homeScore: number | null;
  awayScore: number | null;
  winner: string | null;
  settled: boolean;
  locked: boolean;
  isKnockout: boolean;
  home: TeamView | null;
  away: TeamView | null;
  myPrediction: {
    homeScore: number;
    awayScore: number;
    koWinnerTeamId: number | null;
    boost: string;
    points: number | null;
    breakdown: string | null;
  } | null;
  predictionCount: number;
}

export interface LeaderboardRow {
  userId: number;
  username: string;
  displayName: string;
  avatar: string;
  matchPoints: number;
  bonusPoints: number;
  total: number;
  exactCount: number;
  predictionsCount: number;
  badgeCount: number;
  rank: number;
  movement: number;
}

export interface FeedItem {
  id: number;
  type: string;
  emoji?: string;
  message?: string;
  createdAt: string;
}

export interface BonusQuestion {
  id: number;
  kind: string;
  label: string;
  description: string;
  points: number;
  deadline: string;
  locked: boolean;
  settled: boolean;
  answer: string | null;
  myAnswer: string | null;
  myPoints: number | null;
}

export interface BadgeView {
  id: string;
  emoji: string;
  label: string;
  description: string;
  badgeId?: string;
  awardedAt?: string;
}
