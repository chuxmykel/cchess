import { ActionSheetAction } from '../components/ActionSheet';

// The ☰ menu's actions that every game screen offers.

export function flipBoardAction(flip: () => void): ActionSheetAction {
  return {
    label: 'Flip board',
    onPress: flip,
    immediate: true,
    testID: 'flip-board-action',
  };
}

/** The game, opened in the analysis board. */
export function analyseAction(analyse: () => void): ActionSheetAction {
  return {
    label: 'Analyse',
    onPress: analyse,
    testID: 'analyse-action',
  };
}

/** The game's review: its key moments, and what to take from it. */
export function reviewAction(review: () => void): ActionSheetAction {
  return {
    label: 'Game review',
    onPress: review,
    testID: 'review-action',
  };
}

/** A game against someone new - "Play 5+0", say, for someone who only
 * watched. */
export function newOpponentAction(
  findNewOpponent: () => void,
  label = 'New opponent',
): ActionSheetAction {
  return {
    label,
    onPress: findNewOpponent,
    testID: 'new-opponent-action',
  };
}
