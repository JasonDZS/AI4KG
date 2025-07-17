import json
import csv
import pandas as pd
import networkx as nx
from typing import Dict, List, Any, Tuple, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, UploadFile
import uuid
import io
import xml.etree.ElementTree as ET
from xml.dom import minidom
import logging

from app.models.models import Graph, Node, Edge, User
from app.schemas.schemas import GraphCreate, NodeCreate, EdgeCreate

logger = logging.getLogger(__name__)

class FileService:
    def __init__(self, db: Session):
        self.db = db
    
    async def import_graph_file(self, file: UploadFile, user: User, title: Optional[str] = None, description: Optional[str] = None) -> dict:
        """导入图谱文件"""
        try:
            # 读取文件内容
            content = await file.read()
            
            # 根据文件类型解析数据
            if file.filename.endswith('.json'):
                graph_data = self._parse_json(content)
            elif file.filename.endswith('.csv'):
                graph_data = self._parse_csv(content)
            elif file.filename.endswith('.gexf'):
                graph_data = self._parse_gexf(content)
            elif file.filename.endswith('.graphml'):
                graph_data = self._parse_graphml(content)
            else:
                raise HTTPException(status_code=400, detail="不支持的文件格式")
            
            # 创建图谱
            from app.services.graph_service import GraphService
            graph_service = GraphService(self.db)
            
            graph_create = GraphCreate(
                title=title or file.filename.replace('.', '_'),
                description=description or f"从文件 {file.filename} 导入",
                nodes=graph_data.get('nodes', []),
                edges=graph_data.get('edges', [])
            )
            
            result = graph_service.create_graph(graph_create, user)
            return result
            
        except Exception as e:
            logger.error(f"文件导入失败: {str(e)}")
            raise HTTPException(status_code=400, detail=f"文件导入失败: {str(e)}")
    
    def export_graph(self, graph_id: str, format: str) -> Tuple[bytes, str, str]:
        """导出图谱数据"""
        try:
            # 获取图谱数据
            graph = self.db.query(Graph).filter(Graph.id == graph_id).first()
            if not graph:
                raise HTTPException(status_code=404, detail="图谱不存在")
            
            nodes = self.db.query(Node).filter(Node.graph_id == graph_id).all()
            edges = self.db.query(Edge).filter(Edge.graph_id == graph_id).all()
            
            # 根据格式导出
            if format == 'json':
                return self._export_json(graph, nodes, edges)
            elif format == 'csv':
                return self._export_csv(graph, nodes, edges)
            elif format == 'gexf':
                return self._export_gexf(graph, nodes, edges)
            elif format == 'graphml':
                return self._export_graphml(graph, nodes, edges)
            else:
                raise HTTPException(status_code=400, detail="不支持的导出格式")
                
        except Exception as e:
            logger.error(f"文件导出失败: {str(e)}")
            raise HTTPException(status_code=400, detail=f"文件导出失败: {str(e)}")
    
    def _parse_json(self, content: bytes) -> Dict[str, Any]:
        """解析JSON格式文件"""
        try:
            data = json.loads(content.decode('utf-8'))
            
            # 标准化数据格式
            nodes = []
            edges = []
            
            if 'nodes' in data:
                for node in data['nodes']:
                    node_create = NodeCreate(
                        id=str(node.get('id', str(uuid.uuid4()))),
                        node_id=str(node.get('id', str(uuid.uuid4()))),
                        label=node.get('label', node.get('name', '')),
                        type=node.get('type', 'entity'),
                        properties=node.get('properties', {}),
                        x=node.get('x'),
                        y=node.get('y'),
                        size=node.get('size'),
                        color=node.get('color')
                    )
                    nodes.append(node_create)
            
            if 'edges' in data or 'links' in data:
                edge_data = data.get('edges', data.get('links', []))
                for edge in edge_data:
                    edge_create = EdgeCreate(
                        id=str(edge.get('id', str(uuid.uuid4()))),
                        edge_id=str(edge.get('id', str(uuid.uuid4()))),
                        source_node_id=str(edge.get('source', edge.get('from', ''))),
                        target_node_id=str(edge.get('target', edge.get('to', ''))),
                        label=edge.get('label', edge.get('type', '')),
                        type=edge.get('type', 'relationship'),
                        properties=edge.get('properties', {}),
                        weight=edge.get('weight'),
                        color=edge.get('color')
                    )
                    edges.append(edge_create)
            
            return {'nodes': nodes, 'edges': edges}
            
        except Exception as e:
            raise ValueError(f"JSON解析错误: {str(e)}")
    
    def _parse_csv(self, content: bytes) -> Dict[str, Any]:
        """解析CSV格式文件"""
        try:
            # 使用pandas读取CSV
            df = pd.read_csv(io.StringIO(content.decode('utf-8')))
            
            nodes = []
            edges = []
            
            # 判断CSV格式：节点还是边
            if 'source' in df.columns and 'target' in df.columns:
                # 边列表格式
                for _, row in df.iterrows():
                    edge_id = str(row.get('id', str(uuid.uuid4())))
                    edge = EdgeCreate(
                        id=edge_id,
                        edge_id=edge_id,
                        source_node_id=str(row['source']),
                        target_node_id=str(row['target']),
                        label=row.get('label', ''),
                        type=row.get('type', 'relationship'),
                        weight=row.get('weight'),
                        properties={}
                    )
                    edges.append(edge)
                    
                    # 自动创建节点
                    for node_id in [row['source'], row['target']]:
                        if not any(n.node_id == str(node_id) for n in nodes):
                            node_create = NodeCreate(
                                id=str(node_id),
                                node_id=str(node_id),
                                label=str(node_id),
                                type='entity'
                            )
                            nodes.append(node_create)
            else:
                # 节点列表格式
                for _, row in df.iterrows():
                    node_id = str(row.get('id', str(uuid.uuid4())))
                    node = NodeCreate(
                        id=node_id,
                        node_id=node_id,
                        label=row.get('label', row.get('name', '')),
                        type=row.get('type', 'entity'),
                        properties={}
                    )
                    nodes.append(node)
            
            return {'nodes': nodes, 'edges': edges}
            
        except Exception as e:
            raise ValueError(f"CSV解析错误: {str(e)}")
    
    def _parse_gexf(self, content: bytes) -> Dict[str, Any]:
        """解析GEXF格式文件"""
        try:
            G = nx.read_gexf(io.StringIO(content.decode('utf-8')))
            return self._networkx_to_data(G)
        except Exception as e:
            raise ValueError(f"GEXF解析错误: {str(e)}")
    
    def _parse_graphml(self, content: bytes) -> Dict[str, Any]:
        """解析GraphML格式文件"""
        try:
            G = nx.read_graphml(io.StringIO(content.decode('utf-8')))
            return self._networkx_to_data(G)
        except Exception as e:
            raise ValueError(f"GraphML解析错误: {str(e)}")
    
    def _networkx_to_data(self, G: nx.Graph) -> Dict[str, Any]:
        """将NetworkX图转换为标准数据格式"""
        nodes = []
        edges = []
        
        # 转换节点
        for node_id, data in G.nodes(data=True):
            node = NodeCreate(
                id=str(node_id),
                node_id=str(node_id),
                label=data.get('label', str(node_id)),
                type=data.get('type', 'entity'),
                properties=data,
                x=data.get('x'),
                y=data.get('y'),
                size=data.get('size'),
                color=data.get('color')
            )
            nodes.append(node)
        
        # 转换边
        for source, target, data in G.edges(data=True):
            edge_id = str(data.get('id', f"{source}-{target}"))
            edge = EdgeCreate(
                id=edge_id,
                edge_id=edge_id,
                source_node_id=str(source),
                target_node_id=str(target),
                label=data.get('label', ''),
                type=data.get('type', 'relationship'),
                properties=data,
                weight=data.get('weight'),
                color=data.get('color')
            )
            edges.append(edge)
        
        return {'nodes': nodes, 'edges': edges}
    
    def _export_json(self, graph: Graph, nodes: List[Node], edges: List[Edge]) -> Tuple[bytes, str, str]:
        """导出为JSON格式"""
        data = {
            'graph': {
                'id': graph.id,
                'title': graph.title,
                'description': graph.description,
                'created_at': graph.created_at.isoformat() if graph.created_at else None
            },
            'nodes': [
                {
                    'id': node.node_id,
                    'label': node.label,
                    'type': node.type,
                    'properties': node.properties or {},
                    'x': node.x,
                    'y': node.y,
                    'size': node.size,
                    'color': node.color
                }
                for node in nodes
            ],
            'edges': [
                {
                    'id': edge.edge_id,
                    'source': edge.source_node_id,
                    'target': edge.target_node_id,
                    'label': edge.label,
                    'type': edge.type,
                    'properties': edge.properties or {},
                    'weight': edge.weight,
                    'color': edge.color
                }
                for edge in edges
            ]
        }
        
        json_str = json.dumps(data, ensure_ascii=False, indent=2)
        filename = f"{graph.title}_{graph.id}.json"
        return json_str.encode('utf-8'), filename, "application/json"
    
    def _export_csv(self, graph: Graph, nodes: List[Node], edges: List[Edge]) -> Tuple[bytes, str, str]:
        """导出为CSV格式（边列表）"""
        # 创建边的DataFrame
        edge_data = []
        for edge in edges:
            edge_data.append({
                'id': edge.edge_id,
                'source': edge.source_node_id,
                'target': edge.target_node_id,
                'label': edge.label,
                'type': edge.type,
                'weight': edge.weight,
                'color': edge.color
            })
        
        df = pd.DataFrame(edge_data)
        csv_str = df.to_csv(index=False, encoding='utf-8')
        filename = f"{graph.title}_{graph.id}_edges.csv"
        return csv_str.encode('utf-8'), filename, "text/csv"
    
    def _export_gexf(self, graph: Graph, nodes: List[Node], edges: List[Edge]) -> Tuple[bytes, str, str]:
        """导出为GEXF格式"""
        G = nx.Graph()
        
        # 添加节点
        for node in nodes:
            G.add_node(
                node.node_id,
                label=node.label,
                type=node.type,
                x=node.x,
                y=node.y,
                size=node.size,
                color=node.color,
                **node.properties or {}
            )
        
        # 添加边
        for edge in edges:
            G.add_edge(
                edge.source_node_id,
                edge.target_node_id,
                id=edge.edge_id,
                label=edge.label,
                type=edge.type,
                weight=edge.weight,
                color=edge.color,
                **edge.properties or {}
            )
        
        # 导出为GEXF
        output = io.StringIO()
        nx.write_gexf(G, output)
        gexf_content = output.getvalue()
        filename = f"{graph.title}_{graph.id}.gexf"
        return gexf_content.encode('utf-8'), filename, "application/xml"
    
    def _export_graphml(self, graph: Graph, nodes: List[Node], edges: List[Edge]) -> Tuple[bytes, str, str]:
        """导出为GraphML格式"""
        G = nx.Graph()
        
        # 添加节点
        for node in nodes:
            G.add_node(
                node.node_id,
                label=node.label,
                type=node.type,
                x=node.x,
                y=node.y,
                size=node.size,
                color=node.color,
                **node.properties or {}
            )
        
        # 添加边
        for edge in edges:
            G.add_edge(
                edge.source_node_id,
                edge.target_node_id,
                id=edge.edge_id,
                label=edge.label,
                type=edge.type,
                weight=edge.weight,
                color=edge.color,
                **edge.properties or {}
            )
        
        # 导出为GraphML
        output = io.StringIO()
        nx.write_graphml(G, output)
        graphml_content = output.getvalue()
        filename = f"{graph.title}_{graph.id}.graphml"
        return graphml_content.encode('utf-8'), filename, "application/xml"
