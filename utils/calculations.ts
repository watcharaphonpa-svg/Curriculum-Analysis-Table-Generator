
/**
 * Calculates priority rankings based on values.
 * Highest value gets rank 1.
 * Same values get the same rank.
 * Capped at 1-10 as per requirement.
 */
export const calculatePriority = (values: number[]): (number | string)[] => {
  if (values.length === 0) return [];
  
  const validValues = values.filter(v => v > 0);
  if (validValues.length === 0) return values.map(() => '-');

  const sortedUnique = Array.from(new Set(validValues)).sort((a, b) => b - a);
  
  return values.map(v => {
    if (v === 0) return '-';
    const rank = sortedUnique.indexOf(v) + 1;
    // Rank is 1-10 only.
    return rank > 10 ? 10 : rank;
  });
};

/**
 * Distributes a target sum across an array of values using the Largest Remainder Method.
 * Optional maxVal parameter constrains individual cell values.
 */
export const distributeSum = (values: number[], targetSum: number, maxVal?: number): number[] => {
  const currentTotal = values.reduce((a, b) => a + b, 0);
  if (currentTotal === 0) return values.map(() => 0);

  // If target sum is impossible with max constraints, relax max constraint
  const effectiveMax = (maxVal && targetSum <= values.length * maxVal) ? maxVal : undefined;

  const scaled = values.map(v => (v * targetSum) / currentTotal);
  let results = scaled.map(v => Math.floor(v));
  
  if (effectiveMax) {
    results = results.map(v => Math.min(v, effectiveMax));
  }

  let currentSum = results.reduce((a, b) => a + b, 0);
  let diff = targetSum - currentSum;

  const remainders = scaled.map((v, i) => v - results[i]);
  const indexedRemainders = remainders
    .map((r, i) => ({ r, i }))
    .sort((a, b) => b.r - a.r);

  // First pass: Fill using remainders while respecting maxVal
  for (let i = 0; i < indexedRemainders.length && diff > 0; i++) {
    const idx = indexedRemainders[i].i;
    if (!effectiveMax || results[idx] < effectiveMax) {
      results[idx]++;
      diff--;
    }
  }

  // Second pass: If still diff (due to hard max constraint), we must exceed max to reach target sum
  if (diff > 0) {
    for (let i = 0; i < results.length && diff > 0; i++) {
      results[i]++;
      diff--;
    }
  }

  return results;
};

/**
 * Scales a 2D matrix to a specific target grand total while maintaining 
 * integer values and optional cell constraints.
 */
export const scaleMatrix = (
  matrix: number[][],
  targetTotal: number,
  maxCellVal?: number
): number[][] => {
  const flat = matrix.flat();
  const adjustedFlat = distributeSum(flat, targetTotal, maxCellVal);
  
  const result: number[][] = [];
  let pointer = 0;
  for (let r = 0; r < matrix.length; r++) {
    const row: number[] = [];
    for (let c = 0; c < matrix[r].length; c++) {
      row.push(adjustedFlat[pointer++]);
    }
    result.push(row);
  }
  return result;
};
