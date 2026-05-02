const post = (path, body, signal) =>
  fetch(`/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  }).then(r => r.json());

export const fetchCosineSimilarity = (vecA, vecB, signal) =>
  post('/cosine', { vec_a: vecA, vec_b: vecB }, signal);

export const fetchCF = (ratings, target, signal) =>
  post('/cf', { ratings, target }, signal);

export const fetchMF = ({ ratings, k, alpha, lambda, steps }, signal) =>
  post('/mf', { ratings, k, alpha, lambda, steps }, signal);
