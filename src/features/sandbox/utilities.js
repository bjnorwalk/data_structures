export const starterValues = [12, 7, 19, 3, 15];
export const starterBars = [38, 18, 54, 25, 72, 45, 31];

export function createEntries(values) {
  return values.map((value) => ({ id: crypto.randomUUID(), value }));
}

export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}
