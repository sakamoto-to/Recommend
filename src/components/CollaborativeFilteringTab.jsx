import { useState, useCallback, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import { cosineSim } from '../utils/cosineSim';
import { SAMPLE } from '../data/sample';

export default function CollaborativeFilteringTab() {
  const [ratings, setRatings] = useState(SAMPLE.map(r => [...r]));
  const [target, setTarget]   = useState(0);
  const [editing, setEditing] = useState(null);

  const updateCell = (u, i, raw) => {
    setRatings(prev => {
      const next = prev.map(r => [...r]);
      if (raw === '' || raw === null) { next[u][i] = null; return next; }
      const n = parseInt(raw, 10);
      if (n >= 1 && n <= 5) next[u][i] = n;
      return next;
    });
  };

  const userCosSim = useCallback((u1, u2) => {
    const shared = ratings[u1]
      .map((v, i) => [v, ratings[u2][i]])
      .filter(([a, b]) => a !== null && b !== null);
    if (shared.length === 0) return 0;
    return cosineSim(shared.map(([a]) => a), shared.map(([, b]) => b));
  }, [ratings]);

  const similarities = useMemo(() =>
    [0,1,2,3,4]
      .filter(u => u !== target)
      .map(u => ({ user: `ユーザー${u+1}`, idx: u, sim: userCosSim(target, u) }))
      .sort((a, b) => b.sim - a.sim),
  [target, userCosSim]);

  const recommendations = useMemo(() =>
    ratings[target]
      .map((v, i) => {
        if (v !== null) return null;
        let num = 0, den = 0;
        let topContrib = null;
        similarities.forEach(({ idx, sim }) => {
          if (ratings[idx][i] !== null && sim > 0) {
            num += sim * ratings[idx][i];
            den += sim;
            if (!topContrib) topContrib = { user: `ユーザー${idx+1}`, rating: ratings[idx][i] };
          }
        });
        if (den === 0) return null;
        const score = num / den;
        const reason = topContrib
          ? `${topContrib.user}があなたと最も類似しており、商品${i+1}に${topContrib.rating}点をつけています`
          : '推薦データが不足しています';
        return { item: `商品${i+1}`, score, reason };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score),
  [ratings, target, similarities]);

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
    </div>
  );
}
