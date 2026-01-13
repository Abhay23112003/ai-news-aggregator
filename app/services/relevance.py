def is_relevant(article:dict)->bool:
    title=article.get('title',"")
    summary=article.get("summary","")

    if not title:
        return False
    if len(summary)<50:
        return False
    return True