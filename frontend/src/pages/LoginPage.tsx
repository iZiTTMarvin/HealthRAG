import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";
import { login } from "../services/authApi";
import "../styles/auth.css";

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
    <div className="auth-shell">
      <section className="auth-hero">
        <div className="auth-title">医疗智能问答</div>
        <div className="auth-subtitle">
          结合知识图谱与大模型的医疗问答系统，提供可信的症状、病因、治疗建议与药物信息。
        </div>
        <div className="auth-message">
          当前版本 <strong>FastAPI + React</strong>，支持本地模型与硅基流动 API。
        </div>
      </section>
      <section className="auth-card">
        <form className="auth-form" onSubmit={handleSubmit}>
          <h2>登录</h2>
          <label className="auth-field">
            用户名
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="请输入用户名"
              required
            />
          </label>
          <label className="auth-field">
            密码
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="请输入密码"
              required
            />
          </label>
          <button className="auth-button" type="submit" disabled={loading}>
            {loading ? "登录中..." : "登录"}
          </button>
          {message && <div className="auth-message">{message}</div>}
          <div className="auth-switch">
            还没有账号？<Link to="/register">立即注册</Link>
          </div>
        </form>
      </section>
    </div>
  );
}
