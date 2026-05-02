from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import numpy as np

router = APIRouter()


class CFRequest(BaseModel):
    ratings: list[list[Optional[float]]]
    target: int


def _cosine_sim(a: list[float], b: list[float]) -> float:
    # 2人のユーザーが共通して評価したアイテムのベクトル同士のコサイン類似度を返す
    # 共通評価がなければ類似度は 0 とする
    arr_a, arr_b = np.array(a), np.array(b)
    na, nb = np.linalg.norm(arr_a), np.linalg.norm(arr_b)
    if na == 0 or nb == 0:
        return 0.0
    return float(np.dot(arr_a, arr_b) / (na * nb))


@router.post("/cf")
def collaborative_filtering(req: CFRequest):
    ratings = req.ratings
    target = req.target
    n_items = len(ratings[0])

    # ── ステップ1: ターゲットユーザーと他の全ユーザーの類似度を計算 ──
    # 両者が評価済みのアイテムだけを取り出して比較する（未評価は除外）
    similarities = []
    for u, row in enumerate(ratings):
        if u == target:
            continue
        shared = [(ratings[target][i], row[i]) for i in range(n_items)
                  if ratings[target][i] is not None and row[i] is not None]
        sim = _cosine_sim([a for a, _ in shared], [b for _, b in shared]) if shared else 0.0
        similarities.append({"user": f"ユーザー{u+1}", "idx": u, "sim": sim})

    # 類似度の高い順に並び替える（グラフ表示と推薦計算の両方で使う）
    similarities.sort(key=lambda x: x["sim"], reverse=True)

    # ── ステップ2: ターゲットが未評価のアイテムに対して予測スコアを計算 ──
    recommendations = []
    for i in range(n_items):
        if ratings[target][i] is not None:
            continue  # すでに評価済みのアイテムはスキップ

        # 加重平均: 類似度が高いユーザーの評価を重く反映する
        # 予測スコア = Σ(類似度 × 評価値) / Σ(類似度)　→　ここが重要
        num, den = 0.0, 0.0
        top = None
        for s in similarities:
            idx, sim = s["idx"], s["sim"]
            if ratings[idx][i] is not None and sim > 0:
                num += sim * ratings[idx][i]
                den += sim
                if top is None:
                    top = {"user": f"ユーザー{idx+1}", "rating": ratings[idx][i]}

        if den == 0:
            continue  # 誰も評価していないアイテムは推薦できない

        reason = (
            f"{top['user']}があなたと最も類似しており、商品{i+1}に{top['rating']}点をつけています"
            if top else "推薦データが不足しています"
        )
        recommendations.append({"item": f"商品{i+1}", "score": num / den, "reason": reason})

    # 予測スコアが高い順に並び替えて返す
    recommendations.sort(key=lambda x: x["score"], reverse=True)
    return {"similarities": similarities, "recommendations": recommendations}
