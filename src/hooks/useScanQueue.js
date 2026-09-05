/**
 * useScanQueue — persistent scan job queue hook
 *
 * Stores job IDs in localStorage so they survive page refreshes.
 * Polls the backend for PENDING/PROCESSING jobs every 4 seconds.
 * Fires a callback (and shows a toast-style notification) when a job completes.
 */
import { useState, useEffect, useCallback } from 'react';
import api from '../axios';
import Swal from 'sweetalert2';

const STORAGE_KEY = 'farmassist_scan_jobs';

/** Read the persisted job list from localStorage */
function loadPersistedJobs() {
  try {
    const jobs = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return jobs.filter(j => j.status === 'PENDING' || j.status === 'PROCESSING');
  } catch {
    return [];
  }
}

/** Write the current job list back to localStorage */
function persistJobs(jobs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
}

export function useScanQueue() {
  const [jobs, setJobs] = useState(loadPersistedJobs);

  // Keep localStorage in sync whenever jobs change
  useEffect(() => {
    persistJobs(jobs);
  }, [jobs]);

  // Fetch historical jobs from backend on mount to populate queue
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await api.get('/api/scan/jobs/');
        const activeJobs = data.filter(j => j.status === 'PENDING' || j.status === 'PROCESSING');
        setJobs(activeJobs);
      } catch (err) {
        console.warn("Could not fetch scan history:", err?.message);
      }
    };
    fetchHistory();
  }, []);

  /**
   * addJob — called immediately after POST /api/scan/submit/ returns
   * @param {number} jobId
   * @param {string} cropHint
   */
  const addJob = useCallback((jobId, cropHint = '') => {
    setJobs(prev => {
      // Deduplicate: don't add the same job_id twice
      if (prev.some(j => j.id === jobId)) return prev;
      return [
        { id: jobId, status: 'PENDING', crop_hint: cropHint, created_at: new Date().toISOString(), result: null, error_message: '' },
        ...prev,
      ];
    });

    Swal.fire({
      icon: 'info',
      title: 'Task Queued',
      text: 'Your scan request has been submitted and is processing.',
      position: 'center',
      showConfirmButton: false,
      timer: 2000
    });
  }, []);

  /**
   * removeJob — lets the user remove a completed/failed job from their history
   */
  const removeJob = useCallback((jobId) => {
    setJobs(prev => prev.filter(j => j.id !== jobId));
  }, []);

  /**
   * Listen to the SSE custom event dispatched by RootLayout
   * and automatically clear the completed/failed job from the queue
   */
  useEffect(() => {
    const handleJobUpdate = (e) => {
      const { job_id, type } = e.detail;
      if (type === 'job_completed' || type === 'job_failed') {
        setJobs(prev => prev.filter(j => j.id !== job_id));
      }
    };

    window.addEventListener('scanJobUpdate', handleJobUpdate);
    return () => window.removeEventListener('scanJobUpdate', handleJobUpdate);
  }, []);

  const pendingCount = jobs.filter(j => j.status === 'PENDING' || j.status === 'PROCESSING').length;

  return {
    jobs,
    addJob,
    removeJob,
    pendingCount,
  };
}
