import { EffectCallback, useEffect } from 'react';

export function useFocusEffect(effect: EffectCallback): void {
  useEffect(effect, [effect]);
}
