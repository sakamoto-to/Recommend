import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import { fetchCF } from '../api';
import { SAMPLE } from '../data/sample';
import ExplanationPanel, { FormulaBlock, Step, SectionTitle } from './ExplanationPanel';

export default function CollaborativeFilteringTab() {
  const [ratings, setRatings]           = useState(SAMPLE.map(r => [...r]));
  const [target, setTarget]             = useState(0);
  const [editing, setEditing]           = useState(null);
  const [similarities, setSimilarities] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

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

  const updateCell = (u, i, raw) => {
    setRatings(prev => {
      const next = prev.map(r => [...r]);
      if (raw === '' || raw === null) { next[u][i] = null; return next; }
      const n = parseInt(raw, 10);
      if (n >= 1 && n <= 5) next[u][i] = n;
      return next;
    });
  };

  const cellBg = v =>
    v === null ? '#1e293b' :
    v >= 4    ? '#166534' :
    v >= 2    ? '#1e3a5f' :
                '#7f1d1d';

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-cyan-400 font-bold text-lg">評価行列（クリックで編集）</h3>
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
                  <td className={`p-2 font-medium text-left text-sm ${u === target ? 'text-cyan-300' : 'text-gray-400'}`}>
                    {u === target ? '▶ ' : ''}ユーザー{u+1}
                  </td>
                  {row.map((val, i) => (
                    <td key={i} className="p-1">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-cyan-400 font-bold text-lg">ユーザー間類似度</h3>
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

      {/* 式の解説アコーディオン */}
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

        <SectionTitle>なぜコサイン類似度を使うのか</SectionTitle>
        <p className="text-gray-400 text-sm leading-relaxed">
          「全部5点」をつけるユーザーと「全部3点」をつけるユーザーは、
          評価の絶対値は異なるが<span className="text-cyan-300 font-semibold">傾向（何を好むか）は同じ</span>かもしれない。
          コサイン類似度はベクトルの長さを正規化するため、評価水準の違いに左右されにくい。
        </p>
      </ExplanationPanel>
    </div>
  );
}
