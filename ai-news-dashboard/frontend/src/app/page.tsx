'use client';

import { useState, useEffect } from 'react';
import {
  Newspaper,
  TrendingUp,
  Bookmark,
  Clock,
  LoaderCircle,
  Volume2
} from 'lucide-react';
import NewsTrendsChart from './components/NewsTrendsCharts';
import NotificationSettings from './components/NotificationSettings';
import { useReadingTimer } from './hooks/useReadingTimer';
import Header from './components/Header';

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

// Utility function to format time
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
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [bookmarkLoader, setBookmarkLoader] = useState(false)
  const [bookmarkLoaderUUID, setBookmarkLoaderUUID] = useState('')
  const [duration, setDuration] = useState('')
  const { formattedTime } = useReadingTimer();

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingArticleId, setSpeakingArticleId] = useState<string | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);


  useEffect(() => {
    fetchArticles();
  }, []);

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

  const categories = ['All', 'Technology', 'Finance', 'Sports', 'Health', 'World', 'Science'];

  const insights = {
    totalArticles: articles.length,
    trendingTopics: articles.filter(article => article.trending === true).length,
    savedForLater: articles.filter(article => article.bookmark === true).length,
    readingTime: `${formattedTime}`
  };

  const updateBookmark = async (article: Article) => {
    const article_id = article["id"]
    const value = !article['bookmark']
    try {
      const response = await fetch('/api/articles', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          article_id: article_id,
          is_bookmarked: value,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update bookmark');
      }
      await fetchArticles();
      const result = await response.json();
      console.log('Bookmark synced to database:', result);
      setBookmarkLoader(false)
      setBookmarkLoaderUUID('')
    } catch (error) {
      console.error('Database Sync Error:', error);
      setBookmarkLoader(false)
      alert("Could not save bookmark. Please try again.");
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
      // Stop previous audio
      stopAudio();

      setIsSpeaking(true);
      setSpeakingArticleId(article.id);

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `${article.title}. ${article.summary}`,
        }),
      });

      if (!response.ok) {
        throw new Error('TTS request failed');
      }

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);

      const newAudio = new Audio(audioUrl);
      setAudio(newAudio);

      newAudio.play();

      newAudio.onended = () => {
        stopAudio();
      };

    } catch (error) {
      console.error(error);
      stopAudio();
      alert('Unable to play audio');
    }
  };


  // 1. Filter based on category
  const filteredArticles = articles.filter(article =>
    selectedCategory === 'All' ? true : article.category === selectedCategory
  );

  // 2. Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const articlesPerPage = 9;

  // 3. Calculate indices
  const indexOfLastArticle = currentPage * articlesPerPage;
  const indexOfFirstArticle = indexOfLastArticle - articlesPerPage;
  const currentArticles = filteredArticles.slice(indexOfFirstArticle, indexOfLastArticle);

  // 4. Calculate total pages
  const totalPages = Math.ceil(filteredArticles.length / articlesPerPage);
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Top Story */}
        <section className="mb-6 sm:mb-8 lg:mb-10">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Top Story</h2>

          {loading ? (
            <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 lg:p-8 animate-pulse">
              <div className="h-40 sm:h-48 bg-gray-200 rounded-xl mb-4" />
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-full" />
            </div>
          ) : articles.length > 0 ? (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row">
              <div className="md:w-2/5 relative bg-gray-100 p-3 sm:p-4">
                {articles[0].image_url ? (
                  <img
                    src={articles[0].image_url}
                    alt={articles[0].title}
                    className="w-full h-48 sm:h-56 object-contain rounded-xl"
                  />
                ) : (
                  <div className="w-full h-48 sm:h-56 flex items-center justify-center text-gray-400 rounded-xl bg-gray-200">
                    <Newspaper className="w-12 h-12 sm:w-16 sm:h-16" />
                  </div>
                )}
              </div>

              <div className="md:w-3/5 p-4 sm:p-6 lg:p-8">
                <div className='flex justify-between items-start'>
                  <span className="inline-block px-3 py-1 bg-emerald-500 text-white text-xs font-medium rounded-full mb-3">
                    Featured News
                  </span>
                  <div className="flex flex-col">
                    {bookmarkLoader && bookmarkLoaderUUID == articles[0]?.id ? <LoaderCircle className='text-emerald-500 animate-spin w-5 h-5 sm:w-6 sm:h-6' /> :
                      <Bookmark onClick={() => handleBookmark(articles[0])}
                        className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors cursor-pointer ${articles[0].bookmark === true
                          ? 'text-emerald-500 fill-emerald-500' :
                          'text-emerald-500 fill-none'
                          }`}
                      />

                    }

                  </div>
                </div>

                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-2 sm:mb-3 line-clamp-2">
                  {articles[0].title}
                </h3>

                <p className="text-gray-600 mb-4 sm:mb-6 leading-relaxed text-xs sm:text-sm line-clamp-3">
                  {articles[0].summary}
                </p>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <span className="text-xs text-gray-500 flex items-center gap-2">
                    <Clock className="w-4 h-4 flex-shrink-0" />
                    {formatDistanceToNow(new Date(articles[0].created_at))}
                  </span>

                  <div className='flex justify-between items-center gap-3'>
                    <Volume2
                      onClick={() => speakSummary(articles[0])}
                      className={`w-5 h-5 sm:w-6 sm:h-6 cursor-pointer transition
                        ${speakingArticleId === articles[0].id
                          ? 'text-emerald-600 animate-pulse'
                          : 'text-gray-400 hover:text-emerald-500'
                        }`}
                    />
                    <a
                      href={articles[0].link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto text-center px-4 sm:px-5 py-2 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600 transition"
                    >
                      Read Full Story
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 text-center text-gray-500">
              No articles available
            </div>
          )}
        </section>

        {/* Quick Insights */}
        <section className="mb-6 sm:mb-8 lg:mb-10">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Quick Insights</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
            <InsightCard icon={<Newspaper className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />} title="Total Articles" value={`${insights.totalArticles}+`} description="News articles published this month." />
            <InsightCard icon={<TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />} title="Trending Topics" value={insights.trendingTopics.toString()} description="Currently popular topics across all categories." />
            <InsightCard icon={<Bookmark className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />} title="Saved For Later" value={insights.savedForLater.toString()} description="Articles bookmarked for offline reading." />
            <InsightCard icon={<Clock className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />} title="Reading Time" value={insights.readingTime} description="Estimated time spent reading this week." />
          </div>
          <section className="mt-6 sm:mt-8 lg:mt-10 grid gap-4 sm:gap-6 lg:grid-cols-2">
            {/* Left side can be NotificationSettings later */}
            <NotificationSettings />
            <NewsTrendsChart />
          </section>

        </section>

        {/* Explore Categories */}
        <section className="mb-6 sm:mb-8 lg:mb-10">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Explore Categories</h2>
          <div className="flex gap-2 sm:gap-3 flex-wrap">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 sm:px-4 lg:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition ${selectedCategory === category
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
              >
                {category}
              </button>
            ))}
          </div>
        </section>

        {/* Latest News */}
        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
            {selectedCategory} News
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {loading
              ? [1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
                <div key={i} className="bg-white rounded-2xl shadow-sm p-3 sm:p-4 animate-pulse">
                  <div className="h-32 sm:h-40 bg-gray-200 rounded-xl mb-3" />
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-full" />
                </div>
              ))
              : currentArticles.map((article) => (
                <NewsCard
                  key={article.id}
                  article={article}
                  handleBookmark={handleBookmark}
                  bookmarkLoader={bookmarkLoader}
                  bookmarkLoaderUUID={bookmarkLoaderUUID}
                  speakSummary={speakSummary}
                  speakingArticleId={speakingArticleId}
                />
              ))
            }
          </div>

          {/* 3. Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-1.5 sm:gap-2 mt-6 sm:mt-8 lg:mt-10 flex-wrap">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl text-sm sm:text-base font-medium transition ${currentPage === i + 1
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

interface InsightCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  description: string;
}

function InsightCard({ icon, title, value, description }: InsightCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-3 sm:p-4 lg:p-5 hover:shadow-md transition">
      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
        {icon}
        <h3 className="font-semibold text-gray-700 text-xs sm:text-sm">{title}</h3>
      </div>
      <p className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}

function NewsCard({ article, handleBookmark, bookmarkLoader, bookmarkLoaderUUID, speakSummary,
  speakingArticleId }: {
    article: Article, handleBookmark: (article: Article) => void, bookmarkLoader: boolean, bookmarkLoaderUUID: string, speakSummary: (article: Article) => void,
    speakingArticleId: string | null
  }) {
  return (
    <div className="relative bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition">

      <div className="bg-gray-100 p-2 sm:p-3">
        {article.image_url ? (
          <img src={article.image_url} alt={article.title} className="w-full h-32 sm:h-40 object-contain rounded-xl" />
        ) : (
          <div className="w-full h-32 sm:h-40 flex items-center justify-center text-gray-400 rounded-xl bg-gray-200">
            <Newspaper className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
        )}
      </div>
      <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-10"> {/* Changed z-1 to z-10 */}
        {bookmarkLoader && bookmarkLoaderUUID === article.id ? <LoaderCircle className='text-emerald-500 animate-spin w-5 h-5 sm:w-6 sm:h-6' /> :
          <Bookmark onClick={() => handleBookmark(article)}
            className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors cursor-pointer ${article.bookmark === true
              ? 'text-emerald-500 fill-emerald-500' :
              'text-emerald-500 fill-none'
              }`}
          />
        }

      </div>

      <div className="p-3 sm:p-4">
        <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-2 line-clamp-2">
          {article.title}
        </h3>
        <p className="text-gray-600 mb-3 line-clamp-2 text-xs leading-relaxed">
          {article.summary}
        </p>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Clock className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{formatDistanceToNow(new Date(article.created_at))}</span>
          </span>

          <div className='flex justify-center items-center gap-3'>
            <Volume2
              onClick={() => speakSummary(article)}
              className={`w-5 h-5 cursor-pointer
              ${speakingArticleId === article.id
                  ? 'text-emerald-600 animate-pulse'
                  : 'text-gray-400 hover:text-emerald-500'
                }`}
            />
            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-500 font-medium hover:text-emerald-600 transition text-xs whitespace-nowrap"
            >
              Read More
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}