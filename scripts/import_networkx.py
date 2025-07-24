#!/usr/bin/env python3
"""
AI4KG NetworkX 图数据导入脚本

将 NetworkX 格式的图数据导入到 AI4KG 后端数据库中。
支持 GML, GraphML, GEXF, JSON 等格式。

数据格式说明：
- 节点格式：适配后端 Node 模型，包含 id(业务ID), label, type, properties, x, y, size, color
- 边格式：适配后端 Edge 模型，包含 id(业务ID), source_node_id, target_node_id, label, type, properties, weight, color
- 后端存储：双重存储系统 (SQLite + Neo4j)，主要使用 SQLite 存储

Usage:
    python import_networkx.py --file graph.gml --title "我的图谱"
    python import_networkx.py --directory ./graphs --user testuser
    python import_networkx.py --file graph.gml --analyze --layout spring --dry-run
"""

import argparse
import json
import os
import sys
import logging
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
import requests
from datetime import datetime
import math

try:
    import networkx as nx
    import numpy as np
except ImportError:
    print("Error: NetworkX and numpy not installed. Please run: pip install networkx numpy")
    sys.exit(1)

# 设置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/import.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class NetworkXImporter:
    """NetworkX 图数据导入器"""
    
    def __init__(self, api_url: str = "http://localhost:8000", token: Optional[str] = None):
        self.api_url = api_url.rstrip('/')
        self.token = token
        self.session = requests.Session()
        
        if token:
            self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        # 节点类型对应的颜色映射
        self.type_colors = {
            'person': '#FF4C4C',  # 鲜红（醒目且易识别）
            'organization': '#3D8BFF',  # 鲜亮蓝（专业感、科技感）
            'location': '#00C897',  # 鲜绿松（自然、地点联想）
            'concept': '#A259FF',  # 明亮紫（抽象、高级感）
            'event': '#FFD21F',  # 鲜黄（突出事件/时间点）
            'object': '#FF7A00',  # 橘色（具象事物，温暖）
            'entity': '#00B2FF',  # 青蓝（常规实体，清晰高亮）
            'relationship': '#FF3CAC',  # 玫红渐变色（强调连接性）
            'default': '#FFA500'  # 亮橙（避免灰，保有视觉统一）
        }

    def load_graph(self, file_path: str, format_hint: Optional[str] = None) -> nx.Graph:
        """加载NetworkX图数据"""
        file_path = Path(file_path)
        
        if not file_path.exists():
            raise FileNotFoundError(f"文件不存在: {file_path}")
        
        # 自动检测格式
        ext = file_path.suffix.lower()
        format_type = format_hint or {
            '.gml': 'gml',
            '.graphml': 'graphml', 
            '.xml': 'graphml',
            '.gexf': 'gexf',
            '.json': 'json',
            '.txt': 'edgelist',
            '.csv': 'edgelist'
        }.get(ext, 'auto')
        
        logger.info(f"加载图文件: {file_path} (格式: {format_type})")
        
        try:
            if format_type == 'gml':
                return nx.read_gml(file_path, encoding='utf-8')
            elif format_type == 'graphml':
                return nx.read_graphml(file_path)
            elif format_type == 'gexf':
                return nx.read_gexf(file_path, encoding='utf-8')
            elif format_type == 'json':
                return nx.node_link_graph(json.load(open(file_path, 'r', encoding='utf-8')))
            elif format_type == 'edgelist':
                return nx.read_edgelist(file_path, encoding='utf-8')
            else:
                # 尝试自动检测
                for loader in [nx.read_gml, nx.read_graphml, nx.read_gexf]:
                    try:
                        return loader(file_path)
                    except:
                        continue
                raise ValueError(f"无法识别文件格式: {file_path}")
                
        except Exception as e:
            logger.error(f"加载图文件失败: {e}")
            raise
    
    def analyze_graph(self, G: nx.Graph, layout_algorithm: str = 'spring', 
                     scale: float = 1000.0) -> nx.Graph:
        """分析图谱并计算布局、大小、颜色等属性"""
        logger.info(f"开始分析图谱: {len(G.nodes)} 节点, {len(G.edges)} 边")
        
        # 创建图的副本以避免修改原图
        G_analyzed = G.copy()
        
        # 1. 计算布局坐标
        logger.info(f"计算布局: {layout_algorithm}")
        pos = self._calculate_layout(G_analyzed, layout_algorithm, scale)
        
        # 2. 计算节点度数
        degrees = dict(G_analyzed.degree())
        
        # 3. 推断节点类型并设置颜色
        node_types = {}
        for node_id, attrs in G_analyzed.nodes(data=True):
            node_type = self._infer_node_type(attrs)
            node_types[node_id] = node_type
        
        # 4. 计算节点大小范围
        min_degree = min(degrees.values()) if degrees else 1
        max_degree = max(degrees.values()) if degrees else 1
        size_range = (10, 50)  # 最小和最大大小
        
        # 5. 更新节点属性
        for node_id in G_analyzed.nodes():
            attrs = G_analyzed.nodes[node_id]
            
            # 设置坐标
            if node_id in pos:
                attrs['x'] = float(pos[node_id][0])
                attrs['y'] = float(pos[node_id][1])
            
            # 设置大小（基于度数）
            degree = degrees.get(node_id, 1)
            if max_degree > min_degree:
                normalized_degree = (degree - min_degree) / (max_degree - min_degree)
            else:
                normalized_degree = 0.5
            size = size_range[0] + normalized_degree * (size_range[1] - size_range[0])
            attrs['size'] = round(size / 3, 2)
            
            # 设置颜色（基于类型）
            node_type = node_types.get(node_id, 'default')
            attrs['color'] = self.type_colors.get(node_type, self.type_colors['default'])
            attrs['type'] = node_type
            
            # 添加分析信息
            attrs['degree'] = degree
            attrs['analyzed'] = True
        
        # 6. 计算图的统计信息
        stats = self._calculate_graph_statistics(G_analyzed)
        G_analyzed.graph.update(stats)
        
        logger.info(f"分析完成: 布局={layout_algorithm}, 节点类型={len(set(node_types.values()))}")
        return G_analyzed
    
    def _calculate_layout(self, G: nx.Graph, algorithm: str, scale: float) -> Dict[Any, Tuple[float, float]]:
        """计算图布局"""
        try:
            if algorithm == 'spring':
                return nx.spring_layout(G, scale=scale, iterations=50, k=None)
            elif algorithm == 'circular':
                return nx.circular_layout(G, scale=scale)
            elif algorithm == 'shell':
                return nx.shell_layout(G, scale=scale)
            elif algorithm == 'spectral':
                if len(G.nodes) > 1:
                    return nx.spectral_layout(G, scale=scale)
                else:
                    return nx.spring_layout(G, scale=scale)
            elif algorithm == 'random':
                return nx.random_layout(G, scale=scale)
            elif algorithm == 'kamada_kawai':
                if len(G.nodes) > 1:
                    return nx.kamada_kawai_layout(G, scale=scale)
                else:
                    return nx.spring_layout(G, scale=scale)
            elif algorithm == 'fruchterman_reingold':
                return nx.fruchterman_reingold_layout(G, scale=scale, iterations=50)
            else:
                logger.warning(f"未知布局算法: {algorithm}, 使用默认spring布局")
                return nx.spring_layout(G, scale=scale, iterations=50)
                
        except Exception as e:
            logger.warning(f"布局计算失败: {e}, 使用随机布局")
            return nx.random_layout(G, scale=scale)
    
    def _calculate_graph_statistics(self, G: nx.Graph) -> Dict[str, Any]:
        """计算图的统计信息"""
        stats = {
            'node_count': len(G.nodes),
            'edge_count': len(G.edges),
            'density': nx.density(G),
            'is_connected': nx.is_connected(G) if len(G.nodes) > 0 else False
        }
        
        # 计算度数统计
        degrees = list(dict(G.degree()).values())
        if degrees:
            stats.update({
                'avg_degree': sum(degrees) / len(degrees),
                'max_degree': max(degrees),
                'min_degree': min(degrees)
            })
        
        # 计算连通分量
        if len(G.nodes) > 0:
            stats['num_connected_components'] = nx.number_connected_components(G)
            
            # 计算聚类系数
            try:
                stats['avg_clustering'] = nx.average_clustering(G)
            except:
                stats['avg_clustering'] = 0.0
            
            # 计算直径（只对连通图）
            if nx.is_connected(G) and len(G.nodes) > 1:
                try:
                    stats['diameter'] = nx.diameter(G)
                    stats['avg_shortest_path_length'] = nx.average_shortest_path_length(G)
                except:
                    pass
        
        return stats
    
    def convert_graph_to_ai4kg(self, G: nx.Graph, title: str, description: str = "") -> Dict[str, Any]:
        """将NetworkX图转换为AI4KG后端格式"""
        logger.info(f"转换图数据: {len(G.nodes)} 节点, {len(G.edges)} 边")
        
        # 创建节点名称到ID的映射（用于边的转换）
        # 在GraphML中，节点的名称可能用作边的source/target，但我们需要使用节点的ID
        node_name_to_id = {}
        node_id_to_name = {}
        
        # 转换节点 - 适配后端Node模型
        nodes = []
        for node_id, attrs in G.nodes(data=True):
            # 生成唯一的节点ID（如果node_id本身不适合作为ID）
            business_id = str(node_id)
            node_label = attrs.get('label', str(node_id))
            
            # 建立映射关系：节点名称 -> 节点ID
            node_name_to_id[str(node_id)] = business_id  # NetworkX中的node_id -> 业务ID
            node_name_to_id[node_label] = business_id     # 节点标签 -> 业务ID
            node_id_to_name[business_id] = node_label
            
            node = {
                "id": business_id,  # 业务ID，对应backend的node_id字段
                "label": node_label,
                "type": self._infer_node_type(attrs),
                "properties": self._clean_attributes(attrs, exclude=['label', 'type', 'x', 'y', 'size', 'color'])
            }
            
            # 处理坐标 - 后端直接存储为x, y字段
            if 'pos' in attrs and isinstance(attrs['pos'], (list, tuple)) and len(attrs['pos']) >= 2:
                try:
                    node['x'] = float(attrs['pos'][0])
                    node['y'] = float(attrs['pos'][1])
                except (ValueError, TypeError):
                    node['x'] = None
                    node['y'] = None
            else:
                x_val = attrs.get('x', attrs.get('position_x'))
                y_val = attrs.get('y', attrs.get('position_y'))
                
                # 确保坐标是有效数字或None
                try:
                    node['x'] = float(x_val) if x_val is not None else None
                except (ValueError, TypeError):
                    node['x'] = None
                    
                try:
                    node['y'] = float(y_val) if y_val is not None else None
                except (ValueError, TypeError):
                    node['y'] = None
            
            # 处理大小和颜色 - 后端直接存储为size, color字段
            size_val = attrs.get('size', attrs.get('node_size'))
            if size_val is not None:
                try:
                    node['size'] = float(size_val)
                except (ValueError, TypeError):
                    node['size'] = None
            else:
                node['size'] = None
                
            color_val = attrs.get('color', attrs.get('node_color'))
            if color_val is not None:
                node['color'] = str(color_val)
            else:
                node['color'] = None
            
            # 清理None值，但保留坐标字段（后端期望这些字段）
            cleaned_node = {}
            for k, v in node.items():
                if k in ['x', 'y', 'size', 'color']:  # 这些字段保留，即使是None
                    cleaned_node[k] = v
                elif v is not None:  # 其他字段只在非None时保留
                    cleaned_node[k] = v
            
            nodes.append(cleaned_node)
        
        # 转换边 - 适配后端Edge模型
        edges = []
        for source, target, attrs in G.edges(data=True):
            # 将source和target从节点名称转换为节点ID
            source_id = node_name_to_id.get(str(source))
            target_id = node_name_to_id.get(str(target))
            
            if source_id is None:
                logger.warning(f"边的源节点 '{source}' 未找到对应的节点ID，跳过此边")
                continue
            if target_id is None:
                logger.warning(f"边的目标节点 '{target}' 未找到对应的节点ID，跳过此边")
                continue
            
            edge = {
                "id": attrs.get('id', f"{source_id}-{target_id}"),  # 业务ID，对应backend的edge_id字段
                "source_node_id": source_id,  # 使用映射后的节点ID
                "target_node_id": target_id,  # 使用映射后的节点ID
                "label": attrs.get('label', attrs.get('relation', '')),
                "type": attrs.get('type', attrs.get('relation', 'relationship')),
                "properties": self._clean_attributes(attrs, exclude=['label', 'type', 'weight', 'color'])
            }
            
            # 处理权重 - 后端直接存储为weight字段
            weight_val = attrs.get('weight', attrs.get('strength'))
            if weight_val is not None:
                try:
                    edge['weight'] = float(weight_val)
                except (ValueError, TypeError):
                    edge['weight'] = None
            else:
                edge['weight'] = None
            
            # 处理颜色 - 后端直接存储为color字段
            color_val = attrs.get('color', attrs.get('edge_color'))
            if color_val is not None:
                edge['color'] = str(color_val)
            else:
                edge['color'] = None
            
            # 清理None值，但保留权重和颜色字段
            cleaned_edge = {}
            for k, v in edge.items():
                if k in ['weight', 'color']:  # 这些字段保留，即使是None
                    cleaned_edge[k] = v
                elif v is not None:  # 其他字段只在非None时保留
                    cleaned_edge[k] = v
            
            edges.append(cleaned_edge)
        
        # 添加图的统计信息到描述中
        if hasattr(G, 'graph') and G.graph:
            stats = G.graph
            if 'node_count' in stats:
                stats_text = f"\n\n图统计信息:\n"
                stats_text += f"- 节点数量: {stats.get('node_count', 0)}\n"
                stats_text += f"- 边数量: {stats.get('edge_count', 0)}\n"
                stats_text += f"- 密度: {stats.get('density', 0):.4f}\n"
                stats_text += f"- 平均度数: {stats.get('avg_degree', 0):.2f}\n"
                stats_text += f"- 聚类系数: {stats.get('avg_clustering', 0):.4f}\n"
                stats_text += f"- 连通分量数: {stats.get('num_connected_components', 0)}\n"
                description += stats_text
        
        return {
            "title": title,
            "description": description,
            "nodes": nodes,
            "edges": edges
        }
    
    def _infer_node_type(self, attrs: Dict[str, Any]) -> str:
        """推断节点类型"""
        # 优先使用明确的类型字段
        for key in ['type', 'node_type', 'category', 'class', 'group', 'kind']:
            if key in attrs and attrs[key]:
                return str(attrs[key])
        
        # 根据属性推断
        if 'name' in attrs or 'person' in str(attrs).lower():
            return 'person'
        elif 'organization' in str(attrs).lower() or 'company' in str(attrs).lower():
            return 'organization'
        elif 'location' in str(attrs).lower() or 'place' in str(attrs).lower():
            return 'location'
        else:
            return 'entity'
    
    def _clean_attributes(self, attrs: Dict[str, Any], exclude: List[str] = None) -> Dict[str, Any]:
        """清理属性，移除特殊字段"""
        exclude = exclude or []
        cleaned = {}
        
        for key, value in attrs.items():
            if key in exclude:
                continue
            
            # 转换值类型
            if isinstance(value, (int, float, str, bool)):
                cleaned[key] = value
            elif isinstance(value, (list, tuple)):
                # 只保留简单类型的列表
                if all(isinstance(v, (int, float, str, bool)) for v in value):
                    cleaned[key] = list(value)
            elif isinstance(value, dict):
                # 递归清理字典
                nested = self._clean_attributes(value)
                if nested:
                    cleaned[key] = nested
            else:
                # 其他类型转为字符串
                cleaned[key] = str(value)
        
        return cleaned
    
    def import_graph(self, graph_data: Dict[str, Any], user_id: Optional[str] = None) -> Dict[str, Any]:
        """通过API导入图数据"""
        url = f"{self.api_url}/api/graphs"
        
        # 如果指定了用户，先进行身份验证
        if user_id and not self.token:
            logger.warning("指定了用户ID但未提供认证token，可能会失败")
        
        try:
            response = self.session.post(url, json=graph_data)
            response.raise_for_status()
            
            result = response.json()
            if result.get('success'):
                logger.info(f"导入成功，图谱ID: {result['data']['id']}")
                # 返回完整的图谱数据，包含后端生成的节点和边信息
                return result['data']
            else:
                raise Exception(f"API返回错误: {result.get('message', '未知错误')}")
                
        except requests.exceptions.RequestException as e:
            logger.error(f"API请求失败: {e}")
            # 提供更详细的错误信息
            if hasattr(e, 'response') and e.response is not None:
                try:
                    error_detail = e.response.json()
                    if 'detail' in error_detail:
                        logger.error(f"API错误详情: {error_detail['detail']}")
                except:
                    logger.error(f"HTTP状态码: {e.response.status_code}")
                    logger.error(f"响应内容: {e.response.text}")
            raise
    
    def authenticate(self, username: str, password: str) -> str:
        """用户认证，获取token"""
        url = f"{self.api_url}/api/auth/login"
        
        try:
            response = self.session.post(url, json={
                "username": username,
                "password": password
            })
            response.raise_for_status()
            
            result = response.json()
            if result.get('success'):
                token = result['data']['token']
                self.token = token
                self.session.headers.update({"Authorization": f"Bearer {token}"})
                logger.info(f"用户 {username} 认证成功")
                return token
            else:
                raise Exception(f"认证失败: {result.get('message', '未知错误')}")
                
        except requests.exceptions.RequestException as e:
            logger.error(f"认证请求失败: {e}")
            raise
    
    def batch_import(self, directory: str, user_id: Optional[str] = None, 
                    title_prefix: str = "", batch_size: int = 1000,
                    analyze: bool = False, layout_algorithm: str = 'spring') -> List[Dict[str, Any]]:
        """批量导入目录中的图文件"""
        directory = Path(directory)
        if not directory.exists():
            raise FileNotFoundError(f"目录不存在: {directory}")
        
        # 支持的文件扩展名
        supported_exts = {'.gml', '.graphml', '.xml', '.gexf', '.json'}
        graph_files = [f for f in directory.glob('*') if f.suffix.lower() in supported_exts]
        
        if not graph_files:
            logger.warning(f"目录 {directory} 中没有找到支持的图文件")
            return []
        
        logger.info(f"找到 {len(graph_files)} 个图文件待导入")
        
        results = []
        for i, file_path in enumerate(graph_files, 1):
            try:
                logger.info(f"处理文件 {i}/{len(graph_files)}: {file_path.name}")
                
                # 加载图
                G = self.load_graph(file_path)
                
                # 分析图（如果需要）
                if analyze:
                    G = self.analyze_graph(G, layout_algorithm)
                
                # 生成标题
                title = f"{title_prefix}{file_path.stem}" if title_prefix else file_path.stem
                description = f"从文件 {file_path.name} 导入"
                if analyze:
                    description += f"，已应用 {layout_algorithm} 布局分析"
                
                # 转换格式
                graph_data = self.convert_graph_to_ai4kg(G, title, description)
                
                # 导入
                result = self.import_graph(graph_data, user_id)
                results.append({
                    "file": str(file_path),
                    "graph_id": result.get('id'),
                    "title": result.get('title', title),
                    "node_count": len(result.get('nodes', [])),
                    "edge_count": len(result.get('edges', [])),
                    "status": "success"
                })
                
            except Exception as e:
                logger.error(f"导入文件 {file_path.name} 失败: {e}")
                results.append({
                    "file": str(file_path),
                    "graph_id": None,
                    "status": "failed",
                    "error": str(e)
                })
        
        return results

