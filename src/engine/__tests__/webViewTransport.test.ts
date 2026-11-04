import { createSlotTransports } from '../webViewTransport';

describe('createSlotTransports', () => {
  it("sends each slot's commands to its engine in the page", () => {
    const post = jest.fn();
    const { transports } = createSlotTransports(post, ['main', 'threat']);

    transports.threat.send('go depth 14');

    expect(JSON.parse(post.mock.calls[0][0])).toEqual({
      type: 'uci',
      slot: 'threat',
      command: 'go depth 14',
    });
  });

  it("hands each line the page sends back to that slot's listeners", () => {
    const { transports, receive } = createSlotTransports(jest.fn(), [
      'main',
      'threat',
    ]);
    const main = jest.fn();
    const threat = jest.fn();
    transports.main.onLine(main);
    const stopListening = transports.threat.onLine(threat);

    receive({ slot: 'main', line: 'uciok' });
    stopListening();
    receive({ slot: 'threat', line: 'uciok' });

    expect(main).toHaveBeenCalledWith('uciok');
    expect(threat).not.toHaveBeenCalled();
  });
});
