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
        nodes = current_graph_data.get("nodes", [])
        
        # 根据类型过滤
        if type:
            nodes = [n for n in nodes if n.get("type", "").lower() == type.lower()]
        
        # 根据搜索关键词过滤
        if search:
            search_lower = search.lower()
            nodes = [
                n for n in nodes 
                if search_lower in n.get("label", "").lower() 
                or search_lower in n.get("type", "").lower()
                or any(search_lower in str(v).lower() for v in n.get("properties", {}).values())
            ]
        
        return DataResponse(
            success=True,
            message=f"获取到 {len(nodes)} 个节点",
            data=nodes
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取节点失败: {str(e)}"
        )

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
        
        # 查找要更新的节点
        node_index = -1
        for i, node in enumerate(current_graph_data.get("nodes", [])):
            if node["id"] == node_id:
                node_index = i
                break
        
        if node_index == -1:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"节点 '{node_id}' 不存在"
            )
        
        # 获取现有节点数据
        existing_node = current_graph_data["nodes"][node_index].copy()
        
        # 更新节点数据（只更新提供的字段）
        if node_data.label is not None:
            existing_node["label"] = node_data.label
        if node_data.type is not None:
            existing_node["type"] = node_data.type
        if node_data.x is not None:
            existing_node["x"] = node_data.x
        if node_data.y is not None:
            existing_node["y"] = node_data.y
        if node_data.size is not None:
            existing_node["size"] = node_data.size
        if node_data.color is not None:
            existing_node["color"] = node_data.color
        if node_data.properties is not None:
            existing_node["properties"] = node_data.properties
        
        # 更新节点列表
        updated_nodes = current_graph_data.get("nodes", []).copy()
        updated_nodes[node_index] = existing_node
        
        # 保持边不变
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
            message="节点更新成功",
            data=existing_node
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"更新节点失败: {str(e)}"
        )

@router.get("/{graph_id}/nodes/{node_id}/delete-impact", response_model=DataResponse)
async def get_node_delete_impact(
    graph_id: uuid.UUID,
    node_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取删除节点的影响分析"""
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
        
        # 检查节点是否存在
        target_node = next((n for n in current_graph_data.get("nodes", []) if n["id"] == node_id), None)
        if not target_node:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"节点 '{node_id}' 不存在"
            )
        
        # 查找受影响的边
        affected_edges = [
            e for e in current_graph_data.get("edges", []) 
            if e.get("source") == node_id or e.get("target") == node_id
        ]
        
        # 查找受影响的相邻节点（通过边连接的节点）
        connected_node_ids = set()
        for edge in affected_edges:
            if edge.get("source") == node_id:
                connected_node_ids.add(edge.get("target"))
            elif edge.get("target") == node_id:
                connected_node_ids.add(edge.get("source"))
        
        connected_nodes = [
            n for n in current_graph_data.get("nodes", []) 
            if n["id"] in connected_node_ids
        ]
        
        impact_data = {
            "target_node": target_node,
            "affected_edges": affected_edges,
            "connected_nodes": connected_nodes,
            "affected_edges_count": len(affected_edges),
            "connected_nodes_count": len(connected_nodes)
        }
        
        return DataResponse(
            success=True,
            message=f"删除节点 '{target_node.get('label', node_id)}' 将影响 {len(affected_edges)} 条边和 {len(connected_nodes)} 个相邻节点",
            data=impact_data
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"分析删除影响失败: {str(e)}"
        )

@router.delete("/{graph_id}/nodes/{node_id}", response_model=DataResponse)
async def delete_node(
    graph_id: uuid.UUID,
    node_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """删除节点"""
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
        
        # 检查节点是否存在
        existing_node = next((n for n in current_graph_data.get("nodes", []) if n["id"] == node_id), None)
        if not existing_node:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"节点 '{node_id}' 不存在"
            )
        
        # 删除节点（过滤掉目标节点）
        updated_nodes = [n for n in current_graph_data.get("nodes", []) if n["id"] != node_id]
        
        # 删除与该节点相关的所有边（source或target为该节点的边）
        updated_edges = [
            e for e in current_graph_data.get("edges", []) 
            if e.get("source") != node_id and e.get("target") != node_id
        ]
        
        # 计算删除的边数量（用于返回信息）
        original_edges_count = len(current_graph_data.get("edges", []))
        deleted_edges_count = original_edges_count - len(updated_edges)
        
        # 更新图谱数据
        from app.schemas.schemas import GraphUpdate
        update_data = GraphUpdate(
            title=graph.title,
            description=graph.description,
            nodes=updated_nodes,
            edges=updated_edges
        )
        
        graph_service.update_graph(str(graph_id), update_data, current_user)
        
        # 构建返回消息
        message = f"节点删除成功"
        if deleted_edges_count > 0:
            message += f"，同时删除了 {deleted_edges_count} 条相关边"
        
        return DataResponse(
            success=True,
            message=message,
            data={
                "deleted_node_id": node_id,
                "deleted_edges_count": deleted_edges_count,
                "remaining_nodes_count": len(updated_nodes),
                "remaining_edges_count": len(updated_edges)
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"删除节点失败: {str(e)}"
        )