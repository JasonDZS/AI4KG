from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
from dotenv import load_dotenv

from app.api.routers import auth, graphs, nodes, edges, analysis, files, search
from app.core.config import get_settings
from app.core.database import init_databases, close_databases

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时初始化数据库连接
    await init_databases()
    yield
    # 关闭时清理数据库连接
    await close_databases()

app = FastAPI(
    title="AI4KG API",
    description="AI4KG 知识图谱可视化平台的后端API服务",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

settings = get_settings()

# CORS中间件配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"],
)

# 包含路由
app.include_router(auth.router, prefix="/api/auth", tags=["认证"])
app.include_router(graphs.router, prefix="/api/graphs", tags=["图谱管理"])
app.include_router(nodes.router, prefix="/api/graphs", tags=["节点管理"])
app.include_router(edges.router, prefix="/api/graphs", tags=["边管理"])
app.include_router(analysis.router, prefix="/api/graphs", tags=["图分析"])
app.include_router(files.router, prefix="/api/graphs", tags=["文件处理"])
app.include_router(search.router, prefix="/api", tags=["搜索查询"])

@app.get("/")
async def root():
    return {"message": "AI4KG API Service", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ai4kg-backend"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG
    )