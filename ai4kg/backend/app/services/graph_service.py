from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List, Optional
import uuid
import logging

from app.models.models import Graph, User, Node, Edge
from app.schemas.schemas import GraphCreate, GraphUpdate, PaginationParams
from app.core.database import get_neo4j_session

logger = logging.getLogger(__name__)

class GraphService:
    def __init__(self, db: Session):
        self.db = db
    
    def create_graph(self, graph_data: GraphCreate, user: User) -> dict:
        """创建新图谱"""
        try:
            # 生成Neo4j图ID
            neo4j_graph_id = str(uuid.uuid4())
            
            # 在SQLite中创建图谱记录
            db_graph = Graph(
                title=graph_data.title,
                description=graph_data.description,
                user_id=user.id,
                neo4j_graph_id=neo4j_graph_id,
                node_count=len(graph_data.nodes) if graph_data.nodes else 0,
                edge_count=len(graph_data.edges) if graph_data.edges else 0
            )
            
            self.db.add(db_graph)
            self.db.commit()
            self.db.refresh(db_graph)
            
            # 保存节点和边数据
            if graph_data.nodes or graph_data.edges:
                # 先保存到SQLite
                self._save_graph_data_to_sqlite(db_graph.id, graph_data.nodes, graph_data.edges)
                
                # 然后尝试保存到Neo4j（如果可用）
                try:
                    self._save_graph_data_to_neo4j(neo4j_graph_id, graph_data.nodes, graph_data.edges)
                    logger.info("数据已同时保存到SQLite和Neo4j")
                except Exception as e:
                    logger.warning(f"Neo4j不可用，数据仅保存到SQLite: {e}")
            
            # 返回格式化的数据
            return {
                "id": db_graph.id,
                "title": db_graph.title,
                "description": db_graph.description,
                "user_id": db_graph.user_id,
                "metadata": {
                    "created_at": db_graph.created_at,
                    "updated_at": db_graph.updated_at,
                    "node_count": db_graph.node_count,
                    "edge_count": db_graph.edge_count
                }
            }
            
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"创建图谱失败: {str(e)}"
            )
    
    def get_user_graphs(self, user: User, params: PaginationParams) -> tuple[List[dict], int]:
        """获取用户的图谱列表"""
        query = self.db.query(Graph).filter(Graph.user_id == user.id)
        
        # 搜索过滤
        if params.search:
            query = query.filter(Graph.title.ilike(f"%{params.search}%"))
        
        # 获取总数
        total = query.count()
        
        # 分页
        offset = (params.page - 1) * params.size
        db_graphs = query.offset(offset).limit(params.size).all()
        
        # 转换为正确格式
        graphs = []
        for db_graph in db_graphs:
            graphs.append({
                "id": db_graph.id,
                "title": db_graph.title,
                "description": db_graph.description,
                "user_id": db_graph.user_id,
                "metadata": {
                    "created_at": db_graph.created_at,
                    "updated_at": db_graph.updated_at,
                    "node_count": db_graph.node_count,
                    "edge_count": db_graph.edge_count
                }
            })
        
        return graphs, total
    
    def get_graph_by_id(self, graph_id: str, user: User) -> Optional[Graph]:
        """根据ID获取图谱"""
        return self.db.query(Graph).filter(
            Graph.id == graph_id,
            Graph.user_id == user.id
        ).first()
    
    def get_graph_with_data(self, graph_id: str, user: User) -> dict:
        """获取包含节点和边数据的图谱"""
        graph = self.get_graph_by_id(graph_id, user)
        if not graph:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="图谱不存在"
            )
        
        # 优先从SQLite获取节点和边数据
        nodes, edges = self._get_graph_data_from_sqlite(graph.id)
        
        # 如果SQLite中没有数据，尝试从Neo4j获取
        if not nodes and not edges:
            try:
                nodes, edges = self._get_graph_data_from_neo4j(graph.neo4j_graph_id)
                logger.info("从Neo4j获取图数据")
            except Exception as e:
                logger.warning(f"从Neo4j获取数据失败: {e}")
                nodes, edges = [], []
        else:
            logger.info("从SQLite获取图数据")
        
        return {
            "id": graph.id,
            "title": graph.title,
            "description": graph.description,
            "nodes": nodes,
            "edges": edges,
            "metadata": {
                "created_at": graph.created_at,
                "updated_at": graph.updated_at,
                "node_count": graph.node_count,
                "edge_count": graph.edge_count
            }
        }
    
    def update_graph(self, graph_id: str, graph_data: GraphUpdate, user: User) -> dict:
        """更新图谱"""
        graph = self.get_graph_by_id(graph_id, user)
        if not graph:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="图谱不存在"
            )
        
        try:
            # 更新SQLite中的图谱信息
            if graph_data.title:
                graph.title = graph_data.title
            if graph_data.description is not None:
                graph.description = graph_data.description
            
            # 如果提供了节点和边数据，更新存储
            if graph_data.nodes is not None or graph_data.edges is not None:
                nodes = graph_data.nodes or []
                edges = graph_data.edges or []
                
                # 先更新SQLite中的数据
                self._save_graph_data_to_sqlite(graph.id, nodes, edges)
                
                # 然后尝试更新Neo4j中的数据
                try:
                    self._clear_graph_data_from_neo4j(graph.neo4j_graph_id)
                    self._save_graph_data_to_neo4j(graph.neo4j_graph_id, nodes, edges)
                    logger.info("数据已同时更新到SQLite和Neo4j")
                except Exception as e:
                    logger.warning(f"Neo4j不可用，数据仅更新到SQLite: {e}")
                
                # 更新计数
                graph.node_count = len(nodes)
                graph.edge_count = len(edges)
            
            self.db.commit()
            self.db.refresh(graph)
            
            # 返回格式化的数据
            return {
                "id": graph.id,
                "title": graph.title,
                "description": graph.description,
                "user_id": graph.user_id,
                "metadata": {
                    "created_at": graph.created_at,
                    "updated_at": graph.updated_at,
                    "node_count": graph.node_count,
                    "edge_count": graph.edge_count
                }
            }
            
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"更新图谱失败: {str(e)}"
            )
    
    def delete_graph(self, graph_id: str, user: User) -> bool:
        """删除图谱"""
        graph = self.get_graph_by_id(graph_id, user)
        if not graph:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="图谱不存在"
            )
        
        try:
            # 从SQLite删除节点和边数据
            self._clear_graph_data_from_sqlite(graph.id)
            
            # 从Neo4j删除图数据（如果可用）
            try:
                self._clear_graph_data_from_neo4j(graph.neo4j_graph_id)
                logger.info("已从SQLite和Neo4j删除图数据")
            except Exception as e:
                logger.warning(f"Neo4j不可用，仅从SQLite删除图数据: {e}")
            
            # 从SQLite删除图谱记录
            self.db.delete(graph)
            self.db.commit()
            
            return True
            
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"删除图谱失败: {str(e)}"
            )
    
    def _save_graph_data_to_neo4j(self, graph_id: str, nodes: List, edges: List):
        """将图数据保存到Neo4j"""
        try:
            with get_neo4j_session() as session:
                # 创建节点
                for node in nodes:
                    # 处理Pydantic模型或字典
                    if hasattr(node, 'model_dump'):
                        node_data = node.model_dump()
                    elif hasattr(node, 'dict'):
                        node_data = node.dict()
                    else:
                        node_data = node
                    
                    session.run(
                        """
                        CREATE (n:Node {
                            id: $id,
                            graph_id: $graph_id,
                            label: $label,
                            type: $type,
                            properties: $properties,
                            x: $x,
                            y: $y,
                            size: $size,
                            color: $color
                        })
                        """,
                        id=node_data.get('id') or str(uuid.uuid4()),
                        graph_id=graph_id,
                        label=node_data.get('label'),
                        type=node_data.get('type'),
                        properties=node_data.get('properties', {}),
                        x=node_data.get('x'),
                        y=node_data.get('y'),
                        size=node_data.get('size'),
                        color=node_data.get('color')
                    )
                
                # 创建边
                for edge in edges:
                    # 处理Pydantic模型或字典
                    if hasattr(edge, 'model_dump'):
                        edge_data = edge.model_dump()
                    elif hasattr(edge, 'dict'):
                        edge_data = edge.dict()
                    else:
                        edge_data = edge
                    
                    session.run(
                        """
                        MATCH (source:Node {id: $source, graph_id: $graph_id})
                        MATCH (target:Node {id: $target, graph_id: $graph_id})
                        CREATE (source)-[r:EDGE {
                            id: $id,
                            graph_id: $graph_id,
                            label: $label,
                            type: $type,
                            properties: $properties,
                            weight: $weight,
                            color: $color
                        }]->(target)
                        """,
                        id=edge_data.get('id') or str(uuid.uuid4()),
                        graph_id=graph_id,
                        source=edge_data.get('source_node_id'),
                        target=edge_data.get('target_node_id'),
                        label=edge_data.get('label'),
                        type=edge_data.get('type'),
                        properties=edge_data.get('properties', {}),
                        weight=edge_data.get('weight'),
                        color=edge_data.get('color')
                    )
        except Exception as e:
            logger.warning(f"保存数据到Neo4j失败: {e}")
            raise
    
    def _get_graph_data_from_neo4j(self, graph_id: str) -> tuple[List[dict], List[dict]]:
        """从Neo4j获取图数据"""
        try:
            with get_neo4j_session() as session:
                # 获取节点
                nodes_result = session.run(
                    "MATCH (n:Node {graph_id: $graph_id}) RETURN n",
                    graph_id=graph_id
                )
                nodes = [dict(record["n"]) for record in nodes_result]
                
                # 获取边
                edges_result = session.run(
                    """
                    MATCH (source:Node {graph_id: $graph_id})-[r:EDGE {graph_id: $graph_id}]->(target:Node {graph_id: $graph_id})
                    RETURN r, source.id as source, target.id as target
                    """,
                    graph_id=graph_id
                )
                edges = []
                for record in edges_result:
                    edge_data = dict(record["r"])
                    edge_data["source"] = record["source"]
                    edge_data["target"] = record["target"]
                    edges.append(edge_data)
                
                return nodes, edges
        except Exception as e:
            logger.warning(f"从Neo4j获取数据失败: {e}")
            return [], []
    
    def _clear_graph_data_from_neo4j(self, graph_id: str):
        """从Neo4j清除图数据"""
        try:
            with get_neo4j_session() as session:
                # 删除边
                session.run(
                    "MATCH ()-[r:EDGE {graph_id: $graph_id}]-() DELETE r",
                    graph_id=graph_id
                )
                # 删除节点
                session.run(
                    "MATCH (n:Node {graph_id: $graph_id}) DELETE n",
                    graph_id=graph_id
                )
        except Exception as e:
            logger.warning(f"从Neo4j清除数据失败: {e}")
            # 不抛出异常，允许继续运行
    
    def _save_graph_data_to_sqlite(self, graph_id: str, nodes: List, edges: List):
        """将图数据保存到SQLite"""
        try:
            # 先清除旧数据
            self._clear_graph_data_from_sqlite(graph_id)
            
            # 保存节点
            for node in nodes:
                # 处理Pydantic模型或字典
                if hasattr(node, 'model_dump'):
                    node_data = node.model_dump()
                elif hasattr(node, 'dict'):
                    node_data = node.dict()
                else:
                    node_data = node
                
                db_node = Node(
                    graph_id=graph_id,
                    node_id=node_data.get('id', str(uuid.uuid4())),
                    label=node_data.get('label', ''),
                    type=node_data.get('type', 'entity'),
                    properties=node_data.get('properties', {}),
                    x=node_data.get('x'),
                    y=node_data.get('y'),
                    size=node_data.get('size'),
                    color=node_data.get('color')
                )
                self.db.add(db_node)
            
            # 保存边
            for edge in edges:
                # 处理Pydantic模型或字典
                if hasattr(edge, 'model_dump'):
                    edge_data = edge.model_dump()
                elif hasattr(edge, 'dict'):
                    edge_data = edge.dict()
                else:
                    edge_data = edge
                
                db_edge = Edge(
                    graph_id=graph_id,
                    edge_id=edge_data.get('id', str(uuid.uuid4())),
                    source_node_id=edge_data.get('source_node_id', ''),
                    target_node_id=edge_data.get('target_node_id', ''),
                    label=edge_data.get('label', ''),
                    type=edge_data.get('type', 'relationship'),
                    properties=edge_data.get('properties', {}),
                    weight=edge_data.get('weight'),
                    color=edge_data.get('color')
                )
                self.db.add(db_edge)
            
            self.db.commit()
            logger.info(f"已保存到SQLite: {len(nodes)} 节点, {len(edges)} 边")
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"保存数据到SQLite失败: {e}")
            raise
    
    def _get_graph_data_from_sqlite(self, graph_id: str) -> tuple[List[dict], List[dict]]:
        """从SQLite获取图数据"""
        try:
            # 获取节点
            db_nodes = self.db.query(Node).filter(Node.graph_id == graph_id).all()
            nodes = []
            for db_node in db_nodes:
                node_dict = {
                    "id": db_node.node_id,  # 使用业务ID而不是数据库主键
                    "label": db_node.label,
                    "type": db_node.type,
                    "properties": db_node.properties or {}
                }
                if db_node.x is not None:
                    node_dict["x"] = db_node.x
                if db_node.y is not None:
                    node_dict["y"] = db_node.y
                if db_node.size is not None:
                    node_dict["size"] = db_node.size
                if db_node.color:
                    node_dict["color"] = db_node.color
                nodes.append(node_dict)
            
            # 获取边
            db_edges = self.db.query(Edge).filter(Edge.graph_id == graph_id).all()
            edges = []
            for db_edge in db_edges:
                edge_dict = {
                    "id": db_edge.edge_id,  # 使用业务ID而不是数据库主键
                    "source": db_edge.source_node_id,  # 前端期望的字段名
                    "target": db_edge.target_node_id,  # 前端期望的字段名
                    "type": db_edge.type,
                    "properties": db_edge.properties or {}
                }
                if db_edge.label:
                    edge_dict["label"] = db_edge.label
                if db_edge.weight is not None:
                    edge_dict["weight"] = db_edge.weight
                if db_edge.color:
                    edge_dict["color"] = db_edge.color
                edges.append(edge_dict)
            
            return nodes, edges
            
        except Exception as e:
            logger.error(f"从SQLite获取数据失败: {e}")
            return [], []
    
    def _clear_graph_data_from_sqlite(self, graph_id: str):
        """从SQLite清除图数据"""
        try:
            # 删除边
            self.db.query(Edge).filter(Edge.graph_id == graph_id).delete()
            # 删除节点
            self.db.query(Node).filter(Node.graph_id == graph_id).delete()
            self.db.commit()
            logger.info(f"已从SQLite清除图数据: {graph_id}")
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"从SQLite清除数据失败: {e}")
            raise