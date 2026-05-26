import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageCircle, Heart, Repeat2, Share, Search, 
  Image as ImageIcon, MapPin, BadgeCheck, MoreHorizontal, 
  CloudSun, TrendingUp, IndianRupee, Users, Bookmark, 
  Bell, Home, FileText
} from 'lucide-react';

// --- MOCK DATA ---
const TRENDING = [
  { category: 'Agriculture', tag: '#MaharashtraMonsoon', posts: '4.2K' },
  { category: 'Local Market', tag: '#KalyanMandi', posts: '1.8K' },
  { category: 'Technology', tag: '#SoilHealthCard', posts: '945' },
  { category: 'Policy', tag: '#PMKISAN', posts: '8,432' },
  { category: 'Farming', tag: '#OrganicPesticides', posts: '512' },
];

const MOCK_POSTS = [
  {
    id: 1,
    author: 'Ramesh Yadav',
    handle: '@ramesh_yadav',
    role: 'Wheat Farmer',
    location: 'Kanpur, UP',
    avatar: 'RY',
    time: '2h',
    content: 'Yellow rust is increasing in my wheat field. Please suggest good remedy and spray schedule. This is 20 days old crop.',
    hasImage: true,
    category: 'Crops',
    likes: 56,
    comments: 23,
    reposts: 7,
    isVerified: true,
    tags: ['#Wheat', '#PlantDisease']
  },
  {
    id: 2,
    author: 'Ministry of Agriculture',
    handle: '@AgriGoI',
    role: 'Government',
    location: 'New Delhi',
    avatar: 'GOI',
    time: '5h',
    content: 'PM-Kisan 14th installment processing has begun. Ensure your e-KYC is updated and your bank account is linked with Aadhaar by the end of this month to avoid delays.',
    hasImage: false,
    category: 'Schemes',
    likes: 1205,
    comments: 412,
    reposts: 890,
    isVerified: true,
    tags: ['#PMKisan', '#FarmersFirst']
  },
   {
    id: 3,
    author: 'Ramesh Yadav',
    handle: '@ramesh_yadav',
    role: 'Wheat Farmer',
    location: 'Kanpur, UP',
    avatar: 'RY',
    time: '2h',
    content: 'Yellow rust is increasing in my wheat field. Please suggest good remedy and spray schedule. This is 20 days old crop.',
    hasImage: true,
    category: 'Crops',
    likes: 56,
    comments: 23,
    reposts: 7,
    isVerified: true,
    tags: ['#Wheat', '#PlantDisease']
  },
   {
    id: 4,
    author: 'Ramesh Yadav',
    handle: '@ramesh_yadav',
    role: 'Wheat Farmer',
    location: 'Kanpur, UP',
    avatar: 'RY',
    time: '2h',
    content: 'Yellow rust is increasing in my wheat field. Please suggest good remedy and spray schedule. This is 20 days old crop.',
    hasImage: true,
    category: 'Crops',
    likes: 56,
    comments: 23,
    reposts: 7,
    isVerified: true,
    tags: ['#Wheat', '#PlantDisease']
  },
   {
    id: 5,
    author: 'Ramesh Yadav',
    handle: '@ramesh_yadav',
    role: 'Wheat Farmer',
    location: 'Kanpur, UP',
    avatar: 'RY',
    time: '2h',
    content: 'Yellow rust is increasing in my wheat field. Please suggest good remedy and spray schedule. This is 20 days old crop.',
    hasImage: true,
    category: 'Crops',
    likes: 56,
    comments: 23,
    reposts: 7,
    isVerified: true,
    tags: ['#Wheat', '#PlantDisease']
  },
];

const MARKET_PRICES = [
  { crop: 'Wheat', price: '₹2,125', trend: 'up', change: '2.3%' },
  { crop: 'Rice (Paddy)', price: '₹1,940', trend: 'up', change: '1.8%' },
  { crop: 'Tomato', price: '₹1,325', trend: 'down', change: '3.2%' },
];

const TABS = ['For You', 'Following', 'Crops', 'Schemes', 'Market'];

