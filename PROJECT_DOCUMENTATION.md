# HealthRAG 项目详细文档

## 目录
- [1. 项目概述](#1-项目概述)
- [2. 系统架构](#2-系统架构)
- [3. 技术栈](#3-技术栈)
- [4. 后端设计](#4-后端设计)
- [5. 前端设计](#5-前端设计)
- [6. 核心业务逻辑](#6-核心业务逻辑)
- [7. 数据模型](#7-数据模型)
- [8. API 接口](#8-api-接口)
- [9. 部署指南](#9-部署指南)
- [10. 开发指南](#10-开发指南)

---

## 1. 项目概述

### 1.1 项目简介

**HealthRAG** 是一个基于 RAG（检索增强生成）架构的医疗智能问答系统，采用前后端分离架构，通过知识图谱而非传统向量数据库实现精准的医学知识检索与问答。

### 1.2 核心特性

- **知识图谱驱动**: 使用 Neo4j 图数据库存储约 44,656 个实体和 312,159 个关系
- **混合意图识别**: 结合规则匹配（快速）和大模型（准确）双重策略
- **多模型支持**: 同时支持本地 Ollama 和云端硅基流动 API
- **流式响应**: 实时展示 AI 生成内容，提升用户体验
- **角色权限管理**: 支持用户和管理员双角色系统
- **调试友好**: 可展示实体识别、意图识别、Prompt 等调试信息

### 1.3 项目结构

```
RAGnLLM_System/
├── backend/              # 后端 FastAPI 服务
│   ├── main.py          # 应用入口
│   ├── routes/          # 路由层
│   └── services/        # 业务逻辑层
├── frontend/            # 前端 React 应用
│   ├── src/
│   │   ├── components/  # React 组件
│   │   ├── pages/       # 页面组件
│   │   ├── services/    # API 服务
│   │   └── contexts/    # React Context
│   └── package.json
├── data/                # 数据文件
├── model/               # NER 模型文件
├── img/                 # 图片资源
└── tmp_data/           # 临时数据
```

---

## 2. 系统架构

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        前端层 (Frontend)                     │
│  React + TypeScript + Vite + Tailwind CSS + Framer Motion   │
└─────────────────────────┬───────────────────────────────────┘
                          │ RESTful API (流式JSON响应)
                          │
┌─────────────────────────┴───────────────────────────────────┐
│                        后端层 (Backend)                      │
│                      FastAPI + Python                       │
├─────────────────────────────────────────────────────────────┤
│  路由层 (Routes)                                            │
│  ├── auth_routes.py    - 用户认证                           │
│  ├── chat_routes.py    - 聊天对话                           │
│  ├── model_routes.py   - 模型管理                           │
│  └── neo4j_routes.py   - 知识图谱                           │
├─────────────────────────────────────────────────────────────┤
│  服务层 (Services)                                           │
│  ├── AuthService      - 认证服务                            │
│  ├── ChatService      - 聊天核心逻辑                        │
│  ├── NerService       - 命名实体识别                        │
│  ├── IntentService    - 意图识别                            │
│  ├── PromptService    - Prompt 生成                         │
│  ├── Neo4jService     - 知识图谱服务                        │
│  └── ModelService     - 模型调用服务                        │
└─────────────────────────┬───────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
┌───────▼────────┐ ┌──────▼──────┐ ┌───────▼────────┐
│   Neo4j        │ │   NER Model │ │   LLM Models  │
│   Graph DB     │ │ (BERT+RNN)  │ │ (Ollama/API)  │
│  44K+ 实体     │ │             │ │               │
│  312K+ 关系    │ │             │ │               │
└────────────────┘ └─────────────┘ └────────────────┘
```

### 2.2 数据流图

```
用户提问
    │
    ▼
┌─────────────────┐
│  前端 ChatPage  │
└────────┬────────┘
         │ POST /api/chat/stream
         ▼
┌─────────────────────────────────────┐
│         ChatService                 │
│  1. 连接 Neo4j                      │
│  2. NER 实体提取                    │
│  3. 意图识别                        │
│  4. 知识检索 & Prompt 生成          │
│  5. 调用 LLM 生成答案               │
└─────────────────────────────────────┘
         │ 流式响应
         ▼
┌─────────────────┐
│  前端实时渲染    │
└─────────────────┘
```

---

## 3. 技术栈

### 3.1 后端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Python | 3.x | 后端开发语言 |
| FastAPI | 0.115.6 | Web 框架 |
| ollama | 0.4.4 | 本地模型调用 |
| py2neo | 2021.2.4 | Neo4j 客户端 |
| torch | 2.5.1 | 深度学习框架 |
| transformers | 4.47.0 | BERT 模型 |
| scikit-learn | - | TF-IDF 特征提取 |
| seqeval | 1.2.2 | NER 评估指标 |

### 3.2 前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.3.1 | UI 框架 |
| TypeScript | 5.6.3 | 类型安全 |
| Vite | 5.4.11 | 构建工具 |
| Tailwind CSS | 3.4.17 | 样式框架 |
| Framer Motion | 12.23.26 | 动画库 |
| react-router-dom | 6.28.0 | 路由管理 |
| react-markdown | 10.1.0 | Markdown 渲染 |
| Lucide React | - | 图标库 |

### 3.3 基础设施

| 技术 | 用途 |
|------|------|
| Neo4j | 知识图谱数据库 |
| Ollama | 本地大模型运行环境 |
| SiliconFlow API | 云端大模型服务 |

---

## 4. 后端设计

### 4.1 应用入口

**文件**: `backend/main.py`

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import auth_router, model_router, neo4j_router, chat_router

def create_app() -> FastAPI:
    app = FastAPI(title="RAG 医疗问答系统 API", version="0.1.0")

    # CORS 配置
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # 注册路由
    app.include_router(auth_router, prefix="/api/auth")
    app.include_router(model_router, prefix="/api/models")
    app.include_router(neo4j_router, prefix="/api/neo4j")
    app.include_router(chat_router, prefix="/api/chat")

    return app

app = create_app()

@app.get("/health")
async def health_check():
    return {"status": "ok"}
```

### 4.2 路由层

#### 4.2.1 认证路由

**文件**: `backend/routes/auth_routes.py`

| 端点 | 方法 | 描述 | 参数 |
|------|------|------|------|
| `/api/auth/login` | POST | 用户登录 | username, password |
| `/api/auth/register` | POST | 用户注册 | username, password |

#### 4.2.2 聊天路由

**文件**: `backend/routes/chat_routes.py`

| 端点 | 方法 | 描述 | 参数 |
|------|------|------|------|
| `/api/chat/stream` | POST | 流式对话 | query, model_source, model_name, api_key, neo4j_password |

#### 4.2.3 模型路由

**文件**: `backend/routes/model_routes.py`

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/models` | GET | 获取可用模型列表 |

#### 4.2.4 Neo4j 路由

**文件**: `backend/routes/neo4j_routes.py`

| 端点 | 方法 | 描述 | 参数 |
|------|------|------|------|
| `/api/neo4j/connect` | POST | 连接知识图谱 | password |
| `/api/neo4j/status` | GET | 查询连接状态 |

### 4.3 服务层

#### 4.3.1 AuthService - 认证服务

**文件**: `backend/services/auth_service.py`

```python
class AuthService:
    def __init__(self):
        self._credentials = load_credentials()

    def login(self, username: str, password: str) -> Dict[str, str]:
        user_cred = self._credentials.get(username)
        if user_cred and user_cred.password == password:
            role = "admin" if user_cred.is_admin else "user"
            return {"ok": "true", "message": "登录成功", "role": role}
        return {"ok": "false", "message": "用户名或密码错误"}

    def register(self, username: str, password: str) -> Dict[str, str]:
        if username in self._credentials:
            return {"ok": "false", "message": "用户名已存在"}
        self._credentials[username] = Credentials(username, password)
        save_credentials(self._credentials)
        return {"ok": "true", "message": "注册成功"}
```

#### 4.3.2 ChatService - 聊天核心逻辑

**文件**: `backend/services/chat_service.py`

**工作流程**:

1. **连接 Neo4j**: 确保知识图谱连接正常
2. **实体提取**: 使用 NER 服务识别问题中的医疗实体
3. **意图识别**: 判断用户问题的类型（简介、治疗、药品等）
4. **知识检索**: 根据意图和实体从知识图谱检索相关信息
5. **Prompt 生成**: 构建包含检索结果的提示词
6. **LLM 调用**: 调用本地或云端模型生成答案
7. **流式返回**: 实时返回生成内容

```python
def stream_chat(self, query, model_source, model_name, api_key, neo4j_password):
    # 步骤 1: 连接 Neo4j
    if not neo4j_service.status().get("connected"):
        neo4j_service.connect(custom_password=neo4j_password)

    # 步骤 2: 实体提取
    entities = ner_service.get_entities(query)

    # 步骤 3: 意图识别
    intent_result = intent_service.recognize(query, model_name, model_source, api_key)

    # 步骤 4: 生成提示词
    prompt, yitu, entities = prompt_service.generate_prompt(
        intent_result, query, neo4j_service.client, entities
    )

    # 步骤 5: 发送元数据
    yield json.dumps({
        "type": "meta",
        "intent": yitu,
        "entities": entities,
        "prompt": prompt
    })

    # 步骤 6: 调用模型生成答案
    if model_source == "local":
        for chunk in ollama_client.chat(model=model_name, messages=[...], stream=True):
            yield json.dumps({"type": "delta", "content": chunk["message"]["content"]})
    else:
        for line in stream_response.iter_lines():
            yield json.dumps({"type": "delta", "content": delta})

    yield json.dumps({"type": "done"})
```

#### 4.3.3 NerService - 命名实体识别

**文件**: `backend/services/ner_service.py`

**模型架构**: BERT + Bi-RNN + CRF

```python
class Bert_Model(nn.Module):
    def __init__(self, model_name, hidden_size, tag_num, bi=True):
        super().__init__()
        self.bert = BertModel.from_pretrained(model_name)
        self.gru = nn.RNN(
            input_size=768,
            hidden_size=hidden_size,
            num_layers=2,
            batch_first=True,
            bidirectional=bi
        )
        self.classifier = nn.Linear(hidden_size * 2, tag_num)
        self.loss_fn = nn.CrossEntropyLoss(ignore_index=0)
```

**识别流程**:

1. **模型预测**: BERT 编码 + Bi-RNN 序列建模 + 分类器
2. **规则匹配**: 使用 AC 自动机匹配实体词典
3. **结果合并**: 合并模型和规则结果
4. **TF-IDF 对齐**: 优化边界对齐

**性能**: F1 = 97.40%

#### 4.3.4 IntentService - 意图识别

**文件**: `backend/services/intent_service.py`

**混合策略**:

| 策略 | 优先级 | 准确性 | 速度 |
|------|--------|--------|------|
| 规则匹配 | 1 | 中 | 快 |
| LLM 识别 | 2 | 高 | 慢 |

```python
def recognize(self, query, model_name, model_type, api_key):
    # 1. 规则匹配（优先）
    for keyword, intents in self._simple_intents.items():
        if keyword in query:
            return f"{intents} # 根据关键词'{keyword}'匹配"

    # 2. LLM 意图识别（回退）
    prompt = f"""
    你是医疗意图识别专家。分析用户问题："{query}"
    从以下类别选择最相关的（可多选，最多3个）：
    - 查询疾病简介
    - 查询疾病病因
    - 查询疾病症状
    - 查询疾病治疗方法
    - 查询疾病使用药品
    - 查询疾病宜吃食物
    - 查询疾病忌吃食物
    - 查询疾病需要检查
    - 查询疾病治愈概率
    - 查询疾病治疗周期
    - 查询疾病易感人群
    直接输出：["类别1", "类别2"]
    """
    return model_config.call_model(model_name, prompt, model_type, api_key, stream=False)
```

#### 4.3.5 PromptService - Prompt 生成

**文件**: `backend/services/prompt_service.py`

**Prompt 结构**:

```
<指令>
你是一个医疗问答机器人，你需要根据给定的提示回答用户的问题。
</指令>

<提示>
{知识检索结果}
</提示>

<用户问题>
{用户原始问题}
</用户问题>

<注意>
你的全部回答必须完全基于给定的提示，不能使用提示之外的知识。
</注意>
```

**知识检索策略**:

| 意图 | 检索内容 | Cypher 查询示例 |
|------|----------|----------------|
| 简介 | 疾病属性 | `MATCH (n:疾病{名称:$name}) RETURN n.疾病简介` |
| 症状 | 疾病症状 | `MATCH (d:疾病)-[:has_symptom]->(s:疾病症状) WHERE d.名称=$name RETURN s.名称` |
| 药品 | 使用药品 | `MATCH (d:疾病)-[:common_drug]->(m:药品) WHERE d.名称=$name RETURN m.名称` |
| 宜吃 | 宜吃食物 | `MATCH (d:疾病)-[:do_eat]->(f:食物) WHERE d.名称=$name RETURN f.名称` |
| 忌吃 | 忌吃食物 | `MATCH (d:疾病)-[:no_eat]->(f:食物) WHERE d.名称=$name RETURN f.名称` |

#### 4.3.6 Neo4jService - 知识图谱服务

**文件**: `backend/services/neo4j_service.py`

```python
class Neo4jService:
    def __init__(self):
        self._client = None
        self._status = {"connected": False}

    def connect(self, custom_password=None):
        attempts = [
            {"uri": "bolt://localhost:7687", "user": "neo4j", "password": custom_password or "neo4j"},
            {"uri": "bolt://localhost:7687", "user": "neo4j", "password": "password"},
        ]

        for attempt in attempts:
            try:
                self._client = Graph(attempt["uri"], auth=(attempt["user"], attempt["password"]))
                self._status["connected"] = True
                return True
            except Exception:
                continue
        return False

    def status(self):
        return self._status

    @property
    def client(self):
        return self._client
```

#### 4.3.7 ModelService - 模型调用服务

**文件**: `backend/services/model_service.py`

**支持的模型源**:

| 模型源 | 描述 | 示例模型 |
|--------|------|----------|
| local | 本地 Ollama | qwen2.5, llama3, deepseek |
| siliconflow | 云端硅基流动 | DeepSeek-V3, Qwen2.5-72B |

```python
def get_ollama_models():
    result = subprocess.run(['ollama', 'list'], capture_output=True, text=True, timeout=5)
    # 解析输出返回模型列表

def call_ollama(model, prompt, stream=False):
    client = Client(host='http://127.0.0.1:11434')
    return client.chat(model=model, messages=[{'role': 'user', 'content': prompt}], stream=True)

def call_siliconflow(model, prompt, api_key, stream=False):
    url = "https://api.siliconflow.cn/v1/chat/completions"
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    data = {"model": model, "messages": [{"role": "user", "content": prompt}], "stream": stream}
    response = requests.post(url, headers=headers, json=data, stream=True, timeout=60)
    return response
```

---

## 5. 前端设计

### 5.1 应用入口

**文件**: `frontend/src/main.tsx`

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import App from './App';

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
```

### 5.2 路由配置

**文件**: `frontend/src/App.tsx`

```typescript
<Routes location={location} key={location.pathname}>
  <Route path="/" element={<Navigate to="/chat" replace />} />
  <Route path="/login" element={<LoginPage />} />
  <Route path="/register" element={<RegisterPage />} />
  <Route path="/chat" element={
    <RequireAuth>
      <ChatPage />
    </RequireAuth>
  } />
</Routes>
```

### 5.3 页面组件

#### 5.3.1 LoginPage - 登录页

**文件**: `frontend/src/pages/LoginPage.tsx`

**特性**:
- 分屏布局（表单 + 品牌展示）
- 动态背景装饰动画
- 表单验证
- 成功后自动跳转到聊天页

#### 5.3.2 RegisterPage - 注册页

**文件**: `frontend/src/pages/RegisterPage.tsx`

**特性**:
- 注册表单
- 用户名重复检查
- 成功后自动跳转到登录页

#### 5.3.3 ChatPage - 聊天页

**文件**: `frontend/src/pages/ChatPage.tsx`

**核心功能**:
- 多会话窗口管理
- 模型源切换（本地/云端）
- 模型选择
- Neo4j 连接状态监控
- 调试信息开关
- 流式响应处理

**状态管理**:

```typescript
const [sessions, setSessions] = useState<Session[]>([]);
const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
const [modelSource, setModelSource] = useState<'local' | 'siliconflow'>('local');
const [models, setModels] = useState<string[]>([]);
const [selectedModel, setSelectedModel] = useState<string>('');
const [neo4jStatus, setNeo4jStatus] = useState<Neo4jStatus>({ connected: false });
const [showDebug, setShowDebug] = useState(false);
```

**消息发送流程**:

```typescript
const handleSend = async (text: string) => {
  // 1. 创建用户消息
  const userMsg: ChatMessage = {
    id: generateId(),
    role: 'user',
    content: text
  };

  // 2. 创建助手消息
  const assistantMsg: ChatMessage = {
    id: generateId(),
    role: 'assistant',
    content: ''
  };

  // 3. 更新会话
  updateSession(sessionId, s => ({
    ...s,
    messages: [...s.messages, userMsg, assistantMsg]
  }));

  // 4. 调用流式 API
  await streamChat({
    query: text,
    model_source: modelSource,
    model_name: selectedModel,
    api_key: apiKey,
    neo4j_password: neo4jPassword
  }, {
    onMeta: (meta) => {
      updateAssistant(assistantMsg.id, msg => ({
        ...msg,
        ent: meta.entities,
        intent: meta.intent,
        prompt: meta.prompt
      }));
    },
    onDelta: (delta) => {
      updateAssistant(assistantMsg.id, msg => ({
        ...msg,
        content: msg.content + delta
      }));
    },
    onDone: () => {
      setStreamingIds(prev => prev.filter(id => id !== assistantMsg.id));
    }
  });
};
```

### 5.4 组件

#### 5.4.1 Sidebar - 侧边栏

**文件**: `frontend/src/components/Sidebar.tsx`

**功能**:
- 折叠/展开动画
- 模型源切换
- 历史会话列表
- Neo4j 状态指示（呼吸灯动画）
- 设置入口（仅管理员）

#### 5.4.2 ChatMessage - 消息组件

**文件**: `frontend/src/components/ChatMessage.tsx`

**结构**:

```typescript
<div className="flex flex-col gap-2">
  {/* 消息内容 */}
  <div className="prose prose-sm">
    <ReactMarkdown>{message.content}</ReactMarkdown>
  </div>

  {/* 调试信息折叠 */}
  {showDebug && (
    <Accordion>
      <EntityDisplay entities={message.ent} />
      <IntentDisplay intent={message.intent} />
      <KnowledgeDisplay knowledge={message.knowledge} />
    </Accordion>
  )}
</div>
```

#### 5.4.3 ChatWindow - 聊天窗口

**文件**: `frontend/src/components/ChatWindow.tsx`

**功能**:
- 消息列表展示（自动滚动）
- 输入区域
- Enter 发送，Shift+Enter 换行
- 流式响应状态指示

#### 5.4.4 MessageList - 消息列表

**文件**: `frontend/src/components/MessageList.tsx`

**功能**:
- 欢迎界面（空状态）
- 消息自动滚动到底部
- 流式响应动画

#### 5.4.5 SettingsModal - 设置弹窗

**文件**: `frontend/src/components/SettingsModal.tsx`

**功能**:
- Neo4j 连接配置（仅管理员）
- 调试信息开关（仅管理员）
- API Key 配置

### 5.5 API 服务

#### 5.5.1 chatApi - 聊天 API

**文件**: `frontend/src/services/chatApi.ts`

```typescript
export interface ChatStreamPayload {
  query: string;
  model_source: 'local' | 'siliconflow';
  model_name: string;
  api_key?: string;
  neo4j_password?: string;
}

export interface StreamCallbacks {
  onMeta: (meta: MetaData) => void;
  onDelta: (delta: string) => void;
  onDone: () => void;
}

export async function streamChat(
  payload: ChatStreamPayload,
  callbacks: StreamCallbacks
) {
  const res = await fetch(`${API_BASE}/api/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    let index = buffer.indexOf("\n");
    while (index >= 0) {
      const line = buffer.slice(0, index).trim();
      if (line) {
        const data = JSON.parse(line);
        if (data.type === "meta") callbacks.onMeta(data);
        if (data.type === "delta") callbacks.onDelta(data.content);
        if (data.type === "done") callbacks.onDone();
      }
      buffer = buffer.slice(index + 1);
      index = buffer.indexOf("\n");
    }
  }
}
```

#### 5.5.2 authApi - 认证 API

**文件**: `frontend/src/services/authApi.ts`

```typescript
export async function login(username: string, password: string) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  return res.json();
}

export async function register(username: string, password: string) {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  return res.json();
}
```

#### 5.5.3 modelApi - 模型 API

**文件**: `frontend/src/services/modelApi.ts`

```typescript
export async function getModels(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/api/models`);
  const data = await res.json();
  return data.models || [];
}
```

#### 5.5.4 neo4jApi - Neo4j API

**文件**: `frontend/src/services/neo4jApi.ts`

```typescript
export async function connectNeo4j(password: string): Promise<{ ok: string }> {
  const res = await fetch(`${API_BASE}/api/neo4j/connect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password })
  });
  return res.json();
}

export async function getNeo4jStatus(): Promise<Neo4jStatus> {
  const res = await fetch(`${API_BASE}/api/neo4j/status`);
  return res.json();
}
```

### 5.6 上下文与类型

#### 5.6.1 AuthContext - 认证上下文

**文件**: `frontend/src/contexts/AuthContext.tsx`

```typescript
export interface AuthState {
  username: string;
  role: 'user' | 'admin';
}

export interface AuthContextValue {
  auth: AuthState | null;
  setAuth: (auth: AuthState | null) => void;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuthState] = useState<AuthState | null>(readStoredAuth());

  const setAuth = (next: AuthState | null) => {
    setAuthState(next);
    if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ auth, setAuth }}>
      {children}
    </AuthContext.Provider>
  );
}
```

#### 5.6.2 类型定义

**文件**: `frontend/src/types/chat.ts`

```typescript
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  ent?: string;        // 实体识别结果
  intent?: string;     // 意图识别结果
  prompt?: string;     // 完整 Prompt
  knowledge?: string;  // 知识库检索内容
}

