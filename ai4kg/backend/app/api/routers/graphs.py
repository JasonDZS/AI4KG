from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.api.routers.auth import get_current_user
from app.services.graph_service import GraphService
from app.schemas.schemas import (
    GraphCreate, GraphUpdate, GraphWithData, GraphList, 
    DataResponse, PaginationParams, User
)

router = APIRouter()

@router.get("", response_model=DataResponse)
async def get_graphs(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取图谱列表"""
    try:
        graph_service = GraphService(db)
        params = PaginationParams(page=page, size=size, search=search)
        graphs, total = graph_service.get_user_graphs(current_user, params)
        
        return DataResponse(
            success=True,
            message="获取图谱列表成功",
            data=GraphList(graphs=graphs, total=total)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取图谱列表失败: {str(e)}"
        )

@router.get("/{graph_id}", response_model=DataResponse)
async def get_graph(
    graph_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取单个图谱（包含节点和边数据）"""
    try:
        graph_service = GraphService(db)
        graph_data = graph_service.get_graph_with_data(graph_id, current_user)
        
        return DataResponse(
            success=True,
            message="获取图谱成功",
            data=graph_data
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取图谱失败: {str(e)}"
        )

@router.post("", response_model=DataResponse)
async def create_graph(
    graph_data: GraphCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """创建图谱"""
    try:
        graph_service = GraphService(db)
        graph = graph_service.create_graph(graph_data, current_user)
        
        return DataResponse(
            success=True,
            message="创建图谱成功",
            data=graph
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"创建图谱失败: {str(e)}"
        )

@router.put("/{graph_id}", response_model=DataResponse)
async def update_graph(
    graph_id: str,
    graph_data: GraphUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """更新图谱"""
    try:
        graph_service = GraphService(db)
        graph = graph_service.update_graph(graph_id, graph_data, current_user)
        
        return DataResponse(
            success=True,
            message="更新图谱成功",
            data=graph
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"更新图谱失败: {str(e)}"
        )

@router.delete("/{graph_id}", response_model=DataResponse)
async def delete_graph(
    graph_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """删除图谱"""
    try:
        graph_service = GraphService(db)
        success = graph_service.delete_graph(graph_id, current_user)
        
        if success:
            return DataResponse(
                success=True,
                message="删除图谱成功"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="删除图谱失败"
            )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"删除图谱失败: {str(e)}"
        )