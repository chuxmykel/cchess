const mockClient = {
  capture: jest.fn(),
  screen: jest.fn(),
  identify: jest.fn(),
  reset: jest.fn(),
  optIn: jest.fn(),
  optOut: jest.fn(),
};
const mockPostHog = jest.fn(() => mockClient);
jest.mock('posthog-react-native', () => ({ PostHog: mockPostHog }));

function load(key?: string) {
  if (key === undefined) delete process.env.EXPO_PUBLIC_POSTHOG_KEY;
  else process.env.EXPO_PUBLIC_POSTHOG_KEY = key;
  let module: typeof import('../analytics');
  jest.isolateModules(() => {
    module = require('../analytics');
  });
  return module!;
}

describe('analytics', () => {
  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.EXPO_PUBLIC_POSTHOG_KEY;
  });

  it('does nothing, and never makes a client, without a key', () => {
    const { analytics, isAnalyticsAvailable } = load();
    analytics.capture('account_created');
    analytics.screen('Home');
    analytics.setEnabled(false);
    expect(isAnalyticsAvailable).toBe(false);
    expect(mockPostHog).not.toHaveBeenCalled();
  });

  it('sends to the EU host, without IP-derived locations, with a key', () => {
    const { analytics } = load('phc_test');
    analytics.capture('report_sent', { reason: 'spam' });
    analytics.screen('Home');
    analytics.identify('user-1');
    analytics.setEnabled(false);

    expect(mockPostHog).toHaveBeenCalledTimes(1);
    expect(mockPostHog).toHaveBeenCalledWith(
      'phc_test',
      expect.objectContaining({
        host: 'https://eu.i.posthog.com',
        disableGeoip: true,
      }),
    );
    expect(mockClient.capture).toHaveBeenCalledWith('report_sent', {
      reason: 'spam',
    });
    expect(mockClient.screen).toHaveBeenCalledWith('Home');
    expect(mockClient.identify).toHaveBeenCalledWith('user-1');
    expect(mockClient.optOut).toHaveBeenCalled();
  });
});
