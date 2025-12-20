import { motion, AnimatePresence } from "framer-motion";
import { X, Database, Shield, Bug } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: string;
  neo4jStatus: { connected: boolean; error: string | null };
  neo4jPassword: string;
  showEntities: boolean;
  showIntent: boolean;
  showPrompt: boolean;
  onChangeNeo4jPassword: (password: string) => void;
  onConnectNeo4j: () => void;
  onChangeDebug: (debug: { showEntities: boolean; showIntent: boolean; showPrompt: boolean }) => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  role,
  neo4jStatus,
  neo4jPassword,
  showEntities,
  showIntent,
  showPrompt,
  onChangeNeo4jPassword,
  onConnectNeo4j,
  onChangeDebug
}: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-glass w-full max-w-md overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-text-main">系统设置</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-slate-100 text-text-muted transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Neo4j Section */}
            <div className="space-y-4">
              <div className="flex items-center text-sm font-semibold text-text-main">
                <Database size={16} className="mr-2 text-primary" />
                知识图谱连接 (Neo4j)
              </div>
              
              <div className="bg-surface-background rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-muted">连接状态</span>
                  <div className="flex items-center">
                    <span className={`w-2 h-2 rounded-full mr-2 ${neo4jStatus.connected ? "bg-accent-green" : "bg-red-400"}`} />
                    <span className={neo4jStatus.connected ? "text-accent-green" : "text-red-400"}>
                      {neo4jStatus.connected ? "已连接" : "未连接"}
                    </span>
                  </div>
                </div>
                
                {neo4jStatus.error && (
                  <div className="text-xs text-red-500 bg-red-50 p-2 rounded-lg">
                    {neo4jStatus.error}
                  </div>
                )}

                {role === "admin" && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-text-muted block">管理员密码</label>
                    <div className="flex space-x-2">
                      <input
                        type="password"
                        value={neo4jPassword}
                        onChange={(e) => onChangeNeo4jPassword(e.target.value)}
                        placeholder="输入 Neo4j 密码"
                        className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      />
                      <button
                        onClick={onConnectNeo4j}
                        className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-hover transition-colors shadow-sm"
                      >
                        连接
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Debug Section */}
            {role === "admin" && (
              <div className="space-y-4">
                <div className="flex items-center text-sm font-semibold text-text-main">
                  <Bug size={16} className="mr-2 text-secondary" />
                  调试信息显示
                </div>
                
                <div className="space-y-2">
                  <label className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-background transition-colors cursor-pointer border border-transparent hover:border-slate-100">
                    <span className="text-sm text-text-main">显示实体识别结果</span>
                    <input
                      type="checkbox"
                      checked={showEntities}
                      onChange={(e) => onChangeDebug({ showEntities: e.target.checked, showIntent, showPrompt })}
                      className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                    />
                  </label>
                  
                  <label className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-background transition-colors cursor-pointer border border-transparent hover:border-slate-100">
                    <span className="text-sm text-text-main">显示意图识别结果</span>
                    <input
                      type="checkbox"
                      checked={showIntent}
                      onChange={(e) => onChangeDebug({ showEntities, showIntent: e.target.checked, showPrompt })}
                      className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                    />
                  </label>
                  
                  <label className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-background transition-colors cursor-pointer border border-transparent hover:border-slate-100">
                    <span className="text-sm text-text-main">显示 Prompt & 知识库内容</span>
                    <input
                      type="checkbox"
                      checked={showPrompt}
                      onChange={(e) => onChangeDebug({ showEntities, showIntent, showPrompt: e.target.checked })}
                      className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
