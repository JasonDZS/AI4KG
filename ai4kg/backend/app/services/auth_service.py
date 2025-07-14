from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import Optional
import re
import html

from app.models.models import User
from app.schemas.schemas import UserCreate, UserLogin
from app.utils.auth import get_password_hash, verify_password, create_access_token

class AuthService:
    def __init__(self, db: Session):
        self.db = db
    
    def _validate_password_strength(self, password: str) -> None:
        """验证密码强度"""
        if len(password) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="密码长度至少6位"
            )
    
    def _sanitize_input(self, text: str) -> str:
        """清理用户输入，防止XSS"""
        # 移除HTML标签
        text = re.sub(r'<[^>]+>', '', text)
        # HTML转义
        text = html.escape(text)
        return text
    
    def register_user(self, user_data: UserCreate) -> User:
        """注册新用户"""
        # 验证密码强度
        self._validate_password_strength(user_data.password)
        
        # 清理用户输入
        sanitized_username = self._sanitize_input(user_data.username)
        sanitized_email = self._sanitize_input(user_data.email)
        
        # 检查用户名是否已存在
        if self.db.query(User).filter(User.username == sanitized_username).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered"
            )
        
        # 检查邮箱是否已存在
        if self.db.query(User).filter(User.email == sanitized_email).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # 创建新用户
        hashed_password = get_password_hash(user_data.password)
        db_user = User(
            username=sanitized_username,
            email=sanitized_email,
            password_hash=hashed_password
        )
        
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        
        return db_user
    
    def authenticate_user(self, login_data: UserLogin) -> Optional[User]:
        """验证用户登录"""
        user = self.db.query(User).filter(User.username == login_data.username).first()
        
        if not user or not verify_password(login_data.password, user.password_hash):
            return None
        
        return user
    
    def create_user_token(self, user: User) -> str:
        """为用户创建访问令牌"""
        access_token = create_access_token(
            data={"sub": str(user.id), "username": user.username}
        )
        return access_token
    
    def get_user_by_id(self, user_id: str) -> Optional[User]:
        """根据ID获取用户"""
        return self.db.query(User).filter(User.id == user_id).first()
    
    def get_user_by_username(self, username: str) -> Optional[User]:
        """根据用户名获取用户"""
        return self.db.query(User).filter(User.username == username).first()