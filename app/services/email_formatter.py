def build_email_html(articles: list) -> str:
    """
    Build HTML content for the news email with images.
    """
    if not articles:
        return "<p>No new articles available.</p>"

    html_parts = [
        "<h2 style='font-family:Arial'>📰 AI News Digest</h2>",
        "<p style='font-family:Arial'>Here are the latest curated news summaries:</p>",
        "<hr>"
    ]

    for article in articles:
        image_html = ""
        if article.get("image_url"):
            image_html = f"""
            <img src="{article['image_url']}"
                 style="width:100%; max-width:600px; border-radius:8px; margin:10px 0;"
                 alt="News image"/>
            """

        html_parts.append(f"""
        <div style="font-family:Arial; margin-bottom:30px;">
            {image_html}
            <h3>{article['title']}</h3>
            <p><em>{article['source']} | {article['created_at']}</em></p>
            <p>{article['summary']}</p>
            <p>
              <a href="{article['link']}" target="_blank">
                Read full article →
              </a>
            </p>
        </div>
        <hr>
        """)

    return "\n".join(html_parts)
