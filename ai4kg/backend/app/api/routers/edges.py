from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.core.database import get_db
from app.api.routers.auth import get_current_user
from app.schemas.schemas import EdgeCreate, EdgeUpdate, DataResponse, User
from app.services.graph_service import GraphService

router = APIRouter()

@router.get("/{graph_id}/edges", response_model=DataResponse)
async def get_edges(
    graph_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取图谱中的所有边"""
    try:
        graph_service = GraphService(db)
        
        # 验证图谱是否存在且属于当前用户
        graph = graph_service.get_graph_by_id(str(graph_id), current_user)
        if not graph:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="图谱不存在"
            )
        
        # 获取图谱数据（包含边）
        graph_data = graph_service.get_graph_with_data(str(graph_id), current_user)
        edges = graph_data.get("edges", [])
        
        return DataResponse(
            success=True,
            message=f"成功获取 {len(edges)} 条边",
            data=edges
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取边失败: {str(e)}"
        )

@router.post("/{graph_id}/edges", response_model=DataResponse)
async def create_edge(
    graph_id: uuid.UUID,
    edge_data: EdgeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """创建边"""
    try:
        graph_service = GraphService(db)
        
        # 获取源节点和目标节点ID
        source_id = edge_data.effective_source
        target_id = edge_data.effective_target
        
        if not source_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="必须提供源节点ID (source 或 source_node_id)"
            )
        
        if not target_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="必须提供目标节点ID (target 或 target_node_id)"
            )
        
        # 创建边数据
        edge_dict = {
            "source": source_id,
            "target": target_id,
            "label": edge_data.label or "",
            "type": edge_data.type,
            "weight": edge_data.weight,
            "color": edge_data.color,
            "properties": edge_data.properties or {}
        }
        
        # 使用新的服务方法直接添加边
        new_edge = graph_service.add_edge(str(graph_id), edge_dict, current_user)
        
        return DataResponse(
            success=True,
            message="边创建成功",
            data=new_edge
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"创建边失败: {str(e)}"
        )

@router.put("/{graph_id}/edges/{edge_id}", response_model=DataResponse)
async def update_edge(
    graph_id: uuid.UUID,
    edge_id: str,
    edge_data: EdgeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """更新边"""
    try:
        graph_service = GraphService(db)
        
        # 构建更新数据
        update_dict = {}
        
        effective_source = edge_data.effective_source
        effective_target = edge_data.effective_target
        
        if effective_source is not None:
            update_dict["source"] = effective_source
        if effective_target is not None:
            update_dict["target"] = effective_target
        if edge_data.label is not None:
            update_dict["label"] = edge_data.label
        if edge_data.type is not None:
            update_dict["type"] = edge_data.type
        if edge_data.weight is not None:
            update_dict["weight"] = edge_data.weight
        if edge_data.color is not None:
            update_dict["color"] = edge_data.color
        if edge_data.properties is not None:
            update_dict["properties"] = edge_data.properties
        
        # 使用新的服务方法直接更新边
        updated_edge = graph_service.update_edge(str(graph_id), edge_id, update_dict, current_user)
        
        return DataResponse(
            success=True,
            message="边更新成功",
            data=updated_edge
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"更新边失败: {str(e)}"
        )

@router.delete("/{graph_id}/edges/{edge_id}", response_model=DataResponse)
async def delete_edge(
    graph_id: uuid.UUID,
    edge_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """删除边"""
    try:
        graph_service = GraphService(db)
        
        # 使用新的服务方法直接删除边
        result = graph_service.delete_edge(str(graph_id), edge_id, current_user)
        
        return DataResponse(
            success=True,
            message=result["message"],
            data=result
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"删除边失败: {str(e)}"
        )