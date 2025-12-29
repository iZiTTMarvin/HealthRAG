import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Filter, Loader2, AlertCircle, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Network } from "vis-network/standalone";
import { DataSet } from "vis-data/standalone";

/**
 * 知识图谱可视化模态框组件
 * 使用 vis-network 渲染医疗知识图谱，支持搜索、过滤和交互功能
 */

interface GraphNode {
    id: string;
    label: string;
    type: string;
    properties: Record<string, any>;
    highlighted?: boolean;
}

interface GraphEdge {
    from: string;
    to: string;
    label: string;
}

interface GraphData {
    nodes: GraphNode[];
    edges: GraphEdge[];
    total_nodes?: number;
    total_edges?: number;
    error?: string;
}

interface KnowledgeGraphModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// 节点类型颜色映射（与 Neo4j 数据库中的标签一致）
const NODE_COLORS: Record<string, string> = {
    "疾病": "#3b82f6",        // 蓝色
    "药品": "#10b981",        // 绿色
    "疾病症状": "#ef4444",    // 红色（数据库中是"疾病症状"）
    "食物": "#f59e0b",        // 橙色
    "检查": "#8b5cf6",        // 紫色（数据库中是"检查"）
    "疾病科目": "#ec4899",    // 粉色（数据库中是"疾病科目"）
    "治疗方法": "#14b8a6",    // 青色
    "药品商": "#6366f1",      // 靛蓝色
};