export interface Session {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
}

export interface Neo4jStatus {
  connected: boolean;
  uri?: string;
  user?: string;
}

export interface MetaData {
  type: 'meta';
  intent: string;
  entities: Record<string, string>;
  prompt: string;
}
```

---

## 6. 核心业务逻辑

### 6.1 知识图谱构建

**文件**: `build_up_graph.py`

**数据源**: DiseaseKG 医疗数据集

**实体类型** (8类):

| 实体类型 | 数量 | 属性 |
|----------|------|------|
| 疾病 | 8,808 | 名称、简介、病因、预防措施、治疗周期、治愈概率、易感人群 |
| 药品 | 3,828 | 名称、别名 |
| 食物 | 4,870 | 名称、别名 |
| 检查项目 | 3,353 | 名称、别名 |
| 科目 | 54 | 名称、别名 |
| 药品商 | 17,201 | 名称、别名 |
| 疾病症状 | 5,998 | 名称、别名 |
| 治疗方法 | 544 | 名称、别名 |

**关系类型** (11类):

| 关系类型 | 描述 | 示例 |
|----------|------|------|
| has_symptom | 疾病具有症状 | (感冒)-[has_symptom]->(发热) |
| need_check | 疾病需要检查 | (感冒)-[need_check]->(血常规) |
| do_eat | 疾病宜吃食物 | (感冒)-[do_eat]->(姜汤) |
| no_eat | 疾病忌吃食物 | (感冒)-[no_eat]->(辛辣食物) |
| common_drug | 疾病常用药品 | (感冒)-[common_drug]->(感冒灵) |
| cure_way | 疾病治疗方法 | (感冒)-[cure_way]->(休息) |
| belongs_to | 疾病所属科目 | (感冒)-[belongs_to]->(内科) |
| has_department | 疾病所属科室 | (感冒)-[has_department]->(呼吸科) |
| easy_get | 疾病易感人群 | (感冒)-[easy_get]->(儿童) |
| is_symptom_of | 症状属于疾病 | (发热)-[is_symptom_of]->(感冒) |
| is_check_of | 检查属于疾病 | (血常规)-[is_check_of]->(感冒) |

**构建流程**:

```python
def import_disease_data(driver, type, entity):
    """导入疾病实体"""
    order = """
    CREATE (n:%s {
        名称: $name,
        疾病简介: $desc,
        疾病病因: $cause,
        预防措施: $prevent,
        治疗周期: $cure_lasttime,
        治愈概率: $cured_prob,
        疾病易感人群: $easy_get
    })
    """ % type
    session.run(order, name=disease["名称"], ...)

