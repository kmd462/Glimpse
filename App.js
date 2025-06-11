import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {AuthProvider, useAuth} from './src/context/AuthContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Screens
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import FeedScreen from './src/screens/feed/FeedScreen';
import AlbumDetailScreen from './src/screens/album/AlbumDetailScreen';
import CreateAlbumScreen from './src/screens/album/CreateAlbumScreen';
import ProfileScreen from './src/screens/profile/ProfileScreen';
import PhotoViewerScreen from './src/screens/photo/PhotoViewerScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Stack (Login/Register)
const AuthStack = () => (
  <Stack.Navigator screenOptions={{headerShown: false}}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

// Feed Stack Navigator
const FeedStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="FeedHome"
      component={FeedScreen}
      options={{title: 'Glimpse'}}
    />
    <Stack.Screen
      name="AlbumDetail"
      component={AlbumDetailScreen}
      options={{title: 'Album'}}
    />
    <Stack.Screen
      name="PhotoViewer"
      component={PhotoViewerScreen}
      options={{headerShown: false}}
    />
  </Stack.Navigator>
);

// Main Tab Navigator
const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({route}) => ({
      tabBarIcon: ({focused, color, size}) => {
        let iconName;
        if (route.name === 'Feed') iconName = 'home';
        else if (route.name === 'Create') iconName = 'add-circle';
        else if (route.name === 'Profile') iconName = 'person';

        return <Icon name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#007AFF',
      tabBarInactiveTintColor: 'gray',
      headerShown: false,
    })}>
    <Tab.Screen name="Feed" component={FeedStack} />
    <Tab.Screen name="Create" component={CreateAlbumScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

// Main App Navigator
const AppNavigator = () => {
  const {user} = useAuth();

  return (
    <NavigationContainer>
      {user ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
};

// App Component
const App = () => {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
};

export default App;