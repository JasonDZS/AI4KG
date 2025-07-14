#!/usr/bin/env python3
"""
AI4KG 图数据验证脚本

验证图数据的完整性和格式正确性。

Usage:
    python validate_graph.py --file graph.gml
    python validate_graph.py --graph-id abc123
"""

import argparse
import json
import sys
import logging
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
import requests

try:
    import networkx as nx
except ImportError:
    print("Warning: NetworkX not installed. File validation will be limited.")
    nx = None

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

class GraphValidator:
    """图数据验证器"""
    
    def __init__(self, api_url: str = "http://localhost:8000"):
        self.api_url = api_url.rstrip('/')
    
    def validate_file(self, file_path: str, verbose: bool = False) -> Dict[str, Any]:
        """验证文件格式和内容"""
        file_path = Path(file_path)
        
        if not file_path.exists():
            return {"valid": False, "error": f"文件不存在: {file_path}"}
        
        if not nx:
            return {"valid": False, "error": "NetworkX未安装，无法验证文件"}
        
        result = {
            "valid": True,
            "file_path": str(file_path),
            "file_size": file_path.stat().st_size,
            "warnings": [],
            "errors": []
        }
        
        try:
            # 尝试加载图
            ext = file_path.suffix.lower()
            if ext == '.gml':
                G = nx.read_gml(file_path, encoding='utf-8')
                result["format"] = "GML"
            elif ext in ['.graphml', '.xml']:
                G = nx.read_graphml(file_path)
                result["format"] = "GraphML"
            elif ext == '.gexf':
                G = nx.read_gexf(file_path, encoding='utf-8')
                result["format"] = "GEXF"
            elif ext == '.json':
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                G = nx.node_link_graph(data)
                result["format"] = "JSON"
            else:
                result["errors"].append(f"不支持的文件格式: {ext}")
                result["valid"] = False
                return result
            
            # 基本统计
            result.update({
                "node_count": len(G.nodes),
                "edge_count": len(G.edges),
                "is_directed": G.is_directed(),
                "is_connected": nx.is_connected(G) if not G.is_directed() else nx.is_weakly_connected(G),
                "density": nx.density(G)
            })
            
            # 检查节点属性
            node_attrs = set()
            nodes_without_labels = 0
            for node, attrs in G.nodes(data=True):
                node_attrs.update(attrs.keys())
                if 'label' not in attrs:
                    nodes_without_labels += 1
            
            result["node_attributes"] = list(node_attrs)
            
            if nodes_without_labels > 0:
                result["warnings"].append(f"缺少标签的节点: {nodes_without_labels}")
            
            # 检查边属性
            edge_attrs = set()
            for source, target, attrs in G.edges(data=True):
                edge_attrs.update(attrs.keys())
            
            result["edge_attributes"] = list(edge_attrs)
            
            # 检查孤立节点
            isolated_nodes = list(nx.isolates(G))
            if isolated_nodes:
                result["warnings"].append(f"孤立节点: {len(isolated_nodes)}")
                if verbose:
                    result["isolated_nodes"] = isolated_nodes[:10]  # 只显示前10个
            
            # 检查自环
            self_loops = list(nx.selfloop_edges(G))
            if self_loops:
                result["warnings"].append(f"自环边: {len(self_loops)}")
                if verbose:
                    result["self_loops"] = self_loops[:10]
            
            # 检查多重边
            if G.is_multigraph():
                result["warnings"].append("包含多重边")
            
            # 检查节点ID类型
            node_id_types = set(type(node).__name__ for node in G.nodes())
            if len(node_id_types) > 1:
                result["warnings"].append(f"节点ID类型不一致: {node_id_types}")
            
            # 检查大型组件
            if not G.is_directed():
                components = list(nx.connected_components(G))
                if len(components) > 1:
                    largest_cc = max(components, key=len)
                    result["largest_component_size"] = len(largest_cc)
                    result["component_count"] = len(components)
                    
                    if len(largest_cc) / len(G.nodes) < 0.8:
                        result["warnings"].append("最大连通组件占比较小")
            
            if verbose:
                # 添加示例数据
                result["sample_nodes"] = list(G.nodes(data=True))[:3]
                result["sample_edges"] = list(G.edges(data=True))[:3]
        
        except Exception as e:
            result["valid"] = False
            result["errors"].append(f"加载文件失败: {str(e)}")
        
        return result
    
    def validate_api_graph(self, graph_id: str, token: Optional[str] = None) -> Dict[str, Any]:
        """验证API中的图数据"""
        headers = {}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        
        try:
            # 获取图数据
            response = requests.get(f"{self.api_url}/api/graphs/{graph_id}", headers=headers)
            response.raise_for_status()
            
            graph_data = response.json()
            if not graph_data.get('success'):
                return {"valid": False, "error": graph_data.get('message', '获取图数据失败')}
            
            data = graph_data['data']
            nodes = data.get('nodes', [])
            edges = data.get('edges', [])
            
            result = {
                "valid": True,
                "graph_id": graph_id,
                "title": data.get('title', ''),
                "description": data.get('description', ''),
                "node_count": len(nodes),
                "edge_count": len(edges),
                "warnings": [],
                "errors": []
            }
            
            # 验证节点
            node_ids = set()
            node_types = set()
            nodes_without_labels = 0
            
            for node in nodes:
                if 'id' not in node:
                    result["errors"].append("节点缺少ID字段")
                    continue
                
                node_id = node['id']
                if node_id in node_ids:
                    result["errors"].append(f"重复的节点ID: {node_id}")
                node_ids.add(node_id)
                
                if 'type' in node:
                    node_types.add(node['type'])
                
                if not node.get('label'):
                    nodes_without_labels += 1
            
            result["node_types"] = list(node_types)
            
            if nodes_without_labels > 0:
                result["warnings"].append(f"缺少标签的节点: {nodes_without_labels}")
            
            # 验证边
            edge_types = set()
            invalid_edges = 0
            
            for edge in edges:
                if 'source' not in edge or 'target' not in edge:
                    result["errors"].append("边缺少source或target字段")
                    continue
                
                source = edge['source']
                target = edge['target']
                
                if source not in node_ids:
                    result["errors"].append(f"边引用不存在的源节点: {source}")
                    invalid_edges += 1
                
                if target not in node_ids:
                    result["errors"].append(f"边引用不存在的目标节点: {target}")
                    invalid_edges += 1
                
                if 'type' in edge:
                    edge_types.add(edge['type'])
            
            result["edge_types"] = list(edge_types)
            result["invalid_edges"] = invalid_edges
            
            # 检查元数据一致性
            metadata = data.get('metadata', {})
            declared_node_count = metadata.get('node_count', 0)
            declared_edge_count = metadata.get('edge_count', 0)
            
            if declared_node_count != len(nodes):
                result["warnings"].append(f"元数据节点数不匹配: 声明{declared_node_count}, 实际{len(nodes)}")
            
            if declared_edge_count != len(edges):
                result["warnings"].append(f"元数据边数不匹配: 声明{declared_edge_count}, 实际{len(edges)}")
            
            # 设置验证状态
            if result["errors"]:
                result["valid"] = False
            
        except requests.exceptions.RequestException as e:
            result = {"valid": False, "error": f"API请求失败: {str(e)}"}
        except Exception as e:
            result = {"valid": False, "error": f"验证过程出错: {str(e)}"}
        
        return result
    
    def print_validation_result(self, result: Dict[str, Any], verbose: bool = False):
        """打印验证结果"""
        if result["valid"]:
            print("✅ 验证通过")
        else:
            print("❌ 验证失败")
            if "error" in result:
                print(f"错误: {result['error']}")
                return
        
        # 基本信息
        if "format" in result:
            print(f"✅ 文件格式: {result['format']}")
        
        print(f"✅ 节点数量: {result.get('node_count', 'N/A')}")
        print(f"✅ 边数量: {result.get('edge_count', 'N/A')}")
        
        if "is_directed" in result:
            print(f"✅ 有向图: {'是' if result['is_directed'] else '否'}")
        
        if "is_connected" in result:
            print(f"✅ 连通性: {'连通' if result['is_connected'] else '不连通'}")
        
        if "density" in result:
            print(f"✅ 图密度: {result['density']:.4f}")
        
        # 属性信息
        if "node_attributes" in result and result["node_attributes"]:
            print(f"✅ 节点属性: {result['node_attributes']}")
        
        if "edge_attributes" in result and result["edge_attributes"]:
            print(f"✅ 边属性: {result['edge_attributes']}")
        
        if "node_types" in result and result["node_types"]:
            print(f"✅ 节点类型: {result['node_types']}")
        
        if "edge_types" in result and result["edge_types"]:
            print(f"✅ 边类型: {result['edge_types']}")
        
        # 警告信息
        if result.get("warnings"):
            print("\n⚠️  警告:")
            for warning in result["warnings"]:
                print(f"   {warning}")
        
        # 错误信息
        if result.get("errors"):
            print("\n❌ 错误:")
            for error in result["errors"]:
                print(f"   {error}")
        
        # 详细信息
        if verbose:
            if "file_size" in result:
                print(f"\n📊 文件大小: {result['file_size']} bytes")
            
            if "largest_component_size" in result:
                print(f"📊 最大连通组件: {result['largest_component_size']}")
            
            if "component_count" in result:
                print(f"📊 连通组件数: {result['component_count']}")
            
            if "sample_nodes" in result:
                print(f"\n📝 示例节点:")
                for node in result["sample_nodes"]:
                    print(f"   {node}")
            
            if "sample_edges" in result:
                print(f"\n📝 示例边:")
                for edge in result["sample_edges"]:
                    print(f"   {edge}")

def main():
    parser = argparse.ArgumentParser(description="验证图数据的完整性和格式")
    
    # 输入选项
    input_group = parser.add_mutually_exclusive_group(required=True)
    input_group.add_argument('--file', '-f', help='验证本地图文件')
    input_group.add_argument('--graph-id', '-g', help='验证API中的图数据')
    
    # 认证选项
    parser.add_argument('--token', help='API认证token')
    parser.add_argument('--api-url', default='http://localhost:8000', help='API服务地址')
    
    # 输出选项
    parser.add_argument('--verbose', '-v', action='store_true', help='详细输出')
    parser.add_argument('--json', action='store_true', help='JSON格式输出')
    
    args = parser.parse_args()
    
    validator = GraphValidator(api_url=args.api_url)
    
    if args.file:
        result = validator.validate_file(args.file, verbose=args.verbose)
    else:
        result = validator.validate_api_graph(args.graph_id, token=args.token)
    
    if args.json:
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        validator.print_validation_result(result, verbose=args.verbose)
    
    # 设置退出码
    sys.exit(0 if result["valid"] else 1)

if __name__ == '__main__':
    main()