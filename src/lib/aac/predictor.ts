// AAC next-card predictor — ported 1:1 from
// standalone_autism_module/app/services/ml_predictor.py
// Runs entirely in the browser: no backend call, no database.

import { AACCard, getCardById } from "./cards";
import { TRANSITION_MATRIX } from "./transition-matrix";

export interface PredictedCard {
  card: AACCard;
  probability: number;
  reason: string;
}

const STARTER_IDS = ["i_want", "i_feel", "i_need", "help_please"];
const FALLBACK_IDS = ["thank_you", "yes", "help_please"];

export function predictNextCards(sequence: string[], topK = 4): PredictedCard[] {
  // No cards yet → recommend sentence starters
  if (sequence.length === 0) {
    return STARTER_IDS.slice(0, topK)
      .map((id) => getCardById(id))
      .filter((c): c is AACCard => !!c)
      .map((card) => ({
        card,
        probability: 0.25,
        reason: "Recommended starter to initiate communication",
      }));
  }

  const lastToken = sequence[sequence.length - 1];
  const lastCard = getCardById(lastToken);
  const predictions: PredictedCard[] = [];
  const seen = new Set<string>();

  // 1. Trained transition matrix
  const nextProbs = TRANSITION_MATRIX[lastToken];
  if (nextProbs) {
    for (const [targetId, prob] of Object.entries(nextProbs)) {
      const card = getCardById(targetId);
      if (card && !seen.has(targetId)) {
        seen.add(targetId);
        predictions.push({
          card,
          probability: prob,
          reason: `High transition likelihood after '${lastCard ? lastCard.label : lastToken}'`,
        });
      }
    }
  }

  // 2. Fallback: the card's own default hints
  if (lastCard && predictions.length < topK) {
    for (const hintId of lastCard.defaultNextHints) {
      if (!seen.has(hintId)) {
        const card = getCardById(hintId);
        if (card) {
          seen.add(hintId);
          predictions.push({ card, probability: 0.15, reason: "Standard contextual continuation" });
        }
      }
    }
  }

  // 3. Universal courteous endings
  if (predictions.length < topK) {
    for (const fid of FALLBACK_IDS) {
      if (!seen.has(fid) && fid !== lastToken) {
        const card = getCardById(fid);
        if (card) {
          seen.add(fid);
          predictions.push({ card, probability: 0.1, reason: "Polite sentence closure" });
        }
      }
    }
  }

  return predictions.slice(0, topK);
}
