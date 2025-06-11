import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

export class FirebaseService {
  // Album Services
  static async createAlbum(albumData) {
    try {
      const albumRef = await firestore().collection('albums').add({
        ...albumData,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
      return albumRef.id;
    } catch (error) {
      throw new Error(`Failed to create album: ${error.message}`);
    }
  }

  static async getAlbum(albumId) {
    try {
      const albumDoc = await firestore().collection('albums').doc(albumId).get();
      if (!albumDoc.exists) {
        throw new Error('Album not found');
      }
      return {id: albumDoc.id, ...albumDoc.data()};
    } catch (error) {
      throw new Error(`Failed to get album: ${error.message}`);
    }
  }

  static async getUserAlbums(userId) {
    try {
      const albumsSnapshot = await firestore()
        .collection('albums')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

      return albumsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      throw new Error(`Failed to get user albums: ${error.message}`);
    }
  }

  static async deleteAlbum(albumId) {
    try {
      const batch = firestore().batch();

      // Delete album
      const albumRef = firestore().collection('albums').doc(albumId);
      batch.delete(albumRef);

      // Delete all photos in the album
      const photosSnapshot = await firestore()
        .collection('photos')
        .where('albumId', '==', albumId)
        .get();

      for (const photoDoc of photosSnapshot.docs) {
        batch.delete(photoDoc.ref);

        // Delete image from storage
        const photoData = photoDoc.data();
        try {
          await storage().refFromURL(photoData.imageUrl).delete();
        } catch (storageError) {
          console.warn('Failed to delete image from storage:', storageError);
        }
      }

      await batch.commit();
    } catch (error) {
      throw new Error(`Failed to delete album: ${error.message}`);
    }
  }

  // Photo Services
  static async uploadPhoto(imageUri, photoId) {
    try {
      const reference = storage().ref(`photos/${photoId}`);
      await reference.putFile(imageUri);
      return await reference.getDownloadURL();
    } catch (error) {
      throw new Error(`Failed to upload photo: ${error.message}`);
    }
  }

  static async addPhoto(photoData) {
    try {
      const photoRef = await firestore().collection('photos').add({
        ...photoData,
        createdAt: firestore.FieldValue.serverTimestamp(),
        likes: [],
        likeCount: 0,
      });
      return photoRef.id;
    } catch (error) {
      throw new Error(`Failed to add photo: ${error.message}`);
    }
  }

  static async getAlbumPhotos(albumId) {
    try {
      const photosSnapshot = await firestore()
        .collection('photos')
        .where('albumId', '==', albumId)
        .orderBy('createdAt', 'asc')
        .get();

      return photosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      throw new Error(`Failed to get album photos: ${error.message}`);
    }
  }

  static async deletePhoto(photoId, imageUrl) {
    try {
      // Delete from Firestore
      await firestore().collection('photos').doc(photoId).delete();

      // Delete from Storage
      try {
        await storage().refFromURL(imageUrl).delete();
      } catch (storageError) {
        console.warn('Failed to delete image from storage:', storageError);
      }
    } catch (error) {
      throw new Error(`Failed to delete photo: ${error.message}`);
    }
  }

  // Social Features
  static async toggleLike(photoId, userId) {
    try {
      const photoRef = firestore().collection('photos').doc(photoId);

      return firestore().runTransaction(async transaction => {
        const photoDoc = await transaction.get(photoRef);
        if (!photoDoc.exists) {
          throw new Error('Photo not found');
        }

        const photoData = photoDoc.data();
        const likes = photoData.likes || [];
        const isLiked = likes.includes(userId);

        let newLikes;
        if (isLiked) {
          newLikes = likes.filter(id => id !== userId);
        } else {
          newLikes = [...likes, userId];
        }

        transaction.update(photoRef, {
          likes: newLikes,
          likeCount: newLikes.length,
        });

        return !isLiked; // Return new like status
      });
    } catch (error) {
      throw new Error(`Failed to toggle like: ${error.message}`);
    }
  }

  static async addComment(photoId, userId, text) {
    try {
      const commentRef = await firestore().collection('comments').add({
        photoId,
        userId,
        text,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
      return commentRef.id;
    } catch (error) {
      throw new Error(`Failed to add comment: ${error.message}`);
    }
  }

  static async getPhotoComments(photoId) {
    try {
      const commentsSnapshot = await firestore()
        .collection('comments')
        .where('photoId', '==', photoId)
        .orderBy('createdAt', 'asc')
        .get();

      return Promise.all(
        commentsSnapshot.docs.map(async doc => {
          const commentData = doc.data();

          // Get user info for each comment
          const userDoc = await firestore()
            .collection('users')
            .doc(commentData.userId)
            .get();

          return {
            id: doc.id,
            ...commentData,
            user: userDoc.data(),
          };
        }),
      );
    } catch (error) {
      throw new Error(`Failed to get comments: ${error.message}`);
    }
  }

  static async deleteComment(commentId, userId) {
    try {
      const commentRef = firestore().collection('comments').doc(commentId);
      const commentDoc = await commentRef.get();

      if (!commentDoc.exists) {
        throw new Error('Comment not found');
      }

      const commentData = commentDoc.data();
      if (commentData.userId !== userId) {
        throw new Error('Unauthorized to delete this comment');
      }

      await commentRef.delete();
    } catch (error) {
      throw new Error(`Failed to delete comment: ${error.message}`);
    }
  }

  // Feed Services
  static async getFeedPhotos(limit = 50) {
    try {
      const photosSnapshot = await firestore()
        .collection('photos')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      return Promise.all(
        photosSnapshot.docs.map(async doc => {
          const photoData = doc.data();

          // Get album info
          const albumDoc = await firestore()
            .collection('albums')
            .doc(photoData.albumId)
            .get();

          // Get user info
          const userDoc = await firestore()
            .collection('users')
            .doc(photoData.userId)
            .get();

          return {
            id: doc.id,
            ...photoData,
            album: albumDoc.data(),
            user: userDoc.data(),
          };
        }),
      );
    } catch (error) {
      throw new Error(`Failed to get feed photos: ${error.message}`);
    }
  }

  // User Services
  static async getUserProfile(userId) {
    try {
      const userDoc = await firestore().collection('users').doc(userId).get();
      if (!userDoc.exists) {
        throw new Error('User not found');
      }
      return {id: userDoc.id, ...userDoc.data()};
    } catch (error) {
      throw new Error(`Failed to get user profile: ${error.message}`);
    }
  }
}