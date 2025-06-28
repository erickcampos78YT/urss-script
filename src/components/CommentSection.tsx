import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, addDoc, updateDoc, doc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { HeartIcon, ChatBubbleLeftIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { useNavigate } from 'react-router-dom';

interface Comment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: any;
  updatedAt: any;
  isEdited: boolean;
  votes: number;
  userVotes: { [key: string]: 'up' | 'down' };
  replies: Comment[];
  parentId?: string;
  scriptId: string;
  codeBlockId: string; // ADICIONADO
}

interface CommentSectionProps {
  scriptId: string;
  codeBlockId: string; // ADICIONADO
}

const CommentSection: React.FC<CommentSectionProps> = ({ scriptId, codeBlockId }) => {
  const { currentUser } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'top' | 'new' | 'controversial'>('top');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!scriptId || !codeBlockId) {
      setComments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const commentsRef = collection(db, 'comments');
    let q = query(
      commentsRef,
      where('scriptId', '==', scriptId),
      where('codeBlockId', '==', codeBlockId),
      where('parentId', '==', null)
    );
    switch (sortBy) {
      case 'top':
        q = query(q, orderBy('votes', 'desc'));
        break;
      case 'new':
        q = query(q, orderBy('createdAt', 'desc'));
        break;
      case 'controversial':
        q = query(q, orderBy('votes', 'asc'));
        break;
    }
    // Real-time listener
    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const allComments = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const commentData = doc.data();
          // Fetch replies for this comment
          const repliesQuery = query(
            commentsRef,
            where('parentId', '==', doc.id),
            where('codeBlockId', '==', codeBlockId),
            orderBy('createdAt', 'asc')
          );
          const repliesSnapshot = await getDocs(repliesQuery);
          const replies = repliesSnapshot.docs.map(replyDoc => {
            const replyData = replyDoc.data();
            const reply: Comment = {
              id: replyDoc.id,
              scriptId: scriptId,
              codeBlockId: codeBlockId,
              content: replyData.content || '',
              authorId: replyData.authorId || '',
              authorName: replyData.authorName || 'Anonymous',
              isEdited: replyData.isEdited || false,
              createdAt: replyData.createdAt,
              updatedAt: replyData.updatedAt,
              votes: replyData.votes || 0,
              userVotes: replyData.userVotes || {},
              replies: [],
              parentId: doc.id
            };
            return reply;
          });
          return {
            id: doc.id,
            scriptId: scriptId,
            codeBlockId: codeBlockId,
            content: commentData.content || '',
            authorId: commentData.authorId || '',
            authorName: commentData.authorName || 'Anonymous',
            isEdited: commentData.isEdited || false,
            createdAt: commentData.createdAt,
            updatedAt: commentData.updatedAt,
            votes: commentData.votes || 0,
            userVotes: commentData.userVotes || {},
            replies: replies,
            parentId: null
          } as Comment;
        })
      );
      setComments(allComments);
      setError(null);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [scriptId, codeBlockId, sortBy]);

  const handleVote = async (commentId: string, voteType: 'up' | 'down') => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    try {
      const commentRef = doc(db, 'comments', commentId);
      const comment = comments.find(c => c.id === commentId) || 
                     comments.flatMap(c => c.replies).find(r => r.id === commentId);

      if (!comment) return;

      const currentVote = comment.userVotes?.[currentUser.uid];
      let voteChange = 0;

      if (currentVote === voteType) {
        // Remove existing vote
        voteChange = voteType === 'up' ? -1 : 1;
        await updateDoc(commentRef, {
          votes: comment.votes + voteChange,
          [`userVotes.${currentUser.uid}`]: null
        });
      } else if (currentVote) {
        // Change vote
        voteChange = voteType === 'up' ? 2 : -2;
        await updateDoc(commentRef, {
          votes: comment.votes + voteChange,
          [`userVotes.${currentUser.uid}`]: voteType
        });
      } else {
        // New vote
        voteChange = voteType === 'up' ? 1 : -1;
        await updateDoc(commentRef, {
          votes: comment.votes + voteChange,
          [`userVotes.${currentUser.uid}`]: voteType
        });
      }

      // fetchComments();
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const trimmedContent = newComment.trim();
    if (!trimmedContent) return;

    if (trimmedContent.length > 1000) {
      setError('Comment cannot exceed 1000 characters.');
      return;
    }

    try {
      const commentsRef = collection(db, 'comments');
      const timestamp = serverTimestamp();
      
      await addDoc(commentsRef, {
        content: trimmedContent,
        scriptId,
        codeBlockId, // Adiciona codeBlockId ao salvar comentário
        authorId: currentUser.uid,
        authorName: currentUser.displayName || 'Anonymous',
        createdAt: timestamp,
        updatedAt: timestamp,
        isEdited: false,
        parentId: null,
        votes: 0,
        userVotes: {}
      });

      setNewComment('');
      // fetchComments();
    } catch (error) {
      console.error('Error adding comment:', error);
      setError('Failed to post comment. Please try again.');
    }
  };

  const handleSubmitReply = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const trimmedContent = newComment.trim();
    if (!trimmedContent) return;

    if (trimmedContent.length > 500) {
      setError('Reply cannot exceed 500 characters.');
      return;
    }

    try {
      const commentsRef = collection(db, 'comments');
      const timestamp = serverTimestamp();
      
      await addDoc(commentsRef, {
        content: trimmedContent,
        scriptId,
        codeBlockId, // Adiciona codeBlockId ao salvar reply
        authorId: currentUser.uid,
        authorName: currentUser.displayName || 'Anonymous',
        createdAt: timestamp,
        updatedAt: timestamp,
        isEdited: false,
        parentId,
        votes: 0,
        userVotes: {}
      });

      setNewComment('');
      setReplyTo(null);
      // fetchComments();
    } catch (error) {
      console.error('Error adding reply:', error);
      setError('Failed to post reply. Please try again.');
    }
  };

  const CommentItem: React.FC<{ comment: Comment; level?: number }> = ({ comment, level = 0 }) => {
    const [showReplies, setShowReplies] = useState(true);
    const currentVote = comment.userVotes?.[currentUser?.uid || ''];

    return (
      <div className={`${level > 0 ? 'ml-8 mt-4' : 'mt-6'}`}>
        <div className="bg-dark-gray/50 rounded-xl p-4">
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              <button
                onClick={() => handleVote(comment.id, 'up')}
                className={`p-1 rounded hover:bg-dark-gray/70 ${
                  currentVote === 'up' ? 'text-carmine' : 'text-gray-400'
                }`}
              >
                <ChevronUpIcon className="h-5 w-5" />
              </button>
              <span className="text-sm font-medium">{comment.votes}</span>
              <button
                onClick={() => handleVote(comment.id, 'down')}
                className={`p-1 rounded hover:bg-dark-gray/70 ${
                  currentVote === 'down' ? 'text-carmine' : 'text-gray-400'
                }`}
              >
                <ChevronDownIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium text-white">{comment.authorName}</span>
                <span className="text-sm text-gray-400">
                  {comment.createdAt?.toDate().toLocaleDateString()}
                  {comment.isEdited && (
                    <span className="ml-2 text-xs">(edited)</span>
                  )}
                </span>
              </div>
              <p className="text-gray-300 mb-4">{comment.content}</p>

              {level === 0 && (
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setReplyTo(comment.id)}
                    className="text-sm text-gray-400 hover:text-carmine transition-colors"
                  >
                    Reply
                  </button>
                  {comment.replies && comment.replies.length > 0 && (
                    <button
                      onClick={() => setShowReplies(!showReplies)}
                      className="text-sm text-gray-400 hover:text-carmine transition-colors"
                    >
                      {showReplies ? 'Hide Replies' : 'Show Replies'} ({comment.replies.length})
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {replyTo === comment.id && (
            <div className="mt-4 ml-12">
              <form onSubmit={(e) => handleSubmitReply(e, comment.id)} className="space-y-2">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a reply... (max 500 characters)"
                  className="w-full bg-dark-gray/50 border border-carmine/30 rounded-xl px-4 py-2 text-gray-300"
                  rows={2}
                  maxLength={500}
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setReplyTo(null)}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-carmine rounded-xl hover:bg-carmine/90 transition-colors"
                  >
                    Post Reply
                  </button>
                </div>
              </form>
            </div>
          )}

          {showReplies && comment.replies && comment.replies.length > 0 && (
            <div className="mt-4">
              {comment.replies.map((reply) => (
                <CommentItem key={reply.id} comment={reply} level={level + 1} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-carmine"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-carmine">Comments</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'top' | 'new' | 'controversial')}
            className="bg-dark-gray/50 border border-carmine/30 rounded-xl px-3 py-1 text-sm focus:outline-none focus:border-carmine"
          >
            <option value="top">Top</option>
            <option value="new">New</option>
            <option value="controversial">Controversial</option>
          </select>
        </div>
      </div>
      
      <form onSubmit={handleSubmitComment} className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-carmine/20 flex items-center justify-center">
              <span className="text-carmine font-semibold">
                {currentUser?.displayName?.charAt(0).toUpperCase() || 'A'}
              </span>
            </div>
          </div>
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment... (max 1000 characters)"
              className="w-full bg-dark-gray/50 border border-carmine/30 rounded-xl px-4 py-2 text-gray-300"
              rows={3}
              maxLength={1000}
            />
            <div className="flex justify-end mt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-carmine rounded-xl hover:bg-carmine/90 transition-colors"
              >
                Post Comment
              </button>
            </div>
          </div>
        </div>
      </form>

      {error && (
        <div className="bg-carmine/20 border border-carmine text-carmine px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))
        )}
      </div>
    </div>
  );
};

// Função utilitária para obter nome do usuário
function getUserName(user: any) {
  if (!user) return 'Anonymous';
  if (user.displayName && user.displayName.trim() !== '') return user.displayName;
  if (user.email) return user.email.split('@')[0];
  return 'Anonymous';
}

export default CommentSection;