def create_all_relationship(driver, all_relationship):
    """创建实体间关系"""
    order = """
    match (a:%s{名称:"%s"}),(b:%s{名称:"%s"})
    create (a)-[r:%s]->(b)
    """
    session.run(order % (type1, name1, type2, name2, rel_type))
```

### 6.2 NER 模型训练与推理

**文件**: `ner_model.py`

**模型架构**:

```
输入句子
    │
    ▼
BERT Encoder (chinese-roberta-wwm-ext)
    │
    ▼ (768-dim)
Bi-RNN (2层, hidden_size=128)
    │
    ▼ (256-dim)
Linear Classifier
    │
    ▼ (tag_num)
CRF (可选)
    │
    ▼
标签序列
```

**数据增强策略**:

| 策略 | 描述 | 示例 |
|------|------|------|
| 实体替换 | 用同类其他实体替换 | "感冒" → "发烧" |
| 实体掩码 | 随机掩盖部分字符 | "感冒" → "感*" |
| 实体拼接 | 增加并列实体 | "感冒" → "感冒和发烧" |

**推理流程**:

```python
def get_ner_result(model, tokenizer, sen, rule, tfidf_r, device, idx2tag):
    # 1. 模型预测
    inputs = tokenizer(sen, return_tensors="pt", truncation=True, padding=True)
    with torch.no_grad():
        outputs = model(inputs["input_ids"].to(device))
        pre_tag = [idx2tag[idx] for idx in outputs.argmax(dim=-1)[0]]

    # 2. 规则匹配 (AC 自动机)
    rule_result = rule.find(sen)

    # 3. 结果合并
    merge_result = merge(pre_tag, rule_result)

    # 4. TF-IDF 对齐
    tfidf_result = tfidf_r.align(merge_result)

    return tfidf_result
```

**性能指标**:

| 模型 | Precision | Recall | F1 |
|------|-----------|--------|-----|
| chinese-roberta-wwm-ext (基础) | 95.8% | 96.2% | 96.0% |
| + 数据增强 | 97.1% | 97.7% | 97.4% |

### 6.3 意图识别

**意图分类**:

| 意图类别 | 关键词 | 示例问题 |
|----------|--------|----------|
| 查询疾病简介 | 简介、是什么 | "感冒是什么？" |
| 查询疾病病因 | 病因、原因 | "感冒的病因是什么？" |
| 查询疾病症状 | 症状、表现 | "感冒有什么症状？" |
| 查询疾病治疗方法 | 治疗、怎么办 | "感冒怎么治疗？" |
| 查询疾病使用药品 | 药品、吃药 | "感冒吃什么药？" |
| 查询疾病宜吃食物 | 宜吃、可以吃 | "感冒可以吃什么？" |
| 查询疾病忌吃食物 | 忌吃、不能吃 | "感冒不能吃什么？" |
| 查询疾病需要检查 | 检查、检查什么 | "感冒需要检查什么？" |
| 查询疾病治愈概率 | 治愈概率、能好吗 | "感冒能治好吗？" |
| 查询疾病治疗周期 | 治疗周期、多久 | "感冒治疗需要多久？" |
| 查询疾病易感人群 | 易感人群、谁容易得 | "谁容易得感冒？" |

### 6.4 模型配置

**文件**: `model_config.py`

**支持的模型源**:

#### 6.4.1 本地 Ollama

```python
def get_ollama_models():
    """获取本地 Ollama 模型列表"""
    result = subprocess.run(
        ['ollama', 'list'],
        capture_output=True,
        text=True,
        timeout=5
    )
    lines = result.stdout.strip().split('\n')[1:]  # 跳过表头
    models = [line.split()[0] for line in lines if line.strip()]
    return models

