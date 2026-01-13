import os
from groq import Groq

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def summarize_article(article: dict) -> str:
    """
    Summarize a news article using full article text.
    """
    prompt = f"""
    Summarize the following news article in 2–3 concise sentences.
    Focus on key facts and avoid speculation.

    Title: {article['title']}
    Article:
    {article['full_text']}
    """

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "user", "content": prompt}
        ],
        temperature=0.3,
    )

    return response.choices[0].message.content.strip()
