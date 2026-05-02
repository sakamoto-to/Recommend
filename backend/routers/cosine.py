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
    na, nb = np.linalg.norm(a), np.linalg.norm(b)
    if na == 0 or nb == 0:
        return {"similarity": 0.0}
    return {"similarity": float(np.dot(a, b) / (na * nb))}
