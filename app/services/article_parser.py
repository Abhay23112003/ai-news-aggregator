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