import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import FastImage from 'react-native-fast-image';
import {FirebaseService} from '../../services/firebase';
import {useAuth} from '../../context/AuthContext';

const {width} = Dimensions.get('window');

const CreateAlbumScreen = ({navigation}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const {user} = useAuth();

  const selectImages = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      selectionLimit: 10,
      includeBase64: false,
    };

    launchImageLibrary(options, response => {
      if (response.assets && response.assets.length > 0) {
        setSelectedImages(response.assets);
      }
    });
  };

  const createAlbum = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter an album title');
      return;
    }

    if (selectedImages.length === 0) {
      Alert.alert('Error', 'Please select at least one photo');
      return;
    }

    setUploading(true);

    try {
      // Create album document
      const albumId = await FirebaseService.createAlbum({
        title: title.trim(),
        description: description.trim(),
        userId: user.uid,
        photoCount: selectedImages.length,
      });

      // Upload photos
      const photoPromises = selectedImages.map(async (image, index) => {
        const photoId = `${albumId}_${index}_${Date.now()}`;
        const imageUrl = await FirebaseService.uploadPhoto(image.uri, photoId);

        return FirebaseService.addPhoto({
          albumId,
          userId: user.uid,
          imageUrl,
          thumbnailUrl: imageUrl, // You could generate actual thumbnails
          metadata: {
            originalName: image.fileName,
            size: image.fileSize,
          },
        });
      });

      await Promise.all(photoPromises);

      Alert.alert('Success', 'Album created successfully!', [
        {
          text: 'OK',
          onPress: () => {
            setTitle('');
            setDescription('');
            setSelectedImages([]);
            navigation.navigate('Feed');
          },
        },
      ]);
    } catch (error) {
      console.error('Error creating album:', error);
      Alert.alert('Error', 'Failed to create album. Please try again.');
    }

    setUploading(false);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Create New Album</Text>

        <TextInput
          style={styles.input}
          placeholder="Album title"
          value={title}
          onChangeText={setTitle}
          maxLength={50}
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Description (optional)"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          maxLength={200}
        />

        <TouchableOpacity style={styles.selectButton} onPress={selectImages}>
          <Text style={styles.selectButtonText}>
            {selectedImages.length > 0
              ? `${selectedImages.length} photos selected`
              : 'Select Photos'}
          </Text>
        </TouchableOpacity>

        {selectedImages.length > 0 && (
          <ScrollView horizontal style={styles.imagePreview}>
            {selectedImages.map((image, index) => (
              <FastImage
                key={index}
                source={{uri: image.uri}}
                style={styles.previewImage}
                resizeMode={FastImage.resizeMode.cover}
              />
            ))}
          </ScrollView>
        )}

        <TouchableOpacity
          style={[styles.createButton, uploading && styles.disabledButton]}
          onPress={createAlbum}
          disabled={uploading}>
          {uploading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="white" size="small" />
              <Text style={styles.createButtonText}>Creating Album...</Text>
            </View>
          ) : (
            <Text style={styles.createButtonText}>Create Album</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  selectButton: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  selectButtonText: {
    textAlign: 'center',
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  imagePreview: {
    marginBottom: 20,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 10,
  },
  createButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10,
  },
});

export default CreateAlbumScreen;