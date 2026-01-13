def build_email_html(articles:list)->str:
    if not articles:
        return "<p>No new articles available.</p>"
    
    html_parts = [
        "<h2>📰 AI News Digest</h2>",
        "<p>Here are the latest curated news summaries:</p>",
        "<hr>"
    ]

    for article in articles:
        html_parts.append(f"""
        <h3>{article['title']}</h3>
        <p><em>{article['source']} | {article['created_at']}</em></p>
        <p>{article['summary']}</p>
        <p><a href="{article['link']}">Read full article</a></p>
        <hr>
        """)

    return "\n".join(html_parts)