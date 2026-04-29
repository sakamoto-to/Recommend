import React, { useState, useMemo } from 'react';
import { cosineSim } from '../utils/cosineSim';

export default function CosineSimilarityTab() {
  const [vecA, setVecA] = useState([3, 2]);
  const [vecB, setVecB] = useState([1, 4]);

  const sim = useMemo(() => cosineSim(vecA, vecB), [vecA, vecB]);

  const getLabel = (s) => {
    if (s >= 0.8)  return { text: '非常に似ている',   color: '#22c55e' };
    if (s >= 0.5)  return { text: 'やや似ている',     color: '#06b6d4' };
    if (s >= -0.5) return { text: 'あまり似ていない', color: '#eab308' };
    return           { text: '逆方向（正反対）',       color: '#ef4444' };
  };
  const label = getLabel(sim);

  const SIZE = 300;
  const CTR  = SIZE / 2;
  const SCL  = CTR / 7;

  const toSVG = (x, y) => [CTR + x * SCL, CTR - y * SCL];

  const Arrow = ({ x, y, color }) => {
    const [ex, ey] = toSVG(x, y);
    const dx = ex - CTR, dy = ey - CTR;
    const len = Math.hypot(dx, dy);
    if (len < 2) return null;
    const ux = dx / len, uy = dy / len;
    const hl = 10;
    return (
      <>
        <line x1={CTR} y1={CTR} x2={ex} y2={ey} stroke={color} strokeWidth={2.5} />
        <polygon
          points={`${ex},${ey} ${ex-ux*hl-uy*5},${ey-uy*hl+ux*5} ${ex-ux*hl+uy*5},${ey-uy*hl-ux*5}`}
          fill={color}
        />
      </>
    );
  };

  const a1 = Math.atan2(vecA[1], vecA[0]);
  const a2 = Math.atan2(vecB[1], vecB[0]);
  const R  = 32;
  const arcS = [CTR + R * Math.cos(a1), CTR - R * Math.sin(a1)];
  const arcE = [CTR + R * Math.cos(a2), CTR - R * Math.sin(a2)];
  const diff = ((a2 - a1) + 2 * Math.PI) % (2 * Math.PI);
  const sweep = diff > Math.PI ? 1 : 0;

  const na  = Math.hypot(vecA[0], vecA[1]).toFixed(3);
  const nb  = Math.hypot(vecB[0], vecB[1]).toFixed(3);
  const dot = (vecA[0]*vecB[0] + vecA[1]*vecB[1]).toFixed(3);

  const SliderGroup = ({ label, color, vec, setVec }) => (
    <div className="space-y-3">
      <h4 className="font-semibold text-sm" style={{ color }}>{label}</h4>
      {['x', 'y'].map((c, i) => (
        <div key={c} className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">{c} 成分</span>
            <span className="font-mono" style={{ color }}>{vec[i].toFixed(1)}</span>
          </div>
          <input
            type="range" min={-5} max={5} step={0.1} value={vec[i]}
            onChange={e => setVec(v => v.map((x, j) => j === i ? +e.target.value : x))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: color }}
          />
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-xl p-6 space-y-6">
          <h3 className="text-cyan-400 font-bold text-lg">ベクトル入力</h3>
          <SliderGroup label="ベクトル A" color="#60a5fa" vec={vecA} setVec={setVecA} />
          <SliderGroup label="ベクトル B" color="#fb923c" vec={vecB} setVec={setVecB} />
          <div className="bg-slate-900 rounded-lg p-4 font-mono text-xs space-y-1.5">
            <div className="text-gray-400">cos θ = (A・B) / (|A| × |B|)</div>
            <div className="text-gray-300">
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= ({dot}) / ({na} × {nb})
            </div>
            <div className="text-cyan-300 font-bold text-sm">
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= {sim.toFixed(4)}
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 flex flex-col items-center space-y-5">
          <h3 className="text-cyan-400 font-bold text-lg">2D 可視化</h3>
          <svg width={SIZE} height={SIZE} className="rounded-xl bg-slate-900 border border-slate-700">
            {[-4,-2,2,4].map(v => (
              <React.Fragment key={v}>
                <line x1={toSVG(v,-7)[0]} y1={toSVG(v,-7)[1]} x2={toSVG(v,7)[0]} y2={toSVG(v,7)[1]}
                  stroke="#1e293b" strokeWidth={1} />
                <line x1={toSVG(-7,v)[0]} y1={toSVG(-7,v)[1]} x2={toSVG(7,v)[0]} y2={toSVG(7,v)[1]}
                  stroke="#1e293b" strokeWidth={1} />
              </React.Fragment>
            ))}
            <line x1={0} y1={CTR} x2={SIZE} y2={CTR} stroke="#334155" />
            <line x1={CTR} y1={0} x2={CTR} y2={SIZE} stroke="#334155" />
            <path
              d={`M ${arcS[0]} ${arcS[1]} A ${R} ${R} 0 ${sweep} 0 ${arcE[0]} ${arcE[1]}`}
              stroke="#a78bfa" strokeWidth={1.5} fill="rgba(167,139,250,0.1)" strokeDasharray="4 2"
            />
            <Arrow x={vecA[0]} y={vecA[1]} color="#60a5fa" />
            <Arrow x={vecB[0]} y={vecB[1]} color="#fb923c" />
            {vecA[0] !== 0 || vecA[1] !== 0 ? (
              <text x={toSVG(vecA[0], vecA[1])[0]+6} y={toSVG(vecA[0], vecA[1])[1]-6}
                fill="#60a5fa" fontSize={14} fontWeight="bold">A</text>
            ) : null}
            {vecB[0] !== 0 || vecB[1] !== 0 ? (
              <text x={toSVG(vecB[0], vecB[1])[0]+6} y={toSVG(vecB[0], vecB[1])[1]-6}
                fill="#fb923c" fontSize={14} fontWeight="bold">B</text>
            ) : null}
            <text x={SIZE-14} y={CTR-6} fill="#475569" fontSize={11}>x</text>
            <text x={CTR+6} y={12}    fill="#475569" fontSize={11}>y</text>
          </svg>

          <div className="text-center">
            <div className="text-5xl font-bold text-white mb-1">{sim.toFixed(3)}</div>
            <div className="text-base font-semibold" style={{ color: label.color }}>{label.text}</div>
            <div className="text-gray-500 text-xs mt-1">コサイン類似度（-1 〜 +1）</div>
          </div>
        </div>
      </div>
    </div>
  );
}
