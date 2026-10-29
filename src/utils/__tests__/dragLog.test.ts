describe('logDrag', () => {
  const original = process.env.EXPO_PUBLIC_DEBUG_DRAG;
  afterEach(() => {
    process.env.EXPO_PUBLIC_DEBUG_DRAG = original;
    jest.restoreAllMocks();
  });

  // Read when the module loads, so loaded afresh for each setting.
  function loadWith(value: string | undefined) {
    process.env.EXPO_PUBLIC_DEBUG_DRAG = value;
    let module: typeof import('../dragLog') | undefined;
    jest.isolateModules(() => {
      module = jest.requireActual('../dragLog');
    });
    return module!;
  }

  it('logs a drop when EXPO_PUBLIC_DEBUG_DRAG is 1', () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    const { logDrag, DRAG_LOG_ENABLED } = loadWith('1');

    logDrag('game e2->e4 ok');

    expect(DRAG_LOG_ENABLED).toBe(true);
    expect(log).toHaveBeenCalledWith('[drag] game e2->e4 ok');
  });

  it('stays quiet otherwise', () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    const { logDrag, DRAG_LOG_ENABLED } = loadWith(undefined);

    logDrag('game e2->e4 ok');

    expect(DRAG_LOG_ENABLED).toBe(false);
    expect(log).not.toHaveBeenCalled();
  });
});
