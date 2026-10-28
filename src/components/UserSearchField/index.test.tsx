import { fireEvent, render } from '@testing-library/react-native';

import UserSearchField from '.';

describe('UserSearchField', () => {
  async function renderField(query = 'jud') {
    const onChangeQuery = jest.fn();
    const screen = await render(
      <UserSearchField query={query} onChangeQuery={onChangeQuery} />,
    );
    return { screen, onChangeQuery };
  }

  it('passes on what is typed', async () => {
    const { screen, onChangeQuery } = await renderField('');

    await fireEvent.changeText(screen.getByTestId('user-search-input'), 'ma');

    expect(onChangeQuery).toHaveBeenCalledWith('ma');
    expect(screen.queryByTestId('user-search-clear')).toBeNull();
  });

  it('clears the search', async () => {
    const { screen, onChangeQuery } = await renderField();

    await fireEvent.press(screen.getByTestId('user-search-clear'));

    expect(onChangeQuery).toHaveBeenCalledWith('');
  });
});
