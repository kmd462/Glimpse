import React, {createContext, useContext, useEffect, useState} from 'react';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({children}) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async user => {
      if (user) {
        try {
          // Get additional user data from Firestore
          const userDoc = await firestore()
            .collection('users')
            .doc(user.uid)
            .get();

          setUser({
            ...user,
            ...userDoc.data(),
          });
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(user);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    try {
      await auth().signInWithEmailAndPassword(email, password);
    } catch (error) {
      throw error;
    }
  };

  const register = async (email, password, username) => {
    try {
      const {user} = await auth().createUserWithEmailAndPassword(
        email,
        password,
      );

      // Create user document in Firestore
      await firestore().collection('users').doc(user.uid).set({
        username,
        email,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

      await user.updateProfile({displayName: username});
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await auth().signOut();
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{user, loading, login, register, logout}}>
      {children}
    </AuthContext.Provider>
  );
};