def call_ollama(model, prompt, stream=False):
    """调用本地 Ollama"""
    client = Client(host='http://127.0.0.1:11434')
    return client.chat(
        model=model,
        messages=[{'role': 'user', 'content': prompt}],
        stream=True
    )
```

#### 6.4.2 云端硅基流动

```python
def call_siliconflow(model, prompt, api_key, stream=False):
    """调用硅基流动 API"""
    url = "https://api.siliconflow.cn/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    data = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "stream": stream
    }
    response = requests.post(
        url,
        headers=headers,
        json=data,
        stream=True,
        timeout=60
    )
    return response
```

**推荐模型**:

| 模型源 | 模型名称 | 特点 |
|--------|----------|------|
| local | qwen2.5 | 中文能力强，本地运行 |
| local | llama3 | 通用能力强 |
| siliconflow | DeepSeek-V3 | 最新模型，推理能力强 |
| siliconflow | Qwen2.5-72B | 大参数模型，效果更好 |

---

## 7. 数据模型

### 7.1 用户凭据

**文件**: `user_data_storage.py`

```python
class Credentials:
    def __init__(self, username: str, password: str, is_admin: bool = False):
        self.username = username
        self.password = password
        self.is_admin = is_admin
```

**存储格式**: JSON 文件 (`tmp_data/user_credentials.json`)

```json
{
  "admin": {
    "username": "admin",
    "password": "admin123",
    "is_admin": true
  },
  "user1": {
    "username": "user1",
    "password": "password123",
    "is_admin": false
  }
}
```

### 7.2 聊天请求

**文件**: `backend/routes/chat_routes.py`

```python
class ChatRequest(BaseModel):
    query: str                    # 用户问题
    model_source: str             # 'local' 或 'siliconflow'
    model_name: str               # 模型名称
    api_key: str | None = None    # 硅基流动 API Key
    neo4j_password: str | None = None  # Neo4j 密码
