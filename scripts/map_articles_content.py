import docx
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

DOCX_PATH = "Clean Copies of UNILAG Communication Review Journal Articles .docx"
doc = docx.Document(DOCX_PATH)
body = doc.element.body
children = body.xpath('./w:p | ./w:tbl')

article_starts = [
    (0, 1),
    (291, 2),
    (482, 3),
    (787, 4),
    (1004, 5),
    (1181, 6),
    (1383, 7),
    (1602, 8),
    (1786, 9),
    (1918, 10),
    (len(children), 11)
]

def get_article_id(idx):
    for i in range(len(article_starts) - 1):
        if article_starts[i][0] <= idx < article_starts[i+1][0]:
            return article_starts[i][1]
    return 10

article_elements = {i: {"tables": [], "images": []} for i in range(1, 11)}

table_count = 0
for idx, child in enumerate(children):
    art_id = get_article_id(idx)
    if child.tag.endswith('tbl'):
        table_count += 1
        # Extract table data
        rows_data = []
        for row in child.xpath('./w:tr'):
            cells_data = []
            for cell in row.xpath('./w:tc'):
                cell_text = "".join(cell.itertext()).strip().replace('\n', ' ')
                cells_data.append(cell_text)
            rows_data.append(cells_data)
        
        # Look at previous paragraph for table title/caption
        caption = ""
        if idx > 0 and children[idx-1].tag.endswith('p'):
            caption = "".join(children[idx-1].itertext()).strip()
        
        article_elements[art_id]["tables"].append({
            "table_global_id": table_count,
            "child_idx": idx,
            "caption": caption,
            "rows": len(rows_data),
            "cols": len(rows_data[0]) if rows_data else 0,
            "sample_header": rows_data[0] if rows_data else [],
            "sample_row": rows_data[1] if len(rows_data) > 1 else []
        })
    elif child.tag.endswith('p'):
        blips = child.xpath('.//a:blip')
        if blips:
            rIds = [b.attrib.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed') for b in blips]
            targets = [doc.part.rels[r].target_ref for r in rIds if r in doc.part.rels]
            p_text = "".join(child.itertext()).strip()
            # check adjacent paragraph for caption
            adj_p = ""
            if idx + 1 < len(children) and children[idx+1].tag.endswith('p'):
                adj_p = "".join(children[idx+1].itertext()).strip()
            prev_p = ""
            if idx > 0 and children[idx-1].tag.endswith('p'):
                prev_p = "".join(children[idx-1].itertext()).strip()
            
            article_elements[art_id]["images"].append({
                "child_idx": idx,
                "targets": targets,
                "p_text": p_text,
                "prev_p": prev_p,
                "next_p": adj_p
            })

print("\n=== SUMMARY PER ARTICLE ===")
for i in range(1, 11):
    info = article_elements[i]
    print(f"\n--- Article {i} ---")
    print(f"Tables: {len(info['tables'])}")
    for t in info['tables']:
        print(f"  [Table {t['table_global_id']}] ({t['rows']}x{t['cols']}) Cap: '{t['caption'][:60]}' | Hdr: {t['sample_header'][:3]}")
    print(f"Images/Figures: {len(info['images'])} paragraphs with images")
    for img in info['images'][:5]: # sample first 5
        print(f"  [Img at {img['child_idx']}] Targets: {img['targets']} | Next: '{img['next_p'][:50]}' | Prev: '{img['prev_p'][:50]}'")
    if len(info['images']) > 5:
        print(f"  ... and {len(info['images']) - 5} more image paragraphs")
