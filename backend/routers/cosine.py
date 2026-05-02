from fastapi import APIRouter
from pydantic import BaseModel
import numpy as np

router = APIRouter()


class CosineRequest(BaseModel):
    vec_a: list[float]
    vec_b: list[float]


@router.post("/cosine")
def cosine_similarity(req: CosineRequest):
    a = np.array(req.vec_a)
    b = np.array(req.vec_b)

    # 各ベクトルの大きさ（L2ノルム）を計算する
    # ノルムはベクトルの「長さ」を表し、sqrt(x² + y² + ...) で求まる
    na, nb = np.linalg.norm(a), np.linalg.norm(b)

    # どちらかが零ベクトルの場合は角度が定義できないので 0 を返す
    if na == 0 or nb == 0:
        return {"similarity": 0.0}

    # コサイン類似度 = 内積 / (|A| × |B|)
    # 内積が大きい（同じ方向）ほど 1 に近づき、直交で 0、逆方向で -1 になる
    return {"similarity": float(np.dot(a, b) / (na * nb))}
