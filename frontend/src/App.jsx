import { useState } from 'react';
import CosineSimilarityTab from './components/CosineSimilarityTab';
import CollaborativeFilteringTab from './components/CollaborativeFilteringTab';
import MatrixFactorizationTab from './components/MatrixFactorizationTab';

// 表示タブの定義：id・ラベル・コンポーネントを一元管理
const TABS = [
  { id: 0, label: 'コサイン類似度',    Component: CosineSimilarityTab },
  { id: 1, label: '協調フィルタリング', Component: CollaborativeFilteringTab },
  { id: 2, label: '行列因子分解',       Component: MatrixFactorizationTab },
];

export default function App() {
  // 現在選択中のタブ番号（0〜2）
  const [tab, setTab] = useState(0);

  // タブ番号からレンダリングするコンポーネントを動的に取得
  const { Component } = TABS[tab];

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#0f172a' }}>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            📊 レコメンド数理 学習アプリ
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            パラメータを操作して、推薦アルゴリズムの数理的な仕組みをインタラクティブに体験しよう
          </p>
        </header>

        {/* タブナビゲーション */}
        <div className="flex gap-2 mb-8 p-1.5 rounded-xl" style={{ backgroundColor: '#1e293b' }}>
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200"
              style={{
                backgroundColor: tab === id ? '#0891b2' : 'transparent',
                color: tab === id ? '#ffffff' : '#94a3b8',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* key={tab} でタブ切り替え時にコンポーネントをリマウントし、フェードアニメーションを適用する */}
        <div key={tab} style={{ animation: 'fadeIn 0.25s ease' }}>
          <Component />
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        input[type=range] { cursor: pointer; }
      `}</style>
    </div>
  );
}
