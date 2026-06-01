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

// --- API & Hooks ---
import axios from 'axios'
import api from "../../axios";
// import { useAuth } from "../../context/AuthContext";
import useInfiniteScroll from "../../hooks/useInfiniteScroll";
import useNetworkSync from "../../hooks/useNetworkSync";
import { savePostOffline } from "../../lib/indexedDB";

const CLOUDINARY_CLOUD_NAME = "dvqz7gibd"
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
const CLOUDINARY_UPLOAD_PRESET = "FarmAssist_Post_Images";

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

export default function CommunityFeed({
  isExpanded = true,
  userLanguage = "en",
}) {
  const [activeTab, setActiveTab] = useState("All");
  const [isUploading, setIsUploading] = useState(false); // To show a loading spinner on the post button

  // Feed State
  const [posts, setPosts] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(false);

  // Post Creation State
  const [newPostText, setNewPostText] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);

  // Offline Engine Hooks
  const { isOnline, syncing, queueCount, checkQueue } = useNetworkSync();

  // const { userData, user, isAuthenticated } = useAuth();

  // const firstName = userData.first_name
  // const photo = userData.photo_url


  // ============================================================================
  // DATA FETCHING & INFINITE SCROLL
  // ============================================================================
  // 1. UPDATED FETCH POSTS (Added Cache Buster)
  const fetchPosts = async (cursor = null, reset = false) => {
    if (loading) return;
    setLoading(true);
    try {
      // We add `t=${Date.now()}` so the browser never serves a stale disk-cache response
      let url = `/api/posts/?t=${Date.now()}&`;
      if (activeTab !== "All") url += `category=${activeTab}&`;
      if (cursor) url += `cursor=${cursor}`;

      const res = await api.get(url);
      setPosts((prev) =>
        reset ? res.data.results : [...prev, ...res.data.results],
      );
      setNextCursor(res.data.next);
    } catch (error) {
      console.error("Failed to fetch feed:", error);
    } finally {
      setLoading(false);
    }
  };

  // 2. UPDATED CREATE POST (Added Error Handling & Smooth Scroll)
  const handleCreatePost = async () => {
    if (!newPostText.trim() && !selectedImage) return;
    setIsUploading(true);

    try {
      let uploadedImageUrl = null;

      // STEP 1: If there is an image, upload to Cloudinary FIRST
      if (selectedImage && isOnline) {
        const cloudinaryData = new FormData();
        cloudinaryData.append("file", selectedImage);
        cloudinaryData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

        const cloudRes = await axios.post(CLOUDINARY_URL, cloudinaryData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        uploadedImageUrl = cloudRes.data.secure_url;
      }

      // STEP 2: Prepare the payload for Django
      const postPayload = {
        content: newPostText,
        category: activeTab === "All" ? "Crops" : activeTab,
        image_url: uploadedImageUrl, // Send the URL, not the file
      };

      // STEP 3: Save to Django or Offline IndexedDB
      if (isOnline) {
        // Using your configured axios instance to hit your Django API
        await api.post("/api/posts/", postPayload);
        fetchPosts(null, true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        // ... offline saving logic ...
        checkQueue();
      }

      setNewPostText("");
      setSelectedImage(null);
    } catch (error) {
      console.error("Failed to create post.", error);
    } finally {
      setIsUploading(false);
    }
  };

  // Initial load and tab switching
  useEffect(() => {
    fetchPosts(null, true);
  }, [activeTab]);

  // Load more trigger for infinite scroll
  const loadMore = useCallback(() => {
    if (nextCursor) fetchPosts(nextCursor.split("cursor=")[1]);
  }, [nextCursor]);

  const lastPostRef = useInfiniteScroll(loadMore, !!nextCursor);

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
            <div
              key={i}
              className="flex justify-between items-start hover:bg-base-content/[0.04] p-3 md:p-4 -mx-2 md:-mx-4 rounded-2xl cursor-pointer transition-colors group"
            >
              <div>
                <div className="text-xs font-medium text-base-content/50 mb-1 flex items-center gap-1.5 uppercase tracking-wide">
                  {trend.category}{" "}
                  <span className="text-[8px] opacity-50">•</span> Trending
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
        <button className="text-primary text-[15px] font-medium hover:underline mt-6 px-2 text-left w-fit transition-all">
          Show more
        </button>
      </div>
    );
  }

  // ============================================================================
  // VIEW 2: EXPANDED MODE (GPU Accelerated & Sticky Navs)
  // ============================================================================
  return (
    // Note the `items-start` here. It prevents columns from stretching to full height, which enables sticky tracking.
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 h-full pb-10 items-start animate-fade-in">
      {/* LEFT COLUMN: Navigation (Sticky) */}
      <div className="hidden lg:block lg:col-span-3 sticky top-0 max-h-screen overflow-y-auto hide-scrollbar space-y-6 pt-2 pb-10">
        <nav className="space-y-1">
          <a className="flex items-center gap-4 px-4 py-3 rounded-xl bg-base-content/5 font-bold text-primary cursor-pointer">
            <Home className="w-5 h-5" /> Home
          </a>
          <a className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-base-content/5 text-base-content/80 transition-colors cursor-pointer">
            <Search className="w-5 h-5" /> Explore
          </a>
          <a className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-base-content/5 text-base-content/80 transition-colors cursor-pointer">
            <Users className="w-5 h-5" /> My Network
          </a>
          <a className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-base-content/5 text-base-content/80 transition-colors cursor-pointer">
            <Bell className="w-5 h-5" /> Alerts
          </a>
          <a className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-base-content/5 text-base-content/80 transition-colors cursor-pointer">
            <Bookmark className="w-5 h-5" /> Saved
          </a>
        </nav>
        <div className="divider my-2 px-4 opacity-50"></div>
        <div className="px-4">
          <h3 className="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-4">
            Quick Access
          </h3>
          <ul className="space-y-4 text-sm font-medium text-base-content/70">
            <li className="flex items-center gap-3 cursor-pointer hover:text-primary transition-colors">
              <CloudSun className="w-4 h-4" /> Local Weather
            </li>
            <li className="flex items-center gap-3 cursor-pointer hover:text-primary transition-colors">
              <IndianRupee className="w-4 h-4" /> Market Prices
            </li>
            <li className="flex items-center gap-3 cursor-pointer hover:text-primary transition-colors">
              <FileText className="w-4 h-4" /> Govt Schemes
            </li>
          </ul>
        </div>
      </div>

      {/* CENTER COLUMN: Main Feed (Scrolls naturally) */}
      <div className="col-span-1 lg:col-span-6 xl:col-span-6 flex flex-col gap-4 border-x-0 lg:border-x border-base-content/10 lg:px-2 min-h-screen">
        {/* Offline Status Alerts */}
        {!isOnline && (
          <div className="bg-warning/20 border border-warning/50 text-warning-content p-3 rounded-xl flex items-center justify-between mx-2">
            <div className="flex items-center gap-2">
              <CloudOff className="w-5 h-5 text-warning" />
              <span className="text-sm font-medium">
                Offline Mode. Posts saved securely.
              </span>
            </div>
            {queueCount > 0 && (
              <div className="badge badge-warning">{queueCount} pending</div>
            )}
          </div>
        )}
        {syncing && (
          <div className="bg-info/20 border border-info/50 text-info p-3 rounded-xl flex items-center gap-3 animate-pulse mx-2">
            <UploadCloud className="w-5 h-5" />
            <span className="text-sm font-medium">
              Uploading queued posts...
            </span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex overflow-x-auto hide-scrollbar border-b border-base-content/10 sticky top-0 bg-base-100/90 backdrop-blur-md z-10">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-5 py-4 text-sm font-medium whitespace-nowrap hover:bg-base-content/5 transition-colors flex-1 text-center ${activeTab === tab ? "text-base-content" : "text-base-content/50"}`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div
                  layoutId="feed-active-tab"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Create Post Input */}
        <div className="p-4 border-b border-base-content/10 flex gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold flex-shrink-0">
            Me
          </div>
          <div className="flex-1">
            <textarea
              value={newPostText}
              onChange={(e) => setNewPostText(e.target.value)}
              placeholder="What's happening in your farm?"
              className="w-full bg-transparent resize-none outline-none text-base md:text-lg placeholder:text-base-content/40 min-h-[60px] pt-2"
            />
            {selectedImage && (
              <div className="text-xs text-primary font-bold">
                Image attached: {selectedImage.name}
              </div>
            )}
            <div className="flex justify-between items-center mt-2">
              <div className="flex gap-1 text-primary">
                <label className="btn btn-ghost btn-sm btn-circle hover:bg-primary/10 cursor-pointer">
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => setSelectedImage(e.target.files[0])}
                  />
                  <ImageIcon className="w-4 h-4" />
                </label>
                <button className="btn btn-ghost btn-sm btn-circle hover:bg-primary/10">
                  <MapPin className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={handleCreatePost}
                className="btn btn-primary btn-sm rounded-full px-6 shadow-sm"
              >
                {isOnline ? "Post" : "Queue Offline"}
              </button>
            </div>
          </div>
        </div>

        {/* Posts Stream */}
        <div className="flex flex-col">
          {posts.map((post, i) => {
            const isLast = posts.length === i + 1;
            return (
              <article
                ref={isLast ? lastPostRef : null}
                key={post.id}
                className="p-4 border-b border-base-content/5 hover:bg-base-content/[0.02] transition-colors cursor-pointer"
              >
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-neutral text-neutral-content flex items-center justify-center font-bold flex-shrink-0 text-sm shadow-inner">
                    {post.author_initials || "U"}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-1.5 flex-wrap leading-tight">
                        <span className="font-bold text-[15px] hover:underline">
                          {post.author_name}
                        </span>
                        {post.isVerified && (
                          <BadgeCheck className="w-4 h-4 text-info" />
                        )}
                        <span className="text-base-content/50 text-sm ml-1">
                          ·{" "}
                          {new Date(post.created_at).toLocaleDateString(
                            undefined,
                            { month: "short", day: "numeric" },
                          )}
                        </span>
                      </div>
                      <button className="btn btn-ghost btn-xs btn-circle text-base-content/50 hover:bg-base-content/10 transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="mt-1.5 text-[15px] text-base-content/90 whitespace-pre-wrap leading-relaxed">
                      {getLocalizedContent(post)}
                    </p>

                    {post.image_url && (
                      <img
                        src={post.image_url}
                        loading="lazy"
                        alt="Post media"
                        className="mt-3 w-full max-h-80 object-cover rounded-2xl bg-base-200"
                      />
                    )}

                    <div className="flex justify-between items-center mt-3 max-w-md text-base-content/50 pr-4">
                      <button className="flex items-center gap-1.5 hover:text-info transition-colors group">
                        <span className="p-1.5 rounded-full group-hover:bg-info/10 transition-colors">
                          <MessageCircle className="w-[18px] h-[18px]" />
                        </span>
                        <span className="text-xs font-medium">0</span>
                      </button>
                      <button className="flex items-center gap-1.5 hover:text-success transition-colors group">
                        <span className="p-1.5 rounded-full group-hover:bg-success/10 transition-colors">
                          <Repeat2 className="w-[18px] h-[18px]" />
                        </span>
                        <span className="text-xs font-medium">0</span>
                      </button>
                      <button className="flex items-center gap-1.5 hover:text-error transition-colors group">
                        <span className="p-1.5 rounded-full group-hover:bg-error/10 transition-colors">
                          <Heart className="w-[18px] h-[18px]" />
                        </span>
                        <span className="text-xs font-medium">
                          {post.likes_count}
                        </span>
                      </button>
                      <button className="flex items-center gap-1.5 hover:text-primary transition-colors group">
                        <span className="p-1.5 rounded-full group-hover:bg-primary/10 transition-colors">
                          <Share className="w-[18px] h-[18px]" />
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}

          {loading && (
            <div className="p-8 text-center">
              <span className="loading loading-spinner text-primary"></span>
            </div>
          )}
          {!loading && posts.length === 0 && (
            <div className="p-10 text-center text-base-content/40">
              No discussions found in this category.
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Context Widgets (Sticky) */}
      <div className="hidden xl:block xl:col-span-3 sticky top-0 max-h-screen overflow-y-auto hide-scrollbar space-y-5 pt-2 pr-2 pb-10">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/50" />
          <input
            type="text"
            placeholder="Search communities..."
            className="w-full pl-10 pr-4 py-2.5 bg-base-content/5 border border-transparent rounded-full focus:bg-base-100 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all outline-none text-sm"
          />
        </div>

        {/* Mandi Prices Widget */}
        <div className="bg-base-content/[0.03] rounded-2xl p-5 border border-base-content/5">
          <h3 className="font-extrabold text-base mb-4 tracking-tight">
            Market Prices
          </h3>
          <div className="space-y-4">
            {MARKET_PRICES.map((item) => (
              <div
                key={item.crop}
                className="flex justify-between items-center group cursor-pointer"
              >
                <span className="text-sm font-semibold text-base-content/80 group-hover:text-primary transition-colors">
                  {item.crop}
                </span>
                <div className="text-right flex flex-col items-end">
                  <div className="text-sm font-bold">{item.price}</div>
                  <div
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md mt-0.5 ${item.trend === "up" ? "bg-success/10 text-success" : "bg-error/10 text-error"} flex items-center gap-1`}
                  >
                    <TrendingUp
                      className={`w-2.5 h-2.5 ${item.trend === "down" && "rotate-180"}`}
                    />
                    {item.change}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="text-primary text-sm font-medium mt-5 hover:underline w-full text-left transition-all">
            View full market report
          </button>
        </div>

        {/* Mini Trending Widget */}
        <div className="bg-base-content/[0.03] rounded-2xl p-5 border border-base-content/5">
          <h3 className="font-extrabold text-base mb-4 tracking-tight">
            Trending Topics
          </h3>
          <div className="space-y-5">
            {TRENDING.slice(0, 3).map((trend, i) => (
              <div key={i} className="cursor-pointer group">
                <div className="text-xs font-medium text-base-content/40 flex justify-between items-center mb-0.5">
                  {trend.category}{" "}
                  <MoreHorizontal className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-base-content" />
                </div>
                <div className="font-bold text-[15px] group-hover:text-primary transition-colors">
                  {trend.tag}
                </div>
                <div className="text-xs font-medium text-base-content/50 mt-0.5">
                  {trend.posts} posts
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
