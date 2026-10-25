import os
import re
import json
import sqlite3
import psycopg2

DOI_MAPPING = [
    ("10.5281/zenodo.14892001", "10.5281/zenodo.23575604"),
    ("10.5281/zenodo.14892002", "10.5281/zenodo.23575616"),
    ("10.5281/zenodo.14892003", "10.5281/zenodo.23575618"),
    ("10.5281/zenodo.14892004", "10.5281/zenodo.23575620"),
    ("10.5281/zenodo.14892005", "10.5281/zenodo.23575622"),
    ("10.5281/zenodo.14892006", "10.5281/zenodo.23575626"),
    ("10.5281/zenodo.14892007", "10.5281/zenodo.23575630"),
    ("10.5281/zenodo.14892008", "10.5281/zenodo.23575634"),
    ("10.5281/zenodo.14892009", "10.5281/zenodo.23575638"),
    ("10.5281/zenodo.14892010", "10.5281/zenodo.23575645"),
]

print("1. Updating prisma/seed-data.ts...")
with open("prisma/seed-data.ts", "r", encoding="utf-8") as f:
    seed_content = f.read()

for old_doi, new_doi in DOI_MAPPING:
    seed_content = seed_content.replace(old_doi, new_doi)

with open("prisma/seed-data.ts", "w", encoding="utf-8") as f:
    f.write(seed_content)
print("  -> prisma/seed-data.ts updated successfully.")

print("2. Updating data/real-articles.json...")
with open("data/real-articles.json", "r", encoding="utf-8") as f:
    articles_json = f.read()

for old_doi, new_doi in DOI_MAPPING:
    articles_json = articles_json.replace(old_doi, new_doi)

with open("data/real-articles.json", "w", encoding="utf-8") as f:
    f.write(articles_json)
print("  -> data/real-articles.json updated successfully.")

# Also check scripts/extract_articles.py if any
if os.path.exists("scripts/extract_articles.py"):
    with open("scripts/extract_articles.py", "r", encoding="utf-8") as f:
        ext_code = f.read()
    for old_doi, new_doi in DOI_MAPPING:
        ext_code = ext_code.replace(old_doi, new_doi)
    with open("scripts/extract_articles.py", "w", encoding="utf-8") as f:
        f.write(ext_code)

print("3. Updating SQLite databases...")
for db_path in ["data/journal.db", "prisma/journal-template.db"]:
    if os.path.exists(db_path):
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        for old_doi, new_doi in DOI_MAPPING:
            cur.execute("UPDATE Article SET doi = ? WHERE doi = ?", (new_doi, old_doi))
        conn.commit()
        conn.close()
        print(f"  -> {db_path} updated.")

print("4. Updating PostgreSQL database...")
# Read DATABASE_URL from .env
db_url = None
with open(".env", "r", encoding="utf-8") as f:
    for line in f:
        if line.startswith("DATABASE_URL="):
            db_url = line.strip().split("=", 1)[1].strip('"\'')
            break

if db_url:
    try:
        pg_conn = psycopg2.connect(db_url)
        pg_cur = pg_conn.cursor()
        updated_count = 0
        for old_doi, new_doi in DOI_MAPPING:
            pg_cur.execute('UPDATE "Article" SET doi = %s WHERE doi = %s', (new_doi, old_doi))
            updated_count += pg_cur.rowcount
        pg_conn.commit()
        pg_conn.close()
        print(f"  -> PostgreSQL updated ({updated_count} rows updated).")
    except Exception as e:
        print(f"  -> PostgreSQL update error: {e}")
else:
    print("  -> No DATABASE_URL found in .env.")

print("\nDone applying real DOIs!")
