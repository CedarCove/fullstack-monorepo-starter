import { Stack } from 'expo-router';
import { TrpcProvider } from '~/providers/TrpcProvider';

export default function RootLayout() {
  return (
    <TrpcProvider>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Grasp Mobile' }} />
      </Stack>
    </TrpcProvider>
  );
}
