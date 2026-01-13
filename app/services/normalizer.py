from datetime import datetime

def normalize_article(raw_article:dict,source:str)->dict:
    return {
        "title":raw_article.get("title","").strip(),
        "summary":raw_article.get("summary","").strip(),
        "link":raw_article.get("link",""),
        "published":raw_article.get("published",""),
        "source":source,
        "image_url":None,
    }

def normalize_articles(raw_articles:list,source:str)->list:
    return [normalize_article(article,source) for article in raw_articles]