from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List
import uuid

from app.core.database import get_db
from app.api.routers.auth import get_current_user
from app.schemas.schemas import NodeCreate, NodeUpdate, DataResponse, User
from app.services.graph_service import GraphService

router = APIRouter()

@router.get("/{graph_id}/nodes", response_model=DataResponse)
async def get_nodes(
    graph_id: uuid.UUID,
    type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取图谱中的所有节点"""
    # TODO: 实现节点获取逻辑
    return DataResponse(success=True, message="节点获取功能待实现", data=[])

@router.post("/{graph_id}/nodes", response_model=DataResponse)
async def create_node(
    graph_id: uuid.UUID,
    node_data: NodeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """创建节点"""
    try:
        graph_service = GraphService(db)
        
        # 验证图谱是否存在且属于当前用户
        graph = graph_service.get_graph_by_id(str(graph_id), current_user)
        if not graph:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="图谱不存在"
            )
        
        # 获取当前图谱数据
        current_graph_data = graph_service.get_graph_with_data(str(graph_id), current_user)
        
        # 生成新节点ID（如果没有提供）
        new_node_id = node_data.id if node_data.id else str(uuid.uuid4())
        
        # 检查节点ID是否已存在
        existing_node = next((n for n in current_graph_data.get("nodes", []) if n["id"] == new_node_id), None)
        if existing_node:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"节点ID '{new_node_id}' 已存在"
            )
        
        # 创建新节点数据
        new_node = {
            "id": new_node_id,
            "label": node_data.label,
            "type": node_data.type,
            "x": node_data.x,
            "y": node_data.y,
            "size": node_data.size,
            "color": node_data.color,
            "properties": node_data.properties or {}
        }
        
        # 添加到现有数据中
        updated_nodes = current_graph_data.get("nodes", []) + [new_node]
        updated_edges = current_graph_data.get("edges", [])
        
        # 更新图谱数据
        from app.schemas.schemas import GraphUpdate
        update_data = GraphUpdate(
            title=graph.title,
            description=graph.description,
            nodes=updated_nodes,
            edges=updated_edges
        )
        
        graph_service.update_graph(str(graph_id), update_data, current_user)
        
        return DataResponse(
            success=True,
            message="节点创建成功",
            data=new_node
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"创建节点失败: {str(e)}"
        )

@router.put("/{graph_id}/nodes/{node_id}", response_model=DataResponse)
async def update_node(
    graph_id: uuid.UUID,
    node_id: str,
    node_data: NodeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """更新节点"""
    # TODO: 实现节点更新逻辑
    return DataResponse(success=True, message="节点更新功能待实现", data=None)

@router.delete("/{graph_id}/nodes/{node_id}", response_model=DataResponse)
async def delete_node(
    graph_id: uuid.UUID,
    node_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """删除节点"""
    # TODO: 实现节点删除逻辑
    return DataResponse(success=True, message="节点删除功能待实现", data=None)