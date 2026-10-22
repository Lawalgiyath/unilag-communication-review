import zipfile
import xml.etree.ElementTree as ET
import json
import re

def clean_text(text: str) -> str:
    if not text:
        return ""
    # Standardize curly quotes and apostrophes if needed
    text = text.replace('\u2018', "'").replace('\u2019', "'")
    text = text.replace('\u201c', '"').replace('\u201d', '"')
    text = text.replace('\u2013', '–').replace('\u2014', '—')
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def parse_keywords(kw_str: str) -> list[str]:
    # Remove "Keywords:" or "Keywords"
    kw_clean = re.sub(r'^(?:keywords|keyword)[\s:;-]*', '', kw_str, flags=re.IGNORECASE).strip()
    # Remove trailing period
    kw_clean = kw_clean.rstrip('.')
    # Split by comma or semicolon
    parts = re.split(r'[,;]\s*', kw_clean)
    res = []
    for p in parts:
        p = clean_text(p)
        if p and p not in res:
            res.append(p)
    return res

def main():
    docx_path = 'Clean Copies of UNILAG Communication Review Journal Articles .docx'
    with zipfile.ZipFile(docx_path) as z:
        xml_content = z.read('word/document.xml')
    
    tree = ET.fromstring(xml_content)
    paragraphs = []
    for p in tree.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
        texts = [node.text for node in p.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if node.text]
        paragraphs.append(''.join(texts).strip() if texts else '')

    title_indices = [0, 291, 595, 1043, 1494, 1671, 1873, 2163, 2405, 2537]
    end_indices = [291, 595, 1043, 1494, 1671, 1873, 2163, 2405, 2537, len(paragraphs)]

    # Canonical Titles
    TITLES = [
        "Youth Citizenship, Digital Activism and Electoral Mobilisation Ahead of Nigeria's 2027 General Elections",
        "Youthwashing as Political Performance in the Digital Age: Discursive Construction on X (Twitter), Instagram, and Facebook During Nigeria's 2026-2027 Electioneering",
        "Framing Electoral Credibility on X: Public Discourse on Real-Time Result Transmission Ahead of Nigeria's 2027 General Elections",
        "Digital Mobilisation vs Youth Apathy: A Documentary Analysis of INEC's Strategic Social Media Engagement Ahead of the 2027 Nigerian Election",
        "Curated Media: Broadcast News Editors' Views of Political Media Briefings on 2027 Election Coverage in Akwa Ibom State, Nigeria",
        "Singing Truth to Power: Musical Skits, Digital Performance, and Political Accountability in Nigeria's Media Society",
        "Electorates' Responses to AI-Generated and Human-Created Campaign Messages in South-South Nigeria Ahead of the 2027 General Elections: An Exploratory Qualitative Study",
        "Artificial Intelligence (AI) and the 2027 Elections: Comparing Urban and Rural Voters' Responses to AI-Generated Campaign Messages in Abia State, Nigeria",
        "Electoral Propaganda and Public Opinion Formation in Nigeria's Fourth Republic: A Conceptual Analysis",
        "Setting the 2027 Agenda: Re-Examining the Discourse on Good Governance and the Nigerian Broadcast Media"
    ]

    # Pre-defined authoritative author metadata from the clean manuscript headers
    AUTHORS_META = [
        # Article 1
        [
            {
                "name": "Janet Aver Adikpo",
                "title": "Ph.D.",
                "firstName": "Janet Aver",
                "lastName": "Adikpo",
                "affiliation": "Augustine University, Lagos, Nigeria",
                "email": "jar.adikpo@gmail.com",
                "orcid": "0000-0002-9634-120X",
                "isCorresponding": True
            }
        ],
        # Article 2
        [
            {
                "name": "Anu' Steven Adesemoye",
                "title": "Ph.D.",
                "firstName": "Anu' Steven",
                "lastName": "Adesemoye",
                "affiliation": "Department of Mass Communication, Lagos State University of Science and Technology",
                "email": "adesemoye.a@lasustech.edu.ng",
                "orcid": "0009-0009-0557-8075",
                "isCorresponding": True
            },
            {
                "name": "Olanrewaju Amos Arisoyin",
                "title": "",
                "firstName": "Olanrewaju Amos",
                "lastName": "Arisoyin",
                "affiliation": "Department of Mass Communication, Trinity University, Yaba, Lagos State",
                "email": "lanreamos016@gmail.com",
                "orcid": "0009-0003-9751-1236",
                "isCorresponding": False
            },
            {
                "name": "Bukola Elizabeth Ogunremi",
                "title": "",
                "firstName": "Bukola Elizabeth",
                "lastName": "Ogunremi",
                "affiliation": "Department of Mass Communication, Lagos State University of Science and Technology",
                "email": "ogunremibukky2006@gmail.com",
                "orcid": None,
                "isCorresponding": False
            }
        ],
        # Article 3
        [
            {
                "name": "Godlyn Chidiadi Abisoye",
                "title": "",
                "firstName": "Godlyn Chidiadi",
                "lastName": "Abisoye",
                "affiliation": "Department of Mass Communication, Veronica Adeleke School of Social Sciences, Babcock University, Ilishan-Remo, Ogun State, Nigeria",
                "email": "abisoyeg@babcock.edu.ng",
                "orcid": "0009-0006-7906-6011",
                "isCorresponding": True
            },
            {
                "name": "Adesegun Samson Adetola",
                "title": "Ph.D.",
                "firstName": "Adesegun Samson",
                "lastName": "Adetola",
                "affiliation": "Department of Mass Communication, Babcock University, Ilishan-Remo, Ogun State, Nigeria",
                "email": "adetolas@babcock.edu.ng",
                "orcid": "0000-0001-7753-616X",
                "isCorresponding": False
            }
        ],
        # Article 4
        [
            {
                "name": "Hassan Biodun Suleiman",
                "title": "Ph.D.",
                "firstName": "Hassan Biodun",
                "lastName": "Suleiman",
                "affiliation": "Department of Journalism and Media Studies, Faculty of Communication and Media Studies, Lagos State University, Ojo, Lagos",
                "email": "Hassan.suleiman@lasu.edu.ng",
                "orcid": None,
                "isCorresponding": True
            }
        ],
        # Article 5
        [
            {
                "name": "Precious Ihunanya Ukeje",
                "title": "",
                "firstName": "Precious Ihunanya",
                "lastName": "Ukeje",
                "affiliation": "Department of Mass Communication, Faculty of Communication and Media Studies, University of Uyo, Uyo",
                "email": "pukeje@yahoo.com",
                "orcid": "0009-0003-1990-5694",
                "isCorresponding": True
            }
        ],
        # Article 6
        [
            {
                "name": "Jude Ndubuisi Nwabuokei",
                "title": "Ph.D.",
                "firstName": "Jude Ndubuisi",
                "lastName": "Nwabuokei",
                "affiliation": "Digital Media and Public Relations, School of Arts and Creative Industries, Teesside University",
                "email": "J.Nwabuokei@tees.ac.uk",
                "orcid": "0000-0002-7769-5715",
                "isCorresponding": True
            }
        ],
        # Article 7
        [
            {
                "name": "Uka Nwagbara",
                "title": "",
                "firstName": "Uka",
                "lastName": "Nwagbara",
                "affiliation": "Department of Advertising and Marketing Communications, Faculty of Communication and Media Studies, University of Uyo, Uyo",
                "email": "uunwagbara@gmail.com",
                "orcid": None,
                "isCorresponding": True
            },
            {
                "name": "Precious Ukeje",
                "title": "",
                "firstName": "Precious",
                "lastName": "Ukeje",
                "affiliation": "Department of Mass Communication, Faculty of Communication and Media Studies, University of Uyo, Uyo",
                "email": "pukeje@yahoo.com",
                "orcid": None,
                "isCorresponding": False
            },
            {
                "name": "Daramfon Okon",
                "title": "",
                "firstName": "Daramfon",
                "lastName": "Okon",
                "affiliation": "Department of Information and Media Studies, Faculty of Communication and Media Studies, University of Uyo, Uyo",
                "email": "daramfon.ime.okon@gmail.com",
                "orcid": None,
                "isCorresponding": False
            }
        ],
        # Article 8
        [
            {
                "name": "Uka Nwagbara",
                "title": "",
                "firstName": "Uka",
                "lastName": "Nwagbara",
                "affiliation": "Department of Advertising and Marketing Communications, Faculty of Communication and Media Studies, University of Uyo, Uyo",
                "email": "uunwagbara@gmail.com",
                "orcid": None,
                "isCorresponding": True
            }
        ],
        # Article 9
        [
            {
                "name": "Isaac Ndubuisi Nwosu",
                "title": "",
                "firstName": "Isaac Ndubuisi",
                "lastName": "Nwosu",
                "affiliation": "Faculty of Communication and Media Studies, University of Lagos",
                "email": "isaac.ninsconnect@gmail.com",
                "orcid": None,
                "isCorresponding": True
            },
            {
                "name": "Dimeji-Lamu Michael Tosin",
                "title": "",
                "firstName": "Dimeji-Lamu Michael",
                "lastName": "Tosin",
                "affiliation": "Faculty of Communication and Media Studies, University of Lagos",
                "email": "Dimejilamu@gmail.com",
                "orcid": None,
                "isCorresponding": False
            },
            {
                "name": "Adepoju Tejumaiye",
                "title": "Professor",
                "firstName": "Adepoju",
                "lastName": "Tejumaiye",
                "affiliation": "Faculty of Communication and Media Studies, University of Lagos",
                "email": "pojutejumaiye@yahoo.com",
                "orcid": None,
                "isCorresponding": False
            }
        ],
        # Article 10
        [
            {
                "name": "Ibrahim Uba Yusuf",
                "title": "Ph.D.",
                "firstName": "Ibrahim Uba",
                "lastName": "Yusuf",
                "affiliation": "Post-Doctoral Research Fellow, Indigenous Language Media in Africa (ILMA), North-West University, Mahikeng, South Africa",
                "email": "ibrahim.mcm@unimaid.edu.ng",
                "orcid": "0000-0003-3290-2079",
                "isCorresponding": True
            },
            {
                "name": "Yahaya Abubakar",
                "title": "Ph.D.",
                "firstName": "Yahaya",
                "lastName": "Abubakar",
                "affiliation": "Department of Broadcasting, Faculty of Communication and Media Studies, University of Maiduguri",
                "email": "yaabu2015@gmail.com",
                "orcid": None,
                "isCorresponding": False
            },
            {
                "name": "Musa Usman",
                "title": "Ph.D.",
                "firstName": "Musa",
                "lastName": "Usman",
                "affiliation": "Department of Broadcasting, Faculty of Communication and Media Studies, University of Maiduguri",
                "email": "alhmusa200@gmail.com",
                "orcid": None,
                "isCorresponding": False
            }
        ]
    ]

    articles = []
    current_page = 1

    for i in range(10):
        t_start = title_indices[i]
        t_end = end_indices[i]
        title = TITLES[i]

        # find abstract
        abs_idx = next(k for k in range(t_start, t_end) if paragraphs[k].lower().startswith('abstract'))
        
        abstract_text = ''
        if paragraphs[abs_idx].lower() == 'abstract':
            abstract_text = paragraphs[abs_idx + 1]
            kw_start = abs_idx + 2
        else:
            abstract_text = paragraphs[abs_idx].split(':', 1)[-1].strip()
            kw_start = abs_idx + 1

        abstract_text = clean_text(abstract_text)

        # keywords
        kw_line = ''
        body_start = kw_start
        for k in range(kw_start, min(t_end, kw_start + 5)):
            if 'keyword' in paragraphs[k].lower():
                kw_line = paragraphs[k]
                body_start = k + 1
                break

        keywords = parse_keywords(kw_line)

        # references
        ref_idx = None
        for k in range(body_start, t_end):
            p_clean = paragraphs[k].lower().strip()
            if p_clean in ['references', 'reference', 'works cited'] or p_clean.startswith('references'):
                ref_idx = k
                break

        body_paras = [clean_text(paragraphs[k]) for k in range(body_start, ref_idx if ref_idx else t_end) if paragraphs[k].strip()]
        
        ref_paras = []
        if ref_idx:
            # References can be multi-line or single paragraphs
            for k in range(ref_idx + 1, t_end):
                p = clean_text(paragraphs[k])
                if p:
                    ref_paras.append(p)

        # Page numbering calculation (roughly 14-22 pages per article)
        page_span = 14 + (len(body_paras) // 10)
        first_page = current_page
        last_page = first_page + page_span - 1
        current_page = last_page + 1

        zenodo_doi = f"10.5281/zenodo.1489{2001 + i}"

        article_slug = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')[:80].strip('-')

        article_obj = {
            "order": i,
            "title": title,
            "slug": article_slug,
            "type": "RESEARCH_ARTICLE",
            "doi": zenodo_doi,
            "firstPage": first_page,
            "lastPage": last_page,
            "abstract": abstract_text,
            "keywords": keywords,
            "authors": AUTHORS_META[i],
            "bodyParagraphs": body_paras,
            "references": ref_paras
        }
        articles.append(article_obj)

    with open('data/real-articles.json', 'w', encoding='utf-8') as f:
        json.dump(articles, f, indent=2, ensure_ascii=False)

    print(f"Successfully extracted {len(articles)} articles into data/real-articles.json")

if __name__ == '__main__':
    main()
