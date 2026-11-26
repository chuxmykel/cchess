import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { HomeStackScreenProps } from '../HomeStack/types';

// A game review's own stack: its summary, then the moves stepped through
// over it - so Back, the header's or a swipe, goes from the moves to the
// summary, and from the summary out of the review.
export type ReviewStackParamList = {
  ReviewSummary: undefined;
  ReviewMoves: undefined;
};

export type ReviewStackScreenProps<
  RouteName extends keyof ReviewStackParamList,
> = CompositeScreenProps<
  NativeStackScreenProps<ReviewStackParamList, RouteName>,
  HomeStackScreenProps<'GameReview'>
>;
