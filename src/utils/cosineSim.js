// コサイン類似度
export const cosineSim = (a, b) => {
  const dot = a.reduce((s, v, i) => s + v * b[i], 0);
  const na = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const nb = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
  return na === 0 || nb === 0 ? 0 : dot / (na * nb);
};
