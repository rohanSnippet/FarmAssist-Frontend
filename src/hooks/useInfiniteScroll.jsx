// src/hooks/useInfiniteScroll.jsx
import { useRef, useCallback } from 'react';

export default function useInfiniteScroll(fetchMoreCallback, hasMore) {
    const observer = useRef();
    return useCallback(node => {
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                fetchMoreCallback();
            }
        });
        if (node) observer.current.observe(node);
    }, [fetchMoreCallback, hasMore]);
}