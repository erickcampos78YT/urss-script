import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, increment, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import EditIcon from '../components/icons/EditIcon';
import { HeartIcon, HeartIconSolid, ChatBubbleIcon, CodeBracketIcon } from '../components/icons';
import LoadingSpinner from '../components/LoadingSpinner';
import CommentSection from '../components/CommentSection';
import SimpleEditor from '../components/SimpleEditor';

interface Script {
  id: string;
  title: string;
  description: string;
  code: string;
  language: string;
  authorId: string;
  authorName: string;
  likes: number;
  likedBy: string[];
  createdAt: Date;
  tags: string[];
}

const ScriptDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [script, setScript] = useState<Script | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liked, setLiked] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCode, setEditedCode] = useState('');

  useEffect(() => {
    const fetchScript = async () => {
      if (!id) {
        setError('Script ID is missing');
        setLoading(false);
        return;
      }

      try {
        const scriptRef = doc(db, 'scripts', id);
        const scriptSnap = await getDoc(scriptRef);

        if (!scriptSnap.exists()) {
          setError('Script not found');
          setLoading(false);
          return;
        }

        const scriptData = {
          id: scriptSnap.id,
          ...scriptSnap.data(),
          createdAt: scriptSnap.data().createdAt.toDate(),
        } as Script;

        setScript(scriptData);
        if (currentUser) {
          setLiked(scriptData.likedBy?.includes(currentUser.uid) || false);
        }
      } catch (error) {
        setError('Failed to fetch script');
        console.error('Fetch script error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchScript();
  }, [id, currentUser]);

  const handleLike = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (!script) return;

    try {
      const scriptRef = doc(db, 'scripts', script.id);
      const newLiked = !liked;

      await updateDoc(scriptRef, {
        likes: increment(newLiked ? 1 : -1),
        likedBy: newLiked ? arrayUnion(currentUser.uid) : arrayRemove(currentUser.uid),
      });

      setScript(prev => {
        if (!prev) return null;
        return {
          ...prev,
          likes: newLiked ? prev.likes + 1 : prev.likes - 1,
          likedBy: newLiked
            ? [...(prev.likedBy || []), currentUser.uid]
            : (prev.likedBy || []).filter(id => id !== currentUser.uid),
        };
      });

      setLiked(newLiked);
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  const handleEdit = () => {
    if (!script) return;
    setEditedCode(script.code);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!script || !currentUser) return;

    try {
      const scriptRef = doc(db, 'scripts', script.id);
      await updateDoc(scriptRef, {
        code: editedCode,
        updatedAt: new Date()
      });

      setScript(prev => prev ? { ...prev, code: editedCode } : null);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating script:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !script) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-300">{error || 'Script not found'}</h2>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-dark-gray/50 border border-gray-700 rounded-lg p-6 mb-8 animate-fade-in-up">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-3xl font-bold text-white">{script.title}</h1>
          <div className="flex items-center gap-4">
            {currentUser?.uid === script.authorId && (
              <button
                onClick={isEditing ? handleSave : handleEdit}
                className="btn flex items-center gap-1 bg-blue-600 text-white"
              >
                <EditIcon className="h-4 w-4" />
                {isEditing ? 'Save Changes' : 'Edit Script'}
              </button>
            )}
            <button
              onClick={handleLike}
              className={`btn flex items-center gap-1 ${
                liked
                  ? 'bg-carmine/20 text-carmine'
                  : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {liked ? (
                <HeartIconSolid className="h-5 w-5" />
              ) : (
                <HeartIcon className="h-5 w-5" />
              )}
              <span>{script.likes}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
          <div className="flex items-center gap-1">
            <CodeBracketIcon className="h-4 w-4" />
            <span>{script.language}</span>
          </div>
          <div className="flex items-center gap-1">
            <ChatBubbleIcon className="h-4 w-4" />
            <span>{script.likes} likes</span>
          </div>
          <span>Posted by {script.authorName}</span>
          <span>on {script.createdAt.toLocaleDateString()}</span>
        </div>

        <p className="text-gray-300 mb-4">{script.description}</p>

        {script.tags && script.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {script.tags.map(tag => (
              <span
                key={tag}
                className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mb-6">
          <SimpleEditor
            value={isEditing ? editedCode : script.code}
            onChange={isEditing ? setEditedCode : () => {}}
            language={script.language}
            readOnly={!isEditing}
          />
        </div>
      </div>

      <CommentSection scriptId={script.id} />
    </div>
  );
};

export default ScriptDetail;