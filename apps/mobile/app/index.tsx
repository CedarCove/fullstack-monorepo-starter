import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { trpc } from '~/lib/trpc';

/**
 * Main screen demonstrating tRPC + Drizzle ORM usage
 * Shows type-safe queries, mutations, and automatic caching
 */
export default function HomeScreen() {
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
      const limitedData = todosQuery.data.slice(0, 5);
      setDirectQueryResult(JSON.stringify(limitedData, null, 2));
    } else if (todosQuery.error) {
      setDirectQueryResult(`Error: ${todosQuery.error.message}`);
    } else {
      setDirectQueryResult('Loading todos...');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <StatusBar style="auto" />

      <View style={styles.header}>
        <Text style={styles.title}>Grasp Mobile</Text>
        <Text style={styles.subtitle}>React Native + tRPC + Supabase</Text>
      </View>

      {/* Stats Section */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Statistics (via tRPC)</Text>
        {statsQuery.isPending && <ActivityIndicator />}
        {statsQuery.error && (
          <Text style={styles.errorText}>Error: {statsQuery.error.message}</Text>
        )}
        {statsQuery.data && (
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total</Text>
              <Text style={styles.statValue}>{statsQuery.data.total}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Completed</Text>
              <Text style={styles.statValue}>{statsQuery.data.completed}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Pending</Text>
              <Text style={styles.statValue}>{statsQuery.data.pending}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Rate</Text>
              <Text style={styles.statValue}>{statsQuery.data.completionRate}%</Text>
            </View>
          </View>
        )}
      </View>

      {/* Create Todo Form */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Create Todo (via tRPC)</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={newTodoTitle}
            onChangeText={setNewTodoTitle}
            placeholder="Enter todo title..."
            placeholderTextColor="#999"
          />
          <TouchableOpacity
            style={[styles.button, createTodo.isPending && styles.buttonDisabled]}
            onPress={() => {
              if (newTodoTitle.trim()) {
                createTodo.mutate({ title: newTodoTitle });
              }
            }}
            disabled={createTodo.isPending}
          >
            <Text style={styles.buttonText}>{createTodo.isPending ? 'Creating...' : 'Create'}</Text>
          </TouchableOpacity>
        </View>
        {createTodo.error && (
          <Text style={styles.errorText}>Error: {createTodo.error.message}</Text>
        )}
      </View>

      {/* Todos List */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Todos List (via tRPC)</Text>
        {todosQuery.isPending && <ActivityIndicator />}
        {todosQuery.error && (
          <Text style={styles.errorText}>Error: {todosQuery.error.message}</Text>
        )}
        {todosQuery.data && todosQuery.data.length === 0 && (
          <Text style={styles.emptyText}>No todos yet. Create one above!</Text>
        )}
        {todosQuery.data &&
          todosQuery.data.map((todo) => (
            <View key={todo.id} style={styles.todoItem}>
              <TouchableOpacity
                style={styles.todoContent}
                onPress={() => toggleTodo.mutate({ id: todo.id, completed: !todo.completed })}
              >
                <View style={styles.checkbox}>
                  {todo.completed && <View style={styles.checkboxChecked} />}
                </View>
                <View style={styles.todoText}>
                  <Text style={[styles.todoTitle, todo.completed && styles.todoTitleCompleted]}>
                    {todo.title}
                  </Text>
                  <Text style={styles.todoMeta}>
                    {todo.daysOld} days old
                    {todo.isOverdue && ' (overdue)'}
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteTodo.mutate({ id: todo.id })}
                disabled={deleteTodo.isPending}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          ))}
      </View>

      {/* tRPC Data Preview Example */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>tRPC Data Preview (Cached)</Text>
        <Text style={styles.infoText}>Uses existing cached data - no DB call needed!</Text>
        <TouchableOpacity style={styles.button} onPress={handleTrpcPreview}>
          <Text style={styles.buttonText}>Get Preview (First 5 Todos)</Text>
        </TouchableOpacity>
        {directQueryResult && (
          <View style={styles.codeBlock}>
            <Text style={styles.codeText}>{directQueryResult}</Text>
          </View>
        )}
      </View>

      {/* Architecture Notes */}
      <View style={[styles.card, styles.infoCard]}>
        <Text style={styles.cardTitle}>Architecture Notes</Text>
        <Text style={styles.infoText}>• End-to-end type safety with tRPC + Drizzle</Text>
        <Text style={styles.infoText}>• Type-safe SQL queries via Drizzle ORM</Text>
        <Text style={styles.infoText}>• Shared types across all platforms</Text>
        <Text style={styles.infoText}>• TanStack Query for automatic caching</Text>
        <Text style={styles.infoText}>• No direct DB queries - tRPC handles it all</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  card: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 4,
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#ff3b30',
    marginTop: 8,
  },
  emptyText: {
    color: '#999',
    fontStyle: 'italic',
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  todoContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007AFF',
  },
  todoText: {
    flex: 1,
  },
  todoTitle: {
    fontSize: 16,
    marginBottom: 2,
  },
  todoTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  todoMeta: {
    fontSize: 12,
    color: '#666',
  },
  deleteButton: {
    backgroundColor: '#ff3b30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  codeBlock: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 4,
    marginTop: 8,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
  infoCard: {
    backgroundColor: '#e3f2fd',
  },
  infoText: {
    fontSize: 14,
    marginBottom: 4,
  },
});
