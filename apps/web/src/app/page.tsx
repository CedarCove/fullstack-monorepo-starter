'use client';

import { useState } from 'react';
import { trpc } from '~/lib/trpc';
import { AuthButton } from '~/components/AuthButton';
import { useAuth } from '~/lib/auth';

/**
 * Example component demonstrating tRPC + Drizzle ORM usage
 * Shows type-safe queries, mutations, computed fields, and caching
 * Auth state changes are handled globally in providers.tsx
 */
export default function Home() {
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [directQueryResult, setDirectQueryResult] = useState<any>(null);
  const { user } = useAuth();

  // tRPC queries - type-safe with auto-completion
  // These automatically refetch when auth state changes (handled in providers.tsx)
  const todosQuery = trpc.todo.list.useQuery();
  const statsQuery = trpc.todo.getStats.useQuery();
  const totalCountQuery = trpc.todo.getTotalCount.useQuery();

  // tRPC mutations
  const createTodo = trpc.todo.create.useMutation({
    onSuccess: () => {
      todosQuery.refetch();
      statsQuery.refetch();
      setNewTodoTitle('');
    },
  });

  const toggleTodo = trpc.todo.update.useMutation({
    onSuccess: () => {
      todosQuery.refetch();
      statsQuery.refetch();
    },
  });

  const deleteTodo = trpc.todo.delete.useMutation({
    onSuccess: () => {
      todosQuery.refetch();
      statsQuery.refetch();
    },
  });

  // Example showing how to use existing tRPC data for preview/demo purposes
  const handleTrpcPreview = () => {
    if (todosQuery.data) {
      // Use existing cached data - no additional database call needed!
      const limitedData = todosQuery.data.slice(0, 5);
      setDirectQueryResult({ data: limitedData });
    } else if (todosQuery.error) {
      setDirectQueryResult({ error: todosQuery.error.message });
    } else {
      setDirectQueryResult({ loading: 'Loading todos...' });
    }
  };

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Grasp - Next.js + tRPC + Supabase</h1>
        <AuthButton />
      </div>

      {/* Stats Section - tRPC Query */}
      <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-4">Statistics (via tRPC)</h2>
        {!user ? (
          <p className="text-red-500">Error: Not authenticated</p>
        ) : statsQuery.isPending ? (
          <p>Loading stats...</p>
        ) : statsQuery.error ? (
          <p className="text-red-500">Error: {statsQuery.error.message}</p>
        ) : statsQuery.data ? (
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold">{statsQuery.data.total}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold">{statsQuery.data.completed}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold">{statsQuery.data.pending}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold">{statsQuery.data.completionRate}%</p>
            </div>
          </div>
        ) : null}
      </div>

      {/* Public Query Example */}
      <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-4">Public Query (No Auth Required)</h2>
        {totalCountQuery.data && <p>Total todos in system: {totalCountQuery.data.count}</p>}
      </div>

      {/* Create Todo Form - tRPC Mutation */}
      <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-4">Create Todo (via tRPC)</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (newTodoTitle.trim()) {
              createTodo.mutate({ title: newTodoTitle });
            }
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={newTodoTitle}
            onChange={(e) => setNewTodoTitle(e.target.value)}
            placeholder="Enter todo title..."
            className="flex-1 px-4 py-2 border rounded dark:bg-gray-700"
          />
          <button
            type="submit"
            disabled={createTodo.isPending}
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {createTodo.isPending ? 'Creating...' : 'Create'}
          </button>
        </form>
        {createTodo.error && <p className="text-red-500 mt-2">Error: {createTodo.error.message}</p>}
      </div>

      {/* Todos List - tRPC Query */}
      <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-4">Todos List (via tRPC)</h2>
        {!user ? (
          <p className="text-red-500">Error: Not authenticated</p>
        ) : todosQuery.isPending ? (
          <p>Loading todos...</p>
        ) : todosQuery.error ? (
          <p className="text-red-500">Error: {todosQuery.error.message}</p>
        ) : todosQuery.data && todosQuery.data.length === 0 ? (
          <p className="text-gray-500">No todos yet. Create one above!</p>
        ) : todosQuery.data && todosQuery.data.length > 0 ? (
          <div className="space-y-2">
            {todosQuery.data.map((todo) => (
              <div
                key={todo.id}
                className="flex items-center justify-between p-4 border rounded hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <div className="flex items-center gap-3 flex-1">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo.mutate({ id: todo.id, completed: !todo.completed })}
                    className="w-5 h-5"
                  />
                  <div>
                    <p className={todo.completed ? 'line-through text-gray-500' : ''}>
                      {todo.title}
                    </p>
                    <p className="text-sm text-gray-500">
                      {todo.daysOld} days old
                      {todo.isOverdue && <span className="text-red-500"> (overdue)</span>}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => deleteTodo.mutate({ id: todo.id })}
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  disabled={deleteTodo.isPending}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* tRPC Data Preview Example */}
      <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-4">tRPC Data Preview (Cached)</h2>
        <p className="text-sm text-gray-600 mb-3">
          Uses existing cached data - no additional database call needed!
        </p>
        <button
          onClick={handleTrpcPreview}
          className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Get Preview (First 5 Todos)
        </button>
        {directQueryResult && (
          <pre className="mt-4 p-4 bg-gray-100 dark:bg-gray-900 rounded overflow-auto">
            {JSON.stringify(directQueryResult, null, 2)}
          </pre>
        )}
      </div>

      {/* Architecture Notes */}
      <div className="p-6 bg-blue-50 dark:bg-blue-900 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Architecture Notes</h2>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>tRPC provides end-to-end type safety with auto-completion</li>
          <li>Drizzle ORM handles all database queries (type-safe SQL)</li>
          <li>tRPC procedures include business logic and computed fields</li>
          <li>TanStack Query handles automatic caching and refetching</li>
          <li>Shared types across the monorepo via @grasp/database and @grasp/api</li>
          <li>No direct database queries needed - tRPC + Drizzle handles everything</li>
        </ul>
      </div>
    </main>
  );
}
