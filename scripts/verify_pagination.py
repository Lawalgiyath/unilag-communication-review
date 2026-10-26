import os, pypdf, json

with open('data/real-articles.json', 'r', encoding='utf-8') as f:
    articles = json.load(f)

print('=== Verifying All 10 Article PDFs ===')
all_ok = True
expected_start = 1

for i, a in enumerate(articles):
    slug = a['slug']
    fp = a['firstPage']
    lp = a['lastPage']
    pdf_path = os.path.join('uploads', 'published', f'{slug}.pdf')
    reader = pypdf.PdfReader(pdf_path)
    page_count = len(reader.pages)
    
    # Check page span
    expected_lp = fp + page_count - 1
    p1_text = reader.pages[0].extract_text()
    
    # Check header
    expected_header = f'pp. {fp}-{lp}'
    has_header = expected_header in p1_text
    
    print(f'Article {i+1}: {slug[:35]}...')
    print(f'  Assigned: pp. {fp}-{lp} | PDF pages: {page_count}')
    print(f'  Header has \"{expected_header}\": {has_header}')
    print(f'  Sequential check: {fp} == {expected_start}: {fp == expected_start}')
    print(f'  Page count check: {lp} == {expected_lp}: {lp == expected_lp}')
    
    if fp != expected_start or lp != expected_lp or not has_header:
        all_ok = False
        print('  ERROR DETECTED!')
        
    expected_start = lp + 1

print(f'\nTotal issue pages: {expected_start - 1}')
print(f'ALL CHECKS PASSED: {all_ok}')
