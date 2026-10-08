import { render } from '@testing-library/react-native';

import Avatar from '.';

describe('Avatar', () => {
  it('renders an image when imageUri is given', async () => {
    const screen = await render(
      <Avatar imageUri="https://example.com/a.png" name="Ada Lovelace" />,
    );

    const image = screen.getByTestId('avatar-image');
    expect(image.props.source).toEqual({ uri: 'https://example.com/a.png' });
  });

  it("shows initials from first and last name when there's no image", async () => {
    const screen = await render(<Avatar name="Ada Lovelace" />);

    expect(screen.getByText('AL')).toBeTruthy();
  });

  it('uses only the first initial for a single-word name', async () => {
    const screen = await render(<Avatar name="Ada" />);

    expect(screen.getByText('A')).toBeTruthy();
  });

  it("falls back to a placeholder glyph when there's neither an image nor a name", async () => {
    const screen = await render(<Avatar />);

    expect(screen.getByText('\u{1F464}')).toBeTruthy();
  });
});
