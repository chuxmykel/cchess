import { render } from '@testing-library/react-native';

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
    expect(chart.domain).toEqual({
      x: [from.getTime(), to.getTime()],
      y: [1500, 1550],
    });
    expect(chart.yAxis[0].tickValues).toEqual([1500, 1525, 1550]);
  });

  it('labels the start and end of the period', async () => {
    const chart = await renderChart();

    expect(chart.xAxis.tickValues.map(chart.xAxis.formatXLabel)).toEqual([
      'Sep 27',
      'Oct 27',
    ]);
  });
});
