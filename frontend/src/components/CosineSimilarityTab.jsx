import React, { useState, useEffect } from 'react';
import { fetchCosineSimilarity } from '../api';
import ExplanationPanel, { FormulaBlock, Step, SectionTitle } from './ExplanationPanel';

// ── 投影図（スライダーと連動） ──────────────────────────────────
// 親コンポーネントの vecA・vecB をそのまま受け取り、スライダー操作でリアルタイムに更新される
function ProjectionDiagram({ vecA, vecB }) {
  const PS   = 260;        // SVG キャンバスサイズ（px）
  const PCTR = PS / 2;     // 原点の SVG 座標（中心）
  const PSCL = PCTR / 6.5; // 数学座標 → SVG 座標のスケール係数

  // 数学座標 (x, y) を SVG 座標に変換（y 軸は上下反転）
  const pt = (x, y) => [PCTR + x * PSCL, PCTR - y * PSCL];

  const [Ax, Ay] = pt(vecA[0], vecA[1]);
  const [Bx, By] = pt(vecB[0], vecB[1]);

  // B を A 上に投影した点を計算：t = (A·B) / (A·A)、投影点 = t × A
  const dotAB = vecA[0] * vecB[0] + vecA[1] * vecB[1];
  const dotAA = vecA[0] * vecA[0] + vecA[1] * vecA[1];
  const t = dotAA > 0 ? dotAB / dotAA : 0;
  const [Px, Py] = pt(t * vecA[0], t * vecA[1]);

  // A 方向の単位ベクトル（SVG 座標系）：直角マーカーの方向に使う
  const alen = Math.hypot(Ax - PCTR, Ay - PCTR);
  const uax  = alen > 0 ? (Ax - PCTR) / alen : 1;
  const uay  = alen > 0 ? (Ay - PCTR) / alen : 0;

  // 直角マーカーの3頂点：A 方向と垂直方向（-uay, uax）で L 字を構成
  const s  = 9;
  const raPoints = dotAA > 0 ? [
    [Px + s * uax,           Py + s * uay],
    [Px + s * uax - s * uay, Py + s * uay + s * uax],
    [Px - s * uay,           Py + s * uax],
  ] : null;

  // SVG 上に矢印（線＋三角形ヘッド）を描くヘルパー
  const Arrow = ({ x1, y1, x2, y2, color, dashed = false }) => {
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    if (len < 4) return null; // 長さが短すぎる場合は描画しない
    const ux = dx / len, uy = dy / len;
    const hl = 9;
    return (
      <>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={2}
          strokeDasharray={dashed ? '5 3' : 'none'} />
        <polygon
          points={`${x2},${y2} ${x2-ux*hl-uy*4},${y2-uy*hl+ux*4} ${x2-ux*hl+uy*4},${y2-uy*hl-ux*4}`}
          fill={color}
        />
      </>
    );
  };

  // 投影長 = A·B / |A|（コサイン類似度の分子に相当する量）
  const projLen = dotAA > 0 ? (dotAB / Math.sqrt(dotAA)).toFixed(2) : '0';

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={PS} height={PS} className="rounded-xl bg-slate-900 border border-slate-700">
        {/* 補助グリッド線 */}
        {[-4,-2,2,4].map(v => (
          <React.Fragment key={v}>
            <line x1={pt(v,-7)[0]} y1={pt(v,-7)[1]} x2={pt(v,7)[0]} y2={pt(v,7)[1]} stroke="#1e293b" strokeWidth={1} />
            <line x1={pt(-7,v)[0]} y1={pt(-7,v)[1]} x2={pt(7,v)[0]} y2={pt(7,v)[1]} stroke="#1e293b" strokeWidth={1} />
          </React.Fragment>
        ))}
        {/* x 軸・y 軸 */}
        <line x1={0} y1={PCTR} x2={PS} y2={PCTR} stroke="#334155" />
        <line x1={PCTR} y1={0} x2={PCTR} y2={PS} stroke="#334155" />

        {/* A の延長線（薄い破線）：投影点がベクトル A の外にある場合も視覚的につながるよう表示 */}
        {dotAA > 0 && (
          <line
            x1={pt(-t * vecA[0] * 1.5, -t * vecA[1] * 1.5)[0]}
            y1={pt(-t * vecA[0] * 1.5, -t * vecA[1] * 1.5)[1]}
            x2={pt(vecA[0] * 1.5, vecA[1] * 1.5)[0]}
            y2={pt(vecA[0] * 1.5, vecA[1] * 1.5)[1]}
            stroke="#1e3a5f" strokeWidth={1} strokeDasharray="4 3"
          />
        )}

        {/* 投影ベクトル（緑）：原点 → 投影点 */}
        {dotAA > 0 && Math.hypot(Px - PCTR, Py - PCTR) > 3 && (
          <Arrow x1={PCTR} y1={PCTR} x2={Px} y2={Py} color="#22c55e" />
        )}

        {/* B からの垂線（白破線）：B → 投影点 */}
        {dotAA > 0 && (
          <line x1={Bx} y1={By} x2={Px} y2={Py}
            stroke="#e2e8f0" strokeWidth={1.5} strokeDasharray="4 3" />
        )}

        {/* 直角マーカー（投影点に L 字を描く） */}
        {raPoints && (
          <>
            <line x1={raPoints[0][0]} y1={raPoints[0][1]} x2={raPoints[1][0]} y2={raPoints[1][1]}
              stroke="#94a3b8" strokeWidth={1.2} />
            <line x1={raPoints[2][0]} y1={raPoints[2][1]} x2={raPoints[1][0]} y2={raPoints[1][1]}
              stroke="#94a3b8" strokeWidth={1.2} />
          </>
        )}

        {/* ベクトル A（青）・B（橙） */}
        <Arrow x1={PCTR} y1={PCTR} x2={Ax} y2={Ay} color="#60a5fa" />
        <Arrow x1={PCTR} y1={PCTR} x2={Bx} y2={By} color="#fb923c" />

        {/* ラベル */}
        {dotAA > 0 && <text x={Ax + 6} y={Ay - 6} fill="#60a5fa" fontSize={13} fontWeight="bold">A</text>}
        <text x={Bx + 6} y={By - 6} fill="#fb923c" fontSize={13} fontWeight="bold">B</text>
        {dotAA > 0 && Math.hypot(Px - PCTR, Py - PCTR) > 10 && (
          <text x={Px + 5} y={Py + 14} fill="#22c55e" fontSize={11}>投影点</text>
        )}

        {/* 投影長ラベル：投影ベクトルの中点に A 方向と垂直にオフセットして表示 */}
        {dotAA > 0 && Math.hypot(Px - PCTR, Py - PCTR) > 10 && (
          <text
            x={(PCTR + Px) / 2 - uay * 14}
            y={(PCTR + Py) / 2 + uax * 14}
            fill="#22c55e" fontSize={10} textAnchor="middle"
          >
            A·B/|A|
          </text>
        )}
      </svg>

      {/* 投影の各要素をラベルで整理して表示 */}
      <div className="grid grid-cols-3 gap-2 w-full text-xs text-center">
        <div className="bg-slate-900 rounded-lg p-2 space-y-0.5">
          <div className="text-blue-300 font-semibold">投影ベクトル（緑）</div>
          <div className="text-gray-400 font-mono">A·B/|A| = {projLen}</div>
        </div>
        <div className="bg-slate-900 rounded-lg p-2 space-y-0.5">
          <div className="text-gray-300 font-semibold">垂線（白破線）</div>
          <div className="text-gray-400">B と A は直角に交わる</div>
        </div>
        <div className="bg-slate-900 rounded-lg p-2 space-y-0.5">
          <div className="text-cyan-300 font-semibold">cos θ</div>
          <div className="text-gray-400 font-mono">= (A·B/|A|) / |B|</div>
        </div>
      </div>
    </div>
  );
}

