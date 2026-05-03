import React, { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, Legend,
} from 'recharts';
import ExplanationPanel, { FormulaBlock, Step, SectionTitle } from './ExplanationPanel';
import { fetchMF } from '../api';
import { SAMPLE } from '../data/sample';

export default function MatrixFactorizationTab() {
  const [k,       setK]      = useState(2);
  const [alpha,   setAlpha]  = useState(0.01);
  const [lambda,  setLambda] = useState(0.01);
  const [steps,   setSteps]  = useState(100);
  const [losses,  setLosses] = useState([]);
  const [U,       setU]      = useState(null);
  const [V,       setV]      = useState(null);
  const [running, setRunning] = useState(false);

  const nU = SAMPLE.length;
  const nI = SAMPLE[0].length;

  const runMF = async () => {
    setRunning(true);
    setLosses([]);
    setU(null);
    setV(null);
    try {
      const data = await fetchMF({ ratings: SAMPLE, k, alpha, lambda, steps });
      setLosses(data.losses);
      setU(data.U);
      setV(data.V);
    } finally {
      setRunning(false);
    }
  };

  const reconstructed = U && V
    ? Array.from({ length: nU }, (_, ui) =>
        Array.from({ length: nI }, (_, ii) =>
          U[ui].reduce((s, val, f) => s + val * V[ii][f], 0)))
    : null;

  const getHeatColor = (val, min = 1, max = 5) => {
    const t = Math.max(0, Math.min(1, (val - min) / (max - min)));
    return `rgb(${Math.round(t * 220)}, 50, ${Math.round((1 - t) * 220)})`;
  };

  const Heatmap = ({ data, title, isOrig }) => (
    <div className="flex-1">
      <p className="text-gray-300 text-sm font-semibold text-center mb-3">{title}</p>
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${nI + 1}, 1fr)` }}>
        <div className="text-xs text-gray-600 text-center p-1"></div>
        {[1,2,3,4,5].map(i => (
          <div key={i} className="text-xs text-gray-500 text-center p-1">商{i}</div>
        ))}
        {Array.from({ length: nU }, (_, u) => (
          <React.Fragment key={u}>
            <div className="text-xs text-gray-500 flex items-center justify-center">U{u+1}</div>
            {Array.from({ length: nI }, (_, i) => {
              const raw = isOrig ? SAMPLE[u][i] : data?.[u]?.[i];
              const displayVal = raw === null || raw === undefined ? null :
                isOrig ? raw : Math.max(1, Math.min(5, raw));
              return (
                <div
                  key={i}
                  className="aspect-square flex items-center justify-center text-xs font-mono text-white rounded"
                  style={{ backgroundColor: displayVal !== null ? getHeatColor(displayVal) : '#1e293b' }}
                >
                  {displayVal !== null ? (isOrig ? displayVal : displayVal.toFixed(1)) : '—'}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  const userScatter = U && k >= 2
    ? U.map((u, i) => ({ x: u[0], y: u[1], label: `U${i+1}` }))
    : [];
  const itemScatter = V && k >= 2
    ? V.map((v, i) => ({ x: v[0], y: v[1], label: `V${i+1}` }))
    : [];

  const CustomDot = ({ cx, cy, color, shape }) => {
    if (shape === 'star') {
      const s = 10;
      const pts = Array.from({ length: 5 }, (_, k) => {
        const angle = (k * 4 * Math.PI) / 5 - Math.PI / 2;
        return `${cx + s * Math.cos(angle)},${cy + s * Math.sin(angle)}`;
      }).join(' ');
      return <polygon points={pts} fill={color} />;
    }
    return <circle cx={cx} cy={cy} r={7} fill={color} />;
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-xl p-6">
        <h3 className="text-cyan-400 font-bold text-lg mb-5">パラメータ設定</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            { label: '潜在因子数 k', val: k,      min: 1,     max: 4,   step: 1,     set: setK,      fmt: v => v },
            { label: '学習率 α',    val: alpha,  min: 0.001, max: 0.1, step: 0.001, set: setAlpha,  fmt: v => v.toFixed(3) },
            { label: '正則化 λ',    val: lambda, min: 0.001, max: 0.1, step: 0.001, set: setLambda, fmt: v => v.toFixed(3) },
            { label: 'ステップ数',  val: steps,  min: 10,    max: 500, step: 10,    set: setSteps,  fmt: v => v },
          ].map(({ label, val, min, max, step, set, fmt }) => (
            <div key={label} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">{label}</span>
                <span className="text-cyan-300 font-mono">{fmt(val)}</span>
              </div>
              <input
                type="range" min={min} max={max} step={step} value={val}
                onChange={e => set(+e.target.value)}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: '#06b6d4' }}
                disabled={running}
              />
            </div>
          ))}
        </div>

        <div className="bg-slate-900 rounded-lg p-4 mt-5 font-mono text-xs text-gray-300 space-y-1.5 leading-relaxed">
          <div>目標：R ≈ U × Vᵀ</div>
          <div>損失：L = Σ(r_ui − u_u·v_i)² + λ(‖U‖² + ‖V‖²)</div>
          <div>更新：u_u ← u_u + α(e_ui × v_i − λ × u_u)</div>
          <div className="pl-10">v_i ← v_i + α(e_ui × u_u − λ × v_i)</div>
        </div>

        <button
          onClick={runMF}
          disabled={running}
          className="mt-5 w-full py-3 rounded-xl font-bold text-white text-base transition-colors"
          style={{ backgroundColor: running ? '#334155' : '#0891b2' }}
        >
          {running ? '学習中...' : '学習を実行する'}
        </button>
      </div>

      {losses.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-6">
          <h3 className="text-cyan-400 font-bold text-lg mb-4">損失関数の推移（MSE）</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={losses} margin={{ bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="step"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                label={{ value: 'ステップ数', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 12 }}
              />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }}
                formatter={v => [v.toFixed(5), 'MSE損失']}
              />
              <Line type="monotone" dataKey="loss" stroke="#06b6d4" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {reconstructed && (
        <div className="bg-slate-800 rounded-xl p-6">
          <h3 className="text-cyan-400 font-bold text-lg mb-5">行列の可視化</h3>
          <div className="flex gap-8">
            <Heatmap data={null}          title="元の評価行列"    isOrig={true} />
            <Heatmap data={reconstructed} title="再構成 (U × Vᵀ)" isOrig={false} />
          </div>
          <div className="flex justify-center items-center gap-6 mt-4 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded inline-block" style={{ backgroundColor: getHeatColor(1) }}></span>
              低評価 (1)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded inline-block" style={{ backgroundColor: getHeatColor(5) }}></span>
              高評価 (5)
            </span>
          </div>
        </div>
      )}

      {U && V && k >= 2 && (
        <div className="bg-slate-800 rounded-xl p-6">
          <h3 className="text-cyan-400 font-bold text-lg mb-1">潜在因子の可視化（第1・第2因子）</h3>
          <p className="text-gray-500 text-sm mb-4">近い点同士が「相性のいい」ユーザーと商品の組み合わせを示します</p>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis type="number" dataKey="x" name="因子1" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis type="number" dataKey="y" name="因子2" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <ZAxis range={[60, 60]} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }}
                content={({ payload }) =>
                  payload?.[0] ? (
                    <div className="bg-slate-800 border border-slate-600 p-2 rounded text-sm">
                      <p className="text-white font-bold">{payload[0].payload.label}</p>
                      <p className="text-gray-300">
                        ({payload[0].payload.x.toFixed(3)}, {payload[0].payload.y.toFixed(3)})
                      </p>
                    </div>
                  ) : null
                }
              />
              <Scatter
                name="ユーザー (●)"
                data={userScatter}
                fill="#60a5fa"
                shape={p => <CustomDot {...p} color="#60a5fa" shape="circle" />}
              />
              <Scatter
                name="商品 (★)"
                data={itemScatter}
                fill="#fb923c"
                shape={p => <CustomDot {...p} color="#fb923c" shape="star" />}
              />
              <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 13 }} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 式の解説アコーディオン */}
      <ExplanationPanel>
        <SectionTitle>行列因子分解とは</SectionTitle>
        <p className="text-gray-400 text-sm leading-relaxed">
          評価行列 R（ユーザー × アイテム）を2つの小さな行列 U・V に分解する手法。
          未評価のセルを <span className="text-cyan-300 font-semibold">U × Vᵀ で予測</span> できるようになる。
        </p>

        <SectionTitle>分解のイメージ</SectionTitle>
        <FormulaBlock>
          <div className="text-yellow-300 text-base">R  ≈  U  ×  Vᵀ</div>
          <div className="mt-3 grid grid-cols-3 gap-4 text-xs text-center">
            <div className="space-y-1">
              <div className="text-white font-semibold">R（評価行列）</div>
              <div className="text-gray-400">n_user × n_item</div>
              <div className="text-gray-500">既知の評価 + 欠損値</div>
            </div>
            <div className="space-y-1">
              <div className="text-blue-300 font-semibold">U（ユーザー行列）</div>
              <div className="text-gray-400">n_user × k</div>
              <div className="text-gray-500">各ユーザーの潜在的な好みベクトル</div>
            </div>
            <div className="space-y-1">
              <div className="text-orange-300 font-semibold">V（アイテム行列）</div>
              <div className="text-gray-400">n_item × k</div>
              <div className="text-gray-500">各アイテムの潜在的な特徴ベクトル</div>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-400">k = 潜在因子数（次元数）。小さいほど圧縮、大きいほど表現力が上がる</div>
        </FormulaBlock>

        <SectionTitle>損失関数</SectionTitle>
        <FormulaBlock>
          <div className="text-yellow-300">L = Σ(r_ui − U[u]·V[i])²  +  λ(‖U‖² + ‖V‖²)</div>
          <div className="mt-3 space-y-2 text-xs">
            <div>
              <span className="text-blue-300">第1項（再構成誤差）</span>：予測値と実際の評価の差の二乗和。
              これを小さくすることが学習の目的。
            </div>
            <div>
              <span className="text-orange-300">第2項（正則化項）</span>：U・V の値が大きくなりすぎるのを抑制。
              λ が大きいほど過学習を防ぐ。λ が小さすぎると訓練データに過適合する。
            </div>
          </div>
        </FormulaBlock>

        <SectionTitle>SGD（確率的勾配降下法）による更新</SectionTitle>
        <div className="space-y-4">
          <Step number="1" title="誤差 e を計算する">
            評価済みのセル (u, i) に対して予測値と実測値の差を求める。
            <FormulaBlock>
              <div className="text-yellow-300">e = r_ui − U[u] · V[i]</div>
            </FormulaBlock>
          </Step>
          <Step number="2" title="損失関数を U・V で偏微分して勾配を求める">
            損失 L を U[u] で偏微分すると勾配の方向がわかる。
            マイナス方向に進むことで損失が減少する。
            <FormulaBlock>
              <div className="space-y-1">
                <div><span className="text-gray-400">∂L/∂U[u]</span> = <span className="text-blue-300">−2e·V[i] + 2λ·U[u]</span></div>
                <div><span className="text-gray-400">∂L/∂V[i]</span> = <span className="text-orange-300">−2e·U[u] + 2λ·V[i]</span></div>
              </div>
            </FormulaBlock>
          </Step>
          <Step number="3" title="学習率 α で U・V をアップデートする">
            勾配の反対方向に α だけ動かす（勾配降下）。
            <FormulaBlock>
              <div className="space-y-1">
                <div className="text-yellow-300">U[u] ← U[u] + α·(e·V[i] − λ·U[u])</div>
                <div className="text-yellow-300">V[i] ← V[i] + α·(e·U[u] − λ·V[i])</div>
              </div>
              <div className="mt-2 text-xs text-gray-400">α（学習率）が大きすぎると発散、小さすぎると収束が遅くなる</div>
            </FormulaBlock>
          </Step>
        </div>
      </ExplanationPanel>
    </div>
  );
}
