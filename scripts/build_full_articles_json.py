import docx
import json
import os
import re
import sys
from docx.table import Table
from docx.text.paragraph import Paragraph

sys.stdout.reconfigure(encoding='utf-8')

DOCX_PATH = "Clean Copies of UNILAG Communication Review Journal Articles .docx"
doc = docx.Document(DOCX_PATH)

with open('data/real-articles.json', 'r', encoding='utf-8') as f:
    real_articles = json.load(f)

article_starts = [
    (0, 0),       # Article 1
    (291, 1),     # Article 2
    (482, 2),     # Article 3
    (787, 3),     # Article 4
    (1004, 4),    # Article 5
    (1181, 5),    # Article 6
    (1383, 6),    # Article 7
    (1602, 7),    # Article 8
    (1786, 8),    # Article 9
    (1918, 9),    # Article 10
    (len(doc.element.body), 10)
]

def clean_text(t: str) -> str:
    if not t:
        return ""
    # NO EM DASHES or EN DASHES constraint: replace with standard hyphen
    t = t.replace('\u2014', ' - ').replace('\u2013', ' - ')
    # Normalize unicode quotes
    t = t.replace('\u2018', "'").replace('\u2019', "'")
    t = t.replace('\u201c', '"').replace('\u201d', '"')
    # Normalize spaces
    t = t.replace('\u00a0', ' ').replace('\u202f', ' ')
    # Clean whitespace
    t = re.sub(r'[ \t]+', ' ', t).strip()
    return t

def format_markdown_table(tbl: Table) -> list:
    lines = []
    if not tbl.rows:
        return lines
    
    grid = []
    for r in tbl.rows:
        row_cells = [clean_text(cell.text).replace('\n', ' ').replace('|', '/') for cell in r.cells]
        grid.append(row_cells)
    
    if not grid or not grid[0]:
        return lines
    
    num_cols = len(grid[0])
    header_line = "| " + " | ".join(grid[0]) + " |"
    sep_line = "| " + " | ".join(["---"] * num_cols) + " |"
    lines.append(header_line)
    lines.append(sep_line)
    
    for r in grid[1:]:
        if len(r) < num_cols:
            r += [""] * (num_cols - len(r))
        elif len(r) > num_cols:
            r = r[:num_cols]
        lines.append("| " + " | ".join(r) + " |")
        
    return lines

updated_articles = []

