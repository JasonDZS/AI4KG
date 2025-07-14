#!/usr/bin/env python3
"""
测试运行脚本
"""
import os
import sys
import subprocess
import argparse


def run_tests(test_type="all", verbose=False, coverage=False):
    """运行测试"""
    
    # 设置环境变量
    os.environ["TESTING"] = "true"
    os.environ["PYTHONPATH"] = os.path.abspath(".")
    
    # 基础命令
    cmd = ["python", "-m", "pytest"]
    
    # 根据测试类型添加参数
    if test_type == "unit":
        cmd.extend(["-m", "not integration"])
    elif test_type == "integration":
        cmd.extend(["-m", "integration"])
    elif test_type == "auth":
        cmd.extend(["-m", "auth"])
    elif test_type == "graphs":
        cmd.extend(["-m", "graphs"])
    elif test_type == "nodes":
        cmd.extend(["-m", "nodes"])
    elif test_type == "edges":
        cmd.extend(["-m", "edges"])
    elif test_type == "analysis":
        cmd.extend(["-m", "analysis"])
    elif test_type == "files":
        cmd.extend(["-m", "files"])
    elif test_type == "search":
        cmd.extend(["-m", "search"])
    
    # 详细输出
    if verbose:
        cmd.append("-v")
    
    # 覆盖率
    if coverage:
        cmd.extend(["--cov=app", "--cov-report=html", "--cov-report=term-missing"])
    
    # 添加测试目录
    cmd.append("tests/")
    
    print(f"运行命令: {' '.join(cmd)}")
    
    try:
        result = subprocess.run(cmd, check=True)
        print("✅ 测试通过!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ 测试失败，退出码: {e.returncode}")
        return False
    except KeyboardInterrupt:
        print("\n⏹️ 测试被用户中断")
        return False


def main():
    """主函数"""
    parser = argparse.ArgumentParser(description="运行AI4KG后端测试")
    
    parser.add_argument(
        "--type", "-t",
        choices=["all", "unit", "integration", "auth", "graphs", "nodes", "edges", "analysis", "files", "search"],
        default="all",
        help="测试类型"
    )
    
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="详细输出"
    )
    
    parser.add_argument(
        "--coverage", "-c",
        action="store_true",
        help="生成覆盖率报告"
    )
    
    parser.add_argument(
        "--setup-only",
        action="store_true",
        help="仅检查测试环境设置"
    )
    
    args = parser.parse_args()
    
    if args.setup_only:
        print("🔍 检查测试环境...")
        
        # 检查依赖
        try:
            import pytest
            import fastapi
            import sqlalchemy
            print("✅ 测试依赖已安装")
        except ImportError as e:
            print(f"❌ 缺少依赖: {e}")
            return False
        
        # 检查测试文件
        test_files = [
            "tests/conftest.py",
            "tests/test_main.py", 
            "tests/test_auth.py",
            "tests/test_graphs.py",
            "tests/test_nodes.py",
            "tests/test_edges.py"
        ]
        
        missing_files = []
        for file_path in test_files:
            if not os.path.exists(file_path):
                missing_files.append(file_path)
        
        if missing_files:
            print(f"❌ 缺少测试文件: {', '.join(missing_files)}")
            return False
        
        print("✅ 测试环境检查通过")
        return True
    
    print(f"🚀 开始运行 {args.type} 测试...")
    success = run_tests(args.type, args.verbose, args.coverage)
    
    if args.coverage and success:
        print("\n📊 覆盖率报告已生成到 htmlcov/ 目录")
    
    return success


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
