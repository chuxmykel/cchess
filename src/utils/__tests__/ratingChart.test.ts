import { ratingChartData } from '../ratingChart';

const at = (time: number) => new Date(time).toISOString();

describe('ratingChartData', () => {
  it('plots each rating, then holds the last one to the end of the period', () => {
    const { data } = ratingChartData(
      [
        { at: at(10), rating: 1500 },
        { at: at(50), rating: 1540 },
      ],
      0,
      100,
    );

    expect(data).toEqual([
      { time: 10, rating: 1500, isHeld: false },
      { time: 50, rating: 1540, isHeld: false },
      { time: 100, rating: 1540, isHeld: true },
    ]);
  });

  it('rounds the rating range out to whole tens, with a tick between', () => {
    const { yDomain, yTicks } = ratingChartData(
      [
        { at: at(0), rating: 1503 },
        { at: at(10), rating: 1547 },
      ],
      0,
      10,
    );

    expect(yDomain).toEqual([1500, 1550]);
    expect(yTicks).toEqual([1500, 1525, 1550]);
  });

  it('widens a flat rating into a range around it', () => {
    const { yDomain } = ratingChartData([{ at: at(0), rating: 1500 }], 0, 10);

    expect(yDomain).toEqual([1490, 1510]);
  });

  it('keeps a rating from before the period at its start', () => {
    const { data } = ratingChartData([{ at: at(-50), rating: 1500 }], 0, 10);

    expect(data[0].time).toBe(0);
  });
});
