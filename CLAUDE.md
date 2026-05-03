# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 起動コマンド

```bash
# バックエンド（ポート 8000）
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# フロントエンド（ポート 5173）
cd frontend
npm install
npm run dev
```

API ドキュメント（Swagger UI）: http://localhost:8000/docs

## アーキテクチャ

```
Recommend/
├── backend/                  # FastAPI — 計算ロジックのみ
│   ├── main.py               # アプリ起動・CORS・ルーター登録
│   └── routers/
│       ├── cosine.py         # POST /api/cosine
│       ├── collaborative.py  # POST /api/cf
│       └── matrix_factorization.py  # POST /api/mf
└── frontend/                 # React + Vite + Tailwind CSS
    └── src/
        ├── App.jsx           # タブ切り替えのみ
        ├── api/index.js      # バックエンド呼び出し（fetch ラッパー）
        ├── components/       # タブコンポーネント + 共通UIパーツ
        └── data/sample.js    # CF・MF の初期評価行列
```

**フロント↔バック通信**: Vite の `/api` プロキシ → `http://localhost:8000` に転送。フロントは計算を一切行わず表示のみ。

## 実装方針（フロント・バック共通）

### バックエンド

- 各ルーターは 1 ファイル = 1 トピック（コサイン / CF / MF）。新しいアルゴリズムを追加するときは `routers/` に新ファイルを作り `main.py` で `include_router` する。
- リクエスト/レスポンスは Pydantic モデルで型定義する。`lambda` のような Python 予約語はフィールド名に使えないため `Field(alias="lambda")` で回避する。
- 計算には NumPy を使う。純粋な Python ループで書けるロジックも NumPy で統一する。
- コメントは **なぜその計算をするか** を日本語で書く（式の意味・エッジケースの理由）。

### フロントエンド

- **API 呼び出しは `src/api/index.js` に集約**する。コンポーネントから `fetch` を直接呼ばない。
- スライダー等のリアルタイム入力に伴う API 呼び出しは `useEffect` + `AbortController`（またはタイマー debounce）でキャンセル可能にする。
- **解説パネルは `ExplanationPanel` コンポーネントを使う**。`FormulaBlock`・`Step`・`SectionTitle` を組み合わせて構造化する。新しいタブを追加するときも同じパーツで解説を書く。
- スタイルは Tailwind ユーティリティクラスを使う。固定カラー（背景 `#0f172a`、カード `#1e293b`、アクセント `#0891b2`）は `style={}` で直書きする。

## 解説パネルの書き方

各タブの末尾に `<ExplanationPanel>` を置き、以下の構成で統一する：

1. **概念の説明**（`<SectionTitle>` + `<p>`）― その手法が「何を」「なぜ」やるか
2. **式の分解**（`<FormulaBlock>`）― 式の各項を色付きで解説
3. **ステップ解説**（`<Step number="n">`）― 計算の流れを順番に
4. **直感的な補足**（`<SectionTitle>` + `<p>`）― 数式を使わない言葉の説明

## このアプリの目的

AI 数学の学習用アプリ。今後、演習問題機能・微積分/偏微分の解説章を追加予定（スコープは別途指示）。
機能追加時は「インタラクティブな操作」と「式の解説」を必ずセットで実装する。

## アプリの拡張方針
現状はレコメンドの概念のみだが、今後はAIに関わるマセマティクスを拡張していく方針。
（画像分析、機械学習etc..）

