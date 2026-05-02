# AI数学 学習アプリ

推薦アルゴリズムの数理的な仕組みをインタラクティブに学べるアプリ。

## 構成

```
Recommend/
├── backend/          # FastAPI（計算ロジック）
│   ├── main.py
│   ├── requirements.txt
│   └── routers/
│       ├── cosine.py
│       ├── collaborative.py
│       └── matrix_factorization.py
└── frontend/         # React + Vite（UI）
    └── src/
        ├── api/      # バックエンド呼び出し
        ├── components/
        └── data/
```

## 起動方法

ターミナルを2つ開いて、それぞれ実行する。

### バックエンド（ポート 8000）

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### フロントエンド（ポート 5173）

```bash
cd frontend
npm install
npm run dev
```

ブラウザで http://localhost:5173 を開く。

## API ドキュメント

バックエンド起動後、http://localhost:8000/docs で Swagger UI が確認できる。
