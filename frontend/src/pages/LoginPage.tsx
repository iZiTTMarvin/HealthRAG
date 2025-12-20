import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, ArrowRight, Lock, User } from "lucide-react";

import { useAuth } from "../contexts/AuthContext";
import { login } from "../services/authApi";

export default function LoginPage() {
  const { setAuth } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const res = await login(username.trim(), password);
    setLoading(false);
    if (res.ok === "true" && res.role) {
      setAuth({ username: username.trim(), role: res.role });
      navigate("/chat");
    } else {
      setMessage(res.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 font-sans overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-3xl"
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <motion.div 
          className="absolute bottom-[10%] right-[5%] w-[30%] h-[30%] bg-secondary/10 rounded-full blur-3xl"
          animate={{ x: [0, -40, 0], y: [0, -20, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-5xl grid md:grid-cols-2 bg-white rounded-3xl shadow-glass overflow-hidden z-10 min-h-[600px]"
      >
        {/* Left Side - Form */}
        <div className="p-8 md:p-12 flex flex-col justify-center relative">
          <div className="mb-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-active flex items-center justify-center shadow-lg shadow-primary/20 mb-4">
              <Activity className="text-white" size={24} />
            </div>
            <h1 className="text-3xl font-bold text-text-main mb-2">欢迎回来</h1>
            <p className="text-text-muted">登录 HealthRAG 智能医疗问答系统</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-main ml-1">用户名</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light" size={20} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-surface-background border border-transparent focus:bg-white focus:border-primary/50 text-text-main rounded-xl px-12 py-3.5 outline-none transition-all duration-300 placeholder:text-text-light/50"
                  placeholder="请输入用户名"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-main ml-1">密码</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface-background border border-transparent focus:bg-white focus:border-primary/50 text-text-main rounded-xl px-12 py-3.5 outline-none transition-all duration-300 placeholder:text-text-light/50"
                  placeholder="请输入密码"
                  required
                />
              </div>
            </div>

            {message && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="text-sm text-red-500 bg-red-50 p-3 rounded-lg flex items-center"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2" />
                {message}
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-3.5 rounded-xl shadow-lg shadow-primary/25 transition-all flex items-center justify-center group"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  登录中...
                </span>
              ) : (
                <span className="flex items-center">
                  立即登录 <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
                </span>
              )}
            </motion.button>
          </form>

          <div className="mt-8 text-center text-sm text-text-muted">
            还没有账号？
            <Link to="/register" className="text-primary font-medium hover:underline ml-1">
              立即注册
            </Link>
          </div>
        </div>

        {/* Right Side - Visual */}
        <div className="hidden md:flex flex-col justify-center items-center bg-gradient-to-br from-primary/5 to-secondary/5 relative p-12 overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center opacity-10 mix-blend-multiply" />
          
          <div className="relative z-10 max-w-md">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-soft mb-6 border border-white/50"
            >
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  <Activity size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-text-main mb-1">专业医疗知识图谱</h3>
                  <p className="text-sm text-text-muted leading-relaxed">
                    结合 Neo4j 图数据库，提供精准的疾病、症状、药物关联分析，辅助医疗决策。
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-soft border border-white/50 ml-8"
            >
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary flex-shrink-0">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-text-main mb-1">个性化问答体验</h3>
                  <p className="text-sm text-text-muted leading-relaxed">
                    支持本地 Ollama 与云端大模型，多窗口并行对话，实时流式响应。
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