```

### 7.3 前端消息类型

**文件**: `frontend/src/types/chat.ts`

```typescript
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  ent?: string;        // 实体识别结果
  intent?: string;     // 意图识别结果
  prompt?: string;     // 完整 Prompt
  knowledge?: string;  // 知识库检索内容
}

export interface Session {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
}

export interface Neo4jStatus {
  connected: boolean;
  uri?: string;
  user?: string;
}
```

---

## 8. API 接口

### 8.1 认证接口

#### 8.1.1 用户登录

**端点**: `POST /api/auth/login`

**请求体**:

```json
{
  "username": "admin",
  "password": "admin123"
}
```

**响应**:

```json
{
  "ok": "true",
  "message": "登录成功",
  "role": "admin"
}
```

#### 8.1.2 用户注册

**端点**: `POST /api/auth/register`

**请求体**:

```json
{
  "username": "newuser",
  "password": "password123"
}
```

**响应**:

```json
{
  "ok": "true",
  "message": "注册成功"
}
```

### 8.2 模型接口

#### 8.2.1 获取模型列表

**端点**: `GET /api/models`

**响应**:

```json
{
  "models": ["qwen2.5", "llama3", "deepseek-r1"],
  "source": "local"
}
```

### 8.3 Neo4j 接口

#### 8.3.1 连接 Neo4j

**端点**: `POST /api/neo4j/connect`

**请求体**:

```json
{
  "password": "neo4j"
}
```

**响应**:

```json
{
  "ok": "true",
  "message": "连接成功"
}
```

#### 8.3.2 查询 Neo4j 状态

**端点**: `GET /api/neo4j/status`

**响应**:

```json
{
  "connected": true,
  "uri": "bolt://localhost:7687",
  "user": "neo4j"
}
```

### 8.4 聊天接口

#### 8.4.1 流式对话

**端点**: `POST /api/chat/stream`

**请求体**:

```json
{
  "query": "感冒是什么？",
  "model_source": "local",
  "model_name": "qwen2.5",
  "api_key": null,
  "neo4j_password": "neo4j"
}
```

**响应格式**: SSE (Server-Sent Events) 流式 JSON

**第一个数据包**:

```json
{
  "type": "meta",
  "intent": "查询疾病简介",
  "entities": {
    "疾病": "感冒"
  },
  "prompt": "..."
}
```

**后续数据包**:

```json
{"type": "delta", "content": "感冒"}
{"type": "delta", "content": "，又称"}
{"type": "delta", "content": "上呼吸道感染"}
...
```

**结束数据包**:

```json
{"type": "done"}
```

---

## 9. 部署指南

### 9.1 环境要求

- **操作系统**: Windows/Linux/macOS
- **Python**: 3.8+
- **Node.js**: 16+
- **Neo4j**: 4.4+ (推荐 5.x)
- **Ollama**: 最新版 (可选，用于本地模型)

### 9.2 后端部署

#### 9.2.1 安装依赖

```bash
cd backend
pip install -r requirements.txt
```

**requirements.txt 内容**:

```
fastapi==0.115.6
uvicorn[standard]==0.32.1
ollama==0.4.4
py2neo==2021.2.4
torch==2.5.1
transformers==4.47.0
scikit-learn
seqeval==1.2.2
pyahocorasick
requests
```

#### 9.2.2 启动 Neo4j

```bash
# Windows (假设 Neo4j 安装在 C:\neo4j)
cd C:\neo4j\bin
neo4j.bat console

