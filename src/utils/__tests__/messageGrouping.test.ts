import {
  isBigEmoji,
  MessageListItem,
  messageListItems,
} from '../messageGrouping';

const NOW = new Date(2026, 10, 10, 15, 30);
function message(
  id: string,
  senderId: string,
  minutesFromNine: number,
  day = 10,
) {
  return {
    id,
    senderId,
    createdAt: new Date(2026, 10, day, 9, minutesFromNine).toISOString(),
  };
}

type Message = ReturnType<typeof message>;

function shape(items: MessageListItem<Message>[]) {
  return items.map((item) =>
    item.kind === 'day'
      ? `[${item.label}]`
      : `${item.message.id}${item.continuesGroup ? '^' : ''}${item.endsGroup ? '.' : ''}${item.seen ? ' seen' : ''}`,
  );
}

describe('messageListItems', () => {
  it("separates days, and groups one person's messages moments apart", () => {
    const items = messageListItems(
      [
        message('a', 'them', 0, 9),
        message('b', 'them', 1),
        message('c', 'them', 3),
        message('d', 'me', 4),
        message('e', 'them', 5),
        message('f', 'them', 20),
      ],
      'me',
      null,
      NOW,
    );

    expect(shape(items)).toEqual([
      '[Yesterday]',
      'a.',
      '[Today]',
      'b',
      'c^.',
      'd.',
      'e.',
      'f.',
    ]);
  });

  it('marks my newest message seen once they have read up to it', () => {
    const messages = [
      message('a', 'me', 0),
      message('b', 'me', 1),
      message('c', 'them', 2),
    ];

    expect(
      shape(messageListItems(messages, 'me', messages[1].createdAt, NOW)),
    ).toEqual(['[Today]', 'a', 'b^. seen', 'c.']);
    expect(
      shape(messageListItems(messages, 'me', messages[0].createdAt, NOW)),
    ).toEqual(['[Today]', 'a', 'b^.', 'c.']);
    expect(shape(messageListItems(messages, 'me', null, NOW))).toEqual([
      '[Today]',
      'a',
      'b^.',
      'c.',
    ]);
  });

  it('has nothing to lay out with no messages', () => {
    expect(messageListItems([], 'me', null, NOW)).toEqual([]);
  });
});

describe('isBigEmoji', () => {
  it('takes a message of an emoji or a few', () => {
    expect(isBigEmoji('👍')).toBe(true);
    expect(isBigEmoji('😂😂')).toBe(true);
    expect(isBigEmoji(' ♟️ ')).toBe(true);
    expect(isBigEmoji('👍🏽')).toBe(true);
    expect(isBigEmoji('👨‍👩‍👧')).toBe(true);
  });

  it('leaves text, a mix, or many emoji as a message', () => {
    expect(isBigEmoji('hi')).toBe(false);
    expect(isBigEmoji('gg 👍')).toBe(false);
    expect(isBigEmoji('😂😂😂😂')).toBe(false);
    expect(isBigEmoji('')).toBe(false);
    expect(isBigEmoji('42')).toBe(false);
  });
});
