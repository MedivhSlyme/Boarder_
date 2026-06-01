import { User, SuggestedPlayer, Skill } from '../models/types';

// ─── Cosine-similarity ML engine ──────────────────────────────────────────────
// Architecture (matches design spec in attached .txt):
//   1. Feature extraction   – per-user numeric vector over the shared game corpus
//   2. Cosine similarity    – dot-product / product-of-norms, fully server-side-ready
//   3. Geographic filter    – haversine ≤ MAX_DIST_KM
//   4. Hybrid score         – ML_score * 0.70 + proximity_score * 0.30

const SKILL_VALUE: Record<Skill, number> = {
  Beginner:     1,
  Amateur:      2,
  Intermediate: 3,
  Advanced:     4,
  Expert:       5,
};
const MAX_SKILL = 5;

function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 *
      Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180);
  return 2 * R * Math.asin(Math.sqrt(x));
}

/**
 * Build a dense feature vector for a user over a fixed game corpus.
 * Dimensions: one per known game, value = normalised skill (0 if not played).
 */
function buildVector(user: User, corpus: string[]): Float64Array {
  const lookup = new Map<string, number>();
  for (const g of user.games) {
    lookup.set(g.name.toLowerCase(), SKILL_VALUE[g.skill] / MAX_SKILL);
  }
  const vec = new Float64Array(corpus.length);
  for (let i = 0; i < corpus.length; i++) {
    vec[i] = lookup.get(corpus[i]) ?? 0;
  }
  return vec;
}

function cosineSimilarity(a: Float64Array, b: Float64Array): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot   += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/** Shared game names (for the "shared games" label in the UI). */
function sharedGameNames(a: User, b: User): string[] {
  const setA = new Set(a.games.map((g) => g.name.toLowerCase()));
  return b.games
    .filter((g) => setA.has(g.name.toLowerCase()))
    .map((g) => g.name);
}

/**
 * ML-based friend suggestion engine.
 *
 * Algorithm:
 *   – Content-based filtering via cosine similarity on skill-encoded game vectors
 *   – Geographic pre-filter (MAX_DIST_KM) to keep suggestions reachable
 *   – Hybrid score: cosine * 0.70 + proximity * 0.30
 *   – Excludes existing friends and the current user
 *
 * Computation is designed to be hosted server-side (pure TS, no DOM/RN deps).
 */
export function getSuggestions(
  currentUser: User,
  allUsers: User[],
  loc: { lat: number; lng: number },
): SuggestedPlayer[] {
  const myFriends = new Set(currentUser.friends ?? []);
  const MAX_DIST_KM = 25;

  // Build shared game corpus from all users (current + candidates)
  const corpusSet = new Set<string>();
  for (const u of allUsers) {
    for (const g of u.games) corpusSet.add(g.name.toLowerCase());
  }
  const corpus = Array.from(corpusSet);

  if (corpus.length === 0) return [];

  const myVec = buildVector(currentUser, corpus);

  const results: SuggestedPlayer[] = [];

  for (const u of allUsers) {
    if (u.id === currentUser.id || myFriends.has(u.id)) continue;

    const distanceKm = haversineKm(loc, u.location);
    if (distanceKm > MAX_DIST_KM) continue;

    const uVec = buildVector(u, corpus);
    const mlScore = cosineSimilarity(myVec, uVec);

    // Candidates with zero shared games AND low proximity don't make good suggestions
    if (mlScore === 0 && distanceKm > MAX_DIST_KM * 0.5) continue;

    const proximityScore = Math.max(0, 1 - distanceKm / MAX_DIST_KM);
    const score = mlScore * 0.7 + proximityScore * 0.3;

    if (score <= 0) continue;

    results.push({
      user: u,
      score,
      distanceKm,
      sharedGames: sharedGameNames(currentUser, u),
    });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 20);
}
