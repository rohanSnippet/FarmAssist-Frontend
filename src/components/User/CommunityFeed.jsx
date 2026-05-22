import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../axios';

const CommunityFeed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await api.get('/api/community-posts/');
      setPosts(response.data);
    } catch (err) {
      console.error("Failed to fetch community feed", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 w-full bg-base-100/50 backdrop-blur-md rounded-xl">
        <span className="loading loading-spinner text-primary loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto bg-base-100/40 backdrop-blur-xl border border-base-300 shadow-lg rounded-lg overflow-hidden flex flex-col max-h-[800px]">
      
      {/* Header */}
      <div className="bg-primary/10 border-b border-primary/20 p-5 sticky top-0 z-10 backdrop-blur-md">
        <h2 className="font-extrabold text-2xl text-base-content flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
          </svg>
          Regional Updates
        </h2>
        <p className="text-sm text-base-content/60 mt-1">See what other farmers are facing nearby.</p>
      </div>

      {/* Feed Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-base-200/30 custom-scrollbar">
        <AnimatePresence>
          {posts.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10 text-base-content/50">
              No regional updates yet. Be the first to share an alert!
            </motion.div>
          ) : (
            posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                className="card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition-shadow"
              >
                <div className="card-body p-5">
                  {/* Author Row */}
                  <div className="flex items-center gap-3 mb-2">
                    <div className="avatar">
                      <div className="w-10 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                        <img src={post.author_avatar || "https://ui-avatars.com/api/?name=" + post.author_name} alt="avatar" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-base-content leading-tight">{post.author_name}</h4>
                      <p className="text-xs text-base-content/50 font-medium">
                        {new Date(post.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  {/* Post Content */}
                  <p className="text-base-content/80 whitespace-pre-wrap">{post.content}</p>

                  {/* Attached AI Detection Context (The "Quote Tweet" part) */}
                  {post.pest_name && (
                    <div className="mt-4 rounded-xl border border-error/20 bg-error/5 p-4 flex gap-4 items-center">
                      {post.detection_image && (
                        <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 shadow-sm">
                          <img src={post.detection_image} alt="Crop scan" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-error text-sm">AI Detection:</span>
                          <span className="font-semibold text-base-content">{post.pest_name}</span>
                        </div>
                        <div className="flex gap-2">
                           <span className={`badge badge-xs font-bold ${post.severity >= 4 ? 'badge-error' : 'badge-warning'}`}>
                            Severity: {post.severity}/5
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="card-actions justify-end mt-4 pt-4 border-t border-base-200">
                    <button className="btn btn-ghost btn-sm text-base-content/50 hover:text-primary">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Reply
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CommunityFeed;