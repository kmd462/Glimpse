import React from 'react';
import {
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import FastImage from 'react-native-fast-image';

const {width} = Dimensions.get('window');

const PhotoGrid = ({photos, onPhotoPress, numColumns = 3}) => {
  const itemSize = (width - (numColumns + 1) * 10) / numColumns;

  const renderPhoto = ({item, index}) => (
    <TouchableOpacity
      style={[styles.photoItem, {width: itemSize, height: itemSize}]}
      onPress={() => onPhotoPress(index)}>
      <FastImage
        source={{uri: item.thumbnailUrl || item.imageUrl}}
        style={styles.photo}
        resizeMode={FastImage.resizeMode.cover}
      />
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={photos}
      renderItem={renderPhoto}
      keyExtractor={item => item.id}
      numColumns={numColumns}
      contentContainerStyle={styles.grid}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  grid: {
    padding: 5,
  },
  photoItem: {
    margin: 5,
    borderRadius: 8,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
});

export default PhotoGrid;