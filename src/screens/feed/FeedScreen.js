import React, {useEffect, useState} from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Text,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import {FirebaseService} from '../../services/firebase';

const {width} = Dimensions.get('window');
const ITEM_SIZE = (width - 30) / 2;

const FeedScreen = ({navigation}) => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPhotos = async () => {
    try {
      const photosData = await FirebaseService.getFeedPhotos();
      setPhotos(photosData);
    } catch (error) {
      console.error('Error fetching photos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPhotos();
  };

  const renderPhotoItem = ({item}) => (
    <TouchableOpacity
      style={styles.photoItem}
      onPress={() =>
        navigation.navigate('AlbumDetail', {
          albumId: item.albumId,
          photoId: item.id,
        })
      }>
      <FastImage
        source={{uri: item.thumbnailUrl || item.imageUrl}}
        style={styles.photo}
        resizeMode={FastImage.resizeMode.cover}
      />
      <View style={styles.photoInfo}>
        <Text style={styles.username} numberOfLines={1}>
          {item.user?.username || 'Unknown'}
        </Text>
        <Text style={styles.albumTitle} numberOfLines={1}>
          {item.album?.title || 'Untitled'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading feed...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={photos}
        renderItem={renderPhotoItem}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No photos yet!</Text>
            <Text style={styles.emptySubtext}>
              Create an album and start sharing
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  grid: {
    padding: 10,
  },
  photoItem: {
    width: ITEM_SIZE,
    margin: 5,
    backgroundColor: 'white',
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  photo: {
    width: '100%',
    height: ITEM_SIZE,
  },
  photoInfo: {
    padding: 10,
  },
  username: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#007AFF',
  },
  albumTitle: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default FeedScreen;