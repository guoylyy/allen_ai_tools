# -*- coding: utf-8 -*-
from .main import app
from .scheduler import start_scheduler

# 应用启动时自动启动定时任务
def startup_event():
    """应用启动时执行"""
    try:
        start_scheduler()
        print("定时统计任务已启动")
    except Exception as e:
        print(f"启动定时任务失败: {e}")

# 注册启动事件
@app.on_event("startup")
async def on_startup():
    startup_event()
