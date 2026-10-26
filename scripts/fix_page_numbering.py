import os
import re
import json
import psycopg2

PAGES_MAPPING = [
    {
        "slug": "youth-citizenship-digital-activism-and-electoral-mobilisation-ahead-of-nigeria-s",
        "firstPage": 1,
        "lastPage": 15,
        "span": 15
    },
    {
        "slug": "youthwashing-as-political-performance-in-the-digital-age-discursive-construction",
        "firstPage": 16,
        "lastPage": 27,
        "span": 12
    },
    {
        "slug": "framing-electoral-credibility-on-x-public-discourse-on-real-time-result-transmis",
        "firstPage": 28,
        "lastPage": 69,
        "span": 42
    },
    {
        "slug": "digital-mobilisation-vs-youth-apathy-a-documentary-analysis-of-inec-s-strategic",
        "firstPage": 70,
        "lastPage": 84,
        "span": 15
    },
    {
        "slug": "curated-media-broadcast-news-editors-views-of-political-media-briefings-on-2027",
        "firstPage": 85,
        "lastPage": 96,
        "span": 12
    },
    {
        "slug": "singing-truth-to-power-musical-skits-digital-performance-and-political-accountab",
        "firstPage": 97,
        "lastPage": 108,
        "span": 12
    },
    {
        "slug": "electorates-responses-to-ai-generated-and-human-created-campaign-messages-in-sou",
        "firstPage": 109,
        "lastPage": 119,
        "span": 11
    },
    {
        "slug": "artificial-intelligence-ai-and-the-2027-elections-comparing-urban-and-rural-vote",
        "firstPage": 120,
        "lastPage": 131,
        "span": 12
    },
    {
        "slug": "electoral-propaganda-and-public-opinion-formation-in-nigeria-s-fourth-republic-a",
        "firstPage": 132,
        "lastPage": 141,
        "span": 10
    },
    {
        "slug": "setting-the-2027-agenda-re-examining-the-discourse-on-good-governance-and-the-ni",
        "firstPage": 142,
        "lastPage": 151,
        "span": 10
    }
]

def main():
    print("1. Updating data/real-articles.json...")
    with open("data/real-articles.json", "r", encoding="utf-8") as f:
        articles = json.load(f)

    for i, a in enumerate(articles):
        mapping = PAGES_MAPPING[i]
        a["firstPage"] = mapping["firstPage"]
        a["lastPage"] = mapping["lastPage"]

    with open("data/real-articles.json", "w", encoding="utf-8") as f:
        json.dump(articles, f, indent=2, ensure_ascii=False)
    print("  -> data/real-articles.json successfully updated.")

    print("\n2. Updating prisma/seed-data.ts...")
    with open("prisma/seed-data.ts", "r", encoding="utf-8") as f:
        ts_content = f.read()

    # In prisma/seed-data.ts, update the firstPage and lastPage for each article
    # We can match by slug
    for mapping in PAGES_MAPPING:
        slug = mapping["slug"]
        fp = mapping["firstPage"]
        lp = mapping["lastPage"]
        
        # Regex to match this article block in seed-data.ts
        pattern = re.compile(
            rf'(\"slug\":\s*\"{re.escape(slug)}\",[\s\S]*?\"firstPage\":\s*)\d+(,[\s\S]*?\"lastPage\":\s*)\d+'
        )
        ts_content, count = pattern.subn(rf'\g<1>{fp}\g<2>{lp}', ts_content, count=1)
        if count == 0:
            print(f"  Warning: could not find seed entry for slug: {slug}")
        else:
            print(f"  -> Updated {slug}: pp. {fp}-{lp}")

    with open("prisma/seed-data.ts", "w", encoding="utf-8") as f:
        f.write(ts_content)
    print("  -> prisma/seed-data.ts successfully updated.")

    print("\n3. Updating PostgreSQL database...")
    db_url = None
    with open(".env", "r", encoding="utf-8") as f:
        for line in f:
            if line.startswith("DATABASE_URL="):
                db_url = line.strip().split("=", 1)[1].strip('"\'')
                break

    if db_url:
        try:
            conn = psycopg2.connect(db_url)
            cur = conn.cursor()
            updated_total = 0
            for mapping in PAGES_MAPPING:
                slug = mapping["slug"]
                fp = mapping["firstPage"]
                lp = mapping["lastPage"]
                cur.execute(
                    'UPDATE "Article" SET "firstPage" = %s, "lastPage" = %s WHERE slug = %s',
                    (fp, lp, slug)
                )
                updated_total += cur.rowcount
            conn.commit()
            cur.close()
            conn.close()
            print(f"  -> PostgreSQL updated ({updated_total} rows updated).")
        except Exception as e:
            print(f"  -> PostgreSQL update error: {e}")
    else:
        print("  -> No DATABASE_URL found.")

if __name__ == "__main__":
    main()
