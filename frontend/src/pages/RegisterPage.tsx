import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { register } from "../services/authApi";
import "../styles/auth.css";

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
      setMessage("注册成功，请登录。");
      setTimeout(() => navigate("/login"), 600);
    } else {
      setMessage(res.message);
    }
  };

  return (
    <div className="auth-shell">
      <section className="auth-hero">
        <div className="auth-title">开始体验</div>
        <div className="auth-subtitle">
          创建账号后即可开启多窗口医疗对话，支持模型切换与知识图谱检索。
        </div>
        <div className="auth-message">
          注册后默认角色为普通用户，管理员可在系统内查看调试信息。
        </div>
      </section>
      <section className="auth-card">
        <form className="auth-form" onSubmit={handleSubmit}>
          <h2>注册</h2>
          <label className="auth-field">
            用户名
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="设置用户名"
              required
            />
          </label>
          <label className="auth-field">
            密码
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="设置密码"
              required
            />
          </label>
          <button className="auth-button" type="submit" disabled={loading}>
            {loading ? "注册中..." : "注册"}
          </button>
          {message && <div className="auth-message">{message}</div>}
          <div className="auth-switch">
            已有账号？<Link to="/login">返回登录</Link>
          </div>
        </form>
      </section>
    </div>
  );
}
