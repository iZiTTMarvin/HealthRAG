from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware

from backend.routes.auth_routes import router as auth_router
from backend.routes.model_routes import router as model_router
from backend.routes.neo4j_routes import router as neo4j_router
from backend.routes.chat_routes import router as chat_router

"""
后端主入口模块
使用 FastAPI 框架构建，负责中间件配置、路由注册以及应用实例的创建。
"""

def create_app() -> FastAPI:
    """
    应用工厂函数：初始化并配置 FastAPI 实例。
    """
    # 创建 FastAPI 应用，设置标题和版本号
    app = FastAPI(title="RAG 医疗问答系统 API", version="0.1.0")

    # 配置跨域资源共享 (CORS)
    # 在开发环境下允许所有来源访问，便于前端调试
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # 健康检查接口：用于验证服务是否在线
    @app.get("/health", summary="服务状态检查")
    def health_check():
        return {"status": "ok"}

    # 根路径接口：简单的欢迎信息
    @app.get("/", summary="根路径信息")
    def root():
        return {"status": "ok", "message": "欢迎使用 RAG 医疗问答系统 API"}

    # favicon.ico 接口：处理浏览器自动发起的请求，避免日志中出现 404 错误
    @app.get("/favicon.ico", include_in_schema=False)
    def favicon():
        return Response(status_code=204)

    # 注册子模块路由（路由前缀已在各自模块中定义）
    app.include_router(auth_router)
    app.include_router(model_router)
    app.include_router(neo4j_router)
    app.include_router(chat_router)

    return app


# 创建应用实例，uvicorn 将加载此对象运行
app = create_app()
