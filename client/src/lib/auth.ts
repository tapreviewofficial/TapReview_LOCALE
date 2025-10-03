import { queryClient } from "./queryClient";

export interface User {
  id: number;
  email: string;
  username: string;
}

export function useAuth() {
  const { data: user, isLoading } = queryClient.getQueryData(['api', 'auth', 'me']) as { data: { user: User } | null, isLoading: boolean } || { data: null, isLoading: false };
  
  return {
    user: user?.user || null,
    isLoading,
    isAuthenticated: !!user?.user,
  };
}

export async function logout() {
  await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
  });
  queryClient.clear();
  window.location.href = '/';
}
