#!/bin/bash

# 检查是否存在.env文件，如果不存在则复制示例文件
if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo "Please edit .env file with your configuration."
fi

# 检查虚拟环境
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python -m venv .venv
fi

# 激活虚拟环境
echo "Activating virtual environment..."
source .venv/bin/activate

# 安装依赖
echo "Installing dependencies..."
pip install -r requirements.txt

# 创建必要的目录
mkdir -p data uploads

# 启动服务器
echo "Starting AI4KG Backend Server..."
uvicorn main:app --reload --host 0.0.0.0 --port 8000