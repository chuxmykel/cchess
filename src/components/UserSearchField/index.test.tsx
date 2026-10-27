import { fireEvent, render } from '@testing-library/react-native';

import UserSearchField from '.';
import { UserSearch } from '../../hooks/useUserSearch';

const JUDIT = {
  id: 'judit-id',
  username: 'judit',
  displayName: 'Judit Polgar',
  avatarColor: '#D64545',
};

describe('UserSearchField', () => {
  async function renderField(search: UserSearch, query = 'jud') {
    const onChangeQuery = jest.fn();
    const onSelect = jest.fn();
    const screen = await render(
      <UserSearchField
        query={query}
        onChangeQuery={onChangeQuery}
        search={search}
        onSelect={onSelect}
      />,
    );
    return { screen, onChangeQuery, onSelect };
  }

  it('shows no dropdown before there is anything to search', async () => {
    const { screen } = await renderField({ status: 'idle' }, '');

    expect(screen.queryByTestId('user-search-results')).toBeNull();
  });

  it('lists matching players and picks one, clearing the search', async () => {
    const { screen, onChangeQuery, onSelect } = await renderField({
      status: 'done',
      results: [JUDIT],
    });

    expect(screen.getByText('@judit')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('user-search-result-judit'));

    expect(onSelect).toHaveBeenCalledWith(JUDIT);
    expect(onChangeQuery).toHaveBeenCalledWith('');
  });

  it('says when nobody matches', async () => {
    const { screen } = await renderField({ status: 'done', results: [] });

    expect(screen.getByTestId('user-search-empty')).toHaveTextContent(
      'No players match “jud”.',
    );
  });

  it('says when the search failed', async () => {
    const { screen } = await renderField({ status: 'error' });

    expect(screen.getByText(/Couldn't search right now/)).toBeTruthy();
  });

  it('clears the search', async () => {
    const { screen, onChangeQuery } = await renderField({
      status: 'searching',
    });

    await fireEvent.press(screen.getByTestId('user-search-clear'));

    expect(onChangeQuery).toHaveBeenCalledWith('');
  });
});
