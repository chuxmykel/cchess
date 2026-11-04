import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StyleSheet } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

import { ENGINE_FILES } from '../constants/engine';
import { ensureEngineFiles } from '../engine/engineFiles';
import {
  createEngineStore,
  readEngineFiles,
  removeOtherEngineVersions,
} from '../engine/engineStore';
import { STOCKFISH_PAGE } from '../engine/stockfishPage';
import { AnalysisEngine, ENGINE_SLOTS, EngineSlot } from '../engine/types';
import { UciEngine } from '../engine/UciEngine';
import { createSlotTransports } from '../engine/webViewTransport';

export type EngineStatus =
  | { kind: 'idle' }
  | { kind: 'downloading'; progress: number }
  | { kind: 'starting' }
  | { kind: 'ready'; engines: Record<EngineSlot, AnalysisEngine> }
  | { kind: 'error' };

type EngineContextValue = {
  status: EngineStatus;
  // Counts a screen using the engine; returns its release.
  acquire: () => () => void;
  retry: () => void;
};

const EngineContext = createContext<EngineContextValue | null>(null);

// Kept running this long after the last screen using it lets go, so leaving
// analysis for a moment doesn't mean starting the engine again.
const IDLE_SHUTDOWN_MS = 30_000;

type EngineFiles = { glueJs: string; wasmBase64: string };

// The analysis engine, for the whole app: downloaded the first time a
// screen asks for it (then kept on the device - see engineFiles), run in a
// hidden WebView only while something's using it, and started again if iOS
// ends the WebView's process.
export const EngineProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [users, setUsers] = useState(0);
  // Let go of by every screen, long enough ago to shut down.
  const [isShutDown, setIsShutDown] = useState(true);
  const [progress, setProgress] = useState(0);
  const [downloadFailed, setDownloadFailed] = useState(false);
  const [files, setFiles] = useState<EngineFiles | null>(null);
  const [engines, setEngines] = useState<Record<
    EngineSlot,
    AnalysisEngine
  > | null>(null);
  const [pageFailed, setPageFailed] = useState(false);
  // Bumped to load the page afresh: after its process ended, or a retry.
  const [pageKey, setPageKey] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const webView = useRef<WebView<object>>(null);
  const receive = useRef<
    ((message: { slot?: EngineSlot; line?: string }) => void) | null
  >(null);
  const running = users > 0 || !isShutDown;

  useEffect(() => {
    if (users > 0) return;
    const timer = setTimeout(() => {
      setIsShutDown(true);
      // Out of memory with the page.
      setFiles(null);
      setEngines(null);
      receive.current = null;
    }, IDLE_SHUTDOWN_MS);
    return () => clearTimeout(timer);
  }, [users]);

  // The files, downloaded if they aren't on the device yet.
  useEffect(() => {
    if (!running || files) return;
    let current = true;
    ensureEngineFiles(
      createEngineStore(),
      [ENGINE_FILES.glue, ENGINE_FILES.wasm],
      (fraction) => {
        if (current) setProgress(fraction);
      },
    )
      .then(() => {
        removeOtherEngineVersions();
        return readEngineFiles();
      })
      .then((read) => {
        if (current) setFiles(read);
      })
      .catch(() => {
        if (current) setDownloadFailed(true);
      });
    return () => {
      current = false;
    };
  }, [running, files, attempt]);

  const post = useCallback((message: string) => {
    webView.current?.postMessage(message);
  }, []);

  const onMessage = useCallback(
    (event: WebViewMessageEvent) => {
      let message: { type?: string; slot?: EngineSlot; line?: string };
      try {
        message = JSON.parse(event.nativeEvent.data);
      } catch {
        return;
      }
      switch (message.type) {
        case 'ready':
          if (files) {
            post(
              JSON.stringify({ type: 'boot', slots: ENGINE_SLOTS, ...files }),
            );
          }
          break;
        case 'booted': {
          const { transports, receive: route } = createSlotTransports(
            post,
            ENGINE_SLOTS,
          );
          receive.current = route;
          setEngines({
            main: new UciEngine(transports.main),
            threat: new UciEngine(transports.threat),
          });
          break;
        }
        case 'line':
          receive.current?.(message);
          break;
        case 'error':
          setPageFailed(true);
          break;
      }
    },
    [files, post],
  );

  const restartPage = useCallback(() => {
    receive.current = null;
    setEngines(null);
    setPageFailed(false);
    setPageKey((key) => key + 1);
  }, []);

  const acquire = useCallback(() => {
    setUsers((count) => count + 1);
    setIsShutDown(false);
    return () => setUsers((count) => count - 1);
  }, []);

  const retry = useCallback(() => {
    if (files) {
      restartPage();
    } else {
      setDownloadFailed(false);
      setProgress(0);
      setAttempt((count) => count + 1);
    }
  }, [files, restartPage]);

  const status = useMemo((): EngineStatus => {
    if (!running) return { kind: 'idle' };
    if (downloadFailed || pageFailed) return { kind: 'error' };
    if (!files) return { kind: 'downloading', progress };
    if (!engines) return { kind: 'starting' };
    return { kind: 'ready', engines };
  }, [running, downloadFailed, pageFailed, files, progress, engines]);

  const value = useMemo(
    () => ({ status, acquire, retry }),
    [status, acquire, retry],
  );

  return (
    <EngineContext.Provider value={value}>
      {children}
      {running && files && (
        <WebView
          key={pageKey}
          ref={webView}
          source={{ html: STOCKFISH_PAGE }}
          originWhitelist={['*']}
          onMessage={onMessage}
          onContentProcessDidTerminate={restartPage}
          // The page sits in a container that grows to fill its parent
          // unless it's given a style of its own - hidden too, or it takes
          // half the screen from the app.
          containerStyle={styles.hidden}
          style={styles.hidden}
          pointerEvents="none"
          testID="engine-host"
        />
      )}
    </EngineContext.Provider>
  );
};

// The engine, for a screen that analyses: it's started while the screen is
// mounted (see EngineProvider).
export function useEngine(): Omit<EngineContextValue, 'acquire'> {
  const context = useContext(EngineContext);
  if (!context) {
    throw new Error('useEngine must be used within an EngineProvider');
  }
  const { acquire, status, retry } = context;
  useEffect(() => acquire(), [acquire]);
  return { status, retry };
}

// The context itself, for tests to give screens a fake engine.
export { EngineContext };

const styles = StyleSheet.create({
  hidden: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
});
