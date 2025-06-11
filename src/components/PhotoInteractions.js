import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useAuth} from '../context/AuthContext';
import {FirebaseService} from '../services/firebase';

const PhotoInteractions = ({photo, onClose}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const {user} = useAuth();

  useEffect(() => {
    if (photo) {
      setIsLiked(photo.likes?.includes(user.uid) || false);
      setLikeCount(photo.likeCount || 0);
      loadComments();
    }
  }, [photo, user.uid]);

  const loadComments = async () => {
    try {
      setCommentsLoading(true);
      const commentsData = await FirebaseService.getPhotoComments(photo.id);
      setComments(commentsData);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      const newLikeStatus = await FirebaseService.toggleLike(
        photo.id,
        user.uid,
      );
      setIsLiked(newLikeStatus);
      setLikeCount(prev => (newLikeStatus ? prev + 1 : prev - 1));
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      await FirebaseService.addComment(photo.id, user.uid, newComment.trim());
      setNewComment('');
      await loadComments(); // Reload comments
    } catch (error) {
      Alert.alert('Error', error.message);
    }
    setLoading(false);
  };

  const handleDeleteComment = async commentId => {
    try {
      await FirebaseService.deleteComment(commentId, user.uid);
      await loadComments(); // Reload comments
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const renderComment = ({item}) => (
    <View style={styles.commentItem}>
      <View style={styles.commentContent}>
        <Text style={styles.commentUser}>{item.user?.username}</Text>
        <Text style={styles.commentText}>{item.text}</Text>
      </View>
      {item.userId === user.uid && (
        <TouchableOpacity onPress={() => handleDeleteComment(item.id)}>
          <Icon name="delete" size={16} color="#999" />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Photo Details</Text>
        <TouchableOpacity onPress={onClose}>
          <Icon name="close" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Like Section */}
      <View style={styles.likeSection}>
        <TouchableOpacity style={styles.likeButton} onPress={handleLike}>
          <Icon
            name={isLiked ? 'favorite' : 'favorite-border'}
            size={24}
            color={isLiked ? '#ff4444' : '#666'}
          />
          <Text style={styles.likeCount}>{likeCount}</Text>
        </TouchableOpacity>
      </View>

      {/* Comments Section */}
      <View style={styles.commentsSection}>
        <Text style={styles.sectionTitle}>Comments</Text>

        {commentsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#007AFF" />
          </View>
        ) : (
          <FlatList
            data={comments}
            renderItem={renderComment}
            keyExtractor={item => item.id}
            style={styles.commentsList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={styles.noComments}>No comments yet</Text>
            }
          />
        )}
      </View>

      {/* Add Comment */}
      <View style={styles.addCommentSection}>
        <TextInput
          style={styles.commentInput}
          placeholder="Add a comment..."
          value={newComment}
          onChangeText={setNewComment}
          multiline
          maxLength={200}
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={handleAddComment}
          disabled={loading || !newComment.trim()}>
          <Icon
            name="send"
            size={20}
            color={loading || !newComment.trim() ? '#ccc' : '#007AFF'}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  likeSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeCount: {
    marginLeft: 8,
    fontSize: 16,
    color: '#666',
  },
  commentsSection: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  commentsList: {
    flex: 1,
  },
  commentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  commentContent: {
    flex: 1,
  },
  commentUser: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 2,
  },
  commentText: {
    fontSize: 14,
    color: '#333',
  },
  noComments: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  addCommentSection: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    maxHeight: 100,
  },
  sendButton: {
    padding: 10,
  },
});

export default PhotoInteractions;