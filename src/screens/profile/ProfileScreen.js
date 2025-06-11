import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
  Dimensions,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useAuth} from '../../context/AuthContext';
import {FirebaseService} from '../../services/firebase';
import PhotoGrid from '../../components/PhotoGrid';

const {width} = Dimensions.get('window');

const ProfileScreen = ({navigation}) => {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('albums'); // 'albums' or 'photos'
  const [userPhotos, setUserPhotos] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const {user, logout} = useAuth();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Load user's albums
      const userAlbums = await FirebaseService.getUserAlbums(user.uid);
      setAlbums(userAlbums);

      // Get all photos from user's albums
      const allPhotos = [];
      for (const album of userAlbums) {
        try {
          const albumPhotos = await FirebaseService.getAlbumPhotos(album.id);
          allPhotos.push(...albumPhotos);
        } catch (error) {
          console.warn('Error loading photos for album:', album.id, error);
        }
      }

      // Sort photos by creation date (newest first)
      const sortedPhotos = allPhotos.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB - dateA;
      });

      setUserPhotos(sortedPhotos);
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadUserData();
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Logout',
        style: 'destructive',
        onPress: logout,
      },
    ]);
  };

  const handleEditProfile = () => {
    Alert.alert('Edit Profile', 'Profile editing coming soon!');
  };

  const handleSettings = () => {
    Alert.alert('Settings', 'Settings coming soon!');
  };

  const renderAlbumItem = ({item}) => (
    <TouchableOpacity
      style={styles.albumItem}
      onPress={() => navigation.navigate('AlbumDetail', {albumId: item.id})}>
      <FastImage
        source={{
          uri: item.coverImage || 'https://via.placeholder.com/150x150?text=No+Image'
        }}
        style={styles.albumCover}
        resizeMode={FastImage.resizeMode.cover}
      />
      <View style={styles.albumInfo}>
        <Text style={styles.albumTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.albumCount}>{item.photoCount || 0} photos</Text>
        <Text style={styles.albumDate}>
          {item.createdAt?.toDate ? 
            item.createdAt.toDate().toLocaleDateString() : 
            'Recently created'
          }
        </Text>
      </View>
      <Icon name="chevron-right" size={24} color="#ccc" />
    </TouchableOpacity>
  );

  const handlePhotoPress = photoIndex => {
    navigation.navigate('PhotoViewer', {
      photos: userPhotos,
      initialIndex: photoIndex,
    });
  };

  const renderEmptyAlbums = () => (
    <View style={styles.emptyState}>
      <Icon name="photo-library" size={64} color="#ccc" />
      <Text style={styles.emptyText}>No albums yet</Text>
      <Text style={styles.emptySubtext}>
        Create your first album to get started
      </Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => navigation.navigate('Create')}>
        <Text style={styles.createButtonText}>Create Album</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyPhotos = () => (
    <View style={styles.emptyState}>
      <Icon name="photo" size={64} color="#ccc" />
      <Text style={styles.emptyText}>No photos yet</Text>
      <Text style={styles.emptySubtext}>
        Start sharing your memories
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.displayName?.charAt(0).toUpperCase() || 
                 user?.email?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.editAvatarButton}
              onPress={handleEditProfile}>
              <Icon name="edit" size={16} color="#007AFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.username}>
              {user?.displayName || user?.email?.split('@')[0] || 'User'}
            </Text>
            <Text style={styles.email}>{user?.email}</Text>
            <Text style={styles.joinDate}>
              Joined {user?.metadata?.creationTime ? 
                new Date(user.metadata.creationTime).toLocaleDateString() : 
                'recently'
              }
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleEditProfile}>
            <Icon name="edit" size={20} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleSettings}>
            <Icon name="settings" size={20} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}>
            <Icon name="logout" size={20} color="#ff4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{albums.length}</Text>
          <Text style={styles.statLabel}>Albums</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{userPhotos.length}</Text>
          <Text style={styles.statLabel}>Photos</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {userPhotos.reduce((total, photo) => total + (photo.likeCount || 0), 0)}
          </Text>
          <Text style={styles.statLabel}>Likes</Text>
        </View>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabSelector}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'albums' && styles.activeTab]}
          onPress={() => setActiveTab('albums')}>
          <Icon 
            name="photo-library" 
            size={20} 
            color={activeTab === 'albums' ? '#007AFF' : '#666'} 
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'albums' && styles.activeTabText,
            ]}>
            Albums
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'photos' && styles.activeTab]}
          onPress={() => setActiveTab('photos')}>
          <Icon 
            name="photo" 
            size={20} 
            color={activeTab === 'photos' ? '#007AFF' : '#666'} 
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'photos' && styles.activeTabText,
            ]}>
            Photos
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'albums' ? (
          albums.length > 0 ? (
            <FlatList
              data={albums}
              renderItem={renderAlbumItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            renderEmptyAlbums()
          )
        ) : userPhotos.length > 0 ? (
          <PhotoGrid
            photos={userPhotos}
            onPhotoPress={handlePhotoPress}
            numColumns={3}
          />
        ) : (
          renderEmptyPhotos()
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 2,
  },
  joinDate: {
    fontSize: 14,
    color: '#999',
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  logoutButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 20,
    backgroundColor: '#ffebee',
  },
  stats: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 20,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#eee',
    marginHorizontal: 10,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    minHeight: 300,
  },
  albumItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    margin: 10,
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  albumCover: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 15,
  },
  albumInfo: {
    flex: 1,
  },
  albumTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  albumCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  albumDate: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 300,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;