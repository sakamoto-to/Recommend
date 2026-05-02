from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional
import numpy as np

router = APIRouter()


class MFRequest(BaseModel):
    ratings: list[list[Optional[float]]]
    k: int       # 潜在因子の次元数
    alpha: float  # 学習率
    lam: float = Field(alias="lambda")  # 正則化係数（過学習を防ぐ）
    steps: int   # 学習ステップ数

    model_config = {"populate_by_name": True}


@router.post("/mf")
def matrix_factorization(req: MFRequest):
    R = req.ratings
    k, alpha, lam, steps = req.k, req.alpha, req.lam, req.steps
    n_u, n_i = len(R), len(R[0])

    # ── 初期化: U と V を小さいランダム値で生成 ──
    # U: ユーザー行列 (n_u × k) — 各ユーザーの潜在的な好みを表す
    # V: アイテム行列 (n_i × k) — 各アイテムの潜在的な特徴を表す
    # 再現性のため乱数シードを固定する
    rng = np.random.default_rng(42)
    U = (rng.random((n_u, k)) - 0.5) * 0.2
    V = (rng.random((n_i, k)) - 0.5) * 0.2

    losses = []
    for step in range(steps):

        # ── 確率的勾配降下法（SGD）で U と V を更新 ──
        for ui in range(n_u):
            for ii in range(n_i):
                if R[ui][ii] is None:
                    continue  # 未評価のペアは学習に使わない

                # 予測値 = U[ui] と V[ii] の内積
                # → ユーザーの好みベクトルとアイテムの特徴ベクトルの類似度
                e = R[ui][ii] - float(U[ui] @ V[ii])  # 誤差 = 実際の評価 − 予測値

                # 勾配降下: 誤差を小さくする方向に U・V を更新
                # 正則化項 (lam × U/V) でベクトルが大きくなりすぎるのを抑制する
                U[ui] += alpha * (e * V[ii] - lam * U[ui])
                V[ii] += alpha * (e * U[ui] - lam * V[ii])

        # ── ステップごとの損失（MSE）を記録 ──
        # 評価済みのセルだけで二乗誤差の平均を計算する
        mse = np.mean([
            (R[ui][ii] - float(U[ui] @ V[ii])) ** 2
            for ui in range(n_u) for ii in range(n_i)
            if R[ui][ii] is not None
        ])
        losses.append({"step": step + 1, "loss": float(mse)})

    # U・V を返すことで、フロント側で R ≈ U × Vᵀ の再構成行列を描画できる
    return {"losses": losses, "U": U.tolist(), "V": V.tolist()}
