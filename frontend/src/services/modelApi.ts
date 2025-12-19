const API_BASE = import.meta.env.VITE_API_BASE ?? "";

export interface ModelListResponse {
  local: string[];
  siliconflow: string[];
}

export async function fetchModels(): Promise<ModelListResponse> {
  const res = await fetch(`${API_BASE}/api/models`);
  if (!res.ok) {
    return { local: [], siliconflow: [] };
  }
  return res.json();
}
