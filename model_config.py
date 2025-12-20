#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
模型配置管理模块
该模块负责管理和调用不同类型的语言模型，目前支持本地 Ollama 服务和硅基流动 (SiliconFlow) API。
它提供了统一的接口来获取可用模型列表以及进行同步或流式的模型调用。
"""

import subprocess
import requests
import os

def get_ollama_models():
    """
    获取本地 Ollama 服务中已安装的模型列表。
    通过执行 'ollama list' 命令并解析输出来获取模型名称。
    
    Returns:
        list: 包含本地可用模型名称的列表，如果获取失败则返回空列表。
    """
    try:
        # 执行 ollama list 命令，设置 5 秒超时
        result = subprocess.run(['ollama', 'list'], capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            lines = result.stdout.strip().split('\n')[1:]  # 跳过第一行标题 (NAME, ID, SIZE, MODIFIED)
            models = []
            for line in lines:
                if line.strip():
                    parts = line.split()
                    if parts:
                        model_name = parts[0]
                        models.append(model_name)
            return models
        return []
    except Exception as e:
        print(f"获取 Ollama 模型失败: {e}")
        return []

def call_ollama(model, prompt, stream=False):
    """
    调用本地 Ollama 模型进行文本生成。
    
    Args:
        model (str): 模型名称，例如 'llama3', 'qwen2'。
        prompt (str): 输入的提示词。
        stream (bool): 是否使用流式输出，默认为 False。
        
    Returns:
        str/generator: 如果 stream 为 False，返回生成的完整文本；
                      如果 stream 为 True，返回一个生成器对象。
    """
    from ollama import Client
    # 显式指定连接地址为 127.0.0.1，避免在 Windows 上因 0.0.0.0 导致的网络连接错误 (WinError 10049)
    client = Client(host='http://127.0.0.1:11434')
    if stream:
        # 使用聊天接口进行流式响应
        return client.chat(model=model, messages=[{'role': 'user', 'content': prompt}], stream=True)
    else:
        # 使用生成接口获取完整结果
        return client.generate(model=model, prompt=prompt)['response']

def call_siliconflow(model, prompt, api_key, stream=False):
    """
    调用硅基流动 (SiliconFlow) 提供的在线 API 进行文本生成。
    官网文档: https://docs.siliconflow.cn/
    
    Args:
        model (str): 硅基流动平台上的模型路径，例如 'deepseek-ai/DeepSeek-V3'。
        prompt (str): 输入的提示词。
        api_key (str): 硅基流动的 API 密钥。
        stream (bool): 是否使用流式输出。
        
    Returns:
        requests.Response/str: 如果 stream 为 True，返回原始 Response 对象以便后续流式读取；
                              如果 stream 为 False，返回生成的文本内容。
                              
    Raises:
        Exception: 当 API 调用返回错误或网络异常时抛出。
    """
    url = "https://api.siliconflow.cn/v1/chat/completions"
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    data = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "stream": stream,
        "max_tokens": 2048,
        "temperature": 0.7
    }
    
    try:
        if stream:
            # 流式请求
            response = requests.post(url, headers=headers, json=data, stream=True, timeout=60)
            response.raise_for_status()
            return response
        else:
            # 非流式请求
            response = requests.post(url, headers=headers, json=data, timeout=60)
            response.raise_for_status()
            result = response.json()
            return result['choices'][0]['message']['content']
    except Exception as e:
        raise Exception(f"硅基流动 API 调用失败: {str(e)}")

# 硅基流动平台当前支持的部分热门模型列表
SILICONFLOW_MODELS = [
    "deepseek-ai/DeepSeek-V3",
    "deepseek-ai/DeepSeek-R1",
    "Qwen/Qwen2.5-72B-Instruct",
    "Qwen/Qwen2.5-7B-Instruct",
    "meta-llama/Llama-3.3-70B-Instruct",
    "01-ai/Yi-Lightning",
]

def get_available_models():
    """
    汇总所有可用的模型资源。
    
    Returns:
        dict: 包含 'local' (本地 Ollama 模型) 和 'siliconflow' (API 支持模型) 的字典。
    """
    models = {
        'local': get_ollama_models(),
        'siliconflow': SILICONFLOW_MODELS
    }
    return models

def call_model(model_name, prompt, model_type='local', api_key=None, stream=False):
    """
    统一的模型调用封装接口，屏蔽底层不同服务的调用细节。
    
    Args:
        model_name (str): 模型名称。
        prompt (str): 提示词内容。
        model_type (str): 模型来源类型，可选值为 'local' 或 'siliconflow'。
        api_key (str, optional): API 密钥，仅在 model_type 为 'siliconflow' 时必须。
        stream (bool): 是否使用流式输出。
        
    Returns:
        根据调用的底层函数返回相应的结果。
        
    Raises:
        ValueError: 当参数不合法或传入了不支持的模型类型时。
    """
    if model_type == 'local':
        return call_ollama(model_name, prompt, stream)
    elif model_type == 'siliconflow':
        if not api_key:
            raise ValueError("使用硅基流动 API 需要提供 API Key")
        return call_siliconflow(model_name, prompt, api_key, stream)
    else:
        raise ValueError(f"不支持的模型类型: {model_type}")
