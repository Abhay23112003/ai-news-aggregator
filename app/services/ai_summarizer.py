import os
from groq import Groq
import json

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def summarize_article(article: dict) -> str:
    """
    Summarize a news article using full article text.
    """
    prompt = f"""
    Act as a professional news desk editor and data analyst. Analyze the provided article title and text to generate a structured JSON response.

    Task Requirements:
    1. Summary: Write a 2-3 sentence factual summary in a professional news reporter tone. Do not use introductory phrases.
    2. Trending Status: Determine if the news is "Trending" (True/False) based on the timeliness and scale of the impact.
    3. Category Selection: Assign exactly one category from this specific list: Technology, Finance, Sports, Health, World, Science.

    Output Format: 
    Return ONLY a valid JSON object with the following keys: 
    {{ 
        "summary": "string", 
        "trending": boolean, 
        "category": "string" 
    }}

    Article Data: 
    Title: {article['title']} 
    Full Text: {article['full_text']}

    Constraint: If the article does not perfectly fit a category, pick the closest match from the provided list. Do not create new categories.
    """

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "user", "content": prompt}
        ],
        temperature=0.3,
    )

    content=response.choices[0].message.content
    return json.loads(content)
