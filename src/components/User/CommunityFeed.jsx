import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  MessageCircle,
  Heart,
  Repeat2,
  Share,
  Search,
  Image as ImageIcon,
  MapPin,
  BadgeCheck,
  MoreHorizontal,
  CloudSun,
  TrendingUp,
  IndianRupee,
  Users,
  Bookmark,
  Bell,
  Home,
  FileText,
  CloudOff,
  UploadCloud,
} from "lucide-react";

import api from "../../axios";
import useInfiniteScroll from "../../hooks/useInfiniteScroll";
import useNetworkSync from "../../hooks/useNetworkSync";
import { savePostOffline } from "../../lib/indexedDB";

// --- MOCK DATA FOR WIDGETS ONLY ---
const TRENDING = [
  { category: "Agriculture", tag: "#MaharashtraMonsoon", posts: "4.2K" },
  { category: "Local Market", tag: "#KalyanMandi", posts: "1.8K" },
  { category: "Technology", tag: "#SoilHealthCard", posts: "945" },
  { category: "Policy", tag: "#PMKISAN", posts: "8,432" },
];

const MARKET_PRICES = [
  { crop: "Wheat", price: "₹2,125", trend: "up", change: "2.3%" },
  { crop: "Rice (Paddy)", price: "₹1,940", trend: "up", change: "1.8%" },
  { crop: "Tomato", price: "₹1,325", trend: "down", change: "3.2%" },
];

const TABS = ["All", "Crops", "Schemes", "Market", "Weather"];

