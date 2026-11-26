import { useCallback, useRef, useState } from 'react';
import { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

// A view shared as a picture: captured as a PNG and handed to the share
// sheet. `isSharing` while it's under way; `onError` when it can't be.
export function useShareCard(onError?: (message: string) => void): {
  ref: React.RefObject<React.ComponentRef<typeof View> | null>;
  isSharing: boolean;
  share: () => Promise<void>;
} {
  const ref = useRef<React.ComponentRef<typeof View>>(null);
  const [isSharing, setSharing] = useState(false);

  const share = useCallback(async () => {
    if (!ref.current) return;
    setSharing(true);
    try {
      const uri = await captureRef(ref, { format: 'png', result: 'tmpfile' });
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Share this game',
        UTI: 'public.png',
      });
    } catch {
      onError?.("This game couldn't be shared.");
    } finally {
      setSharing(false);
    }
  }, [onError]);

  return { ref, isSharing, share };
}
