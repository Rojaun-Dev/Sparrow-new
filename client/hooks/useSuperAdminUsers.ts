import { useState, useCallback } from 'react';
import { SuperAdminUserService, UserListParams, UserData, PaginatedResponse } from '@/lib/api/userService';

export function useSuperAdminUsers() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [pagination, setPagination] = useState<PaginatedResponse<UserData>['pagination']>({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);

  const userService = new SuperAdminUserService();

  const fetchUsers = useCallback(async (params?: UserListParams) => {
    try {
      setLoading(true);
      setError(null);
      const response = await userService.getAllUsers(params);
      setUsers(response.data);
      setPagination(response.pagination);
      return response;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserById = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const user = await userService.getUserById(id);
      setCurrentUser(user);
      return user;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch user');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createAdminUser = useCallback(async (data: any) => {
    try {
      setLoading(true);
      setError(null);
      const newUser = await userService.createAdminUser(data);
      setUsers(prev => [...prev, newUser]);
      return newUser;
    } catch (err: any) {
      setError(err.message || 'Failed to create admin user');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUser = useCallback(async (id: string, data: any) => {
    try {
      setLoading(true);
      setError(null);
      const updatedUser = await userService.updateUser(id, data);
      setUsers(prev => prev.map(user => user.id === id ? updatedUser : user));
      if (currentUser?.id === id) {
        setCurrentUser(updatedUser);
      }
      return updatedUser;
    } catch (err: any) {
      setError(err.message || 'Failed to update user');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const deactivateUser = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await userService.deactivateUser(id);
      setUsers(prev => prev.map(user => 
        user.id === id ? { ...user, isActive: false } : user
      ));
      if (currentUser?.id === id) {
        setCurrentUser(prev => prev ? { ...prev, isActive: false } : null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to deactivate user');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const reactivateUser = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await userService.reactivateUser(id);
      setUsers(prev => prev.map(user => 
        user.id === id ? { ...user, isActive: true } : user
      ));
      if (currentUser?.id === id) {
        setCurrentUser(prev => prev ? { ...prev, isActive: true } : null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reactivate user');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const getSystemStatistics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      return await userService.getSystemStatistics();
    } catch (err: any) {
      setError(err.message || 'Failed to fetch system statistics');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    users,
    pagination,
    loading,
    error,
    currentUser,
    fetchUsers,
    fetchUserById,
    createAdminUser,
    updateUser,
    deactivateUser,
    reactivateUser,
    getSystemStatistics
  };
} 