export default function CommunityFeed({ isExpanded = true, userLanguage = "en" }) {
  const [activeTab, setActiveTab] = useState("All");
  const [isUploading, setIsUploading] = useState(false);

  // Feed State
  const [posts, setPosts] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(false);

  // Post Creation State
  const [newPostText, setNewPostText] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Offline Engine Hooks
  const { isOnline, syncing, queueCount, checkQueue } = useNetworkSync();

  // ============================================================================
  // DATA FETCHING
  // ============================================================================
  const fetchPosts = async (cursor = null, reset = false) => {
    if (loading) return;
    setLoading(true);
    try {
      let url = `/api/posts/?t=${Date.now()}&`;
      if (activeTab !== "All") url += `category=${activeTab}&`;
      if (cursor) url += `cursor=${cursor}`;

      const res = await api.get(url);
      setPosts((prev) => (reset ? res.data.results : [...prev, ...res.data.results]));
      setNextCursor(res.data.next);
    } catch (error) {
      console.error("Failed to fetch feed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(null, true);
  }, [activeTab]);

  const loadMore = useCallback(() => {
    if (nextCursor) fetchPosts(nextCursor.split("cursor=")[1]);
  }, [nextCursor]);

  const lastPostRef = useInfiniteScroll(loadMore, !!nextCursor);

  // ============================================================================
  // DJANGO MULTIPART & OFFLINE POST CREATION
  // ============================================================================
  const handleCreatePost = async () => {
    if (!newPostText.trim() && !selectedImage) return;
    setIsUploading(true);

    try {
      const categoryValue = activeTab === "All" ? "Crops" : activeTab;

      if (isOnline) {
        // Online: Send raw file directly to Django API
        const formData = new FormData();
        formData.append("content", newPostText);
        formData.append("category", categoryValue);
        if (selectedImage) {
          formData.append("image", selectedImage);
        }

        await api.post("/api/posts/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        fetchPosts(null, true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        // Offline: Save the Blob directly to IndexedDB
        await savePostOffline({
          type: "COMMUNITY_POST",
          payload: { content: newPostText, category: categoryValue },
          imageFile: selectedImage,
          timestamp: new Date().toISOString()
        });
        if (checkQueue) checkQueue();
      }

      setNewPostText("");
      setSelectedImage(null);
      setImagePreview(null);
    } catch (error) {
      console.error("Failed to create post.", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const getLocalizedContent = (post) => {
    if (userLanguage === "hi" && post.content_hi) return post.content_hi;
    if (userLanguage === "mr" && post.content_mr) return post.content_mr;
    return post.content;
  };

  // ============================================================================
  // VIEW 1: COLLAPSED MODE
  // ============================================================================
  if (!isExpanded) {
    return (
      <div className="w-full flex flex-col pt-2 animate-fade-in">
        <h3 className="font-extrabold text-xl md:text-2xl mb-5 tracking-tight px-2 text-base-content">
          What's happening in Agriculture
        </h3>
        <div className="flex flex-col">
          {TRENDING.map((trend, i) => (
            <div key={i} className="flex justify-between items-start hover:bg-base-content/[0.04] p-3 md:p-4 -mx-2 md:-mx-4 rounded-2xl cursor-pointer transition-colors group">
              <div>
                <div className="text-xs font-medium text-base-content/50 mb-1 flex items-center gap-1.5 uppercase tracking-wide">
                  {trend.category} <span className="text-[8px] opacity-50">•</span> Trending
                </div>
                <div className="font-bold text-base text-base-content group-hover:text-primary transition-colors">
                  {trend.tag}
                </div>
                <div className="text-xs font-medium text-base-content/50 mt-1.5">
                  {trend.posts} posts
                </div>
              </div>
              <button className="btn btn-ghost btn-sm btn-circle text-base-content/40 hover:text-primary hover:bg-primary/10 transition-colors">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ============================================================================
  // VIEW 2: EXPANDED MODE (Spacious, Clean, Side-by-Side Media)
  // ============================================================================
  return (
    <div className="w-full max-w-screen-2xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 h-full pb-10 items-start animate-fade-in px-4 lg:px-8">
      
      {/* LEFT COLUMN: Clean Minimal Nav */}
      <div className="hidden lg:block lg:col-span-2 xl:col-span-2 sticky top-0 max-h-screen overflow-y-auto hide-scrollbar space-y-6 pt-6 pb-10">
        <nav className="space-y-2">
          <a className="flex items-center gap-4 px-4 py-3.5 rounded-full bg-base-content/5 font-extrabold text-primary cursor-pointer text-lg">
            <Home className="w-6 h-6" /> Home
          </a>
          <a className="flex items-center gap-4 px-4 py-3.5 rounded-full hover:bg-base-content/5 text-base-content/80 hover:text-base-content transition-colors cursor-pointer text-lg font-medium">
            <Search className="w-6 h-6" /> Explore
          </a>
          <a className="flex items-center gap-4 px-4 py-3.5 rounded-full hover:bg-base-content/5 text-base-content/80 hover:text-base-content transition-colors cursor-pointer text-lg font-medium">
            <Users className="w-6 h-6" /> Network
          </a>
          <a className="flex items-center gap-4 px-4 py-3.5 rounded-full hover:bg-base-content/5 text-base-content/80 hover:text-base-content transition-colors cursor-pointer text-lg font-medium">
            <Bell className="w-6 h-6" /> Alerts
          </a>
        </nav>
      </div>

      {/* CENTER COLUMN: Spacious Main Feed */}
      <div className="col-span-1 lg:col-span-7 xl:col-span-7 flex flex-col border-x-0 lg:border-x border-base-content/10 min-h-screen">
        
        {/* Sync Status Banners */}
        {!isOnline && (
          <div className="bg-warning/10 border-b border-warning/20 text-warning px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CloudOff className="w-5 h-5" />
              <span className="text-sm font-semibold">Offline Mode. Posts saved securely.</span>
            </div>
            {queueCount > 0 && <div className="badge badge-warning">{queueCount} pending</div>}
          </div>
        )}
        {syncing && (
          <div className="bg-info/10 border-b border-info/20 text-info px-6 py-4 flex items-center gap-3 animate-pulse">
            <UploadCloud className="w-5 h-5" />
            <span className="text-sm font-semibold">Uploading queued posts...</span>
          </div>
        )}

        {/* Clean Tabs */}
        <div className="flex overflow-x-auto hide-scrollbar border-b border-base-content/10 sticky top-0 bg-base-100/95 backdrop-blur-xl z-20 px-2">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-6 py-5 text-[15px] font-bold whitespace-nowrap hover:bg-base-content/5 transition-colors flex-1 text-center ${activeTab === tab ? "text-base-content" : "text-base-content/40"}`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div layoutId="feed-active-tab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        {/* Spacious Post Composer */}
        <div className="p-6 md:p-8 border-b border-base-content/10 flex gap-5">
          <div className="w-12 h-12 rounded-full bg-base-300 text-base-content flex items-center justify-center font-bold flex-shrink-0 text-lg">
            Me
          </div>
          <div className="flex-1">
            <textarea
              value={newPostText}
              onChange={(e) => setNewPostText(e.target.value)}
              placeholder="What's happening in your farm?"
              className="w-full bg-transparent resize-none outline-none text-xl placeholder:text-base-content/30 min-h-[80px] pt-2 leading-relaxed"
            />
            
            {imagePreview && (
              <div className="relative mt-4 mb-4">
                <img src={imagePreview} alt="Preview" className="rounded-2xl max-h-64 object-cover w-full border border-base-content/10" />
                <button onClick={() => { setSelectedImage(null); setImagePreview(null); }} className="absolute top-2 right-2 btn btn-circle btn-sm btn-neutral">
                  ✕
                </button>
              </div>
            )}

            <div className="flex justify-between items-center mt-4 pt-4 border-t border-base-content/5">
              <div className="flex gap-2 text-primary">
                <label className="btn btn-ghost btn-circle hover:bg-primary/10 cursor-pointer">
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageSelect} />
                  <ImageIcon className="w-5 h-5" />
                </label>
                <button className="btn btn-ghost btn-circle hover:bg-primary/10">
                  <MapPin className="w-5 h-5" />
                </button>
              </div>
              <button
                onClick={handleCreatePost}
                disabled={isUploading}
                className="btn btn-primary rounded-full px-8 font-bold text-base shadow-sm"
              >
                {isUploading ? <span className="loading loading-spinner loading-sm"></span> : (isOnline ? "Post" : "Queue")}
              </button>
            </div>
          </div>
        </div>

        {/* Flattened, Spacious Feed Stream */}
        <div className="flex flex-col">
          {posts.map((post, i) => {
            const isLast = posts.length === i + 1;
            return (
              <article
                ref={isLast ? lastPostRef : null}
                key={post.id}
                className="p-6 md:p-8 border-b border-base-content/10 hover:bg-base-content/[0.01] transition-colors cursor-pointer flex flex-col"
              >
                {/* Meta Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-base-300 flex items-center justify-center font-bold text-base-content/70">
                      {post.author_initials || "U"}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-base hover:underline">{post.author_name}</span>
                        {post.isVerified && <BadgeCheck className="w-4 h-4 text-info" />}
                      </div>
                      <span className="text-base-content/50 text-sm">
                        {new Date(post.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </div>
                  <button className="btn btn-ghost btn-sm btn-circle text-base-content/40 hover:bg-base-content/10">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>

                {/* Content Layout (Side-by-side on desktop if image exists) */}
                <div className={`flex flex-col ${post.image_url ? 'md:flex-row' : ''} gap-6 md:gap-8`}>
                  
                  {/* Text Content */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <p className="text-[17px] text-base-content leading-relaxed whitespace-pre-wrap">
                      {getLocalizedContent(post)}
                    </p>
                    
                    {/* Action Bar */}
                    <div className="flex items-center gap-8 mt-6 text-base-content/50">
                      <button className="flex items-center gap-2 hover:text-info transition-colors group">
                        <div className="p-2 rounded-full group-hover:bg-info/10 transition-colors">
                          <MessageCircle className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-medium">0</span>
                      </button>
                      <button className="flex items-center gap-2 hover:text-success transition-colors group">
                        <div className="p-2 rounded-full group-hover:bg-success/10 transition-colors">
                          <Repeat2 className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-medium">0</span>
                      </button>
                      <button className="flex items-center gap-2 hover:text-error transition-colors group">
                        <div className="p-2 rounded-full group-hover:bg-error/10 transition-colors">
                          <Heart className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-medium">{post.likes_count || 0}</span>
                      </button>
                    </div>
                  </div>

                  {/* Right-Side Media (Desktop) / Bottom Media (Mobile) */}
                  {post.image_url && (
                    <div className="w-full md:w-1/3 lg:w-[280px] shrink-0">
                      <img
                        src={post.image_url}
                        loading="lazy"
                        alt="Post media"
                        className="w-full h-48 md:h-full max-h-[300px] object-cover rounded-3xl border border-base-content/10 shadow-sm"
                      />
                    </div>
                  )}
                </div>
              </article>
            );
          })}

          {loading && (
            <div className="p-12 text-center">
              <span className="loading loading-spinner text-primary loading-lg"></span>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Clean Context Widgets */}
      <div className="hidden xl:block xl:col-span-3 sticky top-0 max-h-screen overflow-y-auto hide-scrollbar space-y-8 pt-6 pl-2 pb-10">
        
        {/* Market Widget */}
        <div className="bg-base-100 rounded-3xl p-6 border border-base-content/10 shadow-sm">
          <h3 className="font-extrabold text-xl mb-6 tracking-tight">Market Prices</h3>
          <div className="space-y-5">
            {MARKET_PRICES.map((item) => (
              <div key={item.crop} className="flex justify-between items-center group cursor-pointer">
                <span className="text-base font-bold text-base-content/80 group-hover:text-primary transition-colors">
                  {item.crop}
                </span>
                <div className="text-right flex flex-col items-end">
                  <div className="text-base font-extrabold">{item.price}</div>
                  <div className={`text-xs font-bold mt-1 flex items-center gap-1 ${item.trend === "up" ? "text-success" : "text-error"}`}>
                    <TrendingUp className={`w-3 h-3 ${item.trend === "down" && "rotate-180"}`} />
                    {item.change}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trending Widget */}
        <div className="bg-base-100 rounded-3xl p-6 border border-base-content/10 shadow-sm">
          <h3 className="font-extrabold text-xl mb-6 tracking-tight">Trends for you</h3>
          <div className="space-y-6">
            {TRENDING.slice(0, 3).map((trend, i) => (
              <div key={i} className="cursor-pointer group">
                <div className="text-sm font-medium text-base-content/50 mb-1">{trend.category}</div>
                <div className="font-extrabold text-lg group-hover:text-primary transition-colors">{trend.tag}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}