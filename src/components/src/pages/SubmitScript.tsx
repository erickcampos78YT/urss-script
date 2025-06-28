import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import SimpleEditor from '../components/SimpleEditor';

const SubmitScript = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const commonTags = ['Game', 'Utility', 'Admin', 'Fun', 'Economy', 'Security'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!currentUser) {
      setError('You must be logged in to submit a script');
      setLoading(false);
      return;
    }

    try {
      const scriptData = {
        title,
        titleLowerCase: title.toLowerCase(), // Para facilitar a busca case-insensitive
        description,
        code,
        language,
        authorId: currentUser.uid,
        authorName: currentUser.displayName || 'Anonymous',
        likes: 0,
        likedBy: [],
        comments: 0,
        createdAt: new Date(),
        tags,
      };

      await addDoc(collection(db, 'scripts'), scriptData);
      navigate('/');
    } catch (error) {
      setError('Failed to submit script. Please try again.');
      console.error('Submit script error:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setNewTag('');
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      addTag(newTag.trim());
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-dark-gray/50 border border-gray-700 rounded-lg p-6 animate-fade-in-up">
        <h1 className="text-3xl font-bold text-white mb-6">Submit Script</h1>

        {error && (
          <div className="bg-carmine/20 border border-carmine text-carmine px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2">
              Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 bg-dark-gray/50 border border-gray-700 rounded-xl focus:outline-none focus:border-carmine"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 bg-dark-gray/50 border border-gray-700 rounded-xl focus:outline-none focus:border-carmine min-h-[100px]"
              required
            />
          </div>

          <div>
            <label htmlFor="language" className="block text-sm font-medium mb-2">
              Language
            </label>
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-4 py-2 bg-dark-gray/50 border border-gray-700 rounded-xl focus:outline-none focus:border-carmine"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
              <option value="csharp">C#</option>
              <option value="php">PHP</option>
              <option value="ruby">Ruby</option>
              <option value="swift">Swift</option>
              <option value="kotlin">Kotlin</option>
              <option value="go">Go</option>
              <option value="rust">Rust</option>
              <option value="typescript">TypeScript</option>
            </select>
          </div>

          <div>
            <label htmlFor="tags" className="block text-sm font-medium mb-2">
              Tags
            </label>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map(tag => (
                  <span
                    key={tag}
                    className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm flex items-center"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 text-gray-400 hover:text-gray-200"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                id="tags"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleTagKeyPress}
                placeholder="Add a tag and press Enter"
                className="w-full px-4 py-2 bg-dark-gray/50 border border-gray-700 rounded-xl focus:outline-none focus:border-carmine"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {commonTags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addTag(tag)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      tags.includes(tag)
                        ? 'bg-blue-600 text-white'
                        : 'bg-dark-gray/50 text-gray-300 hover:bg-dark-gray/70'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="code" className="block text-sm font-medium mb-2">
              Code
            </label>
            <SimpleEditor
              value={code}
              onChange={setCode}
              language={language}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-carmine rounded-xl hover:bg-carmine/90 transition-colors disabled:opacity-50 font-medium hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <LoadingSpinner />
                <span className="ml-2">Submitting...</span>
              </div>
            ) : (
              'Submit Script'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SubmitScript;