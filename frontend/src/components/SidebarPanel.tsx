import DebugToggles from "./DebugToggles";
import type { ModelListResponse } from "../services/modelApi";

interface SidebarPanelProps {
  role: "admin" | "user";
  models: ModelListResponse;
  modelSource: "local" | "siliconflow";
  modelName: string;
  apiKey: string;
  neo4jStatus: { connected: boolean; error?: string | null };
  neo4jPassword: string;
  showEntities: boolean;
  showIntent: boolean;
  showPrompt: boolean;
  onChangeModelSource: (next: "local" | "siliconflow") => void;
  onChangeModelName: (next: string) => void;
  onChangeApiKey: (next: string) => void;
  onChangeNeo4jPassword: (next: string) => void;
  onConnectNeo4j: () => void;
  onChangeDebug: (next: { showEntities: boolean; showIntent: boolean; showPrompt: boolean }) => void;
}

export default function SidebarPanel({
  role,
  models,
  modelSource,
  modelName,
  apiKey,
  neo4jStatus,
  neo4jPassword,
  showEntities,
  showIntent,
  showPrompt,
  onChangeModelSource,
  onChangeModelName,
  onChangeApiKey,
  onChangeNeo4jPassword,
  onConnectNeo4j,
  onChangeDebug
}: SidebarPanelProps) {
  const options = modelSource === "local" ? models.local : models.siliconflow;

  return (
    <div className="settings-panel">
      <div className="settings-block">
        <div className="settings-title">模型配置</div>
        <div className="segment">
          <button
            type="button"
            className={modelSource === "local" ? "active" : ""}
            onClick={() => onChangeModelSource("local")}
          >
            本地 Ollama
          </button>
          <button
            type="button"
            className={modelSource === "siliconflow" ? "active" : ""}
            onClick={() => onChangeModelSource("siliconflow")}
          >
            硅基流动 API
          </button>
        </div>
        {modelSource === "siliconflow" && (
          <label className="settings-field">
            API Key
            <input
              type="password"
              value={apiKey}
              placeholder="输入 API Key"
              onChange={(event) => onChangeApiKey(event.target.value)}
            />
          </label>
        )}
        <label className="settings-field">
          选择模型
          <select value={modelName} onChange={(event) => onChangeModelName(event.target.value)}>
            {options.length === 0 && <option value="">暂无模型</option>}
            {options.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="settings-block">
        <div className="settings-title">Neo4j 状态</div>
        <div className={`status-pill ${neo4jStatus.connected ? "ok" : "bad"}`}>
          {neo4jStatus.connected ? "已连接" : "未连接"}
        </div>
        {neo4jStatus.error && <div className="status-note">{neo4jStatus.error}</div>}
        {role === "admin" && (
          <>
            <label className="settings-field">
              管理员密码
              <input
                type="password"
                value={neo4jPassword}
                placeholder="可选"
                onChange={(event) => onChangeNeo4jPassword(event.target.value)}
              />
            </label>
            <button type="button" className="sidebar-button" onClick={onConnectNeo4j}>
              重新连接
            </button>
          </>
        )}
      </div>

      {role === "admin" && (
        <div className="settings-block">
          <div className="settings-title">调试视图</div>
          <DebugToggles
            showEntities={showEntities}
            showIntent={showIntent}
            showPrompt={showPrompt}
            onChange={onChangeDebug}
          />
        </div>
      )}
    </div>
  );
}
