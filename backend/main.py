from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import cosine, collaborative, matrix_factorization

app = FastAPI(title="AI数学 学習アプリ API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cosine.router, prefix="/api")
app.include_router(collaborative.router, prefix="/api")
app.include_router(matrix_factorization.router, prefix="/api")
