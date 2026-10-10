import { Tabs } from 'expo-router';
import { Home, Calendar, List, DollarSign, User } from 'lucide-react-native';
import { theme } from '../src/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.surface,
      }}>
      <Tabs.Screen
        name="(tabs)/index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="(tabs)/bookings"
        options={{
          title: 'Bookings',
          tabBarIcon: ({ color }) => <Calendar size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="(tabs)/listings"
        options={{
          title: 'Listings',
          tabBarIcon: ({ color }) => <List size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="(tabs)/payouts"
        options={{
          title: 'Payouts',
          tabBarIcon: ({ color }) => <DollarSign size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="(tabs)/profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