export default function KnowledgeGraphModal({ isOpen, onClose }: KnowledgeGraphModalProps) {
    const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedNodeTypes, setSelectedNodeTypes] = useState<string[]>([]);
    const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

    const networkContainerRef = useRef<HTMLDivElement>(null);
    const networkRef = useRef<Network | null>(null);

    // 加载图谱概览数据
    const loadGraphOverview = async () => {
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams();
            params.set("limit", "150"); // 加载 150 个节点
            if (selectedNodeTypes.length > 0) {
                params.set("node_types", selectedNodeTypes.join(","));
            }

            const response = await fetch(`http://localhost:8000/api/neo4j/graph/overview?${params}`);

            // 检查 HTTP 响应状态
            if (!response.ok) {
                throw new Error(`HTTP 错误: ${response.status}`);
            }

            const data: GraphData = await response.json();
            console.log("[知识图谱] 加载数据:", data); // 调试日志

            // 检查后端返回的错误字段
            if (data.error) {
                setError(data.error);
                return;
            }

            // 检查数据有效性
            if (!data.nodes || data.nodes.length === 0) {
                setError("未获取到图谱数据，请确保 Neo4j 已连接并包含数据");
                return;
            }

            setGraphData(data);
            renderGraph(data);
        } catch (err: any) {
            console.error("[知识图谱] 加载失败:", err);
            setError(`加载图谱数据失败: ${err.message || '请确保 Neo4j 已连接'}`);
        } finally {
            setLoading(false);
        }
    };

    // 搜索节点
    const searchNodes = async () => {
        if (!searchQuery.trim()) {
            loadGraphOverview();
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams();
            params.set("query", searchQuery);
            params.set("limit", "100");

            // 如果用户选择了节点类型，传递给后端进行过滤
            if (selectedNodeTypes.length > 0) {
                params.set("node_types", selectedNodeTypes.join(","));
            }

            const response = await fetch(`http://localhost:8000/api/neo4j/graph/search?${params}`);

            if (!response.ok) {
                throw new Error(`HTTP 错误: ${response.status}`);
            }

            const data: GraphData = await response.json();
            console.log("[知识图谱] 搜索结果:", data);

            if (data.error) {
                setError(data.error);
                return;
            }

            if (!data.nodes || data.nodes.length === 0) {
                setError(`未找到匹配 "${searchQuery}" 的节点`);
                return;
            }

            setGraphData(data);
            renderGraph(data);
        } catch (err: any) {
            console.error("[知识图谱] 搜索失败:", err);
            setError(`搜索失败: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // 渲染图谱
    const renderGraph = (data: GraphData) => {
        if (!networkContainerRef.current || data.nodes.length === 0) return;

        // 转换节点数据为 vis-network 格式
        const visNodes = data.nodes.map(node => ({
            id: node.id,
            label: node.label,
            title: `${node.type}: ${node.label}`, // 悬浮提示
            color: {
                background: node.highlighted ? "#fbbf24" : (NODE_COLORS[node.type] || "#64748b"),
                border: node.highlighted ? "#f59e0b" : (NODE_COLORS[node.type] || "#475569"),
                highlight: {
                    background: "#fbbf24",
                    border: "#f59e0b"
                }
            },
            font: {
                color: "#1f2937",  // 深灰色文字，在白色背景上清晰可见
                size: 14,
                face: "Inter, sans-serif"
            },
            shape: "dot",
            size: node.highlighted ? 25 : 20,
        }));

        // 转换边数据
        const visEdges = data.edges.map(edge => ({
            from: edge.from,
            to: edge.to,
            label: edge.label,
            arrows: "to",
            color: {
                color: "#cbd5e1",
                highlight: "#3b82f6"
            },
            font: {
                size: 10,
                color: "#64748b",
                face: "Inter, sans-serif",
                strokeWidth: 0
            },
            smooth: {
                type: "continuous"
            }
        }));

        // 创建 DataSet 实例（vis-network 数据容器）
        const nodes = new DataSet(visNodes);
        const edges = new DataSet(visEdges);

        console.log("[知识图谱] 渲染节点数:", visNodes.length, "边数:", visEdges.length);

        // 配置选项
        const options = {
            nodes: {
                borderWidth: 2,
                borderWidthSelected: 3,
            },
            edges: {
                width: 1.5,
                selectionWidth: 3,
            },
            physics: {
                enabled: true,
                stabilization: {
                    iterations: 200,
                    updateInterval: 25
                },
                barnesHut: {
                    gravitationalConstant: -8000,
                    centralGravity: 0.3,
                    springLength: 120,
                    springConstant: 0.04,
                    damping: 0.09
                }
            },
            interaction: {
                hover: true,
                tooltipDelay: 100,
                zoomView: true,
                dragView: true
            },
            layout: {
                improvedLayout: true,
                randomSeed: 42 // 固定布局种子
            }
        };

        // 销毁旧实例
        if (networkRef.current) {
            networkRef.current.destroy();
        }

        // 创建新的 vis-network 实例
        try {
            const network = new Network(
                networkContainerRef.current,
                { nodes, edges },
                options
            );

            networkRef.current = network;
            console.log("[知识图谱] Network 实例创建成功");
        } catch (err: any) {
            console.error("[知识图谱] Network 创建失败:", err);
            setError(`渲染失败: ${err.message}`);
            return;
        }

        // 点击节点事件（需要在 try 块内绑定）
        if (networkRef.current) {
            networkRef.current.on("click", (params) => {
                if (params.nodes.length > 0) {
                    const nodeId = params.nodes[0] as string;
                    const node = data.nodes.find(n => n.id === nodeId);
                    if (node) {
                        setSelectedNode(node);
                    }
                } else {
                    setSelectedNode(null);
                }
            });
        }
    };

    // 初次加载和重新加载
    useEffect(() => {
        if (isOpen) {
            // 如果有搜索词，调用搜索函数；否则加载概览
            if (searchQuery.trim()) {
                searchNodes();
            } else {
                loadGraphOverview();
            }
        }

        return () => {
            if (networkRef.current) {
                networkRef.current.destroy();
                networkRef.current = null;
            }
        };
    }, [isOpen, selectedNodeTypes]);

    // 节点类型选项（与 Neo4j 数据库中的标签一致）
    const nodeTypeOptions = ["疾病", "药品", "疾病症状", "食物", "检查", "疾病科目", "治疗方法", "药品商"];

    const toggleNodeType = (type: string) => {
        setSelectedNodeTypes(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* 头部工具栏 */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-primary/5 to-secondary/5">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-active flex items-center justify-center shadow-lg">
                                <Maximize2 className="text-white" size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-text-main">医疗知识图谱</h2>
                                <p className="text-sm text-text-muted">
                                    {graphData.total_nodes ? `${graphData.total_nodes} 个节点，${graphData.total_edges} 条关系` : "加载中..."}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors text-text-muted hover:text-text-main"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* 搜索和过滤栏 */}
                    <div className="px-6 py-4 border-b border-slate-100 bg-surface-background space-y-3">
                        {/* 搜索框 */}
                        <div className="flex items-center space-x-3">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && searchNodes()}
                                    placeholder="搜索疾病、药品、症状..."
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                                />
                            </div>
                            <button
                                onClick={searchNodes}
                                disabled={loading}
                                className="px-6 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-50 text-sm font-medium"
                            >
                                搜索
                            </button>
                            <button
                                onClick={() => { setSearchQuery(""); loadGraphOverview(); }}
                                className="px-4 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-sm text-text-muted"
                            >
                                重置
                            </button>
                        </div>

                        {/* 节点类型过滤器 */}
                        <div className="flex items-center space-x-2">
                            <Filter size={16} className="text-text-muted" />
                            <span className="text-xs font-medium text-text-muted">节点类型：</span>
                            <div className="flex flex-wrap gap-2">
                                {nodeTypeOptions.map(type => (
                                    <button
                                        key={type}
                                        onClick={() => toggleNodeType(type)}
                                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${selectedNodeTypes.includes(type)
                                            ? "bg-primary text-white shadow-sm"
                                            : "bg-white border border-slate-200 text-text-muted hover:border-primary/30"
                                            }`}
                                        style={{
                                            backgroundColor: selectedNodeTypes.includes(type) ? NODE_COLORS[type] : undefined
                                        }}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 主内容区域 */}
                    <div className="flex-1 flex overflow-hidden">
                        {/* 图谱画布 */}
                        <div className="flex-1 relative bg-slate-50">
                            {loading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                                    <div className="text-center">
                                        <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-3" />
                                        <p className="text-sm text-text-muted">加载图谱数据中...</p>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                                    <div className="text-center max-w-md">
                                        <AlertCircle className="w-16 h-16 text-accent-red mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold text-text-main mb-2">加载失败</h3>
                                        <p className="text-sm text-text-muted mb-4">{error}</p>
                                        <button
                                            onClick={loadGraphOverview}
                                            className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors"
                                        >
                                            重试
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div ref={networkContainerRef} className="w-full h-full" />
                        </div>

                        {/* 节点详情面板 */}
                        <AnimatePresence>
                            {selectedNode && (
                                <motion.div
                                    initial={{ x: 300, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: 300, opacity: 0 }}
                                    className="w-80 bg-white border-l border-slate-200 p-6 overflow-y-auto"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold text-text-main">节点详情</h3>
                                        <button
                                            onClick={() => setSelectedNode(null)}
                                            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {/* 节点名称 */}
                                        <div>
                                            <div className="text-xs font-medium text-text-muted mb-1">名称</div>
                                            <div className="text-base font-semibold text-text-main">{selectedNode.label}</div>
                                        </div>

                                        {/* 节点类型 */}
                                        <div>
                                            <div className="text-xs font-medium text-text-muted mb-1">类型</div>
                                            <div
                                                className="inline-block px-3 py-1 rounded-lg text-sm font-medium text-white"
                                                style={{ backgroundColor: NODE_COLORS[selectedNode.type] || "#64748b" }}
                                            >
                                                {selectedNode.type}
                                            </div>
                                        </div>

                                        {/* 节点属性 */}
                                        <div>
                                            <div className="text-xs font-medium text-text-muted mb-2">属性信息</div>
                                            <div className="space-y-2">
                                                {Object.entries(selectedNode.properties).map(([key, value]) => {
                                                    if (key === "名称" || !value) return null;
                                                    return (
                                                        <div key={key} className="bg-slate-50 rounded-lg p-3">
                                                            <div className="text-xs font-medium text-text-muted mb-1">{key}</div>
                                                            <div className="text-sm text-text-main break-words">
                                                                {typeof value === "string" ? value : JSON.stringify(value)}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
