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
    
    def add_node(self, graph_id: str, node_data: dict, user: User) -> dict:
        """添加单个节点到图谱"""
        graph = self.get_graph_by_id(graph_id, user)
        if not graph:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="图谱不存在"
            )
        
        try:
            # 生成节点ID
            node_id = node_data.get('id', str(uuid.uuid4()))
            
            # 创建节点对象
            db_node = Node(
                graph_id=graph.id,
                node_id=node_id,
                label=node_data.get('label', ''),
                type=node_data.get('type', 'entity'),
                properties=node_data.get('properties', {}),
                x=node_data.get('x'),
                y=node_data.get('y'),
                size=node_data.get('size'),
                color=node_data.get('color')
            )
            
            # 保存到SQLite
            self.db.add(db_node)
            
            # 更新节点计数
            graph.node_count += 1
            
            # 尝试保存到Neo4j
            try:
                with get_neo4j_session() as session:
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
                        id=node_id,
                        graph_id=graph.neo4j_graph_id,
                        label=node_data.get('label'),
                        type=node_data.get('type'),
                        properties=node_data.get('properties', {}),
                        x=node_data.get('x'),
                        y=node_data.get('y'),
                        size=node_data.get('size'),
                        color=node_data.get('color')
                    )
                logger.info("节点已同时保存到SQLite和Neo4j")
            except Exception as e:
                logger.warning(f"Neo4j不可用，节点仅保存到SQLite: {e}")
            
            self.db.commit()
            
            return {
                "id": node_id,
                "label": db_node.label,
                "type": db_node.type,
                "properties": db_node.properties,
                "x": db_node.x,
                "y": db_node.y,
                "size": db_node.size,
                "color": db_node.color
            }
            
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"添加节点失败: {str(e)}"
            )
    
    def add_edge(self, graph_id: str, edge_data: dict, user: User) -> dict:
        """添加单条边到图谱"""
        graph = self.get_graph_by_id(graph_id, user)
        if not graph:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="图谱不存在"
            )
        
        try:
            # 验证源节点和目标节点是否存在
            source_exists = self.db.query(Node).filter(
                Node.graph_id == graph.id,
                Node.node_id == edge_data.get('source')
            ).first()
            
            target_exists = self.db.query(Node).filter(
                Node.graph_id == graph.id,
                Node.node_id == edge_data.get('target')
            ).first()
            
            if not source_exists or not target_exists:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="源节点或目标节点不存在"
                )
            
            # 生成边ID
            edge_id = edge_data.get('id', str(uuid.uuid4()))
            
            # 创建边对象
            db_edge = Edge(
                graph_id=graph.id,
                edge_id=edge_id,
                source_node_id=edge_data.get('source'),
                target_node_id=edge_data.get('target'),
                label=edge_data.get('label', ''),
                type=edge_data.get('type', 'relationship'),
                properties=edge_data.get('properties', {}),
                weight=edge_data.get('weight'),
                color=edge_data.get('color')
            )
            
            # 保存到SQLite
            self.db.add(db_edge)
            
            # 更新边计数
            graph.edge_count += 1
            
            # 尝试保存到Neo4j
            try:
                with get_neo4j_session() as session:
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
                        id=edge_id,
                        graph_id=graph.neo4j_graph_id,
                        source=edge_data.get('source'),
                        target=edge_data.get('target'),
                        label=edge_data.get('label'),
                        type=edge_data.get('type'),
                        properties=edge_data.get('properties', {}),
                        weight=edge_data.get('weight'),
                        color=edge_data.get('color')
                    )
                logger.info("边已同时保存到SQLite和Neo4j")
            except Exception as e:
                logger.warning(f"Neo4j不可用，边仅保存到SQLite: {e}")
            
            self.db.commit()
            
            return {
                "id": edge_id,
                "source": db_edge.source_node_id,
                "target": db_edge.target_node_id,
                "label": db_edge.label,
                "type": db_edge.type,
                "properties": db_edge.properties,
                "weight": db_edge.weight,
                "color": db_edge.color
            }
            
        except HTTPException:
            self.db.rollback()
            raise
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"添加边失败: {str(e)}"
            )
    
    def update_node(self, graph_id: str, node_id: str, node_data: dict, user: User) -> dict:
        """更新节点"""
        graph = self.get_graph_by_id(graph_id, user)
        if not graph:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="图谱不存在"
            )
        
        try:
            # 查找节点
            db_node = self.db.query(Node).filter(
                Node.graph_id == graph.id,
                Node.node_id == node_id
            ).first()
            
            if not db_node:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="节点不存在"
                )
            
            # 更新SQLite中的节点
            if 'label' in node_data:
                db_node.label = node_data['label']
            if 'type' in node_data:
                db_node.type = node_data['type']
            if 'properties' in node_data:
                db_node.properties = node_data['properties']
            if 'x' in node_data:
                db_node.x = node_data['x']
            if 'y' in node_data:
                db_node.y = node_data['y']
            if 'size' in node_data:
                db_node.size = node_data['size']
            if 'color' in node_data:
                db_node.color = node_data['color']
            
            # 尝试更新Neo4j中的节点
            try:
                with get_neo4j_session() as session:
                    session.run(
                        """
                        MATCH (n:Node {id: $id, graph_id: $graph_id})
                        SET n.label = $label,
                            n.type = $type,
                            n.properties = $properties,
                            n.x = $x,
                            n.y = $y,
                            n.size = $size,
                            n.color = $color
                        """,
                        id=node_id,
                        graph_id=graph.neo4j_graph_id,
                        label=db_node.label,
                        type=db_node.type,
                        properties=db_node.properties,
                        x=db_node.x,
                        y=db_node.y,
                        size=db_node.size,
                        color=db_node.color
                    )
                logger.info("节点已同时更新到SQLite和Neo4j")
            except Exception as e:
                logger.warning(f"Neo4j不可用，节点仅更新到SQLite: {e}")
            
            self.db.commit()
            
            return {
                "id": db_node.node_id,
                "label": db_node.label,
                "type": db_node.type,
                "properties": db_node.properties,
                "x": db_node.x,
                "y": db_node.y,
                "size": db_node.size,
                "color": db_node.color
            }
            
        except HTTPException:
            self.db.rollback()
            raise
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"更新节点失败: {str(e)}"
            )
    
    def update_edge(self, graph_id: str, edge_id: str, edge_data: dict, user: User) -> dict:
        """更新边"""
        graph = self.get_graph_by_id(graph_id, user)
        if not graph:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="图谱不存在"
            )
        
        try:
            # 查找边
            db_edge = self.db.query(Edge).filter(
                Edge.graph_id == graph.id,
                Edge.edge_id == edge_id
            ).first()
            
            if not db_edge:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="边不存在"
                )
            
            # 更新SQLite中的边
            if 'label' in edge_data:
                db_edge.label = edge_data['label']
            if 'type' in edge_data:
                db_edge.type = edge_data['type']
            if 'properties' in edge_data:
                db_edge.properties = edge_data['properties']
            if 'weight' in edge_data:
                db_edge.weight = edge_data['weight']
            if 'color' in edge_data:
                db_edge.color = edge_data['color']
            
            # 尝试更新Neo4j中的边
            try:
                with get_neo4j_session() as session:
                    session.run(
                        """
                        MATCH ()-[r:EDGE {id: $id, graph_id: $graph_id}]->()
                        SET r.label = $label,
                            r.type = $type,
                            r.properties = $properties,
                            r.weight = $weight,
                            r.color = $color
                        """,
                        id=edge_id,
                        graph_id=graph.neo4j_graph_id,
                        label=db_edge.label,
                        type=db_edge.type,
                        properties=db_edge.properties,
                        weight=db_edge.weight,
                        color=db_edge.color
                    )
                logger.info("边已同时更新到SQLite和Neo4j")
            except Exception as e:
                logger.warning(f"Neo4j不可用，边仅更新到SQLite: {e}")
            
            self.db.commit()
            
            return {
                "id": db_edge.edge_id,
                "source": db_edge.source_node_id,
                "target": db_edge.target_node_id,
                "label": db_edge.label,
                "type": db_edge.type,
                "properties": db_edge.properties,
                "weight": db_edge.weight,
                "color": db_edge.color
            }
            
        except HTTPException:
            self.db.rollback()
            raise
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"更新边失败: {str(e)}"
            )
    
    def merge_nodes(self, graph_id: str, node_ids: List[str], merged_node_data: dict, user: User) -> dict:
        """合并多个节点为一个节点"""
        graph = self.get_graph_by_id(graph_id, user)
        if not graph:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="图谱不存在"
            )
        
        if len(node_ids) < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="至少需要两个节点才能合并"
            )
        
        try:
            # 验证所有节点是否存在
            nodes_to_merge = self.db.query(Node).filter(
                Node.graph_id == graph.id,
                Node.node_id.in_(node_ids)
            ).all()
            
            if len(nodes_to_merge) != len(node_ids):
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="部分节点不存在"
                )
            
            # 使用第一个节点作为主节点，或创建新节点
            primary_node_id = merged_node_data.get('id', node_ids[0])
            primary_node = None
            
            # 如果指定了新ID，创建新节点
            if primary_node_id not in node_ids:
                primary_node = Node(
                    graph_id=graph.id,
                    node_id=primary_node_id,
                    label=merged_node_data.get('label', ''),
                    type=merged_node_data.get('type', 'entity'),
                    properties=merged_node_data.get('properties', {}),
                    x=merged_node_data.get('x'),
                    y=merged_node_data.get('y'),
                    size=merged_node_data.get('size'),
                    color=merged_node_data.get('color')
                )
                self.db.add(primary_node)
            else:
                # 使用现有节点作为主节点
                primary_node = next(n for n in nodes_to_merge if n.node_id == primary_node_id)
                # 更新主节点信息
                if 'label' in merged_node_data:
                    primary_node.label = merged_node_data['label']
                if 'type' in merged_node_data:
                    primary_node.type = merged_node_data['type']
                if 'properties' in merged_node_data:
                    # 合并属性
                    merged_properties = {}
                    for node in nodes_to_merge:
                        if node.properties:
                            merged_properties.update(node.properties)
                    merged_properties.update(merged_node_data['properties'])
                    primary_node.properties = merged_properties
                if 'x' in merged_node_data:
                    primary_node.x = merged_node_data['x']
                if 'y' in merged_node_data:
                    primary_node.y = merged_node_data['y']
                if 'size' in merged_node_data:
                    primary_node.size = merged_node_data['size']
                if 'color' in merged_node_data:
                    primary_node.color = merged_node_data['color']
            
            # 更新所有指向被合并节点的边
            nodes_to_remove = [n.node_id for n in nodes_to_merge if n.node_id != primary_node_id]
            
            # 更新源节点为被合并节点的边
            edges_to_update_source = self.db.query(Edge).filter(
                Edge.graph_id == graph.id,
                Edge.source_node_id.in_(nodes_to_remove)
            ).all()
            
            for edge in edges_to_update_source:
                edge.source_node_id = primary_node_id
            
            # 更新目标节点为被合并节点的边
            edges_to_update_target = self.db.query(Edge).filter(
                Edge.graph_id == graph.id,
                Edge.target_node_id.in_(nodes_to_remove)
            ).all()
            
            for edge in edges_to_update_target:
                edge.target_node_id = primary_node_id
            
            # 删除被合并的节点
            self.db.query(Node).filter(
                Node.graph_id == graph.id,
                Node.node_id.in_(nodes_to_remove)
            ).delete()
            
            # 更新节点计数
            graph.node_count -= len(nodes_to_remove)
            
            # 尝试在Neo4j中执行合并
            try:
                with get_neo4j_session() as session:
                    # 在Neo4j中合并节点
                    session.run(
                        """
                        // 更新所有指向被合并节点的边到主节点
                        MATCH (n:Node {graph_id: $graph_id})
                        WHERE n.id IN $nodes_to_remove
                        MATCH (n)-[r]-(other)
                        WITH n, r, other
                        MATCH (primary:Node {id: $primary_node_id, graph_id: $graph_id})
                        CREATE (primary)-[new_r:EDGE]->(other)
                        SET new_r = properties(r)
                        DELETE r, n
                        """,
                        graph_id=graph.neo4j_graph_id,
                        nodes_to_remove=nodes_to_remove,
                        primary_node_id=primary_node_id
                    )
                    
                    # 更新主节点信息
                    if primary_node:
                        session.run(
                            """
                            MATCH (n:Node {id: $id, graph_id: $graph_id})
                            SET n.label = $label,
                                n.type = $type,
                                n.properties = $properties,
                                n.x = $x,
                                n.y = $y,
                                n.size = $size,
                                n.color = $color
                            """,
                            id=primary_node_id,
                            graph_id=graph.neo4j_graph_id,
                            label=primary_node.label,
                            type=primary_node.type,
                            properties=primary_node.properties,
                            x=primary_node.x,
                            y=primary_node.y,
                            size=primary_node.size,
                            color=primary_node.color
                        )
                logger.info("节点已在SQLite和Neo4j中合并")
            except Exception as e:
                logger.warning(f"Neo4j不可用，节点仅在SQLite中合并: {e}")
            
            self.db.commit()
            
            return {
                "id": primary_node_id,
                "label": primary_node.label,
                "type": primary_node.type,
                "properties": primary_node.properties,
                "x": primary_node.x,
                "y": primary_node.y,
                "size": primary_node.size,
                "color": primary_node.color,
                "merged_nodes": nodes_to_remove
            }
            
        except HTTPException:
            self.db.rollback()
            raise
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"合并节点失败: {str(e)}"
            )
    
    def delete_node(self, graph_id: str, node_id: str, user: User) -> dict:
        """删除单个节点"""
        graph = self.get_graph_by_id(graph_id, user)
        if not graph:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="图谱不存在"
            )
        
        try:
            # 查找节点
            db_node = self.db.query(Node).filter(
                Node.graph_id == graph.id,
                Node.node_id == node_id
            ).first()
            
            if not db_node:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="节点不存在"
                )
            
            # 删除与该节点相关的所有边
            deleted_edges = self.db.query(Edge).filter(
                Edge.graph_id == graph.id,
                (Edge.source_node_id == node_id) | (Edge.target_node_id == node_id)
            ).all()
            
            deleted_edge_count = len(deleted_edges)
            
            # 从SQLite删除边
            self.db.query(Edge).filter(
                Edge.graph_id == graph.id,
                (Edge.source_node_id == node_id) | (Edge.target_node_id == node_id)
            ).delete()
            
            # 从SQLite删除节点
            self.db.delete(db_node)
            
            # 更新图谱计数
            graph.node_count -= 1
            graph.edge_count -= deleted_edge_count
            
            # 尝试从Neo4j删除
            try:
                with get_neo4j_session() as session:
                    # 删除节点及其关联的边
                    session.run(
                        """
                        MATCH (n:Node {id: $id, graph_id: $graph_id})
                        DETACH DELETE n
                        """,
                        id=node_id,
                        graph_id=graph.neo4j_graph_id
                    )
                logger.info("节点已从SQLite和Neo4j删除")
            except Exception as e:
                logger.warning(f"Neo4j不可用，节点仅从SQLite删除: {e}")
            
            self.db.commit()
            
            return {
                "deleted_node_id": node_id,
                "deleted_edges_count": deleted_edge_count,
                "message": f"节点删除成功，同时删除了 {deleted_edge_count} 条相关边"
            }
            
        except HTTPException:
            self.db.rollback()
            raise
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"删除节点失败: {str(e)}"
            )
    
    def delete_edge(self, graph_id: str, edge_id: str, user: User) -> dict:
        """删除单条边"""
        graph = self.get_graph_by_id(graph_id, user)
        if not graph:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="图谱不存在"
            )
        
        try:
            # 查找边
            db_edge = self.db.query(Edge).filter(
                Edge.graph_id == graph.id,
                Edge.edge_id == edge_id
            ).first()
            
            if not db_edge:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="边不存在"
                )
            
            edge_info = {
                "id": db_edge.edge_id,
                "source": db_edge.source_node_id,
                "target": db_edge.target_node_id,
                "label": db_edge.label,
                "type": db_edge.type
            }
            
            # 从SQLite删除边
            self.db.delete(db_edge)
            
            # 更新边计数
            graph.edge_count -= 1
            
            # 尝试从Neo4j删除
            try:
                with get_neo4j_session() as session:
                    session.run(
                        """
                        MATCH ()-[r:EDGE {id: $id, graph_id: $graph_id}]->()
                        DELETE r
                        """,
                        id=edge_id,
                        graph_id=graph.neo4j_graph_id
                    )
                logger.info("边已从SQLite和Neo4j删除")
            except Exception as e:
                logger.warning(f"Neo4j不可用，边仅从SQLite删除: {e}")
            
            self.db.commit()
            
            return {
                "deleted_edge_id": edge_id,
                "deleted_edge": edge_info,
                "message": "边删除成功"
            }
            
        except HTTPException:
            self.db.rollback()
            raise
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"删除边失败: {str(e)}"
            )