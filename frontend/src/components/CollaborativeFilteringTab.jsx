import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import { fetchCF } from '../api';
import { SAMPLE } from '../data/sample';
import ExplanationPanel, { FormulaBlock, Step, SectionTitle } from './ExplanationPanel';

export default function CollaborativeFilteringTab() {
  // 編集可能な評価行列（初期値はサンプルデータのディープコピー）
  const [ratings, setRatings]           = useState(SAMPLE.map(r => [...r]));
  // 類似度を計算する対象ユーザーの番号（0始まり）
  const [target, setTarget]             = useState(0);
  // インライン編集中のセル座標：{u: 行, i: 列}、編集していないときは null
  const [editing, setEditing]           = useState(null);
  // API から返ってくるユーザー間類似度リスト（降順ソート済み）
  const [similarities, setSimilarities] = useState([]);
  // API から返ってくる推薦アイテムリスト（スコア降順）
  const [recommendations, setRecommendations] = useState([]);

  // ratings または target が変わるたびに 300ms デバウンスして CF API を呼ぶ
  // タイマーをクリアすることで連続入力時の無駄なリクエストを防ぐ
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCF(ratings, target)
        .then(data => {
          setSimilarities(data.similarities);
          setRecommendations(data.recommendations);
        })
        .catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [ratings, target]);

  // セルの値を更新する：空白・null 入力は未評価（null）として扱い、1〜5 以外は無視する
  const updateCell = (u, i, raw) => {
    setRatings(prev => {
      const next = prev.map(r => [...r]);
      if (raw === '' || raw === null) { next[u][i] = null; return next; }
      const n = parseInt(raw, 10);
      if (n >= 1 && n <= 5) next[u][i] = n;
      return next;
    });
  };

  // 評価値に応じた背景色：高評価=深緑、中=青、低=赤、未評価=暗色
  const cellBg = v =>
    v === null ? '#1e293b' :
    v >= 4    ? '#166534' :
    v >= 2    ? '#1e3a5f' :
                '#7f1d1d';

  return (
    <div className="space-y-6">
      {/* ── 評価行列テーブル ───────────────────────────────── */}
      <div className="bg-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-cyan-400 font-bold text-lg">評価行列（クリックで編集）</h3>
          {/* サンプルデータに戻すボタン */}
          <button
            onClick={() => setRatings(SAMPLE.map(r => [...r]))}
            className="px-3 py-1.5 bg-cyan-700 hover:bg-cyan-600 text-white rounded-lg text-sm transition-colors"
          >
            サンプルデータを読み込む
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-center text-sm border-collapse">
            <thead>
              <tr>
                <th className="text-gray-500 p-2 text-left w-24"></th>
                {[1,2,3,4,5].map(i => (
                  <th key={i} className="text-gray-400 p-2 font-medium">商品{i}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ratings.map((row, u) => (
                <tr key={u}>
                  {/* ターゲットユーザーは ▶ マークで強調表示 */}
                  <td className={`p-2 font-medium text-left text-sm ${u === target ? 'text-cyan-300' : 'text-gray-400'}`}>
                    {u === target ? '▶ ' : ''}ユーザー{u+1}
                  </td>
                  {row.map((val, i) => (
                    <td key={i} className="p-1">
                      {/* 編集中のセルは input、それ以外はボタンで表示 */}
                      {editing?.u === u && editing?.i === i ? (
                        <input
                          autoFocus type="number" min={1} max={5}
                          defaultValue={val ?? ''}
                          className="w-12 h-9 bg-slate-700 text-white text-center rounded border border-cyan-400 outline-none font-mono text-sm"
                          onBlur={e => { updateCell(u, i, e.target.value); setEditing(null); }}
                          onKeyDown={e => {
                            if (e.key === 'Enter')  { updateCell(u, i, e.target.value); setEditing(null); }
                            if (e.key === 'Escape') setEditing(null);
                          }}
                        />
                      ) : (
                        <button
                          onClick={() => setEditing({ u, i })}
                          className="w-12 h-9 rounded font-mono text-sm text-white transition-colors hover:opacity-80"
                          style={{ backgroundColor: cellBg(val) }}
                        >
                          {val ?? '—'}
                        </button>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 類似度グラフ ＋ 推薦リスト（横並び） ─────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ユーザー間類似度の横棒グラフ */}
        <div className="bg-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-cyan-400 font-bold text-lg">ユーザー間類似度</h3>
            {/* ターゲットユーザー選択ドロップダウン */}
            <select
              value={target}
              onChange={e => setTarget(+e.target.value)}
              className="bg-slate-700 text-white rounded-lg px-3 py-1.5 text-sm border border-slate-600 outline-none"
            >
              {[0,1,2,3,4].map(u => <option key={u} value={u}>ユーザー{u+1}</option>)}
            </select>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={similarities} layout="vertical" margin={{ left: 10, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis type="number" domain={[-1, 1]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis type="category" dataKey="user" tick={{ fill: '#94a3b8', fontSize: 12 }} width={74} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }}
                formatter={v => [v.toFixed(3), 'コサイン類似度']}
              />
              <Bar dataKey="sim" name="類似度">
                {/* 最も類似度の高いユーザーをシアンで強調、それ以外はグレー */}
                {similarities.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? '#06b6d4' : '#334155'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {similarities[0] && (
            <p className="text-center text-cyan-300 text-sm mt-3">
              最も類似: <span className="font-bold">{similarities[0].user}</span>
              　類似度: {similarities[0].sim.toFixed(3)}
            </p>
          )}
        </div>

        {/* 推薦アイテムカードリスト */}
        <div className="bg-slate-800 rounded-xl p-6">
          <h3 className="text-cyan-400 font-bold text-lg mb-4">
            レコメンド（ユーザー{target+1}）
          </h3>
          {recommendations.length === 0 ? (
            <p className="text-gray-500 text-sm">未評価商品がないか、推薦データが不足しています。</p>
          ) : (
            <div className="space-y-3">
              {recommendations.map((rec, i) => (
                <div key={i} className="bg-slate-700 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-white font-semibold">{rec.item}</span>
                    <span className="text-cyan-300 font-bold font-mono text-sm">
                      予測スコア: {rec.score.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs leading-relaxed">{rec.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── 式の解説アコーディオン ────────────────────────────── */}
      <ExplanationPanel>
        <SectionTitle>協調フィルタリングとは</SectionTitle>
        <p className="text-gray-400 text-sm leading-relaxed">
          「あなたと似た好みを持つユーザーが高く評価したものを推薦する」手法。
          商品の内容は一切見ず、<span className="text-cyan-300 font-semibold">ユーザーの評価パターンの類似性だけ</span>で推薦を行う。
        </p>

        <SectionTitle>3ステップの流れ</SectionTitle>
        <div className="space-y-4">
          <Step number="1" title="ユーザー間の類似度を計算する">
            両者が共通して評価したアイテムだけを取り出し、コサイン類似度を求める。
            未評価のアイテムは計算に含めない。
            <FormulaBlock>
              <div className="text-yellow-300">sim(u, v) = (r_u · r_v) / (|r_u| × |r_v|)</div>
              <div className="mt-2 text-xs text-gray-400">r_u, r_v : 共通評価アイテムのみ抽出したベクトル</div>
            </FormulaBlock>
          </Step>
          <Step number="2" title="未評価アイテムのスコアを加重平均で予測する">
            類似度が高いユーザーの評価ほど重く反映される。
            分母で正規化することでスコアが評価スケール（1〜5）に収まる。
            <FormulaBlock>
              <div className="text-yellow-300">ŷ_ui = Σ( sim(u,v) × r_vi ) / Σ( sim(u,v) )</div>
              <div className="mt-2 space-y-1 text-xs">
                <div><span className="text-blue-300">分子</span> : 類似度 × 評価値 の合計　← 似ている人の評価を重くカウント</div>
                <div><span className="text-orange-300">分母</span> : 類似度の合計　　　　　← 重みの総和で割って正規化</div>
              </div>
            </FormulaBlock>
          </Step>
          <Step number="3" title="予測スコアが高い順に推薦する">
            ターゲットユーザーがまだ評価していないアイテムのうち、
            ステップ2で求めた予測スコアが高いものを上から並べる。
          </Step>
        </div>

        <SectionTitle>分母の意味 — なぜ類似度の合計で割るのか</SectionTitle>
        <p className="text-gray-400 text-sm leading-relaxed mb-3">
          分母がないと、参照できる類似ユーザーが多いほどスコアが無制限に膨らむ。
          類似度の合計で割ることで「重みの総和 = 1」に正規化され、スケールが安定する。
        </p>
        <div className="bg-slate-900 rounded-lg p-4 text-xs space-y-4">
          <div className="text-gray-300 font-semibold">具体例：商品Xへの予測スコア</div>
          {/* 各ユーザーの寄与（sim × rating）を棒グラフで可視化 */}
          {[
            { user: 'ユーザーB', sim: 0.9, rating: 5, color: '#06b6d4' },
            { user: 'ユーザーC', sim: 0.5, rating: 3, color: '#60a5fa' },
            { user: 'ユーザーD', sim: 0.2, rating: 4, color: '#818cf8' },
          ].map(({ user, sim, rating, color }) => {
            const contribution = sim * rating;
            const maxContrib = 0.9 * 5;
            const barWidth = Math.round((contribution / maxContrib) * 100);
            return (
              <div key={user} className="space-y-1">
                <div className="flex justify-between text-gray-400">
                  <span>{user}（類似度 {sim}、評価 {rating}）</span>
                  <span className="font-mono">sim × r = {contribution.toFixed(1)}</span>
                </div>
                <div className="h-4 bg-slate-700 rounded overflow-hidden">
                  <div className="h-full rounded" style={{ width: `${barWidth}%`, backgroundColor: color }} />
                </div>
              </div>
            );
          })}
          {/* 分子・分母・結果の内訳 */}
          <div className="border-t border-slate-700 pt-3 space-y-1.5 text-gray-300">
            <div className="flex justify-between">
              <span className="text-blue-300">分子 Σ(sim × r) = 0.9×5 + 0.5×3 + 0.2×4</span>
              <span className="font-mono text-blue-300">= 7.8</span>
            </div>
            <div className="flex justify-between">
              <span className="text-orange-300">分母 Σ(sim)　　= 0.9 + 0.5 + 0.2</span>
              <span className="font-mono text-orange-300">= 1.6</span>
            </div>
            <div className="flex justify-between font-semibold border-t border-slate-600 pt-2">
              <span>予測スコア = 7.8 ÷ 1.6</span>
              <span className="font-mono text-cyan-300">≈ 4.88 （1〜5の範囲に収まる）</span>
            </div>
          </div>
        </div>

        <SectionTitle>なぜコサイン類似度を使うのか</SectionTitle>
        <p className="text-gray-400 text-sm leading-relaxed">
          「全部5点」をつけるユーザーと「全部3点」をつけるユーザーは、
          評価の絶対値は異なるが<span className="text-cyan-300 font-semibold">傾向（何を好むか）は同じ</span>かもしれない。
          コサイン類似度はベクトルの長さを正規化するため、評価水準の違いに左右されにくい。
        </p>
        <div className="bg-slate-900 rounded-lg p-4 text-xs space-y-3 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="text-cyan-300 font-semibold">コサイン類似度</div>
              <div className="text-gray-400 leading-relaxed">
                ベクトルの「向き」だけを比較。評価の水準差は無視される。
              </div>
              <div className="bg-slate-800 rounded p-2 font-mono">
                <div className="text-gray-300">[5, 5, 5] vs [3, 3, 3]</div>
                <div className="text-cyan-300">cos = 1.000（完全一致）</div>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="text-orange-300 font-semibold">ピアソン相関係数</div>
              <div className="text-gray-400 leading-relaxed">
                各ユーザーの平均を引いた「ズレ」で比較。好みの傾向の差を捉えやすい。
              </div>
              <div className="bg-slate-800 rounded p-2 font-mono">
                <div className="text-gray-300">[5, 5, 5] vs [3, 3, 3]</div>
                <div className="text-orange-300">pearson = 0.000（差なし）</div>
              </div>
            </div>
          </div>
          <div className="text-gray-400 leading-relaxed border-t border-slate-700 pt-2">
            <span className="text-yellow-300 font-semibold">使い分け：</span>
            全員が高評価をつけやすいデータ（好意的バイアス）ではピアソンが有効。
            クリック・非クリックのような0/1評価ではコサインが向く。
          </div>
        </div>

        <SectionTitle>コールドスタート問題</SectionTitle>
        <p className="text-gray-400 text-sm leading-relaxed mb-3">
          協調フィルタリングは「評価履歴」がなければ動かない。
          新規ユーザーや新規アイテムが登場した直後は類似度が計算できず、推薦が機能しない。
        </p>
        <div className="bg-slate-900 rounded-lg p-4 text-xs space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="text-red-400 font-semibold">新規ユーザー問題</div>
              <div className="text-gray-400 leading-relaxed">
                評価が0件のユーザーはどのユーザーとも類似度が計算できない。
              </div>
              <div className="text-gray-500 leading-relaxed">
                → 登録時アンケートや人気ランキングで初期データを補う
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="text-red-400 font-semibold">新規アイテム問題</div>
              <div className="text-gray-400 leading-relaxed">
                誰も評価していないアイテムは分子に現れないため永遠に推薦されない。
              </div>
              <div className="text-gray-500 leading-relaxed">
                → コンテンツベースフィルタリングと組み合わせて補完する
              </div>
            </div>
          </div>
          <div className="border-t border-slate-700 pt-2 text-gray-400 leading-relaxed">
            <span className="text-yellow-300 font-semibold">スパース性との関係：</span>
            評価行列の多くはほとんどが未評価（疎）。
            共通評価が少ないと類似度の信頼性が低下する。
            次のタブで学ぶ行列因子分解はこのスパース性問題に強い手法のひとつ。
          </div>
        </div>
      </ExplanationPanel>
    </div>
  );
}
