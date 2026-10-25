import os
import json
import urllib.request
import urllib.error
import time

TOKEN = "jREXiPYp2TdEmTxoA4vtB4SQNZA7HDFFN87PwGxVT4OT0P6oM3LAXE5SjXdg"

# All 10 articles with their original deposition IDs and PDF filenames
ARTICLES = [
    {
        "index": 1,
        "orig_dep_id": 23575604,
        "already_new_id": 23650839,
        "new_doi": "10.5281/zenodo.23650839",
        "slug": "youth-citizenship-digital-activism-and-electoral-mobilisation-ahead-of-nigeria-s",
        "filename": "youth-citizenship-digital-activism-and-electoral-mobilisation-ahead-of-nigeria-s.pdf",
    },
    {
        "index": 2,
        "orig_dep_id": 23575616,
        "slug": "youthwashing-as-political-performance-in-the-digital-age-discursive-construction",
        "filename": "youthwashing-as-political-performance-in-the-digital-age-discursive-construction.pdf",
    },
    {
        "index": 3,
        "orig_dep_id": 23575618,
        "slug": "framing-electoral-credibility-on-x-public-discourse-on-real-time-result-transmis",
        "filename": "framing-electoral-credibility-on-x-public-discourse-on-real-time-result-transmis.pdf",
    },
    {
        "index": 4,
        "orig_dep_id": 23575620,
        "slug": "digital-mobilisation-vs-youth-apathy-a-documentary-analysis-of-inec-s-strategic",
        "filename": "digital-mobilisation-vs-youth-apathy-a-documentary-analysis-of-inec-s-strategic.pdf",
    },
    {
        "index": 5,
        "orig_dep_id": 23575622,
        "slug": "curated-media-broadcast-news-editors-views-of-political-media-briefings-on-2027",
        "filename": "curated-media-broadcast-news-editors-views-of-political-media-briefings-on-2027.pdf",
    },
    {
        "index": 6,
        "orig_dep_id": 23575626,
        "slug": "singing-truth-to-power-musical-skits-digital-performance-and-political-accountab",
        "filename": "singing-truth-to-power-musical-skits-digital-performance-and-political-accountab.pdf",
    },
    {
        "index": 7,
        "orig_dep_id": 23575630,
        "slug": "electorates-responses-to-ai-generated-and-human-created-campaign-messages-in-sou",
        "filename": "electorates-responses-to-ai-generated-and-human-created-campaign-messages-in-sou.pdf",
    },
    {
        "index": 8,
        "orig_dep_id": 23575634,
        "slug": "artificial-intelligence-ai-and-the-2027-elections-comparing-urban-and-rural-vote",
        "filename": "artificial-intelligence-ai-and-the-2027-elections-comparing-urban-and-rural-vote.pdf",
    },
    {
        "index": 9,
        "orig_dep_id": 23575638,
        "slug": "electoral-propaganda-and-public-opinion-formation-in-nigeria-s-fourth-republic-a",
        "filename": "electoral-propaganda-and-public-opinion-formation-in-nigeria-s-fourth-republic-a.pdf",
    },
    {
        "index": 10,
        "orig_dep_id": 23575645,
        "slug": "setting-the-2027-agenda-re-examining-the-discourse-on-good-governance-and-the-ni",
        "filename": "setting-the-2027-agenda-re-examining-the-discourse-on-good-governance-and-the-ni.pdf",
    },
]

def make_request(url, data=None, headers=None, method="GET"):
    req_headers = {
        "Authorization": f"Bearer {TOKEN}",
        "User-Agent": "UNILAG-Communication-Review/1.0",
    }
    if headers:
        req_headers.update(headers)
    req = urllib.request.Request(url, data=data, headers=req_headers, method=method)
    with urllib.request.urlopen(req) as resp:
        if resp.status == 204:
            return None
        return json.loads(resp.read().decode("utf-8"))

results = []

for item in ARTICLES:
    idx = item["index"]
    orig_id = item["orig_dep_id"]
    filename = item["filename"]
    pdf_path = os.path.join("uploads", "published", filename)

    if not os.path.exists(pdf_path):
        print(f"[{idx}] ERROR: PDF not found at {pdf_path}")
        continue

    file_size = os.path.getsize(pdf_path)
    print(f"\n========================================================")
    print(f"[{idx}/10] Processing {filename} ({file_size / 1024:.1f} KB)...")

    if item.get("already_new_id"):
        new_doi = item["new_doi"]
        print(f"  -> Already uploaded and published: {new_doi}")
        results.append({
            "index": idx,
            "orig_id": orig_id,
            "new_id": item["already_new_id"],
            "new_doi": new_doi,
            "slug": item["slug"],
        })
        continue

    try:
        # Step 1: Create new version draft
        print(f"  1. Creating new version of deposition {orig_id}...")
        nv_res = make_request(
            f"https://zenodo.org/api/deposit/depositions/{orig_id}/actions/newversion",
            data=b"",
            method="POST",
        )
        new_dep_id = nv_res.get("links", {}).get("latest_draft", "").split("/")[-1]
        print(f"     Draft created: {new_dep_id}")

        # Step 2: Get draft details (files & bucket)
        draft = make_request(f"https://zenodo.org/api/deposit/depositions/{new_dep_id}")
        bucket_url = draft.get("links", {}).get("bucket")
        existing_files = draft.get("files", [])
        print(f"     Found {len(existing_files)} existing file(s) in draft.")

        # Step 3: Delete existing file(s) from draft
        for f in existing_files:
            fid = f.get("id")
            fname = f.get("filename")
            print(f"     Deleting old file {fname} ({fid})...")
            make_request(
                f"https://zenodo.org/api/deposit/depositions/{new_dep_id}/files/{fid}",
                method="DELETE",
            )

        # Step 4: Upload new full typeset PDF to bucket
        print(f"  2. Uploading new PDF ({file_size / 1024:.1f} KB) to bucket...")
        with open(pdf_path, "rb") as f:
            pdf_bytes = f.read()

        upload_res = make_request(
            f"{bucket_url}/{filename}",
            data=pdf_bytes,
            headers={"Content-Type": "application/octet-stream"},
            method="PUT",
        )
        uploaded_size = upload_res.get("size")
        print(f"     Uploaded successfully! Size on Zenodo: {uploaded_size} bytes")

        # Step 5: Publish new version
        print(f"  3. Publishing new version on Zenodo...")
        pub_res = make_request(
            f"https://zenodo.org/api/deposit/depositions/{new_dep_id}/actions/publish",
            data=b"",
            method="POST",
        )
        pub_doi = pub_res.get("doi")
        concept_doi = pub_res.get("conceptdoi")
        print(f"     SUCCESS! Published DOI: {pub_doi} (Concept: {concept_doi})")

        results.append({
            "index": idx,
            "orig_id": orig_id,
            "new_id": new_dep_id,
            "new_doi": pub_doi,
            "concept_doi": concept_doi,
            "slug": item["slug"],
        })

        time.sleep(1) # Be gentle with rate limits

    except Exception as e:
        print(f"  ❌ Error processing {filename}: {e}")

print("\n\n========================================================")
print("FINAL RESULTS OF ZENODO FULL PDF UPDATE:")
print(json.dumps(results, indent=2))

with open("data/zenodo_updated_dois.json", "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2)
