from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.services.auth_service import AuthService
from app.schemas.schemas import UserCreate, UserLogin, User, UserWithToken, DataResponse
from app.utils.auth import verify_token

router = APIRouter()
security = HTTPBearer(auto_error=False)

@router.post("/register")
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """用户注册"""
    try:
        auth_service = AuthService(db)
        user = auth_service.register_user(user_data)
        token = auth_service.create_user_token(user)
        
        return DataResponse(
            success=True,
            message="用户注册成功",
            data=UserWithToken(user=User.model_validate(user), token=token)
        )
    except HTTPException as e:
        # 重复注册时直接抛出HTTPException，保持正确的状态码
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"注册失败: {str(e)}"
        )

@router.post("/login", response_model=DataResponse)
async def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """用户登录"""
    try:
        auth_service = AuthService(db)
        user = auth_service.authenticate_user(login_data)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="用户名或密码错误"
            )
        
        token = auth_service.create_user_token(user)
        
        return DataResponse(
            success=True,
            message="登录成功",
            data=UserWithToken(user=User.model_validate(user), token=token)
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"登录失败: {str(e)}"
        )

@router.get("/verify", response_model=DataResponse)
async def verify_token_endpoint(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
):
    """验证令牌"""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        payload = verify_token(credentials.credentials)
        user_id = payload.get("sub")
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        auth_service = AuthService(db)
        user = auth_service.get_user_by_id(user_id)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        return DataResponse(
            success=True,
            message="令牌验证成功",
            data=User.model_validate(user)
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"令牌验证失败: {str(e)}"
        )

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """获取当前用户（依赖注入函数）"""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        payload = verify_token(credentials.credentials)
        user_id = payload.get("sub")
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        auth_service = AuthService(db)
        user = auth_service.get_user_by_id(user_id)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return User.model_validate(user)
    except HTTPException as e:
        raise e