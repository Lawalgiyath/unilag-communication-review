import os
import psycopg2

with open('.env', 'r', encoding='utf-8') as f:
    for line in f:
        if line.startswith('DATABASE_URL='):
            db_url = line.strip().split('=', 1)[1].strip('"\'')
            break

conn = psycopg2.connect(db_url)
cur = conn.cursor()

cur.execute("""
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'StoredFile';
""")
cols = cur.fetchall()
print("StoredFile columns:", cols)

col_names = [c[0] for c in cols]

pdf_dir = os.path.join(os.getcwd(), "uploads", "published")
synced_count = 0

for filename in os.listdir(pdf_dir):
    if filename.endswith(".pdf"):
        filepath = os.path.join(pdf_dir, filename)
        with open(filepath, "rb") as f:
            pdf_bytes = f.read()
        
        if "fileData" in col_names and "filename" in col_names:
            cur.execute(
                """
                UPDATE "StoredFile"
                SET "fileData" = %s
                WHERE "filename" = %s OR "originalName" = %s
                """,
                (psycopg2.Binary(pdf_bytes), filename, filename)
            )
            if cur.rowcount > 0:
                synced_count += cur.rowcount
                print(f"Synced {filename} ({len(pdf_bytes)} bytes) to StoredFile")

conn.commit()
conn.close()
print(f"Successfully synced {synced_count} PDF records to PostgreSQL!")
