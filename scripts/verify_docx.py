import docx
import re
import sys

doc = docx.Document("UNILAG_Communication_Review_Platform_Documentation.docx")
em_dash_found = 0
emoji_found = 0
emoji_pattern = re.compile("[\U00010000-\U0010ffff\u2600-\u27bf\u2300-\u23ff\u2b50\u2b55\u200d\ufe0f\u2700-\u27bf\u2b00-\u2bff\u2190-\u21ff]")

def inspect(text):
    global em_dash_found, emoji_found
    if "\u2014" in text or "\u2013" in text:
        em_dash_found += 1
        print("Found dash in:", repr(text[:60]))
    if emoji_pattern.search(text):
        emoji_found += 1
        print("Found emoji in:", repr(text[:60]))

for p in doc.paragraphs:
    inspect(p.text)

for t in doc.tables:
    for row in t.rows:
        for cell in row.cells:
            for p in cell.paragraphs:
                inspect(p.text)

for s in doc.sections:
    for p in s.header.paragraphs:
        inspect(p.text)
    for p in s.footer.paragraphs:
        inspect(p.text)

print(f"Total paragraphs and cells checked.")
print(f"Em-dashes / en-dashes found: {em_dash_found}")
print(f"Emojis found: {emoji_found}")

if em_dash_found > 0 or emoji_found > 0:
    print("FAILED verification!")
    sys.exit(1)
else:
    print("PASSED: 100% compliant with zero em-dashes and zero emojis.")