for a_idx in range(10):
    start_child = article_starts[a_idx][0]
    end_child = article_starts[a_idx + 1][0]
    art = dict(real_articles[a_idx])
    
    # Clean author names: remove PhD / Ph.D. from title and author name strings
    cleaned_authors = []
    for au in art.get('authors', []):
        au_copy = dict(au)
        # Strip Ph.D. from title
        t = (au_copy.get('title') or '').strip()
        if re.match(r'^(ph\.?\s?d\.?|d\.?\s?phil\.?)$', t, re.I):
            au_copy['title'] = None
        # Clean first and last names
        au_copy['firstName'] = clean_text(au_copy.get('firstName', ''))
        au_copy['lastName'] = clean_text(au_copy.get('lastName', ''))
        # Strip trailing Ph.D. if present in lastName
        au_copy['lastName'] = re.sub(r',?\s+ph\.?d\.?$', '', au_copy['lastName'], flags=re.I).strip()
        au_copy['affiliation'] = clean_text(au_copy.get('affiliation', ''))
        cleaned_authors.append(au_copy)
    art['authors'] = cleaned_authors
    
    # Clean abstract and title
    art['title'] = clean_text(art.get('title', ''))
    art['abstract'] = clean_text(art.get('abstract', ''))
    art['keywords'] = [clean_text(k) for k in art.get('keywords', [])]
    
    # Extract complete body elements
    body_elements = []
    children_slice = doc.element.body[start_child:end_child]
    
    in_abstract = False
    in_references = False
    past_metadata = False
    fig_counter = 0
    
    for c_idx, child in enumerate(children_slice):
        if child.tag.endswith('p'):
            p = Paragraph(child, doc)
            raw_text = clean_text(p.text)
            
            # Check for images in this paragraph
            blips = child.xpath('.//a:blip')
            if blips:
                for b in blips:
                    rId = b.attrib.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed')
                    if rId and rId in doc.part.rels:
                        target_ref = doc.part.rels[rId].target_ref
                        filename = os.path.basename(target_ref)
                        fig_counter += 1
                        
                        # Check next paragraph for a Figure caption
                        caption = ""
                        if c_idx + 1 < len(children_slice) and children_slice[c_idx + 1].tag.endswith('p'):
                            next_text = clean_text(Paragraph(children_slice[c_idx + 1], doc).text)
                            if next_text.startswith("Figure ") or next_text.startswith("Fig."):
                                caption = next_text
                        if not caption:
                            caption = raw_text if raw_text else f"Figure {fig_counter}"
                            
                        body_elements.append(f"![{caption}](/images/articles/{filename})")
                continue
                
            if not raw_text:
                continue
                
            upper = raw_text.upper()
            
            # Skip if this paragraph was already consumed as the caption of the previous figure
            if (raw_text.startswith("Figure ") or raw_text.startswith("Fig.")) and body_elements and body_elements[-1].startswith("!["):
                if raw_text in body_elements[-1]:
                    continue
            
            # Detect start of abstract
            if upper.startswith("ABSTRACT"):
                in_abstract = True
                continue
            if in_abstract and (upper.startswith("KEYWORDS:") or upper.startswith("KEY WORDS:") or upper.startswith("KEYWORDS")):
                in_abstract = False
                past_metadata = True
                continue
            if in_abstract:
                continue
                
            if not past_metadata:
                if any(w in upper for w in ["INTRODUCTION", "BACKGROUND", "1. INTRODUCTION", "OVERVIEW"]):
                    past_metadata = True
                else:
                    if any(w in upper for w in ["ORCID", "EMAIL", "CORRESPONDENCE", "DEPARTMENT OF", "FACULTY OF", "UNIVERSITY OF", "LAGOS", "IBADAN"]):
                        continue
                    if c_idx < 15 and len(raw_text) < 150:
                        continue
            
            if upper == "REFERENCES" or upper.startswith("REFERENCES:") or upper.startswith("BIBLIOGRAPHY"):
                in_references = True
                continue
            if in_references:
                continue
                
            # Detect headings
            is_heading = False
            if p.style.name.startswith("Heading"):
                is_heading = True
            elif len(raw_text) < 100 and (raw_text.isupper() or (p.runs and all(r.bold for r in p.runs if r.text.strip()))):
                if not raw_text.startswith("Table") and not raw_text.startswith("Figure") and not raw_text.startswith("Source:"):
                    is_heading = True
            elif re.match(r'^(Introduction|Research Gap|Theoretical Framework|Literature Review|Methodology|Methods|Findings and Analysis|Findings|Discussion|Conclusion|Policy Recommendations|Appendix)\b', raw_text, re.I):
                if len(raw_text) < 80:
                    is_heading = True
                    
            if is_heading:
                clean_heading = raw_text.title() if raw_text.isupper() else raw_text
                body_elements.append(f"## {clean_heading}")
            else:
                body_elements.append(raw_text)
                
        elif child.tag.endswith('tbl'):
            tbl = Table(child, doc)
            md_table_lines = format_markdown_table(tbl)
            for line in md_table_lines:
                body_elements.append(line)
                
    # Trim any items before the first heading (e.g. stray title or author text before ## Introduction)
    first_heading_idx = 0
    for idx, el in enumerate(body_elements):
        if el.startswith("## "):
            first_heading_idx = idx
            break
    body_elements = body_elements[first_heading_idx:]

    art['bodyParagraphs'] = body_elements
    
    # Clean references as well (no em-dashes)
    if 'references' in art:
        art['references'] = [
            {"order": i+1, "text": clean_text(r if isinstance(r, str) else r.get('text', ''))}
            for i, r in enumerate(art['references'])
        ]
        
    updated_articles.append(art)

# Write updated real-articles.json
with open('data/real-articles.json', 'w', encoding='utf-8') as f:
    json.dump(updated_articles, f, indent=2, ensure_ascii=False)