// ── ユークリッド距離 vs コサイン類似度 比較図 ─────────────────
// 固定の2ケースを静的に描画する（スライダーには連動しない）
function EuclideanComparison() {
  const SZ  = 160;     // 各ミニ SVG のサイズ
  const CTR = SZ / 2;
  const SCL = 28;      // 数学座標 → SVG 座標のスケール係数

  const pt = (x, y) => [CTR + x * SCL, CTR - y * SCL];

  // ミニ SVG に矢印を描くヘルパー（原点からの矢印のみ）
  const arrowSVG = (x2, y2, color) => {
    const [ex, ey] = pt(x2, y2);
    const dx = ex - CTR, dy = ey - CTR;
    const len = Math.hypot(dx, dy);
    if (len < 2) return null;
    const ux = dx / len, uy = dy / len;
    const hl = 8;
    return (
      <>
        <line x1={CTR} y1={CTR} x2={ex} y2={ey} stroke={color} strokeWidth={2.5} />
        <polygon
          points={`${ex},${ey} ${ex-ux*hl-uy*4},${ey-uy*hl+ux*4} ${ex-ux*hl+uy*4},${ey-uy*hl-ux*4}`}
          fill={color}
        />
      </>
    );
  };

  // 1ケース分のミニ図（SVG + コサイン・ユークリッドの数値ラベル）を生成
  const miniSVG = (vA, vB, label, cosVal, eucVal) => {
    const [Ax, Ay] = pt(...vA);
    const [Bx, By] = pt(...vB);
    return (
      <div className="flex flex-col items-center gap-2">
        <p className="text-gray-300 text-xs font-semibold">{label}</p>
        <svg width={SZ} height={SZ} className="rounded-lg bg-slate-900 border border-slate-700">
          <line x1={0} y1={CTR} x2={SZ} y2={CTR} stroke="#334155" />
          <line x1={CTR} y1={0} x2={CTR} y2={SZ} stroke="#334155" />
          {/* ユークリッド距離を破線で示す */}
          <line x1={Ax} y1={Ay} x2={Bx} y2={By} stroke="#475569" strokeWidth={1} strokeDasharray="3 2" />
          {arrowSVG(...vA, '#60a5fa')}
          {arrowSVG(...vB, '#fb923c')}
          <text x={Ax + 5} y={Ay - 5} fill="#60a5fa" fontSize={12} fontWeight="bold">A</text>
          <text x={Bx + 5} y={By - 5} fill="#fb923c" fontSize={12} fontWeight="bold">B</text>
        </svg>
        <div className="w-full space-y-1 text-xs">
          <div className="flex justify-between bg-slate-900 rounded px-2 py-1">
            <span className="text-cyan-300">コサイン類似度</span>
            <span className="font-mono text-white">{cosVal}</span>
          </div>
          <div className="flex justify-between bg-slate-900 rounded px-2 py-1">
            <span className="text-purple-300">ユークリッド距離</span>
            <span className="font-mono text-white">{eucVal}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <p className="text-gray-400 text-sm leading-relaxed">
        コサインは<span className="text-cyan-300 font-semibold">向き</span>を、
        ユークリッドは<span className="text-purple-300 font-semibold">位置の距離</span>を測る。
        同じベクトルのペアでも、どちらの指標を使うかで「似ている」の意味が変わる。
      </p>
      <div className="grid grid-cols-2 gap-4">
        {/* ケース1：同じ方向・違う長さ → コサイン=1 だがユークリッド距離≠0 */}
        {miniSVG([3, 1], [1, 0.33], '同じ方向・違う長さ', '1.000', '約 2.1')}
        {/* ケース2：直角・同じ長さ → コサイン=0 だがユークリッド距離は大きい */}
        {miniSVG([3, 0], [0, 3],   '直角・同じ長さ',     '0.000', '約 4.2')}
      </div>
      {/* 推薦システムでの具体例：評価水準が違っても好み傾向が同じケース */}
      <div className="bg-slate-900 rounded-lg p-4 text-xs space-y-2">
        <p className="text-yellow-300 font-semibold">推薦システムでの実例</p>
        <div className="grid grid-cols-2 gap-3 text-gray-400">
          <div>
            <p className="text-blue-300 mb-1">ユーザーA: [5, 5, 5]</p>
            <p className="text-orange-300 mb-1">ユーザーB: [1, 1, 1]</p>
            <p>→ コサイン = <span className="text-white">1.0（同じ好み傾向）</span></p>
            <p>→ Euclidean = <span className="text-white">6.9（距離が大きい）</span></p>
          </div>
          <div className="text-gray-300 leading-relaxed">
            Euclidean では「A は全部好き、B は全部嫌い」と判断。
            コサインは「どちらも同じように評価している」と正しく判断できる。
          </div>
        </div>
      </div>
    </div>
  );
}

// ── メインコンポーネント ────────────────────────────────────────
export default function CosineSimilarityTab() {
  // スライダーで操作する2つのベクトル（初期値）
  const [vecA, setVecA] = useState([3, 2]);
  const [vecB, setVecB] = useState([1, 4]);
  // バックエンドから返ってくるコサイン類似度の値（-1〜1）
  const [sim, setSim]   = useState(null);

  // vecA・vecB が変わるたびに API を呼ぶ
  // AbortController でリクエストをキャンセルし、古いレスポンスで上書きされるのを防ぐ
  useEffect(() => {
    const controller = new AbortController();
    fetchCosineSimilarity(vecA, vecB, controller.signal)
      .then(data => setSim(data.similarity))
      .catch(() => {});
    return () => controller.abort();
  }, [vecA, vecB]);

  // 類似度の値に応じてラベルテキストと色を決定
  const getLabel = (s) => {
    if (s >= 0.8)  return { text: '非常に似ている',   color: '#22c55e' };
    if (s >= 0.5)  return { text: 'やや似ている',     color: '#06b6d4' };
    if (s >= -0.5) return { text: 'あまり似ていない', color: '#eab308' };
    return           { text: '逆方向（正反対）',       color: '#ef4444' };
  };
  const label = sim !== null ? getLabel(sim) : { text: '...', color: '#94a3b8' };

  // メイン可視化 SVG のサイズと座標変換
  const SIZE = 300;
  const CTR  = SIZE / 2;
  const SCL  = CTR / 7;

  const toSVG = (x, y) => [CTR + x * SCL, CTR - y * SCL];

  // メイン SVG 用の矢印（原点から (x, y) への矢印）
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

  // 2ベクトル間の角度 θ を示す円弧のパラメータを計算
  const a1 = Math.atan2(vecA[1], vecA[0]);
  const a2 = Math.atan2(vecB[1], vecB[0]);
  const R  = 32;
  const arcS = [CTR + R * Math.cos(a1), CTR - R * Math.sin(a1)];
  const arcE = [CTR + R * Math.cos(a2), CTR - R * Math.sin(a2)];
  // sweep フラグ：A→B の角度差が 180° 超なら大回り（1）、以下なら小回り（0）
  const diff = ((a2 - a1) + 2 * Math.PI) % (2 * Math.PI);
  const sweep = diff > Math.PI ? 1 : 0;

  // 解説パネルの計算式表示用に数値を先に計算しておく
  const na  = Math.hypot(vecA[0], vecA[1]).toFixed(3);
  const nb  = Math.hypot(vecB[0], vecB[1]).toFixed(3);
  const dot = (vecA[0]*vecB[0] + vecA[1]*vecB[1]).toFixed(3);

  // ベクトル A・B 共通のスライダーグループ（x, y 成分を個別に操作）
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
      {/* ── スライダー入力 ＋ 2D 可視化（横並び） ────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ベクトル入力パネル：スライダーと計算式プレビュー */}
        <div className="bg-slate-800 rounded-xl p-6 space-y-6">
          <h3 className="text-cyan-400 font-bold text-lg">ベクトル入力</h3>
          <SliderGroup label="ベクトル A" color="#60a5fa" vec={vecA} setVec={setVecA} />
          <SliderGroup label="ベクトル B" color="#fb923c" vec={vecB} setVec={setVecB} />
          {/* 現在の値で計算式を展開してリアルタイム表示 */}
          <div className="bg-slate-900 rounded-lg p-4 font-mono text-xs space-y-1.5">
            <div className="text-gray-400">cos θ = (A・B) / (|A| × |B|)</div>
            <div className="text-gray-300">
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= ({dot}) / ({na} × {nb})
            </div>
            <div className="text-cyan-300 font-bold text-sm">
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= {sim !== null ? sim.toFixed(4) : '...'}
            </div>
          </div>
        </div>

        {/* 2D 可視化パネル：SVG ベクトル図＋類似度スコア表示 */}
        <div className="bg-slate-800 rounded-xl p-6 flex flex-col items-center space-y-5">
          <h3 className="text-cyan-400 font-bold text-lg">2D 可視化</h3>
          <svg width={SIZE} height={SIZE} className="rounded-xl bg-slate-900 border border-slate-700">
            {/* 補助グリッド線 */}
            {[-4,-2,2,4].map(v => (
              <React.Fragment key={v}>
                <line x1={toSVG(v,-7)[0]} y1={toSVG(v,-7)[1]} x2={toSVG(v,7)[0]} y2={toSVG(v,7)[1]}
                  stroke="#1e293b" strokeWidth={1} />
                <line x1={toSVG(-7,v)[0]} y1={toSVG(-7,v)[1]} x2={toSVG(7,v)[0]} y2={toSVG(7,v)[1]}
                  stroke="#1e293b" strokeWidth={1} />
              </React.Fragment>
            ))}
            {/* x 軸・y 軸 */}
            <line x1={0} y1={CTR} x2={SIZE} y2={CTR} stroke="#334155" />
            <line x1={CTR} y1={0} x2={CTR} y2={SIZE} stroke="#334155" />
            {/* θ を示す円弧（紫破線） */}
            <path
              d={`M ${arcS[0]} ${arcS[1]} A ${R} ${R} 0 ${sweep} 0 ${arcE[0]} ${arcE[1]}`}
              stroke="#a78bfa" strokeWidth={1.5} fill="rgba(167,139,250,0.1)" strokeDasharray="4 2"
            />
            <Arrow x={vecA[0]} y={vecA[1]} color="#60a5fa" />
            <Arrow x={vecB[0]} y={vecB[1]} color="#fb923c" />
            {/* ゼロベクトルのときはラベルを表示しない */}
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

          {/* 類似度の数値＋ラベル */}
          <div className="text-center">
            <div className="text-5xl font-bold text-white mb-1">
              {sim !== null ? sim.toFixed(3) : '—'}
            </div>
            <div className="text-base font-semibold" style={{ color: label.color }}>{label.text}</div>
            <div className="text-gray-500 text-xs mt-1">コサイン類似度（-1 〜 +1）</div>
          </div>
        </div>
      </div>

      {/* ── 式の解説アコーディオン ────────────────────────────── */}
      <ExplanationPanel>
        <SectionTitle>コサイン類似度とは</SectionTitle>
        <p className="text-gray-400 text-sm leading-relaxed">
          2つのベクトルが「どの方向を向いているか」の近さを -1〜+1 で表す指標。
          ベクトルの大きさ（長さ）は無視して、<span className="text-cyan-300 font-semibold">向きの一致度だけ</span>を測る。
        </p>

        <SectionTitle>式の分解</SectionTitle>
        <FormulaBlock>
          <div className="text-yellow-300">cos θ = (A · B) / (|A| × |B|)</div>
          <div className="mt-3 space-y-1.5 text-xs">
            <div><span className="text-blue-300">A · B</span>　= 内積　= Σ(aᵢ × bᵢ)　← 各成分を掛けて足す</div>
            <div><span className="text-orange-300">|A|</span>　　= ノルム = √(Σaᵢ²)　　← ベクトルの長さ</div>
            <div><span className="text-gray-400">分母で割る</span>　→ 長さを 1 に揃えて「向きだけ」を比較</div>
          </div>
        </FormulaBlock>

        <SectionTitle>値の意味</SectionTitle>
        <div className="grid grid-cols-3 gap-3 text-center text-xs">
          {[
            { val: '+1', label: '完全に同じ方向', color: '#22c55e', desc: 'θ = 0°' },
            { val:  '0', label: '直交（無関係）', color: '#94a3b8', desc: 'θ = 90°' },
            { val: '−1', label: '完全に逆方向',   color: '#ef4444', desc: 'θ = 180°' },
          ].map(({ val, label, color, desc }) => (
            <div key={val} className="bg-slate-900 rounded-lg p-3 space-y-1">
              <div className="text-2xl font-bold" style={{ color }}>{val}</div>
              <div className="text-gray-300">{label}</div>
              <div className="text-gray-500">{desc}</div>
            </div>
          ))}
        </div>

        <SectionTitle>投影の幾何学的意味（スライダーと連動）</SectionTitle>
        <p className="text-gray-400 text-sm leading-relaxed">
          内積 A·B の正体は「<span className="text-green-400 font-semibold">B を A の方向に投影した長さ</span> × |A|」。
          ノルムで割ると長さが消えて <span className="text-cyan-300 font-semibold">角度 θ のコサイン値だけ</span>が残る。
          スライダーを動かすと投影がリアルタイムで変わる。
        </p>
        {/* vecA・vecB を props として渡すことでスライダーに連動させる */}
        <ProjectionDiagram vecA={vecA} vecB={vecB} />
        <FormulaBlock>
          <div className="space-y-1.5 text-xs">
            <div className="text-yellow-300 text-sm">A · B  =  |A| × |B| × cos θ</div>
            <div className="text-gray-400 mt-2">↓ 両辺を |A|×|B| で割ると</div>
            <div className="text-cyan-300 text-sm">cos θ  =  (A · B) / (|A| × |B|)  =  投影長 / |B|</div>
          </div>
        </FormulaBlock>

        <SectionTitle>ユークリッド距離との対比</SectionTitle>
        <EuclideanComparison />

        <SectionTitle>なぜ「長さを揃える」のか</SectionTitle>
        <p className="text-gray-400 text-sm leading-relaxed">
          例えばユーザーAが「全部5点」、ユーザーBが「全部1点」をつけたとき、
          内積だけで比べると大きな値になってしまう。ノルムで割ることで
          <span className="text-cyan-300 font-semibold">評価の絶対値ではなく傾向の近さ</span>が測れる。
        </p>
      </ExplanationPanel>
    </div>
  );
}
