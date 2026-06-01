// src/hooks/useNetworkSync.jsx
import { useState, useEffect } from 'react';
import axios from '../axios'; 
import { getOfflinePosts, deleteOfflinePost } from '../lib/indexedDB';
import useNetworkStatus from './useNetworkStatus';

export default function useNetworkSync() {
    const isOnline = useNetworkStatus();
    const [syncing, setSyncing] = useState(false);
    const [queueCount, setQueueCount] = useState(0);

    const checkQueue = async () => {
        const posts = await getOfflinePosts();
        setQueueCount(posts.length);
    };

    const syncOfflineData = async () => {
        if (!isOnline || syncing) return;
        setSyncing(true);
        try {
            const postsToSync = await getOfflinePosts();
            for (let post of postsToSync) {
                const formData = new FormData();
                formData.append('content', post.content);
                if (post.category) formData.append('category', post.category);
                
                if (post.media) {
                    const response = await fetch(post.media);
                    const blob = await response.blob();
                    formData.append('image', blob, 'offline_upload.webp');
                }

                await axios.post('/api/posts/', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                await deleteOfflinePost(post.offlineId);
            }
        } catch (error) {
            console.error("Sync failed", error);
        } finally {
            setSyncing(false);
            checkQueue();
        }
    };

    useEffect(() => {
        checkQueue();
        if (isOnline) syncOfflineData();
    }, [isOnline]);

    return { isOnline, syncing, queueCount, checkQueue };
}