# Linux/Mac
neo4j start
```

默认密码: `neo4j`

首次登录后修改密码。

#### 9.2.3 导入知识图谱

```bash
cd project_root
python build_up_graph.py
```

#### 9.2.4 启动后端服务

```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

服务地址: `http://localhost:8000`

### 9.3 前端部署

#### 9.3.1 安装依赖

```bash
cd frontend
npm install
```

#### 9.3.2 启动开发服务器

```bash
npm run dev
```

服务地址: `http://localhost:5173`

#### 9.3.3 构建生产版本

```bash
npm run build
```

构建产物在 `frontend/dist/` 目录。

#### 9.3.4 部署静态文件

使用 Nginx 或其他 Web 服务器托管 `frontend/dist/` 目录。

**Nginx 配置示例**:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 9.4 Ollama 部署 (可选)

#### 9.4.1 安装 Ollama

**Windows**:
下载安装包: https://ollama.ai/download

**Linux**:
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

#### 9.4.2 拉取模型

```bash
ollama pull qwen2.5
ollama pull llama3
```

#### 9.4.3 验证安装

```bash
ollama list
```

### 9.5 生产环境配置

#### 9.5.1 使用 PM2 运行后端

```bash
npm install -g pm2
pm2 start "uvicorn backend.main:app --host 0.0.0.0 --port 8000" --name "healthrag-backend"
pm2 startup
pm2 save
```

