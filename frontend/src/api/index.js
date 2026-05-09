// 全 API 呼び出しの共通処理：JSON ボディを POST して結果を返す
// signal は AbortController から渡すことでリクエストをキャンセル可能にする
const post = (path, body, signal) =>
  fetch(`/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  }).then(r => r.json());

// コサイン類似度 API：2つのベクトルを送って similarity（-1〜1）を受け取る
export const fetchCosineSimilarity = (vecA, vecB, signal) =>
  post('/cosine', { vec_a: vecA, vec_b: vecB }, signal);

// 協調フィルタリング API：評価行列とターゲットユーザー番号を送り、類似度・推薦リストを受け取る
export const fetchCF = (ratings, target, signal) =>
  post('/cf', { ratings, target }, signal);

// 行列因子分解 API：ハイパーパラメータと評価行列を送り、損失履歴・U 行列・V 行列を受け取る
export const fetchMF = ({ ratings, k, alpha, lambda, steps }, signal) =>
  post('/mf', { ratings, k, alpha, lambda, steps }, signal);
