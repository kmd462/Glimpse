import { useState, useEffect } from 'react';
import firestore from '@react-native-firebase/firestore';

export const useCollection = (collectionName, queryConstraints = []) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let query = firestore().collection(collectionName);
    
    // Apply query constraints
    queryConstraints.forEach(constraint => {
      if (constraint.type === 'where') {
        query = query.where(constraint.field, constraint.operator, constraint.value);
      } else if (constraint.type === 'orderBy') {
        query = query.orderBy(constraint.field, constraint.direction);
      } else if (constraint.type === 'limit') {
        query = query.limit(constraint.value);
      }
    });

    const unsubscribe = query.onSnapshot(
      (snapshot) => {
        const documents = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setData(documents);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [collectionName, JSON.stringify(queryConstraints)]);

  return { data, loading, error };
};

export const useDocument = (collectionName, documentId) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!documentId) {
      setLoading(false);
      return;
    }

    const unsubscribe = firestore()
      .collection(collectionName)
      .doc(documentId)
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            setData({ id: doc.id, ...doc.data() });
          } else {
            setData(null);
          }
          setLoading(false);
          setError(null);
        },
        (err) => {
          setError(err);
          setLoading(false);
        }
      );

    return unsubscribe;
  }, [collectionName, documentId]);

  return { data, loading, error };
};