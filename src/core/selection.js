export function chooseWeighted(items, weightKey = "weight") {
  if (!items || items.length === 0) return null;

  const total = items.reduce((sum, item) => {
    const weight = Number(item[weightKey] || 1);
    return sum + (Number.isFinite(weight) && weight > 0 ? weight : 1);
  }, 0);

  let cursor = Math.random() * total;

  for (const item of items) {
    const weight = Number(item[weightKey] || 1);
    cursor -= Number.isFinite(weight) && weight > 0 ? weight : 1;
    if (cursor <= 0) return item;
  }

  return items[items.length - 1];
}

export function randomIntBetween(min, max) {
  const low = Number(min);
  const high = Number(max);
  if (!Number.isFinite(low) || !Number.isFinite(high) || high <= low) return low || 0;
  return Math.floor(Math.random() * (high - low + 1)) + low;
}
