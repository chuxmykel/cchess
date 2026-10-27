import { byPresence, presenceLabel } from '../presence';

const NOW = new Date('2026-10-27T12:00:00.000Z');

function presence(
  overrides: Partial<Parameters<typeof presenceLabel>[0]> = {},
) {
  return {
    online: false,
    playingGameId: null,
    lastSeenAt: null,
    ...overrides,
  };
}

describe('presenceLabel', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: NOW });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('says when someone is playing, before whether they are online', () => {
    expect(presenceLabel(presence({ online: true, playingGameId: 'g' }))).toBe(
      'Playing right now',
    );
    expect(presenceLabel(presence({ online: true }))).toBe('Online');
  });

  it('says how long ago someone offline was last active', () => {
    expect(
      presenceLabel(presence({ lastSeenAt: '2026-10-27T11:44:00.000Z' })),
    ).toBe('Active 16 minutes ago');
    expect(
      presenceLabel(presence({ lastSeenAt: '2026-10-27T11:59:30.000Z' })),
    ).toBe('Active just now');
    expect(presenceLabel(presence())).toBe('Offline');
  });
});

describe('byPresence', () => {
  it('puts players first, then online friends, then the most recently active', () => {
    const recent = presence({ lastSeenAt: '2026-10-27T11:00:00.000Z' });
    const older = presence({ lastSeenAt: '2026-10-20T11:00:00.000Z' });
    const online = presence({ online: true });
    const playing = presence({ online: true, playingGameId: 'g' });

    expect([older, online, recent, playing].sort(byPresence)).toEqual([
      playing,
      online,
      recent,
      older,
    ]);
  });
});
