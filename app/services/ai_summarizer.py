import os
from groq import Groq
import json

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def summarize_article(article: dict) -> str:
    """
    Summarize a news article using full article text.
    """
    prompt = f"""
    Act as a professional news desk editor. 
    Analyze the provided article and generate a structured JSON response.

    Task Requirements:
    1. Summary: Write a 2-3 sentence factual summary. Do not use introductory phrases.
    2. Trending Status: Determine if the news is "Trending" (True/False) based on impact.
    3. Category Selection: Assign exactly ONE category from: Technology, Finance, Sports, Health, World, Science.

    Article Data: 
    Title: {article['title']} 
    Full Text: {article['full_text']}

    Output Format (STRICT):
    Return ONLY a valid JSON object with these keys:
    {{ 
        "summary": "string", 
        "trending": boolean, 
        "category": "string" 
    }}

    CRITICAL CONSTRAINTS:
    - Do NOT include markdown code blocks (like ```json),only give a valid json object.
    - Do NOT include any introductory text, concluding explanations, or notes.
    - Your entire response MUST be the JSON object itself so it can be parsed by json.loads().
    - If a category doesn't fit perfectly, pick the closest match from the list.
"""

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "user", "content": prompt}
        ],
        temperature=0.1,
    )

    content=response.choices[0].message.content.strip()
    print("content: ",content)
    try:
        start_idx=content.find('{')
        end_idx=content.rfind('}')+1
        if start_idx==-1 or end_idx==0:
            print("No JSON object found in the response")
        clean_content=content[start_idx:end_idx]
        return json.loads(clean_content)
    
    except (json.JSONDecodeError, ValueError) as e:
        print(f"Error parsing JSON for article: {article['title']}")
        print(f"Raw content was: {content}")
        
        # STEP 3: Fallback data so the loop continues and saves other articles
        return {
            "summary": article.get("title", "Summary unavailable"),
            "trending": False,
            "category": "World"
        }