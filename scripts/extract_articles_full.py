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

# Load existing real-articles.json metadata
with open('data/real-articles.json', 'r', encoding='utf-8') as f:
    real_articles = json.load(f)

# The 10 article start indices in body children
# We found these earlier by exact title match
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
    # Normalize unicode spaces
    t = t.replace('\u00a0', ' ').replace('\u202f', ' ')
    # Clean whitespace
    t = re.sub(r'[ \t]+', ' ', t).strip()
    return t

def format_markdown_table(tbl: Table) -> list:
    lines = []
    if not tbl.rows:
        return lines
    
    # Extract clean text for all cells
    grid = []
    for r in tbl.rows:
        row_cells = [clean_text(cell.text).replace('\n', ' ').replace('|', '/') for cell in r.cells]
        grid.append(row_cells)
    
    if not grid or not grid[0]:
        return lines
    
    num_cols = len(grid[0])
    # Header
    header_line = "| " + " | ".join(grid[0]) + " |"
    sep_line = "| " + " | ".join(["---"] * num_cols) + " |"
    lines.append(header_line)
    lines.append(sep_line)
    
    for r in grid[1:]:
        # pad row if cols mismatch
        if len(r) < num_cols:
            r += [""] * (num_cols - len(r))
        elif len(r) > num_cols:
            r = r[:num_cols]
        lines.append("| " + " | ".join(r) + " |")
        
    return lines

print("Extracting elements per article...")

articles_data = []

for a_idx in range(10):
    start_child = article_starts[a_idx][0]
    end_child = article_starts[a_idx + 1][0]
    orig_meta = real_articles[a_idx]
    
    body_elements = []
    table_count = 0
    img_count = 0
    
    # We skip title, authors, affiliations, abstract, keywords, and references from the body flow
    # because they are stored in separate dedicated metadata fields.
    # We want bodyParagraphs to hold the complete body: Headings, Sections, Tables, and Figures.
    
    in_abstract = False
    in_references = False
    past_metadata = False
    
    children_slice = doc.element.body[start_child:end_child]
    
    for c_idx, child in enumerate(children_slice):
        if child.tag.endswith('p'):
            p = Paragraph(child, doc)
            raw_text = clean_text(p.text)
            
            # Check for images in paragraph
            blips = child.xpath('.//a:blip')
            if blips:
                for b in blips:
                    rId = b.attrib.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed')
                    if rId and rId in doc.part.rels:
                        target_ref = doc.part.rels[rId].target_ref
                        filename = os.path.basename(target_ref)
                        img_count += 1
                        # If raw_text is caption or empty
                        caption = raw_text if raw_text else f"Figure {img_count}"
                        body_elements.append(f"![{caption}](/images/articles/{filename})")
                continue
            
            if not raw_text:
                continue
                
            upper = raw_text.upper()
            
            # Detect start of abstract
            if upper.startswith("ABSTRACT"):
                in_abstract = True
                continue
            if in_abstract and (upper.startswith("KEYWORDS:") or upper.startswith("KEY WORDS:") or upper.startswith("KEYWORDS")):
                in_abstract = False
                past_metadata = True
                continue
            if in_abstract:
                # Still inside abstract paragraphs
                continue
                
            # If we haven't passed metadata yet (title, authors, emails, ORCID before Introduction)
            if not past_metadata:
                if any(w in upper for w in ["INTRODUCTION", "BACKGROUND", "1. INTRODUCTION", "OVERVIEW"]):
                    past_metadata = True
                else:
                    # Check if it's author line, affiliation line, email, or ORCID
                    if any(w in upper for w in ["ORCID", "EMAIL", "CORRESPONDENCE", "DEPARTMENT OF", "FACULTY OF", "UNIVERSITY OF", "LAGOS", "IBADAN"]):
                        continue
                    if c_idx < 15 and len(raw_text) < 150:
                        # Likely title or author info before Introduction
                        continue
            
            # Detect references section
            if upper == "REFERENCES" or upper.startswith("REFERENCES:") or upper.startswith("BIBLIOGRAPHY"):
                in_references = True
                continue
            if in_references:
                # Skip references from bodyParagraphs since they are in article.references
                continue
                
            # Detect headings
            is_heading = False
            if p.style.name.startswith("Heading"):
                is_heading = True
            elif len(raw_text) < 120 and (raw_text.isupper() or p.runs and all(r.bold for r in p.runs if r.text.strip())):
                if not raw_text.startswith("Table") and not raw_text.startswith("Figure") and not raw_text.startswith("Source:"):
                    is_heading = True
            elif re.match(r'^(Introduction|Research Gap|Theoretical Framework|Literature Review|Methodology|Methods|Findings|Discussion|Conclusion|Policy Recommendations|Appendix)\b', raw_text, re.I):
                if len(raw_text) < 80:
                    is_heading = True
                    
            if is_heading:
                clean_heading = raw_text.title() if raw_text.isupper() else raw_text
                body_elements.append(f"## {clean_heading}")
            else:
                body_elements.append(raw_text)
                
        elif child.tag.endswith('tbl'):
            table_count += 1
            tbl = Table(child, doc)
            md_table_lines = format_markdown_table(tbl)
            for line in md_table_lines:
                body_elements.append(line)
    
    print(f"Article {a_idx+1}: {orig_meta['title'][:40]} -> {len(body_elements)} elements ({table_count} tables, {img_count} figures)")

