import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  Modal,
  Alert,
  FlatList,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useAuth} from '../../context/AuthContext';
import {FirebaseService} from '../../services/firebase';
import PhotoInteractions from '../../components/PhotoInteractions';

const {width, height} = Dimensions.get('window');

const PhotoViewerScreen = ({route, navigation}) => {
  const {photos, initialIndex = 0} = route.params;
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showInteractions, setShowInteractions] = useState(false);
  const {user} = useAuth();

  const currentPhoto = photos[currentIndex];
  const isOwner = currentPhoto?.userId === user?.uid;

  const handleDeletePhoto = () => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await FirebaseService.deletePhoto(
                currentPhoto.id,
                currentPhoto.imageUrl,
              );
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ],
    );
  };

  const renderPhoto = ({item}) => (
    <View style={styles.photoContainer}>
      <FastImage
        source={{uri: item.imageUrl}}
        style={styles.photo}
        resizeMode={FastImage.resizeMode.contain}
      />
    </View>
  );

  const onViewableItemsChanged = ({viewableItems}) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <Text style={styles.counter}>
          {currentIndex + 1} of {photos.length}
        </Text>

        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setShowInteractions(true)}>
            <Icon name="favorite" size={24} color="white" />
          </TouchableOpacity>

          {isOwner && (
            <TouchableOpacity
              onPress={handleDeletePhoto}
              style={{marginLeft: 15}}>
              <Icon name="delete" size={24} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Photo Carousel */}
      <FlatList
        data={photos}
        renderItem={renderPhoto}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={initialIndex}
        getItemLayout={(data, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 50,
        }}
      />

      {/* Photo Interactions Modal */}
      <Modal
        visible={showInteractions}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowInteractions(false)}>
        <PhotoInteractions
          photo={currentPhoto}
          onClose={() => setShowInteractions(false)}
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  counter: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoContainer: {
    width,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photo: {
    width: width,
    height: height - 120,
  },
});

export default PhotoViewerScreen;