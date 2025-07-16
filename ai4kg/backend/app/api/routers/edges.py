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
        
        # 验证图谱是否存在且属于当前用户
        graph = graph_service.get_graph_by_id(str(graph_id), current_user)
        if not graph:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="图谱不存在"
            )
        
        # 获取当前图谱数据
        current_graph_data = graph_service.get_graph_with_data(str(graph_id), current_user)
        
        # 验证源节点和目标节点是否存在
        nodes = current_graph_data.get("nodes", [])
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
        
        source_exists = any(n["id"] == source_id for n in nodes)
        target_exists = any(n["id"] == target_id for n in nodes)
        
        if not source_exists:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"源节点 '{source_id}' 不存在"
            )
        
        if not target_exists:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"目标节点 '{target_id}' 不存在"
            )
        
        # 生成新边ID
        new_edge_id = str(uuid.uuid4())
        
        # 检查是否已存在相同的边
        existing_edge = next((e for e in current_graph_data.get("edges", []) 
                            if e["source"] == source_id and e["target"] == target_id), None)
        
        # 创建新边数据
        new_edge = {
            "id": new_edge_id,
            "source": source_id,
            "target": target_id,
            "label": edge_data.label or "",
            "type": edge_data.type,
            "weight": edge_data.weight,
            "color": edge_data.color,
            "properties": edge_data.properties or {}
        }
        
        # 添加到现有数据中
        updated_nodes = current_graph_data.get("nodes", [])
        updated_edges = current_graph_data.get("edges", []) + [new_edge]
        
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
        
        # 验证图谱是否存在且属于当前用户
        graph = graph_service.get_graph_by_id(str(graph_id), current_user)
        if not graph:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="图谱不存在"
            )
        
        # 获取当前图谱数据
        current_graph_data = graph_service.get_graph_with_data(str(graph_id), current_user)
        
        # 查找要更新的边
        edges = current_graph_data.get("edges", [])
        edge_to_update = None
        edge_index = -1
        
        for i, edge in enumerate(edges):
            if edge["id"] == edge_id:
                edge_to_update = edge
                edge_index = i
                break
        
        if not edge_to_update:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"边 '{edge_id}' 不存在"
            )
        
        # 如果更新了源节点或目标节点，需要验证节点是否存在
        nodes = current_graph_data.get("nodes", [])
        
        effective_source = edge_data.effective_source
        effective_target = edge_data.effective_target
        
        if effective_source is not None:
            source_exists = any(n["id"] == effective_source for n in nodes)
            if not source_exists:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"源节点 '{effective_source}' 不存在"
                )
        
        if effective_target is not None:
            target_exists = any(n["id"] == effective_target for n in nodes)
            if not target_exists:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"目标节点 '{effective_target}' 不存在"
                )
        
        # 更新边数据
        updated_edge = edge_to_update.copy()
        
        if effective_source is not None:
            updated_edge["source"] = effective_source
        if effective_target is not None:
            updated_edge["target"] = effective_target
        if edge_data.label is not None:
            updated_edge["label"] = edge_data.label
        if edge_data.type is not None:
            updated_edge["type"] = edge_data.type
        if edge_data.weight is not None:
            updated_edge["weight"] = edge_data.weight
        if edge_data.color is not None:
            updated_edge["color"] = edge_data.color
        if edge_data.properties is not None:
            updated_edge["properties"] = edge_data.properties
        
        # 更新边列表
        updated_edges = edges.copy()
        updated_edges[edge_index] = updated_edge
        
        # 更新图谱数据
        from app.schemas.schemas import GraphUpdate
        update_data = GraphUpdate(
            title=graph.title,
            description=graph.description,
            nodes=current_graph_data.get("nodes", []),
            edges=updated_edges
        )
        
        graph_service.update_graph(str(graph_id), update_data, current_user)
        
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
        
        # 验证图谱是否存在且属于当前用户
        graph = graph_service.get_graph_by_id(str(graph_id), current_user)
        if not graph:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="图谱不存在"
            )
        
        # 获取当前图谱数据
        current_graph_data = graph_service.get_graph_with_data(str(graph_id), current_user)
        
        # 查找要删除的边
        edges = current_graph_data.get("edges", [])
        edge_to_delete = None
        
        for edge in edges:
            if edge["id"] == edge_id:
                edge_to_delete = edge
                break
        
        if not edge_to_delete:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"边 '{edge_id}' 不存在"
            )
        
        # 从边列表中移除指定的边
        updated_edges = [edge for edge in edges if edge["id"] != edge_id]
        
        # 更新图谱数据
        from app.schemas.schemas import GraphUpdate
        update_data = GraphUpdate(
            title=graph.title,
            description=graph.description,
            nodes=current_graph_data.get("nodes", []),
            edges=updated_edges
        )
        
        graph_service.update_graph(str(graph_id), update_data, current_user)
        
        return DataResponse(
            success=True,
            message="边删除成功",
            data={
                "deleted_edge_id": edge_id,
                "deleted_edge": edge_to_delete
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"删除边失败: {str(e)}"
        )