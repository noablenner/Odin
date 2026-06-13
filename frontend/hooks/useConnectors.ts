"use client";

import { useCallback, useEffect, useState } from "react";
import { apiDelete, apiGet, apiPost } from "@/lib/api";

export function useConnectors() {
  const [connectors, setConnectors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setConnectors(await apiGet("/api/connectors"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const connectApiKey = (type: string, api_key: string, display_name?: string, config = {}) =>
    apiPost("/api/connectors/api-key", { type, api_key, display_name, config }).then(refresh);

  const connectRest = (body: any) => apiPost("/api/connectors/rest", body).then(refresh);

  const startOAuth = async (provider: string) => {
    const { url } = await apiGet(`/api/connectors/${provider}/authorize`);
    window.location.href = url;
  };

  const test = (type: string) => apiPost(`/api/connectors/${type}/test`);
  const preview = (type: string) => apiGet(`/api/connectors/${type}/preview`);
  const disconnect = (type: string) => apiDelete(`/api/connectors/${type}`).then(refresh);

  return { connectors, loading, refresh, connectApiKey, connectRest, startOAuth, test, preview, disconnect };
}
