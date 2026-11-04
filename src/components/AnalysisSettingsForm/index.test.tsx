import { fireEvent, render } from '@testing-library/react-native';

import AnalysisSettingsForm from '.';
import { DEFAULT_ANALYSIS_SETTINGS } from '../../constants/analysis';

describe('AnalysisSettingsForm', () => {
  async function renderForm(settings = DEFAULT_ANALYSIS_SETTINGS) {
    const onChange = jest.fn();
    const screen = await render(
      <AnalysisSettingsForm settings={settings} onChange={onChange} />,
    );
    return { screen, onChange };
  }

  it('sets how many engine lines show, none turning them off', async () => {
    const { screen, onChange } = await renderForm({
      ...DEFAULT_ANALYSIS_SETTINGS,
      engineLineCount: 0,
    });
    expect(screen.getByTestId('engine-line-count')).toHaveTextContent('Off');

    await fireEvent(
      screen.getByTestId('engine-line-count-slider'),
      'valueChange',
      3,
    );

    expect(onChange).toHaveBeenCalledWith({ engineLineCount: 3 });
  });

  it('sets the search time in seconds, its last stop unlimited', async () => {
    const { screen, onChange } = await renderForm();
    expect(screen.getByTestId('search-time')).toHaveTextContent('3 s');

    await fireEvent(
      screen.getByTestId('search-time-slider'),
      'valueChange',
      20,
    );
    await fireEvent(
      screen.getByTestId('search-time-slider'),
      'valueChange',
      21,
    );

    expect(onChange).toHaveBeenCalledWith({ searchSeconds: 20 });
    expect(onChange).toHaveBeenLastCalledWith({ searchSeconds: null });
  });

  it('shows an unlimited search as such', async () => {
    const { screen } = await renderForm({
      ...DEFAULT_ANALYSIS_SETTINGS,
      searchSeconds: null,
    });

    expect(screen.getByTestId('search-time')).toHaveTextContent('Unlimited');
    expect(screen.getByTestId('search-time-slider').props.value).toBe(21);
  });

  it('puts the eval bar where picked, offered only while it shows', async () => {
    const { screen, onChange } = await renderForm();
    expect(screen.getByTestId('eval-bar-position-top')).toBeChecked();

    await fireEvent.press(screen.getByTestId('eval-bar-position-left'));
    expect(onChange).toHaveBeenCalledWith({ evalBarPosition: 'left' });

    const off = await renderForm({
      ...DEFAULT_ANALYSIS_SETTINGS,
      evalBar: false,
    });
    expect(off.screen.queryByTestId('eval-bar-position-left')).toBeNull();
  });

  it('switches the rest on and off', async () => {
    const { screen, onChange } = await renderForm();

    await fireEvent(
      screen.getByTestId('analysis-setting-threatArrows'),
      'valueChange',
      true,
    );

    expect(onChange).toHaveBeenCalledWith({ threatArrows: true });
  });
});