#### 9.5.2 使用 Nginx 反向代理

```nginx
upstream backend {
    server localhost:8000;
}

server {
    listen 80;
    server_name your-domain.com;

    location /api {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_buffering off;
        proxy_cache off;
    }

    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

#### 9.5.3 使用 HTTPS (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 10. 开发指南

### 10.1 本地开发环境搭建

#### 10.1.1 克隆项目

```bash
git clone git@github.com:iZiTTMarvin/HealthRAG.git
cd RAGnLLM_System
```

#### 10.1.2 配置后端

```bash
cd backend
pip install -r requirements.txt
```

#### 10.1.3 配置前端

```bash
cd frontend
npm install
```

#### 10.1.4 启动开发服务器

**终端 1 - 后端**:
```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**终端 2 - 前端**:
```bash
cd frontend
npm run dev
```

### 10.2 代码规范

#### 10.2.1 后端 Python 代码规范

- 使用 PEP 8 风格
- 函数和类使用文档字符串
- 类型注解 (Type Hints)
- 中文注释

**示例**:

```python
def recognize(self, query: str, model_name: str, model_type: str, api_key: str) -> str:
    """
    识别用户问题的意图

    Args:
        query: 用户问题
        model_name: 模型名称
        model_type: 模型类型 ('local' 或 'siliconflow')
        api_key: API 密钥

    Returns:
        意图识别结果
    """
    # 实现代码
    pass
```

#### 10.2.2 前端 TypeScript 代码规范

- 使用 ESLint + Prettier
- 组件使用函数式组件 + Hooks
- 类型注解 (TypeScript)
- 组件注释

**示例**:

```typescript
/**
 * 聊天消息组件
 * @param props - 组件属性
 */
export function ChatMessage({ message, showDebug }: ChatMessageProps) {
  // 实现代码
}
```

### 10.3 测试

#### 10.3.1 后端测试

```bash
cd backend
pytest tests/
```

#### 10.3.2 前端测试

```bash
cd frontend
npm test
```

### 10.4 调试

#### 10.4.1 后端调试

使用 VS Code Python 调试器或添加断点:

```python
import pdb; pdb.set_trace()
```

#### 10.4.2 前端调试

使用浏览器开发者工具 (F12) 或 React DevTools。

### 10.5 常见问题

#### 10.5.1 Neo4j 连接失败

**问题**: 无法连接到 Neo4j

**解决方案**:
1. 检查 Neo4j 是否启动: `neo4j status`
2. 检查密码是否正确
3. 检查端口 7687 是否开放

#### 10.5.2 Ollama 模型调用失败

**问题**: 无法调用 Ollama 模型

**解决方案**:
1. 检查 Ollama 是否启动: `ollama list`
2. 检查模型是否已下载: `ollama pull <model_name>`
3. 检查端口 11434 是否开放

#### 10.5.3 前端无法连接后端

**问题**: API 请求失败

**解决方案**:
1. 检查后端是否启动: 访问 `http://localhost:8000/health`
2. 检查 CORS 配置
3. 检查 API_BASE 配置

### 10.6 贡献指南

1. Fork 项目
2. 创建特性分支: `git checkout -b feature/your-feature`
3. 提交更改: `git commit -m 'Add some feature'`
4. 推送到分支: `git push origin feature/your-feature`
5. 提交 Pull Request

### 10.7 许可证

本项目采用 MIT 许可证。

---

## 附录

### A. 项目文件路径索引

**关键文件**:

| 文件 | 路径 | 描述 |
|------|------|------|
| 后端入口 | `backend/main.py` | FastAPI 应用入口 |
| 聊天服务 | `backend/services/chat_service.py` | 聊天核心逻辑 |
| Prompt 服务 | `backend/services/prompt_service.py` | Prompt 生成 |
| NER 模型 | `ner_model.py` | NER 模型定义 |
| 知识图谱构建 | `build_up_graph.py` | 知识图谱构建 |
| 模型配置 | `model_config.py` | 模型调用配置 |
| 聊天页面 | `frontend/src/pages/ChatPage.tsx` | 聊天页面 |
| 聊天 API | `frontend/src/services/chatApi.ts` | 聊天 API |
| 消息组件 | `frontend/src/components/ChatMessage.tsx` | 消息组件 |

### B. 参考资料

- [FastAPI 官方文档](https://fastapi.tiangolo.com/)
- [React 官方文档](https://react.dev/)
- [Neo4j 官方文档](https://neo4j.com/docs/)
- [Ollama 官方文档](https://ollama.ai/docs)
- [硅基流动 API 文档](https://docs.siliconflow.cn/)

### C. 联系方式

- GitHub: https://github.com/iZiTTMarvin/HealthRAG
- Issues: https://github.com/iZiTTMarvin/HealthRAG/issues

---

**文档版本**: 1.0.0
**最后更新**: 2025-12-26
**作者**: 许皓辰