import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import { trpc } from './lib/trpc';

/**
 * Main popup component demonstrating tRPC + Drizzle ORM usage
 * Shows type-safe queries, mutations, and automatic caching
 */
function Popup() {
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [directQueryResult, setDirectQueryResult] = useState<string>('');

  // tRPC queries - type-safe with auto-completion
  const todosQuery = trpc.todo.list.useQuery();
  const statsQuery = trpc.todo.getStats.useQuery();

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
      const limitedData = todosQuery.data.slice(0, 3);
      setDirectQueryResult(JSON.stringify(limitedData, null, 2));
    } else if (todosQuery.error) {
      setDirectQueryResult(`Error: ${todosQuery.error.message}`);
    } else {
      setDirectQueryResult('Loading todos...');
    }
  };

  return (
    <div style={{ padding: '8px' }}>
      <h1 style={{ fontSize: '20px', marginBottom: '16px' }}>Grasp Extension</h1>

      {/* Stats Section */}
      <div
        style={{
          marginBottom: '16px',
          padding: '12px',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px',
        }}
      >
        <h2 style={{ fontSize: '16px', marginBottom: '8px' }}>Statistics (via tRPC)</h2>
        {statsQuery.isPending && <p>Loading...</p>}
        {statsQuery.error && <p style={{ color: '#ff3b30' }}>Error: {statsQuery.error.message}</p>}
        {statsQuery.data && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '8px',
              fontSize: '12px',
            }}
          >
            <div>
              <div style={{ color: '#666' }}>Total</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{statsQuery.data.total}</div>
            </div>
            <div>
              <div style={{ color: '#666' }}>Done</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                {statsQuery.data.completed}
              </div>
            </div>
            <div>
              <div style={{ color: '#666' }}>Pending</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{statsQuery.data.pending}</div>
            </div>
            <div>
              <div style={{ color: '#666' }}>Rate</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                {statsQuery.data.completionRate}%
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Todo Form */}
      <div
        style={{
          marginBottom: '16px',
          padding: '12px',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px',
        }}
      >
        <h2 style={{ fontSize: '16px', marginBottom: '8px' }}>Create Todo</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (newTodoTitle.trim()) {
              createTodo.mutate({ title: newTodoTitle });
            }
          }}
        >
          <input
            type="text"
            value={newTodoTitle}
            onChange={(e) => setNewTodoTitle(e.target.value)}
            placeholder="Enter todo..."
            style={{
              width: '100%',
              padding: '8px',
              marginBottom: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
            }}
          />
          <button
            type="submit"
            disabled={createTodo.isPending}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#007AFF',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              cursor: 'pointer',
              opacity: createTodo.isPending ? 0.5 : 1,
            }}
          >
            {createTodo.isPending ? 'Creating...' : 'Create'}
          </button>
        </form>
      </div>

      {/* Todos List */}
      <div
        style={{
          marginBottom: '16px',
          padding: '12px',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px',
        }}
      >
        <h2 style={{ fontSize: '16px', marginBottom: '8px' }}>Todos (via tRPC)</h2>
        {todosQuery.isPending && <p style={{ fontSize: '14px' }}>Loading...</p>}
        {todosQuery.error && (
          <p style={{ color: '#ff3b30', fontSize: '14px' }}>Error: {todosQuery.error.message}</p>
        )}
        {todosQuery.data && todosQuery.data.length === 0 && (
          <p style={{ color: '#999', fontSize: '14px' }}>No todos yet.</p>
        )}
        {todosQuery.data && todosQuery.data.length > 0 && (
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {todosQuery.data.map((todo) => (
              <div
                key={todo.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px',
                  marginBottom: '4px',
                  backgroundColor: 'white',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              >
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo.mutate({ id: todo.id, completed: !todo.completed })}
                  style={{ marginRight: '8px' }}
                />
                <span
                  style={{
                    flex: 1,
                    textDecoration: todo.completed ? 'line-through' : 'none',
                    color: todo.completed ? '#999' : 'inherit',
                  }}
                >
                  {todo.title}
                </span>
                <button
                  onClick={() => deleteTodo.mutate({ id: todo.id })}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: '#ff3b30',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Del
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* tRPC Data Preview */}
      <div style={{ padding: '12px', backgroundColor: '#e3f2fd', borderRadius: '4px' }}>
        <h2 style={{ fontSize: '16px', marginBottom: '4px' }}>tRPC Data Preview (Cached)</h2>
        <p style={{ fontSize: '11px', color: '#666', marginBottom: '8px' }}>
          Uses cached data - no DB call!
        </p>
        <button
          onClick={handleTrpcPreview}
          style={{
            width: '100%',
            padding: '8px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          Get Preview (First 3 Todos)
        </button>
        {directQueryResult && (
          <pre
            style={{
              marginTop: '8px',
              padding: '8px',
              backgroundColor: 'white',
              borderRadius: '4px',
              fontSize: '10px',
              overflow: 'auto',
              maxHeight: '100px',
            }}
          >
            {directQueryResult}
          </pre>
        )}
      </div>
    </div>
  );
}

/**
 * App wrapper with providers
 */
function App() {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: 'http://localhost:3000/api/trpc', // Replace with your API URL
          transformer: superjson,
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <Popup />
      </QueryClientProvider>
    </trpc.Provider>
  );
}

// Mount the app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
