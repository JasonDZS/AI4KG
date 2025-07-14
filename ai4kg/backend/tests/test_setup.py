"""
快速测试脚本，验证服务器是否能正常启动
"""
import sys
import os

def test_imports():
    """测试基本导入"""
    try:
        from fastapi import FastAPI
        print("✅ FastAPI imported successfully")
    except ImportError as e:
        print(f"❌ FastAPI import failed: {e}")
        return False
    
    try:
        os.environ["PYTHONPATH"] = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
        sys.path.append(os.environ["PYTHONPATH"])
        print(f"✅ PYTHONPATH set successfully to {os.environ['PYTHONPATH']}")
        from app.core.config import get_settings
        settings = get_settings()
        print("✅ Config loaded successfully")
        print(f"   Database URL: {settings.database_url}")
    except ImportError as e:
        print(f"❌ Config import failed: {e}")
        return False
    except Exception as e:
        print(f"❌ Config loading failed: {e}")
        return False
    
    return True

def check_dependencies():
    """检查必要的依赖包"""
    dependencies = [
        'fastapi',
        'uvicorn', 
        'pydantic',
        'pydantic_settings',
        'sqlalchemy',
        'dotenv'  # 修正导入名称
    ]
    
    missing = []
    for dep in dependencies:
        try:
            __import__(dep)
            print(f"✅ {dep}")
        except ImportError:
            print(f"❌ {dep}")
            missing.append(dep)
    
    if missing:
        print(f"\n缺少依赖包: {', '.join(missing)}")
        print("请运行: uv sync")
        return False
    
    return True

if __name__ == "__main__":
    print("🔍 检查依赖包...")
    deps_ok = check_dependencies()
    
    print("\n🔍 测试导入...")
    imports_ok = test_imports()
    
    if deps_ok and imports_ok:
        print("\n✅ 所有测试通过！服务器应该能正常启动。")
        print("\n🚀 现在可以运行: uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000")
    else:
        print("\n❌ 存在问题，请先解决上述错误。")