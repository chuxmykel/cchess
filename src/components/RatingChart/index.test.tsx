import { act, fireEvent, render } from '@testing-library/react-native';

import RatingChart from '.';

describe('RatingChart', () => {
  const from = new Date('2026-09-27T12:00:00Z');
  const to = new Date('2026-10-27T12:00:00Z');

  async function renderChart() {
    const screen = await render(
      <RatingChart
        history={[
          { at: '2026-10-01T10:00:00.000Z', rating: 1503 },
          { at: '2026-10-20T10:00:00.000Z', rating: 1547 },
        ]}
        from={from}
        to={to}
      />,
    );
    return screen.getByTestId('cartesian-chart').props;
  }

  it('plots the ratings over the whole period, held to its end', async () => {
    const chart = await renderChart();

    expect(chart.data.map((datum: { rating: number }) => datum.rating)).toEqual(
      [1503, 1547, 1547],
    );
    expect(chart.domain).toEqual({ x: [from.getTime(), to.getTime()] });
  });

  it('scrubs on a sideways drag at once, letting vertical drags scroll', async () => {
    const chart = await renderChart();

    expect(chart.chartPressConfig).toEqual({
      pan: { activeOffsetX: [-4, 4], failOffsetY: [-8, 8] },
    });
  });

  it('leaves the rating axis and its ticks to the chart', async () => {
    const chart = await renderChart();

    expect(chart.yAxis[0]).toMatchObject({ tickCount: 3 });
    expect(chart.yAxis[0].tickValues).toBeUndefined();
  });

  it('labels the start and end of the period', async () => {
    const chart = await renderChart();

    expect(chart.xAxis.tickValues.map(chart.xAxis.formatXLabel)).toEqual([
      'Sep 27',
      'Oct 27',
    ]);
  });

  describe('picking a point', () => {
    const history = [
      { at: '2026-10-01T10:00:00.000Z', rating: 1503 },
      { at: '2026-10-20T10:00:00.000Z', rating: 1547 },
    ];
    const chartFor = (points = history, end = to) => (
      <RatingChart history={points} from={from} to={end} />
    );

    async function renderWithBounds() {
      const screen = await render(chartFor());
      await act(() =>
        screen.getByTestId('cartesian-chart').props.onChartBoundsChange({
          left: 0,
          right: 300,
          top: 0,
          bottom: 180,
        }),
      );
      return screen;
    }

    function tapAt(screen: Awaited<ReturnType<typeof render>>, x: number) {
      return fireEvent(screen.getByTestId('rating-chart-touch'), 'pressIn', {
        nativeEvent: { locationX: x },
      });
    }

    it('shows the rating at the point nearest a touch at once, and keeps it shown', async () => {
      const screen = await renderWithBounds();

      // Oct 20 is 23 days into the 30-day period.
      await tapAt(screen, (23 / 30) * 300);

      expect(screen.getByTestId('rating-chart-pressed')).toHaveTextContent(
        /^1547 · Oct 20, 2026/,
      );
    });

    it('calls the rating held to the end of the period "Now"', async () => {
      const screen = await renderWithBounds();

      await tapAt(screen, 300);

      expect(screen.getByTestId('rating-chart-pressed')).toHaveTextContent(
        '1547 · Now',
      );
    });

    it('keeps the same data across renders in the same minute', async () => {
      const screen = await render(chartFor());
      const before = screen.getByTestId('cartesian-chart').props.data;

      await screen.rerender(chartFor(history, new Date(to.getTime() + 5_000)));

      expect(screen.getByTestId('cartesian-chart').props.data).toBe(before);
    });

    it('forgets the point once the chart shows other data', async () => {
      const screen = await renderWithBounds();
      await tapAt(screen, 300);

      await screen.rerender(chartFor(history.slice(0, 1)));

      expect(screen.getByTestId('rating-chart-pressed')).not.toHaveTextContent(
        /\d/,
      );
    });
  });
});
