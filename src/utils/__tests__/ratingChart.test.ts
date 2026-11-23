import { nearestDatumIndex, ratingChartData } from '../ratingChart';

const at = (time: number) => new Date(time).toISOString();

describe('ratingChartData', () => {
  it('draws the first rating back to the start of the period, plots each, then holds the last one to its end', () => {
    const data = ratingChartData(
      [
        { at: at(10), rating: 1500 },
        { at: at(50), rating: 1540 },
      ],
      0,
      100,
    );

    expect(data).toEqual([
      { time: 0, rating: 1500, isHeld: false },
      { time: 10, rating: 1500, isHeld: false },
      { time: 50, rating: 1540, isHeld: false },
      { time: 100, rating: 1540, isHeld: true },
    ]);
  });

  it('keeps a rating from before the period at its start, drawn once', () => {
    const data = ratingChartData([{ at: at(-50), rating: 1500 }], 0, 10);

    expect(data).toEqual([
      { time: 0, rating: 1500, isHeld: false },
      { time: 10, rating: 1500, isHeld: true },
    ]);
  });

  it('draws the current rating across a period with no games', () => {
    expect(ratingChartData([], 0, 10, 1620)).toEqual([
      { time: 0, rating: 1620, isHeld: false },
      { time: 10, rating: 1620, isHeld: true },
    ]);
  });

  it('is empty without a history or a current rating', () => {
    expect(ratingChartData([], 0, 10)).toEqual([]);
  });
});

describe('nearestDatumIndex', () => {
  const data = [0, 40, 100].map((time) => ({
    time,
    rating: 1500,
    isHeld: false,
  }));

  it('picks the point closest in time', () => {
    expect(nearestDatumIndex(data, 15)).toBe(0);
    expect(nearestDatumIndex(data, 25)).toBe(1);
    expect(nearestDatumIndex(data, 90)).toBe(2);
  });

  it('picks the first or last point beyond either end', () => {
    expect(nearestDatumIndex(data, -50)).toBe(0);
    expect(nearestDatumIndex(data, 500)).toBe(2);
  });
});
