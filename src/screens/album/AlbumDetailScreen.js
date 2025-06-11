import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {FirebaseService} from '../../services/firebase';
import {useAuth} from '../../context/AuthContext';
import PhotoGrid from '../../components/PhotoGrid';

const AlbumDetailScreen = ({route, navigation}) => {
  const {albumId, photoId} = route.params;
  const [album, setAlbum] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const {user} = useAuth();

  useEffect(() => {
    loadAlbumData();
  }, [albumId]);

  useEffect(() => {
    if (photoId && photos.length > 0) {
      const photoIndex = photos.findIndex(p => p.id === photoId);
      if (photoIndex !== -1) {
        navigation.navigate('PhotoViewer', {
          photos,
          initialIndex: photoIndex,
          albumId,
        });
      }
    }
  }, [photos, photoId]);

  const loadAlbumData = async () => {
    try {
      const [albumData, photosData] = await Promise.all([
        FirebaseService.getAlbum(albumId),
        FirebaseService.getAlbumPhotos(albumId),
      ]);

      setAlbum(albumData);
      setPhotos(photosData);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAlbum = () => {
    Alert.alert(
      'Delete Album',
      'Are you sure you want to delete this album? This action cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await FirebaseService.deleteAlbum(albumId);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ],
    );
  };

  const handlePhotoPress = photoIndex => {
    navigation.navigate('PhotoViewer', {
      photos,
      initialIndex: photoIndex,
      albumId,
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!album) {
    return (
      <View style={styles.centered}>
        <Text>Album not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{album.title}</Text>
        {album.description && (
          <Text style={styles.description}>{album.description}</Text>
        )}
        <Text style={styles.photoCount}>
          {photos.length} photo{photos.length !== 1 ? 's' : ''}
        </Text>

        {album.userId === user.uid && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteAlbum}>
            <Text style={styles.deleteButtonText}>Delete Album</Text>
          </TouchableOpacity>
        )}
      </View>

      <PhotoGrid photos={photos} onPhotoPress={handlePhotoPress} numColumns={3} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  photoCount: {
    fontSize: 14,
    color: '#999',
    marginBottom: 15,
  },
  deleteButton: {
    backgroundColor: '#ff4444',
    padding: 10,
    borderRadius: 5,
    alignSelf: 'flex-start',
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default AlbumDetailScreen;