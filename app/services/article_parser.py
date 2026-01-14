from bs4 import BeautifulSoup

def extract_article_text(html:str)->str:
    soup=BeautifulSoup(html,"html.parser")

    for tag in soup(["script","style","noscript"]):
        tag.decompose()
    
    paragraphs=[]
    for p in soup.find_all("p"):
        text=p.get_text(strip=True)
        if len(text)>50:
            paragraphs.append(text)
    return "\n\n".join(paragraphs)

def extract_image_url(html: str) -> str | None:
    """
    Extract best image URL from article HTML.
    Priority:
    1. og:image
    2. twitter:image
    3. first <img>
    """
    soup = BeautifulSoup(html, "html.parser")

    # 1. Open Graph image
    og_image = soup.find("meta", property="og:image")
    if og_image and og_image.get("content"):
        return og_image["content"]

    # 2. Twitter image
    twitter_image = soup.find("meta", attrs={"name": "twitter:image"})
    if twitter_image and twitter_image.get("content"):
        return twitter_image["content"]

    # 3. First image tag
    img = soup.find("img")
    if img and img.get("src"):
        return img["src"]

    return None
