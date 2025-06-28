import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { CodeBracketIcon, HeartIcon, ChatBubbleLeftIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Script {
  id: string;
  title: string;
  description: string;
  language: string;
  likes: number;
  comments: number;
  createdAt: Date;
  tags: string[];
}

const MyScripts = () => {
  const { currentUser } = useAuth();
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchScripts = async () => {
      if (!currentUser) {
        setError('You must be logged in to view your scripts.');
        setLoading(false);
        return;
      }

      try {
        const scriptsRef = collection(db, 'scripts');
        const q = query(scriptsRef, where('authorId', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);
        
        const scriptsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate(),
        })) as Script[];

        setScripts(scriptsData);
      } catch (error) {
        setError('Failed to fetch scripts. Please try again.');
        console.error('Fetch scripts error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchScripts();
  }, [currentUser]);

  const handleDelete = async (scriptId: string) => {
    if (!window.confirm('Are you sure you want to delete this script?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'scripts', scriptId));
      setScripts(scripts.filter(script => script.id !== scriptId));
    } catch (error) {
      setError('Failed to delete script. Please try again.');
      console.error('Delete script error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-carmine"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-300">{error}</h2>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">My Scripts</h1>
      </div>

      {scripts.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-300">No scripts found</h2>
          <p className="text-gray-400 mt-2">Start by creating your first script!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scripts.map(script => (
            <motion.div
              key={script.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-dark-gray/50 border border-gray-700 rounded-lg p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-white">{script.title}</h2>
                <button
                  onClick={() => handleDelete(script.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
              <p className="text-gray-300 mb-4 line-clamp-2">{script.description}</p>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <CodeBracketIcon className="h-4 w-4" />
                  <span>{script.language}</span>
                </div>
                <div className="flex items-center gap-1">
                  <HeartIcon className="h-4 w-4" />
                  <span>{script.likes}</span>
                </div>
                <div className="flex items-center gap-1">
                  <ChatBubbleLeftIcon className="h-4 w-4" />
                  <span>{script.comments}</span>
                </div>
              </div>
              {script.tags && script.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {script.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-4 text-sm text-gray-400">
                Created on {script.createdAt.toLocaleDateString()}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyScripts;