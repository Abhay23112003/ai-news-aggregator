'use client';
import { useSession } from "next-auth/react";

import { useState, useEffect, useRef } from 'react';
import {
  Newspaper,
  TrendingUp,
  Bookmark,
  Clock,
  LoaderCircle,
  Volume2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import NewsTrendsChart from './components/NewsTrendsCharts';
import NotificationSettings from './components/NotificationSettings';
import { useReadingTimer } from './hooks/useReadingTimer';
import Header from './components/Header';
import Email from "next-auth/providers/email";

// Types
interface Article {
  id: string,
  title: string;
  summary: string;
  link: string;
  image_url?: string;
  trending?: boolean;
  category?: string;
  bookmark?: boolean;
  created_at: string;
}

interface ArticlesResponse {
  articles: Article[];
}

// Added missing interface to fix your error
interface InsightCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  description: string;
}

function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return `${Math.floor(diffDays / 7)} weeks ago`;
}

export default function Home() {
  const { data: session, status } = useSession();
  const userEmail = session?.user?.email || null;


  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [bookmarkLoader, setBookmarkLoader] = useState(false)
  const [bookmarkLoaderUUID, setBookmarkLoaderUUID] = useState('')
  const { formattedTime } = useReadingTimer();

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingArticleId, setSpeakingArticleId] = useState<string | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const [emailEnabled, setEmailEnabled] = useState<boolean>(true)
  const [frequency, setFrequency] = useState<"daily" | "6hour" | "hourly" | null>(null)
  const [loadingEmail, setLoadingEmail] = useState(false);

  // Pagination & Scrolling
  const [currentPage, setCurrentPage] = useState(1);
  const articlesPerPage = 9;
  const pageBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchArticles();
  }, []);

  // Enhanced scroll to bottom logic
  useEffect(() => {
    if (!loading) {
      // Small timeout ensures the DOM update is painted before scrolling
      setTimeout(() => {
        window.scrollTo({
          top: document.documentElement.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
    }
  }, [currentPage]);

  useEffect(() => {
    if (status !== "authenticated" || !userEmail) return;

    const fetchEmailNotificationSettings = async () => {
      try {
        const res = await fetch(
          `/api/notification-settings?email=${encodeURIComponent(userEmail)}`
        );

        if (!res.ok) {
          console.error("Failed to fetch settings:", res.status);
          return;
        }

        const json = await res.json();

        if (!json?.data) {
          console.error("No data returned from API", json);
          return;
        }

        setEmailEnabled(json.data.email_enabled);
        setFrequency(json.data.frequency);
      } catch (err) {
        console.error("Failed to fetch notification settings", err);
      }
    };

    fetchEmailNotificationSettings();
  }, [status, userEmail]);


  const handleToggle = () => {
    setEmailEnabled((prev) => !prev)
  }

  const saveSettings = async () => {
    console.log("Email is:",userEmail)
    console.log("email_enabled:",emailEnabled)
    console.log("frequency is:",frequency)
    if (!userEmail || !frequency) return;

    setLoadingEmail(true);

    const res = await fetch("/api/notification-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: userEmail,
        email_enabled: emailEnabled,
        frequency,
      }),
    });

    setLoadingEmail(false);

    if (!res.ok) {
      alert("Failed to save settings");
    }
  };



  const fetchArticles = async () => {
    try {
      const response = await fetch('/api/articles?limit=100000');
      const data: ArticlesResponse = await response.json();
      setArticles(data.articles);
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateBookmark = async (article: Article) => {
    const article_id = article["id"]
    const value = !article['bookmark']
    try {
      const response = await fetch('/api/articles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article_id: article_id,
          is_bookmarked: value,
        }),
      });
      if (!response.ok) throw new Error('Failed to update bookmark');
      await fetchArticles();
      setBookmarkLoader(false);
      setBookmarkLoaderUUID('');
    } catch (error) {
      console.error('Database Sync Error:', error);
      setBookmarkLoader(false);
      alert("Could not save bookmark.");
    }
  }

  const handleBookmark = async (article: Article) => {
    setBookmarkLoader(true)
    setBookmarkLoaderUUID(article?.id)
    await updateBookmark(article)
  }

  const stopAudio = () => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      setAudio(null);
    }
    setIsSpeaking(false);
    setSpeakingArticleId(null);
  };

  const speakSummary = async (article: Article) => {
    try {
      stopAudio();
      setIsSpeaking(true);
      setSpeakingArticleId(article.id);
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `${article.title}. ${article.summary}` }),
      });
      if (!response.ok) throw new Error('TTS request failed');
      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      const newAudio = new Audio(audioUrl);
      setAudio(newAudio);
      newAudio.play();
      newAudio.onended = () => stopAudio();
    } catch (error) {
      console.error(error);
      stopAudio();
      alert('Unable to play audio');
    }
  };

  const categories = ['All', 'Technology', 'Finance', 'Sports', 'Health', 'World', 'Science'];
  const insights = {
    totalArticles: articles.length,
    trendingTopics: articles.filter(a => a.trending).length,
    savedForLater: articles.filter(a => a.bookmark).length,
    readingTime: formattedTime
  };

  const filteredArticles = articles.filter(article =>
    selectedCategory === 'All' ? true : article.category === selectedCategory
  );

  const indexOfLastArticle = currentPage * articlesPerPage;
  const indexOfFirstArticle = indexOfLastArticle - articlesPerPage;
  const currentArticles = filteredArticles.slice(indexOfFirstArticle, indexOfLastArticle);
  const totalPages = Math.ceil(filteredArticles.length / articlesPerPage);

  const getPaginationBtnClass = (isActive: boolean) => `
    w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl text-xs sm:text-base font-medium transition flex items-center justify-center
    ${isActive
      ? 'bg-emerald-500 text-white shadow-md cursor-default'
      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-100'
    }
    disabled:bg-gray-50 disabled:text-gray-300 disabled:cursor-not-allowed
  `;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Top Story */}
        <section className="mb-6 sm:mb-8 lg:mb-10">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Top Story</h2>
          {loading ? (
            <div className="bg-white rounded-2xl shadow-sm p-4 animate-pulse h-64" />
          ) : articles.length > 0 ? (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row">
              <div className="md:w-2/5 relative bg-gray-100 p-3">
                {articles[0].image_url ? (
                  <img src={articles[0].image_url} alt={articles[0].title} className="w-full h-48 sm:h-56 object-contain rounded-xl" />
                ) : (
                  <div className="w-full h-48 sm:h-56 flex items-center justify-center text-gray-400 rounded-xl bg-gray-200">
                    <Newspaper className="w-12 h-12" />
                  </div>
                )}
              </div>
              <div className="md:w-3/5 p-4 sm:p-6 lg:p-8">
                <div className='flex justify-between items-start'>
                  <span className="px-3 py-1 bg-emerald-500 text-white text-xs font-medium rounded-full mb-3">Featured News</span>
                  <div className="flex flex-col">
                    {bookmarkLoader && bookmarkLoaderUUID == articles[0]?.id ? <LoaderCircle className='text-emerald-500 animate-spin w-5 h-5' /> :
                      <Bookmark onClick={() => handleBookmark(articles[0])} className={`w-5 h-5 cursor-pointer ${articles[0].bookmark ? 'text-emerald-500 fill-emerald-500' : 'text-emerald-500 fill-none'}`} />
                    }
                  </div>
                </div>
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-2 line-clamp-2">{articles[0].title}</h3>
                <p className="text-gray-600 mb-4 text-xs sm:text-sm line-clamp-3">{articles[0].summary}</p>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <span className="text-xs text-gray-500 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {formatDistanceToNow(new Date(articles[0].created_at))}
                  </span>
                  <div className='flex items-center gap-3'>
                    <Volume2 onClick={() => speakSummary(articles[0])} className={`w-5 h-5 cursor-pointer ${speakingArticleId === articles[0].id ? 'text-emerald-600 animate-pulse' : 'text-gray-400 hover:text-emerald-500'}`} />
                    <a href={articles[0].link} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600 transition">Read Full Story</a>
                  </div>
                </div>
              </div>
            </div>
          ) : <div className="text-center py-10">No articles available</div>}
        </section>

        {/* Quick Insights */}
        <section className="mb-10">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Quick Insights</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <InsightCard icon={<Newspaper className="text-emerald-500" />} title="Total Articles" value={`${insights.totalArticles}+`} description="Published this month." />
            <InsightCard icon={<TrendingUp className="text-emerald-500" />} title="Trending Topics" value={insights.trendingTopics.toString()} description="Currently popular topics." />
            <InsightCard icon={<Bookmark className="text-emerald-500" />} title="Saved For Later" value={insights.savedForLater.toString()} description="Bookmarked for reading." />
            <InsightCard icon={<Clock className="text-emerald-500" />} title="Reading Time" value={insights.readingTime} description="Time spent this week." />
          </div>
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <NotificationSettings
              onToggle={handleToggle}
              emailEnabled={emailEnabled}
              onFrequencyChange={(value) => setFrequency(value)}
              onSave={saveSettings}
              loadingEmail={loadingEmail}
              frequency={frequency}
            />
            <NewsTrendsChart articles={articles} />
          </div>
        </section>

        {/* Explore Categories */}
        <section className="mb-10">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Explore Categories</h2>
          <div className="flex gap-2 flex-wrap">
            {categories.map(category => (
              <button key={category} onClick={() => { setSelectedCategory(category); setCurrentPage(1); }} className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition ${selectedCategory === category ? 'bg-emerald-500 text-white' : 'bg-white text-gray-700 border border-gray-200'}`}>
                {category}
              </button>
            ))}
          </div>
        </section>

        {/* Latest News */}
        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">{selectedCategory} News</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? [1, 2, 3].map(i => <div key={i} className="h-64 bg-white rounded-2xl animate-pulse" />) :
              currentArticles.map((article) => (
                <NewsCard key={article.id} article={article} handleBookmark={handleBookmark} bookmarkLoader={bookmarkLoader} bookmarkLoaderUUID={bookmarkLoaderUUID} speakSummary={speakSummary} speakingArticleId={speakingArticleId} />
              ))
            }
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-1 sm:gap-2 mt-8 flex-wrap">
              <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className={getPaginationBtnClass(false)}>
                <ChevronsLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <button onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))} disabled={currentPage === 1} className={getPaginationBtnClass(false)}>
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {(() => {
                const pagesToShow = 3;
                let startPage = Math.max(1, currentPage - 1);
                let endPage = Math.min(totalPages, startPage + pagesToShow - 1);
                if (endPage - startPage + 1 < pagesToShow) startPage = Math.max(1, endPage - pagesToShow + 1);

                const pageNumbers = [];
                if (startPage > 1) pageNumbers.push(<span key="s-e" className="px-1 text-gray-400">...</span>);

                for (let i = startPage; i <= endPage; i++) {
                  pageNumbers.push(
                    <button key={i} onClick={() => setCurrentPage(i)} className={getPaginationBtnClass(currentPage === i)}>
                      {i}
                    </button>
                  );
                }

                if (endPage < totalPages) pageNumbers.push(<span key="e-e" className="px-1 text-gray-400">...</span>);
                return pageNumbers;
              })()}

              <button onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))} disabled={currentPage === totalPages} className={getPaginationBtnClass(false)}>
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className={getPaginationBtnClass(false)}>
                <ChevronsRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          )}
        </section>
        {/* Invisible div to anchor the absolute bottom for scrolling */}
        <div ref={pageBottomRef} className="h-1" />
      </main>
    </div>
  );
}

function InsightCard({ icon, title, value, description }: InsightCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 hover:shadow-md transition">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h3 className="font-semibold text-gray-700 text-xs sm:text-sm">{title}</h3>
      </div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
  );
}

function NewsCard({ article, handleBookmark, bookmarkLoader, bookmarkLoaderUUID, speakSummary, speakingArticleId }: any) {
  return (
    <div className="relative bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition">
      <div className="bg-gray-100 p-2">
        {article.image_url ? <img src={article.image_url} alt="" className="w-full h-32 sm:h-40 object-contain rounded-xl" /> : <div className="w-full h-32 flex items-center justify-center bg-gray-200 rounded-xl"><Newspaper className="text-gray-400" /></div>}
      </div>
      <div className="absolute top-3 right-3 z-10">
        {bookmarkLoader && bookmarkLoaderUUID === article.id ? <LoaderCircle className='text-emerald-500 animate-spin w-5 h-5' /> :
          <Bookmark onClick={() => handleBookmark(article)} className={`w-5 h-5 cursor-pointer ${article.bookmark ? 'text-emerald-500 fill-emerald-500' : 'text-emerald-500 fill-none'}`} />
        }
      </div>
      <div className="p-4">
        <h3 className="text-sm font-bold text-gray-900 mb-2 line-clamp-2">{article.title}</h3>
        <p className="text-gray-600 mb-3 line-clamp-2 text-xs">{article.summary}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" />{formatDistanceToNow(new Date(article.created_at))}</span>
          <div className='flex items-center gap-3'>
            <Volume2 onClick={() => speakSummary(article)} className={`w-4 h-4 cursor-pointer ${speakingArticleId === article.id ? 'text-emerald-600 animate-pulse' : 'text-gray-400'}`} />
            <a href={article.link} target="_blank" className="text-emerald-500 font-medium text-xs">Read More</a>
          </div>
        </div>
      </div>
    </div>
  );
}