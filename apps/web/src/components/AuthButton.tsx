'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSupabase } from '~/lib/supabase';
import { useAuth } from '~/lib/auth';

export function AuthButton() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { user } = useAuth();
  const supabase = getSupabase();
  const queryClient = useQueryClient();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    // Sign out - auth context will update automatically
    await supabase.auth.signOut();

    // Clear query cache and refetch to show errors
    queryClient.removeQueries();
    queryClient.refetchQueries();
  };

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          Logged in as: <strong>{user.email}</strong>
        </span>
        <button
          onClick={handleSignOut}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSignIn} className="flex items-center gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="px-3 py-2 border rounded dark:bg-gray-700"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className="px-3 py-2 border rounded dark:bg-gray-700"
        required
      />
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
      {error && <span className="text-red-500 text-sm">{error}</span>}
    </form>
  );
}