print("Saved updated data/real-articles.json")

# Now generate prisma/seed-data.ts
ts_code = []
ts_code.append('/**')
ts_code.append(' * Real articles for UNILAG Communication Review')
ts_code.append(" * Special Issue: Platforms, Power, and Polls: Perspectives Ahead of Nigeria's 2027 General Elections")
ts_code.append(' * Volume 9, Number 2 (2026)')
ts_code.append(' * Extracted from faculty-approved clean manuscripts with full tables and figures.')
ts_code.append(' */\n')

ts_code.append('export interface SeedAuthor {')
ts_code.append('  first: string;')
ts_code.append('  last: string;')
ts_code.append('  title?: string | null;')
ts_code.append('  email?: string | null;')
ts_code.append('  affiliation: string;')
ts_code.append('  orcid?: string | null;')
ts_code.append('  corresponding?: boolean;')
ts_code.append('}\n')

ts_code.append('export interface SeedArticle {')
ts_code.append('  title: string;')
ts_code.append('  slug: string;')
ts_code.append('  type: "RESEARCH_ARTICLE" | "REVIEW_ARTICLE" | "COMMENTARY" | "BOOK_REVIEW";')
ts_code.append('  authors: SeedAuthor[];')
ts_code.append('  abstract: string;')
ts_code.append('  keywords: string[];')
ts_code.append('  doi: string;')
ts_code.append('  firstPage: number;')
ts_code.append('  lastPage: number;')
ts_code.append('  bodyParagraphs: string[];')
ts_code.append('  references: string[];')
ts_code.append('}\n')

ts_code.append('export const SPECIAL_ISSUE_TITLE = "Platforms, Power, and Polls: Perspectives Ahead of Nigeria\'s 2027 General Elections";')
ts_code.append('export const SPECIAL_ISSUE_VOLUME = 9;')
ts_code.append('export const SPECIAL_ISSUE_NUMBER = 2;')
ts_code.append('export const SPECIAL_ISSUE_YEAR = 2026;\n')

ts_code.append('export const REAL_ARTICLES: SeedArticle[] = [')

for a in updated_articles:
    ts_code.append('  {')
    ts_code.append(f'    "title": {json.dumps(a["title"])},')
    ts_code.append(f'    "slug": {json.dumps(a["slug"])},')
    ts_code.append(f'    "type": {json.dumps(a["type"])},')
    ts_code.append(f'    "doi": {json.dumps(a["doi"])},')
    ts_code.append(f'    "firstPage": {a["firstPage"]},')
    ts_code.append(f'    "lastPage": {a["lastPage"]},')
    ts_code.append(f'    "abstract": {json.dumps(a["abstract"])},')
    
    # authors
    ts_code.append('    "authors": [')
    for au in a['authors']:
        au_dict = {
            "first": au["firstName"],
            "last": au["lastName"],
            "title": au.get("title") or None,
            "affiliation": au["affiliation"],
            "email": au.get("email"),
            "orcid": au.get("orcid"),
            "corresponding": au.get("isCorresponding", False)
        }
        ts_code.append(f'      {json.dumps(au_dict)},')
    ts_code.append('    ],')
    
    # keywords
    ts_code.append(f'    "keywords": {json.dumps(a["keywords"])},')
    
    # bodyParagraphs
    ts_code.append(f'    "bodyParagraphs": {json.dumps(a["bodyParagraphs"])},')
    
    # references as string[]
    ref_strings = [r["text"] if isinstance(r, dict) else str(r) for r in a.get("references", [])]
    ts_code.append(f'    "references": {json.dumps(ref_strings)}')
    
    ts_code.append('  },')

ts_code.append('];\n')

ts_code.append('export const SEED_ARTICLES: SeedArticle[][] = [REAL_ARTICLES];\n')
ts_code.append('export function buildBodyParagraphs(art: SeedArticle): string[] {')
ts_code.append('  return art.bodyParagraphs || [];')
ts_code.append('}\n')

with open('prisma/seed-data.ts', 'w', encoding='utf-8') as f:
    f.write('\n'.join(ts_code))

print("Saved updated prisma/seed-data.ts")
