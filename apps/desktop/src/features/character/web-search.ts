const { invoke } = await import("@tauri-apps/api/core");

export interface NeoBuilderWebSearchResult {
  title: string;
  url: string;
  snippet: string;
}

export async function searchWeb(query: string, limit = 5): Promise<NeoBuilderWebSearchResult[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  return invoke<NeoBuilderWebSearchResult[]>("web_search", {
    query: cleanQuery,
    limit,
  });
}
