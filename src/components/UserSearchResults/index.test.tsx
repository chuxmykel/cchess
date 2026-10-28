import { fireEvent, render } from '@testing-library/react-native';
import { Keyboard } from 'react-native';

import UserSearchResults from '.';

const JUDIT = {
  id: 'judit-id',
  username: 'judit',
  displayName: 'Judit Polgar',
  avatarColor: '#D64545',
};

describe('UserSearchResults', () => {
  function done(overrides = {}) {
    return {
      status: 'done' as const,
      results: [JUDIT],
      hasMore: false,
      isLoadingMore: false,
      loadMore: jest.fn(),
      ...overrides,
    };
  }

  it('lists matching players and picks one, closing the keyboard', async () => {
    const dismiss = jest.spyOn(Keyboard, 'dismiss');
    const onSelect = jest.fn();
    const screen = await render(
      <UserSearchResults query="jud" search={done()} onSelect={onSelect} />,
    );

    expect(screen.getByText('@judit')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('user-search-result-judit'));

    expect(onSelect).toHaveBeenCalledWith(JUDIT);
    expect(dismiss).toHaveBeenCalled();
  });

  it('scrolls clear of the keyboard, closing it on a drag', async () => {
    const screen = await render(
      <UserSearchResults query="jud" search={done()} onSelect={jest.fn()} />,
    );

    expect(screen.getByTestId('user-search-results')).toHaveProp(
      'keyboardDismissMode',
      'on-drag',
    );
    expect(screen.getByTestId('user-search-results')).toHaveProp(
      'automaticallyAdjustKeyboardInsets',
      true,
    );
  });

  it('fetches more nearing the end, showing that it is', async () => {
    const search = done({ hasMore: true, isLoadingMore: true });
    const screen = await render(
      <UserSearchResults query="jud" search={search} onSelect={jest.fn()} />,
    );

    await fireEvent(screen.getByTestId('user-search-results'), 'endReached');

    expect(search.loadMore).toHaveBeenCalled();
    expect(screen.getByTestId('user-search-more')).toBeTruthy();
  });

  it('says when nobody matches', async () => {
    const screen = await render(
      <UserSearchResults
        query=" jud "
        search={done({ results: [] })}
        onSelect={jest.fn()}
      />,
    );

    expect(screen.getByTestId('user-search-empty')).toHaveTextContent(
      'No players match “jud”.',
    );
  });

  it('shows the search going, and failing', async () => {
    const searching = await render(
      <UserSearchResults
        query="jud"
        search={{ status: 'searching' }}
        onSelect={jest.fn()}
      />,
    );
    expect(searching.getByTestId('user-search-loading')).toBeTruthy();

    const failed = await render(
      <UserSearchResults
        query="jud"
        search={{ status: 'error' }}
        onSelect={jest.fn()}
      />,
    );
    expect(failed.getByText(/Couldn't search right now/)).toBeTruthy();
  });
});
