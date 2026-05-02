from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional
import numpy as np

router = APIRouter()


class MFRequest(BaseModel):
    ratings: list[list[Optional[float]]]
    k: int
    alpha: float
    lam: float = Field(alias="lambda")
    steps: int

    model_config = {"populate_by_name": True}


@router.post("/mf")
def matrix_factorization(req: MFRequest):
    R = req.ratings
    k, alpha, lam, steps = req.k, req.alpha, req.lam, req.steps
    n_u, n_i = len(R), len(R[0])

    rng = np.random.default_rng(42)
    U = (rng.random((n_u, k)) - 0.5) * 0.2
    V = (rng.random((n_i, k)) - 0.5) * 0.2

    losses = []
    for step in range(steps):
        for ui in range(n_u):
            for ii in range(n_i):
                if R[ui][ii] is None:
                    continue
                e = R[ui][ii] - float(U[ui] @ V[ii])
                U[ui] += alpha * (e * V[ii] - lam * U[ui])
                V[ii] += alpha * (e * U[ui] - lam * V[ii])

        mse = np.mean([
            (R[ui][ii] - float(U[ui] @ V[ii])) ** 2
            for ui in range(n_u) for ii in range(n_i)
            if R[ui][ii] is not None
        ])
        losses.append({"step": step + 1, "loss": float(mse)})

    return {"losses": losses, "U": U.tolist(), "V": V.tolist()}
