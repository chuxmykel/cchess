import { unreadBadge } from '.';

jest.mock('../HomeTabStack', () => () => null);
jest.mock('../PuzzlesStack', () => () => null);
jest.mock('../MessagesStack', () => () => null);
jest.mock('../MenuStack', () => () => null);

describe('unreadBadge', () => {
  it('counts every unread message, from anyone', () => {
    expect(unreadBadge({ ana: 2, bo: 3 })).toBe(5);
  });

  it('shows no badge with nothing unread', () => {
    expect(unreadBadge({})).toBeUndefined();
    expect(unreadBadge({ ana: 0 })).toBeUndefined();
  });

  it('stops counting at 99', () => {
    expect(unreadBadge({ ana: 99 })).toBe(99);
    expect(unreadBadge({ ana: 60, bo: 40 })).toBe('99+');
  });
});