def main():
    parser = argparse.ArgumentParser(description="将NetworkX图数据导入到AI4KG")
    
    # 输入选项
    input_group = parser.add_mutually_exclusive_group(required=True)
    input_group.add_argument('--file', '-f', help='输入图文件路径')
    input_group.add_argument('--directory', '-d', help='批量导入目录')
    
    # 图谱信息
    parser.add_argument('--title', '-t', help='图谱标题')
    parser.add_argument('--description', help='图谱描述', default='')
    
    # 分析选项
    parser.add_argument('--analyze', '-a', action='store_true', 
                       help='对图谱进行分析，计算布局、大小和颜色')
    parser.add_argument('--layout', choices=[
        'spring', 'circular', 'shell', 'spectral', 'random', 
        'kamada_kawai', 'fruchterman_reingold'
    ], default='spring', help='布局算法 (仅在 --analyze 时有效)')
    parser.add_argument('--scale', type=float, default=1000.0, 
                       help='布局缩放比例 (默认: 1000.0)')
    
    # 用户认证
    parser.add_argument('--username', '-u', default="testuser", help='用户名')
    parser.add_argument('--password', '-p', default="test123", help='密码')
    parser.add_argument('--token', help='JWT认证token')
    
    # API配置
    parser.add_argument('--api-url', default='http://localhost:8000', help='API服务地址')
    
    # 高级选项
    parser.add_argument('--format', choices=['gml', 'graphml', 'gexf', 'json', 'auto'], 
                       default='auto', help='强制指定文件格式')
    parser.add_argument('--batch-size', type=int, default=1000, help='批处理大小')
    parser.add_argument('--title-prefix', default='', help='批量导入时的标题前缀')
    parser.add_argument('--dry-run', action='store_true', help='预览模式，不实际导入')
    parser.add_argument('--verbose', '-v', action='store_true', help='详细输出')
    
    args = parser.parse_args()
    
    # 设置日志级别
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # 创建日志目录
    os.makedirs('logs', exist_ok=True)
    
    # 创建导入器
    importer = NetworkXImporter(api_url=args.api_url, token=args.token)
    
    try:
        # 用户认证
        if args.username and args.password:
            importer.authenticate(args.username, args.password)
        elif not args.token:
            logger.warning("未提供认证信息，可能无法导入到特定用户")
        
        # 单文件导入
        if args.file:
            if not args.title:
                args.title = Path(args.file).stem
            
            logger.info(f"开始导入文件: {args.file}")
            
            # 加载图
            G = importer.load_graph(args.file, args.format if args.format != 'auto' else None)
            logger.info(f"图信息: {len(G.nodes)} 节点, {len(G.edges)} 边")
            
            # 分析图（如果需要）
            if args.analyze:
                logger.info(f"开始分析图谱，使用 {args.layout} 布局")
                G = importer.analyze_graph(G, args.layout, args.scale)
            
            # 转换格式
            description = args.description
            if args.analyze:
                description += f"\n已应用 {args.layout} 布局分析"
            
            graph_data = importer.convert_graph_to_ai4kg(G, args.title, description)
            
            if args.dry_run:
                # 预览模式，显示转换后的数据结构
                preview_data = {
                    "title": graph_data["title"],
                    "description": graph_data["description"],
                    "node_count": len(graph_data["nodes"]),
                    "edge_count": len(graph_data["edges"]),
                    "analyzed": args.analyze,
                    "layout": args.layout if args.analyze else None,
                    "sample_nodes": graph_data["nodes"][:3],
                    "sample_edges": graph_data["edges"][:3]
                }
                
                # 显示格式说明
                preview_data["format_info"] = {
                    "backend_format": "AI4KG Backend Compatible",
                    "node_fields": ["id", "label", "type", "properties", "x", "y", "size", "color"],
                    "edge_fields": ["id", "source_node_id", "target_node_id", "label", "type", "properties", "weight", "color"]
                }
                
                if args.analyze and graph_data["nodes"]:
                    # 显示分析结果统计
                    node_types = {}
                    sizes = []
                    for node in graph_data["nodes"]:
                        node_type = node.get('type', 'unknown')
                        node_types[node_type] = node_types.get(node_type, 0) + 1
                        if 'size' in node and node['size'] is not None:
                            sizes.append(node['size'])
                    
                    preview_data["analysis_stats"] = {
                        "node_types": node_types,
                        "size_range": [min(sizes), max(sizes)] if sizes else None,
                        "layout_algorithm": args.layout
                    }
                
                print(json.dumps(preview_data, indent=2, ensure_ascii=False))
            else:
                result = importer.import_graph(graph_data)
                print(f"导入成功！图谱ID: {result['id']}")
        
        # 批量导入
        elif args.directory:
            logger.info(f"开始批量导入目录: {args.directory}")
            
            results = importer.batch_import(
                directory=args.directory,
                title_prefix=args.title_prefix,
                batch_size=args.batch_size,
                analyze=args.analyze,
                layout_algorithm=args.layout
            )
            
            # 统计结果
            success_count = sum(1 for r in results if r['status'] == 'success')
            failed_count = len(results) - success_count
            
            print(f"\n批量导入完成:")
            print(f"  成功: {success_count}")
            print(f"  失败: {failed_count}")
            print(f"  总计: {len(results)}")
            print(f"  分析: {'是' if args.analyze else '否'}")
            if args.analyze:
                print(f"  布局: {args.layout}")
            
            if failed_count > 0:
                print("\n失败的文件:")
                for result in results:
                    if result['status'] == 'failed':
                        print(f"  {result['file']}: {result.get('error', '未知错误')}")
    
    except Exception as e:
        logger.error(f"导入过程发生错误: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()