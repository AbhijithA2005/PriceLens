import { useState, useCallback } from 'react';

const API = '/api';

export function useTrainModels() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const train = useCallback(async (dataset) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/train`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataset }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Training failed');
      }
      const data = await res.json();
      setResult(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { train, loading, error, result };
}

export async function fetchDatasets() {
  const res = await fetch(`${API}/datasets`);
  return res.json();
}

export async function fetchModelComparison() {
  const res = await fetch(`${API}/model-comparison`);
  if (!res.ok) throw new Error('No models trained yet');
  return res.json();
}

export async function fetchResiduals(model, dataset) {
  const res = await fetch(`${API}/residuals/${model}?dataset=${dataset}`);
  if (!res.ok) throw new Error('Failed to fetch residuals');
  return res.json();
}

export async function fetchFeatureImportance(dataset) {
  const res = await fetch(`${API}/feature-importance?dataset=${dataset}`);
  if (!res.ok) throw new Error('Failed to fetch feature importance');
  return res.json();
}
