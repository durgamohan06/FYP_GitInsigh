export interface ContributorActivity {
  commits?: number | null;
  pullRequests?: number | null;
  issues?: number | null;
  reviews?: number | null;
}

const ACTIVITY_WEIGHTS = {
  commits: 20,
  pullRequests: 25,
  issues: 15,
  reviews: 20,
} as const;

const SATURATION_SCALES = {
  commits: 5,
  pullRequests: 3,
  issues: 3,
  reviews: 3,
} as const;

function safeCount(value: number | null | undefined): number {
  return Number.isFinite(value) ? Math.max(0, value as number) : 0;
}

function diminishingReturn(count: number, saturationScale: number): number {
  return 1 - Math.exp(-count / saturationScale);
}

/**
 * Scores one contributor on a bounded 0-100 scale.
 * Activity counts are expected to already be scoped to the selected repository and period.
 */
export function calculateContributorScore(activity: ContributorActivity): number {
  const counts = {
    commits: safeCount(activity.commits),
    pullRequests: safeCount(activity.pullRequests),
    issues: safeCount(activity.issues),
    reviews: safeCount(activity.reviews),
  };
  const activeTypes = Object.values(counts).filter((count) => count > 0).length;
  if (activeTypes === 0) return 0;

  const activityPoints = (Object.keys(ACTIVITY_WEIGHTS) as Array<keyof typeof ACTIVITY_WEIGHTS>).reduce(
    (total, type) => total + ACTIVITY_WEIGHTS[type] * diminishingReturn(counts[type], SATURATION_SCALES[type]),
    0,
  );
  const diversityPoints = (activeTypes / Object.keys(ACTIVITY_WEIGHTS).length) * 20;
  const score = activityPoints + diversityPoints;

  // Keep precision during calculation, then round only the displayed score.
  return Math.max(1, Math.min(100, Math.round(score)));
}
