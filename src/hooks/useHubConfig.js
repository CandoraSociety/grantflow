import { useState, useEffect } from 'react';
import { createAxiosClient } from '@base44/sdk/dist/utils/axios-client';

const BEACON_HUB_URL = 'https://beacon-92324875.base44.app/functions/getHubConfig';

export function useHubConfig() {
  const [orgInfo, setOrgInfo] = useState(null);
  const [branding, setBranding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHubConfig();
  }, []);

  const fetchHubConfig = async () => {
    try {
      setLoading(true);
      const client = createAxiosClient({
        baseURL: BEACON_HUB_URL,
        interceptResponses: true
      });

      const response = await client.get('');
      
      if (response?.data) {
        setOrgInfo(response.data.org || null);
        setBranding(response.data.config?.branding || null);
      }
      setError(null);
    } catch (err) {
      console.error('Failed to fetch hub config:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return { orgInfo, branding, loading, error };
}