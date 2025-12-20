import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { AuthProvider } from "./contexts/AuthContext";
import App from "./App";
import "./styles/tailwind.css";

// 前端入口：挂载根节点，并注入路由与鉴权上下文
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* AuthProvider 提供全局登录态；BrowserRouter 处理前端路由 */}
    <AuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
