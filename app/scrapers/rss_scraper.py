import feedparser

def fetch_rss(feed_url:str,limit:int=5):
    feed=feedparser.parse(feed_url)
    articles=[]

    for entry in feed.entries[:limit]:
        articles.append({
            "title":entry.get("title",""),
            "link":entry.get("link",""),
            "summary":entry.get("summary",""),
            "published":entry.get("published","")
        })
    return articles

