import { act, render } from '@testing-library/react-native';
import { Text } from 'react-native';

import { EngineProvider, useEngine } from '../EngineContext';
import { ensureEngineFiles } from '../../engine/engineFiles';
import { readEngineFiles } from '../../engine/engineStore';

jest.mock('../../engine/engineFiles', () => ({
  ...jest.requireActual('../../engine/engineFiles'),
  ensureEngineFiles: jest.fn(),
}));
jest.mock('../../engine/engineStore', () => ({
  createEngineStore: jest.fn(() => ({})),
  readEngineFiles: jest.fn(),
  removeOtherEngineVersions: jest.fn(),
}));

// What the app posted to the page (see jest-setup.js's WebView).
const { postedMessages } = jest.requireMock<{ postedMessages: string[] }>(
  'react-native-webview',
);

const FILES = { glueJs: 'glue();', wasmBase64: 'AGFzbQ==' };

// A screen using the engine, showing where it's got to.
const Analysing: React.FC = () => {
  const { status, retry } = useEngine();
  return (
    <Text testID="status" onPress={retry}>
      {status.kind === 'downloading'
        ? `downloading ${status.progress}`
        : status.kind}
    </Text>
  );
};

type Screen = Awaited<ReturnType<typeof render>>;

async function pageSays(screen: Screen, message: object) {
  await act(async () =>
    screen.getByTestId('engine-host').props.onMessage({
      nativeEvent: { data: JSON.stringify(message) },
    }),
  );
}

describe('EngineProvider', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    postedMessages.length = 0;
    jest.mocked(readEngineFiles).mockResolvedValue(FILES);
  });
  afterEach(() => jest.useRealTimers());

  it('does nothing until a screen asks for the engine', async () => {
    const screen = await render(
      <EngineProvider>
        <Text>Home</Text>
      </EngineProvider>,
    );

    expect(ensureEngineFiles).not.toHaveBeenCalled();
    expect(screen.queryByTestId('engine-host')).toBeNull();
  });

  it('shows the download as it goes', async () => {
    let report: (fraction: number) => void = () => {};
    jest
      .mocked(ensureEngineFiles)
      .mockImplementation((_store, _files, onProgress) => {
        report = onProgress;
        return new Promise(() => {});
      });
    const screen = await render(
      <EngineProvider>
        <Analysing />
      </EngineProvider>,
    );

    await act(async () => report(0.5));

    expect(screen.getByTestId('status')).toHaveTextContent('downloading 0.5');
  });

  it('boots the page with the files, then hands out an engine per search', async () => {
    jest.mocked(ensureEngineFiles).mockResolvedValue(undefined);
    const screen = await render(
      <EngineProvider>
        <Analysing />
      </EngineProvider>,
    );
    expect(screen.getByTestId('status')).toHaveTextContent('starting');

    await pageSays(screen, { type: 'ready' });
    expect(JSON.parse(postedMessages[0])).toEqual({
      type: 'boot',
      slots: ['main', 'threat'],
      ...FILES,
    });

    await pageSays(screen, { type: 'booted' });
    expect(screen.getByTestId('status')).toHaveTextContent('ready');
    // Each engine says hello to its own worker.
    expect(postedMessages.slice(1).map((m) => JSON.parse(m))).toEqual([
      { type: 'uci', slot: 'main', command: 'uci' },
      { type: 'uci', slot: 'threat', command: 'uci' },
    ]);
  });

  it('fails when the engine cannot be downloaded, and tries again', async () => {
    jest
      .mocked(ensureEngineFiles)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue(undefined);
    const screen = await render(
      <EngineProvider>
        <Analysing />
      </EngineProvider>,
    );
    expect(screen.getByTestId('status')).toHaveTextContent('error');

    await act(async () => screen.getByTestId('status').props.onPress());

    expect(screen.getByTestId('status')).toHaveTextContent('starting');
  });

  it('shuts the page down a while after the last screen lets go', async () => {
    jest.mocked(ensureEngineFiles).mockResolvedValue(undefined);
    const screen = await render(
      <EngineProvider>
        <Analysing />
      </EngineProvider>,
    );
    expect(screen.getByTestId('engine-host')).toBeTruthy();

    await screen.rerender(
      <EngineProvider>
        <Text>Home</Text>
      </EngineProvider>,
    );
    await act(async () => jest.advanceTimersByTime(29_000));
    expect(screen.getByTestId('engine-host')).toBeTruthy();
    await act(async () => jest.advanceTimersByTime(1_000));

    expect(screen.queryByTestId('engine-host')).toBeNull();
  });
});
