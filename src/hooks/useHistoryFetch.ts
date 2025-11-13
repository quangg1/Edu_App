import { useState, useCallback, useEffect } from 'react';
import { fetchClient } from '../api/fetchClient';

export interface HistoryItem {
  _id: string;
  title: string;
  subject?: {
    name: string;
  };
  grade?: {
    level: number;
    name: string;
  };
  createdAt: string;
  status: string;
  isAIGenerated: boolean;
  [key: string]: any;
}

export interface HistoryResponse {
  success: boolean;
  data: HistoryItem[];
  pagination: {
    total: number;
    page: number;
    pages: number;
  };
}

interface UseHistoryFetchOptions {
  endpoint: string; // e.g., '/api/v1/quizzes', '/api/v1/rubrics', '/api/v1/lesson-plans'
  limit?: number;
}

export const useHistoryFetch = ({ endpoint, limit = 10 }: UseHistoryFetchOptions) => {
  const [data, setData] = useState<HistoryItem[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchHistory = useCallback(async (page: number = 1) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchClient(`${endpoint}?page=${page}&limit=${limit}`);

      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }

      const result: HistoryResponse = await response.json();

      if (result.success) {
        setData(result.data);
        setPagination(result.pagination);
        setCurrentPage(page);
      } else {
        setError('Không thể tải lịch sử');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Lỗi khi tải dữ liệu';
      setError(errorMessage);
      console.error('History fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [endpoint, limit]);

  // Initial fetch
  useEffect(() => {
    fetchHistory(1);
  }, [endpoint, fetchHistory]);

  const goToPage = useCallback((page: number) => {
    fetchHistory(page);
  }, [fetchHistory]);

  return {
    data,
    pagination,
    loading,
    error,
    currentPage,
    goToPage,
    refetch: () => fetchHistory(currentPage),
  };
};