export default function CommunityFeed({ isExpanded = true }) {
  const [activeTab, setActiveTab] = useState('For You');

  // ============================================================================
  // VIEW 1: COLLAPSED MODE (Trending Only - Ultra Lightweight)
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
        
        <button className="text-primary text-[15px] font-medium hover:underline mt-6 px-2 text-left w-fit transition-all">
          Show more
        </button>
      </div>
    );
  }

  // ============================================================================
  // VIEW 2: EXPANDED MODE (Full Workspace - GPU Accelerated)
  // ============================================================================
  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 h-full pb-10 animate-fade-in">
      
      {/* LEFT COLUMN: Navigation */}
      <div className="hidden lg:block lg:col-span-3 space-y-6 pt-2">
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
          <h3 className="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-4">Quick Access</h3>
          <ul className="space-y-4 text-sm font-medium text-base-content/70">
            <li className="flex items-center gap-3 cursor-pointer hover:text-primary transition-colors"><CloudSun className="w-4 h-4" /> Local Weather</li>
            <li className="flex items-center gap-3 cursor-pointer hover:text-primary transition-colors"><IndianRupee className="w-4 h-4" /> Market Prices</li>
            <li className="flex items-center gap-3 cursor-pointer hover:text-primary transition-colors"><FileText className="w-4 h-4" /> Govt Schemes</li>
          </ul>
        </div>
      </div>

      {/* CENTER COLUMN: Main Feed */}
      <div className="col-span-1 lg:col-span-6 xl:col-span-6 flex flex-col gap-4 border-x-0 lg:border-x border-base-content/10 lg:px-2">
        
        {/* Tabs - Kept isolated motion for the sleek tab indicator only */}
        <div className="flex overflow-x-auto hide-scrollbar border-b border-base-content/10">
          {TABS.map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-5 py-4 text-sm font-medium whitespace-nowrap hover:bg-base-content/5 transition-colors flex-1 text-center ${activeTab === tab ? 'text-base-content' : 'text-base-content/50'}`}
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
              placeholder="What's happening in your farm?" 
              className="w-full bg-transparent resize-none outline-none text-base md:text-lg placeholder:text-base-content/40 min-h-[60px] pt-2"
            />
            <div className="flex justify-between items-center mt-2">
              <div className="flex gap-1 text-primary">
                <button className="btn btn-ghost btn-sm btn-circle hover:bg-primary/10"><ImageIcon className="w-4 h-4" /></button>
                <button className="btn btn-ghost btn-sm btn-circle hover:bg-primary/10"><MapPin className="w-4 h-4" /></button>
              </div>
              <button className="btn btn-primary btn-sm rounded-full px-6 shadow-sm">Post</button>
            </div>
          </div>
        </div>

        {/* Posts Stream - Changed from motion.article to standard HTML element for performance */}
        <div className="flex flex-col">
          {MOCK_POSTS.map((post) => (
            <article 
              key={post.id} 
              className="p-4 border-b border-base-content/5 hover:bg-base-content/[0.02] transition-colors cursor-pointer"
            >
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-neutral text-neutral-content flex items-center justify-center font-bold flex-shrink-0 text-sm shadow-inner">
                  {post.avatar}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-1.5 flex-wrap leading-tight">
                      <span className="font-bold text-[15px] hover:underline">{post.author}</span>
                      {post.isVerified && <BadgeCheck className="w-4 h-4 text-info" />}
                      <span className="text-base-content/50 text-sm ml-1">{post.handle}</span>
                      <span className="text-base-content/50 text-sm">· {post.time}</span>
                    </div>
                    <button className="btn btn-ghost btn-xs btn-circle text-base-content/50 hover:bg-base-content/10 transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
                  </div>

                  <p className="mt-1.5 text-[15px] text-base-content/90 whitespace-pre-wrap leading-relaxed">
                    {post.content}
                  </p>

                  {post.hasImage && (
                    <div className="mt-3 w-full h-56 bg-base-200/50 rounded-2xl border border-base-content/10 flex items-center justify-center text-base-content/30 overflow-hidden">
                      <span className="flex items-center gap-2"><ImageIcon className="w-5 h-5"/> Image Attached</span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 mt-2.5">
                    {post.tags.map(tag => (
                      <span key={tag} className="text-primary text-sm hover:underline font-medium">{tag}</span>
                    ))}
                  </div>

                  {/* Actions - Stripped unnecessary nested divs to reduce DOM node count */}
                  <div className="flex justify-between items-center mt-3 max-w-md text-base-content/50 pr-4">
                    <button className="flex items-center gap-1.5 hover:text-info transition-colors group">
                      <span className="p-1.5 rounded-full group-hover:bg-info/10 transition-colors"><MessageCircle className="w-[18px] h-[18px]" /></span>
                      <span className="text-xs font-medium">{post.comments}</span>
                    </button>
                    <button className="flex items-center gap-1.5 hover:text-success transition-colors group">
                      <span className="p-1.5 rounded-full group-hover:bg-success/10 transition-colors"><Repeat2 className="w-[18px] h-[18px]" /></span>
                      <span className="text-xs font-medium">{post.reposts}</span>
                    </button>
                    <button className="flex items-center gap-1.5 hover:text-error transition-colors group">
                      <span className="p-1.5 rounded-full group-hover:bg-error/10 transition-colors"><Heart className="w-[18px] h-[18px]" /></span>
                      <span className="text-xs font-medium">{post.likes}</span>
                    </button>
                    <button className="flex items-center gap-1.5 hover:text-primary transition-colors group">
                      <span className="p-1.5 rounded-full group-hover:bg-primary/10 transition-colors"><Share className="w-[18px] h-[18px]" /></span>
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* RIGHT COLUMN: Context Widgets */}
      <div className="hidden xl:block xl:col-span-3 space-y-5 pt-2 pr-2">
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
          <h3 className="font-extrabold text-base mb-4 tracking-tight">Market Prices</h3>
          <div className="space-y-4">
            {MARKET_PRICES.map(item => (
              <div key={item.crop} className="flex justify-between items-center group cursor-pointer">
                <span className="text-sm font-semibold text-base-content/80 group-hover:text-primary transition-colors">{item.crop}</span>
                <div className="text-right flex flex-col items-end">
                  <div className="text-sm font-bold">{item.price}</div>
                  <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md mt-0.5 ${item.trend === 'up' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'} flex items-center gap-1`}>
                    <TrendingUp className={`w-2.5 h-2.5 ${item.trend === 'down' && 'rotate-180'}`} />
                    {item.change}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="text-primary text-sm font-medium mt-5 hover:underline w-full text-left transition-all">View full market report</button>
        </div>

        {/* Mini Trending Widget */}
        <div className="bg-base-content/[0.03] rounded-2xl p-5 border border-base-content/5">
          <h3 className="font-extrabold text-base mb-4 tracking-tight">Trending Topics</h3>
          <div className="space-y-5">
            {TRENDING.slice(0, 3).map((trend, i) => (
              <div key={i} className="cursor-pointer group">
                <div className="text-xs font-medium text-base-content/40 flex justify-between items-center mb-0.5">
                  {trend.category} <MoreHorizontal className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-base-content" />
                </div>
                <div className="font-bold text-[15px] group-hover:text-primary transition-colors">{trend.tag}</div>
                <div className="text-xs font-medium text-base-content/50 mt-0.5">{trend.posts} posts</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}