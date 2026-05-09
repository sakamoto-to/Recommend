import { useState } from 'react';

// アコーディオン形式の解説パネル：「式の解説」ボタンをクリックして開閉する
export default function ExplanationPanel({ children }) {
  // パネルの開閉状態
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#1e293b' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 text-left transition-colors hover:bg-slate-700"
      >
        <span className="text-cyan-400 font-bold text-base">式の解説</span>
        <span className="text-cyan-400 text-lg">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-6 pb-6 space-y-6 border-t border-slate-700">
          {children}
        </div>
      )}
    </div>
  );
}

// 数式を等幅フォントのダークボックスで表示するブロック
export function FormulaBlock({ children }) {
  return (
    <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm text-gray-200 leading-relaxed overflow-x-auto">
      {children}
    </div>
  );
}

// 番号付きステップ：シアン丸バッジ＋タイトル＋説明文のセット
export function Step({ number, title, children }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-cyan-700 flex items-center justify-center text-white text-xs font-bold mt-0.5">
        {number}
      </div>
      <div className="space-y-2 flex-1">
        <p className="text-white font-semibold text-sm">{title}</p>
        <div className="text-gray-400 text-sm leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

// セクション区切りタイトル：上ボーダー付きのシアンラベル
export function SectionTitle({ children }) {
  return (
    <p className="text-cyan-300 font-semibold text-sm pt-2 border-t border-slate-700">{children}</p>
  );
}
