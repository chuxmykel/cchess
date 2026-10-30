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
