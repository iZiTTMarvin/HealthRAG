import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, ArrowRight, Lock, User, UserPlus } from "lucide-react";

import { register } from "../services/authApi";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const res = await register(username.trim(), password);
    setLoading(false);
    if (res.ok === "true") {
      setMessage("注册成功，正在跳转登录...");
      setTimeout(() => navigate("/login"), 1500);
    } else {
      setMessage(res.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 font-sans overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-[10%] right-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-3xl"
          animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        />
        <motion.div 
          className="absolute bottom-[20%] left-[5%] w-[35%] h-[35%] bg-secondary/10 rounded-full blur-3xl"
          animate={{ x: [0, 40, 0], y: [0, -20, 0] }}
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
        {/* Left Side - Visual (Swapped for Register) */}
        <div className="hidden md:flex flex-col justify-center items-center bg-gradient-to-br from-secondary/5 to-primary/5 relative p-12 overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?ixlib=rb-4.0.3&auto=format&fit=crop&w=2091&q=80')] bg-cover bg-center opacity-10 mix-blend-multiply" />
          
          <div className="relative z-10 max-w-md text-center">
             <motion.div
               initial={{ scale: 0.8, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               transition={{ delay: 0.2 }}
               className="mb-8 inline-block p-4 rounded-full bg-white shadow-soft"
             >
                <UserPlus size={48} className="text-secondary" />
             </motion.div>
             <motion.h2 
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               transition={{ delay: 0.3 }}
               className="text-2xl font-bold text-text-main mb-4"
             >
               加入 HealthRAG
             </motion.h2>
             <motion.p
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               transition={{ delay: 0.4 }}
               className="text-text-muted leading-relaxed"
             >
               创建账号，即可开启您的智能医疗助手之旅。<br/>
               支持多轮对话、病历分析与个性化健康建议。
             </motion.p>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="p-8 md:p-12 flex flex-col justify-center relative bg-white">
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-text-main mb-2">创建新账号</h1>
            <p className="text-text-muted">填写以下信息完成注册</p>
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
                  className="w-full bg-surface-background border border-transparent focus:bg-white focus:border-secondary/50 text-text-main rounded-xl px-12 py-3.5 outline-none transition-all duration-300 placeholder:text-text-light/50"
                  placeholder="设置用户名"
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
                  className="w-full bg-surface-background border border-transparent focus:bg-white focus:border-secondary/50 text-text-main rounded-xl px-12 py-3.5 outline-none transition-all duration-300 placeholder:text-text-light/50"
                  placeholder="设置密码"
                  required
                />
              </div>
            </div>

            {message && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className={`text-sm p-3 rounded-lg flex items-center ${
                  message.includes("成功") ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full mr-2 ${
                   message.includes("成功") ? "bg-green-500" : "bg-red-500"
                }`} />
                {message}
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-secondary hover:bg-secondary-hover text-white font-medium py-3.5 rounded-xl shadow-lg shadow-secondary/25 transition-all flex items-center justify-center group"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  注册中...
                </span>
              ) : (
                <span className="flex items-center">
                  立即注册 <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
                </span>
              )}
            </motion.button>
          </form>

          <div className="mt-8 text-center text-sm text-text-muted">
            已有账号？
            <Link to="/login" className="text-secondary font-medium hover:underline ml-1">
              返回登录
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
