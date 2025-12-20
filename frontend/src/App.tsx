import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import { useAuth } from "./contexts/AuthContext";
import ChatPage from "./pages/ChatPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

/**
 * 路由守卫：强制未登录用户跳转到登录页
 * - 依赖 AuthContext 提供的 auth 状态
 * - 若无登录信息，则重定向到 /login
 */
function RequireAuth({ children }: { children: JSX.Element }) {
  const { auth } = useAuth();
  if (!auth) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

/**
 * App 根组件
 * - 使用 AnimatePresence 包裹路由，提供淡入淡出页面转场
 * - Routes 按 location 变化重新渲染，确保动画生效
 */
export default function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* 默认跳转到 /chat */}
        <Route path="/" element={<Navigate to="/chat" replace />} />
        {/* 公共路由：登录、注册 */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        {/* 受保护路由：聊天页 */}
        <Route
          path="/chat"
          element={
            <RequireAuth>
              <ChatPage />
            </RequireAuth>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}
