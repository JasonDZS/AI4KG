from pydantic_settings import BaseSettings
from pydantic import ConfigDict, field_validator
from typing import List, Union
from functools import lru_cache

class Settings(BaseSettings):
    model_config = ConfigDict(
        env_file=".env",
        extra="ignore"  # 忽略额外的环境变量
    )
    
    # 数据库配置
    NEO4J_URI: str = "bolt://localhost:7687"
    NEO4J_USER: str = "neo4j"
    NEO4J_PASSWORD: str = "password"
    
    # SQLite 数据库配置
    SQLITE_DB_PATH: str = "data/ai4kg.db"
    
    # JWT配置
    JWT_SECRET_KEY: str = "your-secret-key-change-this-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_HOURS: int = 24
    
    # 应用配置
    DEBUG: bool = True
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    CORS_ORIGINS: Union[List[str], str] = "http://localhost:3000,http://localhost:5173"
    
    # Redis配置
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # 文件上传配置
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE: int = 100  # MB
    
    @field_validator('CORS_ORIGINS', mode='before')
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(',')]
        return v
    
    @property
    def database_url(self) -> str:
        return f"sqlite:///{self.SQLITE_DB_PATH}"

@lru_cache()
def get_settings() -> Settings:
    return Settings()