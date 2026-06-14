/**
 * Realistic sample content for seeding. Article titles, authors, abstracts
 * and keywords are invented but plausible for a Nigerian communication
 * studies journal; editors replace all of this via the admin dashboard.
 */

export interface SeedAuthor {
  first: string;
  last: string;
  email?: string;
  affiliation: string;
  orcid?: string;
  corresponding?: boolean;
}

export interface SeedArticle {
  title: string;
  type: "RESEARCH_ARTICLE" | "REVIEW_ARTICLE" | "COMMENTARY" | "BOOK_REVIEW";
  authors: SeedAuthor[];
  abstract: string;
  keywords: string[];
}

const UNILAG = "University of Lagos, Nigeria";
const UI = "University of Ibadan, Nigeria";
const UNN = "University of Nigeria, Nsukka";
const ABU = "Ahmadu Bello University, Zaria, Nigeria";
const COVENANT = "Covenant University, Ota, Nigeria";
const LASU = "Lagos State University, Nigeria";
const GHANA = "University of Ghana, Legon";
const WITS = "University of the Witwatersrand, South Africa";
const NAIROBI = "University of Nairobi, Kenya";
const BUK = "Bayero University, Kano, Nigeria";

// 30 articles: 5 per issue across Vol 10 (2024) i1-2, Vol 11 (2025) i1-2, Vol 12 (2026) i1-2.
export const SEED_ARTICLES: SeedArticle[][] = [
  // ===== Volume 10, Issue 1 (2024) =====
  [
    {
      title:
        "Gender Framing in Nigerian Television News: A Content Analysis of Prime-Time Bulletins",
      type: "RESEARCH_ARTICLE",
      authors: [
        { first: "Adaeze", last: "Okafor", affiliation: UNILAG, orcid: "0000-0002-1825-0097", corresponding: true },
        { first: "Tunde", last: "Bakare", affiliation: LASU },
      ],
      abstract:
        "This study examines how women are framed in prime-time news bulletins on three Nigerian terrestrial television stations. Using a content analysis of 412 news items broadcast over six months, the study finds that women appeared as primary news subjects in only 18.4% of stories and were disproportionately framed in domestic and victim roles. Expert sourcing showed the starkest disparity: male voices accounted for 87% of all expert interviews. The paper argues that newsroom assignment cultures, rather than audience preference, drive these patterns, and proposes gender-aware editorial guidelines grounded in the Nigerian Broadcasting Code. The findings extend framing theory to an African broadcast context and offer a benchmark for monitoring gender representation in Nigerian television journalism.",
      keywords: ["gender representation", "framing theory", "television news", "Nigeria", "content analysis"],
    },
    {
      title:
        "WhatsApp and the Reconfiguration of Political Mobilisation in Lagos Grassroots Communities",
      type: "RESEARCH_ARTICLE",
      authors: [
        { first: "Babatunde", last: "Adesina", affiliation: UNILAG, corresponding: true },
        { first: "Ngozi", last: "Chukwu", affiliation: UNN, orcid: "0000-0003-2415-6671" },
      ],
      abstract:
        "Drawing on ethnographic fieldwork in three Lagos communities during the 2023 general elections, this article analyses how WhatsApp groups reconfigured grassroots political mobilisation. The study identifies three mobilisation repertoires—broadcast amplification, deliberative clustering, and logistical coordination—and shows how community administrators acted as gatekeepers who filtered, verified, and sometimes monetised political information. The findings complicate techno-optimist accounts of social media and democratic participation by demonstrating that platform affordances interact with existing patronage structures. The article contributes to scholarship on encrypted messaging platforms and electoral politics in the Global South.",
      keywords: ["WhatsApp", "political communication", "mobilisation", "elections", "Lagos"],
    },
    {
      title:
        "Indigenous Language Broadcasting and Cultural Preservation: The Case of Yoruba Radio Drama",
      type: "RESEARCH_ARTICLE",
      authors: [
        { first: "Folake", last: "Adeyemi", affiliation: UI, corresponding: true },
      ],
      abstract:
        "Indigenous language programming is in decline across Nigerian radio, yet Yoruba radio drama retains a devoted audience. Through in-depth interviews with producers and a reception study of 64 listeners in Ibadan and Abeokuta, this article examines how radio drama sustains Yoruba idioms, proverbs, and oral performance traditions in a commercial broadcasting environment. The study finds that drama producers consciously archive linguistic heritage while negotiating advertiser pressure for code-mixed content. It argues that indigenous radio drama functions as an informal language policy actor and recommends regulatory incentives for indigenous-language content quotas.",
      keywords: ["indigenous language", "radio drama", "Yoruba", "cultural preservation", "broadcasting policy"],
    },
    {
      title:
        "Press Freedom and Digital Surveillance in West Africa: A Comparative Legal Analysis",
      type: "REVIEW_ARTICLE",
      authors: [
        { first: "Kwame", last: "Mensah", affiliation: GHANA, orcid: "0000-0001-7234-5512", corresponding: true },
        { first: "Ibrahim", last: "Suleiman", affiliation: ABU },
      ],
      abstract:
        "This review article maps the legal architecture governing digital surveillance of journalists in five West African states: Nigeria, Ghana, Senegal, Côte d'Ivoire, and Benin. Synthesising statutes, case law, and reports from press freedom organisations between 2015 and 2023, the analysis identifies a regional pattern of cybercrime legislation repurposed for journalist surveillance, alongside weak judicial oversight of interception warrants. The article evaluates these frameworks against the African Commission's Declaration of Principles on Freedom of Expression and proposes a harmonised ECOWAS standard for surveillance safeguards.",
      keywords: ["press freedom", "surveillance", "media law", "West Africa", "cybercrime legislation"],
    },
    {
      title:
        "Nollywood on Streaming Platforms: Audience Migration and the Economics of Nigerian Cinema",
      type: "RESEARCH_ARTICLE",
      authors: [
        { first: "Chidinma", last: "Eze", affiliation: COVENANT, corresponding: true },
        { first: "Olumide", last: "Fashola", affiliation: UNILAG },
        { first: "Amara", last: "Nwosu", affiliation: UNN },
      ],
      abstract:
        "The arrival of global streaming platforms has restructured Nollywood's distribution economics. Using industry interviews and an audience survey of 1,107 Nigerian streaming subscribers, this study traces audience migration from physical and broadcast distribution to subscription video-on-demand. Findings indicate a bifurcated market: premium 'New Nollywood' productions command streaming licensing fees while traditional direct-to-video producers face revenue collapse. The article theorises this as platform-induced stratification and discusses implications for cultural policy, local content regulation, and the sustainability of Nigeria's screen production ecosystem.",
      keywords: ["Nollywood", "streaming", "platform economics", "audience research", "film distribution"],
    },
  ],
  // ===== Volume 10, Issue 2 (2024) =====
  [
    {
      title:
        "Health Misinformation on Nigerian Twitter during Disease Outbreaks: Diffusion Patterns and Correction Strategies",
      type: "RESEARCH_ARTICLE",
      authors: [
        { first: "Yetunde", last: "Balogun", affiliation: UNILAG, orcid: "0000-0002-8841-2236", corresponding: true },
        { first: "Daniel", last: "Okoye", affiliation: UNN },
      ],
      abstract:
        "Misinformation during disease outbreaks undermines public health response. This study analyses 28,540 tweets posted during the 2023 diphtheria outbreak in Nigeria, mapping diffusion networks of misleading claims and the corrective interventions that followed. Network analysis reveals that a small cluster of high-follower accounts generated 61% of misinformation reach, while corrections from institutional health accounts achieved less than a tenth of equivalent engagement. Corrections framed with empathy and local language outperformed purely factual rebuttals. The study offers an evidence base for infodemic management in African public health communication.",
      keywords: ["misinformation", "health communication", "Twitter", "infodemic", "network analysis"],
    },
    {
      title:
        "The Rhetoric of Fuel Subsidy Removal: Presidential Crisis Communication in Nigeria, 2012–2023",
      type: "RESEARCH_ARTICLE",
      authors: [
        { first: "Emeka", last: "Obi", affiliation: UNN, corresponding: true },
      ],
      abstract:
        "Fuel subsidy removal is among the most contentious policy acts in Nigerian public life. This article compares the crisis rhetoric of three presidential administrations announcing subsidy reforms in 2012, 2016, and 2023. Using rhetorical criticism anchored in image repair theory, the analysis identifies a shift from technocratic justification toward sacrificial nationalism—appeals asking citizens to absorb hardship for national renewal. The 2023 announcement uniquely fused religious idiom with market logic. The article argues that recurring rhetorical failure stems from a credibility deficit rather than message design, with implications for government communication strategy.",
      keywords: ["crisis communication", "political rhetoric", "image repair", "fuel subsidy", "presidential communication"],
    },
    {
      title:
        "Community Radio and Participatory Development Communication in Northern Nigeria",
      type: "RESEARCH_ARTICLE",
      authors: [
        { first: "Hauwa", last: "Abdullahi", affiliation: BUK, orcid: "0000-0003-9912-4408", corresponding: true },
        { first: "Musa", last: "Garba", affiliation: ABU },
      ],
      abstract:
        "Community radio remains underdeveloped in Nigeria despite two decades of advocacy. This study evaluates participatory programming at four campus-community stations in Kano and Kaduna states, combining programme content analysis with focus groups among listeners in surrounding communities. Findings show that genuinely dialogic formats—phone-in town halls and listener drama clubs—built measurable trust and improved uptake of agricultural and maternal health information, while top-down 'development messaging' formats showed no effect. The article refines participatory communication theory for the Nigerian regulatory context, where full community licensing is still pending.",
      keywords: ["community radio", "development communication", "participation", "Northern Nigeria", "media trust"],
    },
    {
      title:
        "Digital Colonialism and Data Governance Debates in Africa: A Critical Review",
      type: "REVIEW_ARTICLE",
      authors: [
        { first: "Thandiwe", last: "Dlamini", affiliation: WITS, corresponding: true },
        { first: "Olusegun", last: "Ajayi", affiliation: UNILAG },
      ],
      abstract:
        "The concept of digital colonialism has migrated rapidly from activist discourse into communication scholarship. This critical review synthesises 87 peer-reviewed studies published between 2018 and 2024 on data extraction, platform dependency, and digital infrastructure ownership in Africa. The review identifies three dominant analytical frames—extractivism, dependency, and sovereignty—and exposes an empirical gap: claims about data extraction substantially outnumber studies that measure it. The article proposes a research agenda linking political economy of communication with empirical data-flow analysis, and assesses the African Union Data Policy Framework as a test case.",
      keywords: ["digital colonialism", "data governance", "platform studies", "Africa", "political economy"],
    },
    {
      title:
        "Review of 'Media and Society in Postcolonial Africa' by Adebayo Williams",
      type: "BOOK_REVIEW",
      authors: [
        { first: "Tayo", last: "Adebanjo", affiliation: UI, corresponding: true },
      ],
      abstract:
        "This review assesses Adebayo Williams' 'Media and Society in Postcolonial Africa' (Ibadan University Press, 2023), a sweeping account of African media systems from independence-era state broadcasting to platform capitalism. The review commends the book's archival depth on Nigerian press history and its theorisation of the 'patrimonial public sphere', while questioning its limited engagement with Francophone and Lusophone media systems and its pessimistic reading of digital activism. The book is recommended for graduate courses in African media studies.",
      keywords: ["book review", "African media systems", "postcolonial studies", "media history"],
    },
  ],
  // ===== Volume 11, Issue 1 (2025) =====
  [
    {
      title:
        "Algorithmic Visibility and Nigerian Content Creators: Negotiating TikTok's Recommendation System",
      type: "RESEARCH_ARTICLE",
      authors: [
        { first: "Simisola", last: "Ogunleye", affiliation: UNILAG, orcid: "0000-0002-3347-8810", corresponding: true },
        { first: "Kelechi", last: "Anyanwu", affiliation: COVENANT },
      ],
      abstract:
        "Nigerian creators constitute one of TikTok's fastest-growing producer communities, yet little is known about how they understand and negotiate the platform's recommendation algorithm. Based on 32 in-depth interviews with creators and six months of digital observation, this study documents 'algorithmic folk theories' that guide content decisions—beliefs about posting time, sound selection, and regional throttling. Creators engage in collective experimentation through WhatsApp 'engagement pods', a practice the article theorises as communal algorithm auditing. The findings advance creator-economy scholarship beyond Western contexts and raise policy questions about platform transparency obligations in African markets.",
      keywords: ["TikTok", "algorithms", "content creators", "platform governance", "creator economy"],
    },
    {
      title:
        "Framing Climate Change in the Nigerian Press: Between Development Imperatives and Environmental Justice",
      type: "RESEARCH_ARTICLE",
      authors: [
        { first: "Obiageli", last: "Nnamdi", affiliation: UNN, corresponding: true },
        { first: "Peter", last: "Akinwande", affiliation: UI },
      ],
      abstract:
        "How do Nigerian newspapers frame climate change in a petro-state economy? This study analyses 876 climate-related articles from four national dailies between 2021 and 2024. Results show that economic-development frames dominate (43%), followed by disaster frames (27%), while environmental-justice frames linking flooding in the Niger Delta to global emissions appear in under 8% of coverage. Sourcing analysis reveals heavy dependence on government and NGO voices with minimal scientist sourcing. The article discusses how newsroom economics and the oil industry's advertising footprint shape climate silence, contributing to comparative climate communication research in petro-states.",
      keywords: ["climate change communication", "framing", "Nigerian press", "environmental justice", "petro-state"],
    },
    {
      title:
        "Disinformation Economies: The Market for Coordinated Inauthentic Behaviour in Nigerian Elections",
      type: "RESEARCH_ARTICLE",
      authors: [
        { first: "Olusegun", last: "Ajayi", affiliation: UNILAG, orcid: "0000-0001-5520-3349", corresponding: true },
        { first: "Fatima", last: "Yusuf", affiliation: BUK },
        { first: "John", last: "Otieno", affiliation: NAIROBI },
      ],
      abstract:
        "Election disinformation in Nigeria is frequently treated as an organic phenomenon, obscuring its commercial infrastructure. Combining undercover interviews with political consultants, forensic analysis of 214 suspended accounts, and pricing data from influencer marketplaces, this study maps the supply chain of coordinated inauthentic behaviour in the 2023 elections. The market is organised in three tiers: strategist firms, micro-influencer brokers, and bulk amplification farms, with campaign expenditure estimates running into hundreds of millions of naira. The article proposes 'disinformation economies' as an analytical framework and evaluates the regulatory capacity of INEC and NCC to respond.",
      keywords: ["disinformation", "elections", "coordinated inauthentic behaviour", "political marketing", "Nigeria"],
    },
    {
      title:
        "Pidgin English Broadcasting and the Democratisation of News Access in Nigeria",
      type: "RESEARCH_ARTICLE",
      authors: [
        { first: "Efe", last: "Oghenekaro", affiliation: LASU, corresponding: true },
      ],
      abstract:
        "Naija (Nigerian Pidgin) broadcasting has expanded from entertainment niches into full news services. Through a reception study of 48 listeners across socioeconomic strata in Lagos and Warri, alongside interviews with editors at two Pidgin-language stations, this article examines whether Pidgin news genuinely widens access to civic information. Findings show that Pidgin bulletins reach audiences that consume no English-language news, and that listeners exhibit higher comprehension and recall of policy stories. However, editors report advertiser stigma that suppresses revenue. The study argues that Pidgin broadcasting performs a democratising function that merits recognition in broadcast policy.",
      keywords: ["Nigerian Pidgin", "broadcasting", "news access", "linguistic inclusion", "audience comprehension"],
    },
    {
      title:
        "Afrobeats, Digital Diaspora, and the Soft Power of Nigerian Popular Culture",
      type: "COMMENTARY",
      authors: [
        { first: "Wale", last: "Oshodi", affiliation: UNILAG, corresponding: true },
      ],
      abstract:
        "The global ascent of Afrobeats has prompted claims that Nigerian popular culture now constitutes a soft-power asset. This commentary interrogates that claim, distinguishing organic cultural circulation from state-directed soft power strategy. It argues that Nigeria's cultural visibility is creator-led and platform-mediated, flourishing despite—not because of—state cultural policy, and that the diaspora functions as the primary distribution infrastructure. The piece outlines what a genuine cultural diplomacy framework would require: export financing, intellectual property enforcement, and visa diplomacy for touring artists, and cautions against rhetorical appropriation of creative-industry success by the state.",
      keywords: ["Afrobeats", "soft power", "cultural diplomacy", "diaspora", "popular culture"],
    },
  ],
  // ===== Volume 11, Issue 2 (2025) =====
  [
    {
      title:
        "Newsroom Convergence and Precarious Labour in Nigerian Digital Journalism",
      type: "RESEARCH_ARTICLE",
      authors: [
        { first: "Ronke", last: "Alabi", affiliation: UNILAG, orcid: "0000-0002-6678-1124", corresponding: true },
        { first: "Victor", last: "Edem", affiliation: UNN },
      ],
      abstract:
        "Digital-first transitions have remade Nigerian newsroom labour. Drawing on a survey of 312 journalists and 24 in-depth interviews across legacy and digital-native outlets, this study documents the labour conditions accompanying convergence: multi-platform production quotas, unpaid social media duties, and widespread salary arrears. Digital-native journalists report greater editorial autonomy but weaker job security and benefits. The article connects these findings to scholarship on journalistic precarity, showing how platform metrics discipline editorial judgement, and assesses unionisation prospects in a fragmenting industry.",
      keywords: ["journalism labour", "newsroom convergence", "precarity", "digital journalism", "Nigeria"],
    },
    {
      title:
        "Visual Framing of Internally Displaced Persons in Nigerian Photojournalism",
      type: "RESEARCH_ARTICLE",
      authors: [
        { first: "Aisha", last: "Mohammed", affiliation: ABU, corresponding: true },
        { first: "Samuel", last: "Igwe", affiliation: UNN },
      ],
      abstract:
        "Over three million Nigerians are internally displaced, yet their visual representation remains understudied. This study analyses 642 news photographs of IDPs published by six Nigerian outlets between 2020 and 2024, coding for camera angle, individualisation, agency, and caption framing. Results reveal a dominant 'mass victimhood' aesthetic—wide shots of crowds, downcast gazes, and feeding lines—while images depicting IDPs as workers, students, or decision-makers constitute under 12%. Interviews with photojournalists trace these patterns to assignment economics and NGO image subsidies. The article argues for dignity-centred visual protocols and contributes to global scholarship on forced displacement imagery.",
      keywords: ["photojournalism", "visual framing", "internally displaced persons", "humanitarian imagery", "dignity"],
    },
    {
      title:
        "Regulating the Unregulatable? The NBC, Online Broadcasting, and Jurisdictional Drift",
      type: "RESEARCH_ARTICLE",
      authors: [
        { first: "Gbenga", last: "Oyetola", affiliation: UNILAG, corresponding: true },
      ],
      abstract:
        "Nigeria's National Broadcasting Commission has repeatedly asserted authority over online streaming and social media broadcasting, provoking constitutional contestation. This article analyses NBC's regulatory instruments, court challenges, and enforcement actions from 2019 to 2024 through the lens of jurisdictional drift—the migration of legacy regulatory mandates into digital domains without legislative renewal. The analysis shows that drift produces both overreach (sanctioning online platforms beyond statutory remit) and underprotection (no coherent framework for streaming-era audience harms). The article proposes a converged communications act modelled on comparative African and Commonwealth experience.",
      keywords: ["broadcast regulation", "NBC", "online streaming", "media law", "jurisdiction"],
    },
    {
      title:
        "Children's Screen Cultures in Lagos Households: Parental Mediation in a Mobile-First Environment",
      type: "RESEARCH_ARTICLE",
      authors: [
        { first: "Funmilayo", last: "Adeoti", affiliation: LASU, orcid: "0000-0003-4456-7789", corresponding: true },
        { first: "Grace", last: "Ekanem", affiliation: UNILAG },
      ],
      abstract:
        "Nigerian children increasingly encounter screens through shared family smartphones rather than televisions, complicating Western-derived parental mediation models. Based on household interviews with 40 Lagos families across income strata, this study maps mediation practices in mobile-first homes: device lending rituals, sibling gatekeeping, data-cost rationing, and religious content filtering. Data scarcity emerges as an unintentional but powerful mediation mechanism. The article extends parental mediation theory by foregrounding infrastructural and economic constraints, and discusses implications for child online safety policy in low-bandwidth contexts.",
      keywords: ["children and media", "parental mediation", "mobile media", "screen time", "media literacy"],
    },
    {
      title:
        "Review of 'Radio and Nation-Building in Africa' edited by Amina Kone and Joseph Banda",
      type: "BOOK_REVIEW",
      authors: [
        { first: "Ishaya", last: "Danjuma", affiliation: ABU, corresponding: true },
      ],
      abstract:
        "This review evaluates the edited volume 'Radio and Nation-Building in Africa' (Routledge, 2024), a fourteen-chapter collection spanning colonial broadcasting archives, liberation radio, and contemporary community stations. The review highlights the collection's methodological breadth and its recovery of women broadcasters' histories, while noting uneven theoretical integration across chapters and the absence of North African cases. Chapters on Hausa-language services and Rwandan post-genocide broadcasting are singled out as essential reading for African broadcasting historians.",
      keywords: ["book review", "radio history", "nation-building", "African broadcasting"],
    },
  ],
  // ===== Volume 12, Issue 1 (2026) =====
  [
    {
      title:
        "Generative AI in Nigerian Newsrooms: Adoption, Anxieties, and Emerging Editorial Norms",
      type: "RESEARCH_ARTICLE",
      authors: [
        { first: "Ifeoma", last: "Onwuka", affiliation: UNILAG, orcid: "0000-0002-9183-5567", corresponding: true },
        { first: "Rotimi", last: "Akande", affiliation: UI },
      ],
      abstract:
        "Generative artificial intelligence has entered Nigerian newsrooms ahead of any institutional policy. This study surveys 198 journalists and interviews 21 editors across 14 outlets to map adoption patterns, perceived risks, and nascent governance norms. Two-thirds of respondents use generative tools weekly—primarily for headline drafting, translation, and transcript summarisation—yet only two outlets had written AI policies. Editors voice anxieties about hallucinated quotes, English-language model bias against Nigerian names and contexts, and audience trust. The article documents emerging informal norms (mandatory human verification, disclosure debates) and proposes an AI governance framework adapted to resource-constrained newsrooms.",
      keywords: ["artificial intelligence", "journalism practice", "newsroom innovation", "editorial ethics", "Nigeria"],
    },
    {
      title:
        "Digital Financial Scams and Persuasion Architecture: A Rhetorical Analysis of Ponzi Recruitment in Nigerian Social Media",
      type: "RESEARCH_ARTICLE",
      authors: [
        { first: "Chinedu", last: "Okonkwo", affiliation: UNN, corresponding: true },
        { first: "Blessing", last: "Adamu", affiliation: BUK },
      ],
      abstract:
        "Recurrent Ponzi schemes have extracted billions of naira from Nigerian households, with recruitment now native to social media. This study performs a rhetorical analysis of 320 recruitment posts, 18 Telegram pitch channels, and testimonial videos associated with five collapsed schemes. The persuasion architecture combines prosperity-gospel idiom, screenshot 'proof' economies, urgency scarcity cues, and engineered testimonial cascades. Recruiters systematically appropriate the visual language of fintech legitimacy. The article links these findings to protection-motivation theory and proposes counter-messaging design principles for financial regulators and platforms.",
      keywords: ["financial scams", "persuasion", "rhetorical analysis", "social media", "consumer protection"],
    },
    {
      title:
        "Podcasting the Nation: Independent Audio Cultures and Counterpublics in Nigeria",
      type: "RESEARCH_ARTICLE",
      authors: [
        { first: "Tomiwa", last: "Adelaja", affiliation: UNILAG, corresponding: true },
        { first: "Zainab", last: "Bello", affiliation: ABU, orcid: "0000-0001-8890-2234" },
      ],
      abstract:
        "Nigerian podcasting has matured into a distinct cultural field beyond radio's regulatory perimeter. Combining a census of 214 active Nigerian podcasts with interviews of 26 producers, this study analyses the field's genre economy, monetisation pathways, and discursive openings. Podcasts host franker conversations on sexuality, mental health, and religious doubt than broadcast media permit, functioning as counterpublic spaces for urban youth. Yet monetisation concentrates among comedy and relationship genres, marginalising civic formats. The article extends counterpublic theory to African audio cultures and considers what NBC's proposed online audio regulation would mean for the field.",
      keywords: ["podcasting", "counterpublics", "audio culture", "youth media", "media regulation"],
    },
    {
      title:
        "From Town Criers to Telegram: Continuity and Change in Rural Information Ecologies of South-West Nigeria",
      type: "RESEARCH_ARTICLE",
      authors: [
        { first: "Olawale", last: "Ogundipe", affiliation: UI, corresponding: true },
        { first: "Mary", last: "Olatunji", affiliation: LASU },
      ],
      abstract:
        "Rural information ecologies are often narrated as linear transitions from oral to digital media. Fieldwork in six Osun and Oyo communities—combining household surveys (n=480), village meetings, and key-informant interviews—reveals instead a layered ecology where town criers, mosque and church announcements, market gossip networks, radio, and Telegram groups perform differentiated functions. Critically, digital channels depend on oral verification: information acquires actionable credibility only after endorsement by trusted local figures. The article proposes a 'verification chain' model of rural information flow with implications for agricultural extension, health campaigns, and election communication.",
      keywords: ["information ecology", "rural communication", "orality", "Telegram", "South-West Nigeria"],
    },
    {
      title:
        "Sports Journalism and Nationalism: Nigerian Media Coverage of the Super Falcons at the Women's World Cup",
      type: "RESEARCH_ARTICLE",
      authors: [
        { first: "Uche", last: "Nwachukwu", affiliation: UNN, corresponding: true },
      ],
      abstract:
        "Women's football commands episodic national attention in Nigeria, peaking during international tournaments. This study analyses coverage of the Super Falcons across the 2023 FIFA Women's World Cup in four newspapers and two sports websites, comparing volume, framing, and sourcing against coverage of the men's national team in an equivalent tournament window. The Falcons received 38% of equivalent coverage volume, with frames oscillating between national pride and federation crisis narratives centred on unpaid bonuses. Athlete voice was systematically subordinated to administrator voice. The article situates findings within scholarship on gendered sports media and nationalism, arguing the Falcons function as 'conditional national symbols'.",
      keywords: ["sports journalism", "gender", "nationalism", "women's football", "media coverage"],
    },
  ],
  // ===== Volume 12, Issue 2 (2026) — current issue =====
  [
    {
      title:
        "Data Costs and the Stratification of Digital News Consumption in Nigeria",
      type: "RESEARCH_ARTICLE",
      authors: [
        { first: "Halima", last: "Sani", affiliation: BUK, orcid: "0000-0002-7741-3390", corresponding: true },
        { first: "Tobi", last: "Aregbesola", affiliation: UNILAG },
      ],
      abstract:
        "Mobile data pricing is an invisible gatekeeper of Nigerian news consumption. Using a 12-state survey (n=2,034) and 40 think-aloud sessions with low-income users, this study quantifies how data costs structure news repertoires. Respondents in the lowest income quintile spend 11% of monthly income on data and systematically avoid video news, news apps, and image-heavy sites, relying instead on text-based WhatsApp digests and data-free Facebook variants whose content is least verified. The study introduces the concept of 'bandwidth stratification' of civic information and argues that news organisations' web performance choices are de facto accessibility policies.",
      keywords: ["digital divide", "news consumption", "data costs", "mobile internet", "inequality"],
    },
    {
      title:
        "Religious Broadcasting and Public Health: Pentecostal Media Responses to Vaccination Campaigns in Nigeria",
      type: "RESEARCH_ARTICLE",
      authors: [
        { first: "Emmanuel", last: "Adigun", affiliation: UI, corresponding: true },
        { first: "Rebecca", last: "Essien", affiliation: UNILAG },
      ],
      abstract:
        "Pentecostal broadcast networks command audiences rivalling national broadcasters, making their health messaging consequential. This study analyses vaccination-related content across four Pentecostal television networks and twelve megachurch social media accounts during the 2024 HPV vaccine rollout, supplemented by interviews with church media directors. Coverage divided into three stances: active endorsement framing vaccination as stewardship (29%), silence (58%), and hedged scepticism couched in spiritual-discernment language (13%). Where pastors endorsed vaccination on air, affiliated clinics reported measurable uptake increases. The article theorises Pentecostal media as parallel health communication infrastructure and recommends engagement protocols for public health agencies.",
      keywords: ["religious broadcasting", "health communication", "vaccination", "Pentecostalism", "Nigeria"],
    },
    {
      title:
        "Platform Moderation in African Languages: Content Governance Gaps in Hausa, Yoruba, and Igbo Social Media",
      type: "RESEARCH_ARTICLE",
      authors: [
        { first: "Nkechi", last: "Umeh", affiliation: UNILAG, orcid: "0000-0003-1156-9982", corresponding: true },
        { first: "Abdulrahman", last: "Kabir", affiliation: ABU },
        { first: "Wanjiru", last: "Kamau", affiliation: NAIROBI },
      ],
      abstract:
        "Content moderation research concentrates on English-language harms, leaving African-language governance largely unexamined. This study audits platform responses to harmful content in Hausa, Yoruba, and Igbo through systematic reporting of 600 policy-violating posts (hate speech, scam solicitations, and medical misinformation) across two major platforms. Removal rates for African-language violations were less than half those for equivalent English-language content, with Hausa-language hate speech showing the largest enforcement gap. Interviews with former moderation contractors reveal structural under-resourcing of African language operations. The article argues for moderation transparency obligations disaggregated by language, and contributes empirical weight to debates on platform accountability in the Global South.",
      keywords: ["content moderation", "African languages", "platform governance", "hate speech", "accountability"],
    },
    {
      title:
        "The Editorial Cartoon in Nigerian Democracy: Satire, Self-Censorship, and the Shrinking Canvas",
      type: "RESEARCH_ARTICLE",
      authors: [
        { first: "Segun", last: "Awolowo", affiliation: LASU, corresponding: true },
      ],
      abstract:
        "Editorial cartooning occupies a precarious niche in Nigerian journalism: celebrated as democratic conscience yet vulnerable to legal and economic pressure. Through interviews with eleven working cartoonists and a thematic analysis of 480 cartoons published between 2015 and 2025, this study traces the form's contraction—fewer staff positions, migration to social media, and intensified self-censorship around religion, the military, and state governors. Cartoonists describe a 'shrinking canvas' of permissible targets even as digital circulation expands reach. The article reads the editorial cartoon as a barometer of expressive freedom and contributes to scholarship on satire under democratic backsliding.",
      keywords: ["editorial cartoons", "satire", "self-censorship", "press freedom", "Nigerian democracy"],
    },
    {
      title:
        "Teaching Media Literacy in Nigerian Secondary Schools: Curriculum Gaps and Teacher Readiness",
      type: "RESEARCH_ARTICLE",
      authors: [
        { first: "Patience", last: "Okoro", affiliation: UNILAG, corresponding: true },
        { first: "David", last: "Lawal", affiliation: UI, orcid: "0000-0002-4419-8865" },
      ],
      abstract:
        "Misinformation resilience ultimately depends on educational infrastructure, yet media literacy holds no formal place in Nigeria's secondary curriculum. This mixed-methods study surveys 264 teachers across Lagos, Oyo, and Enugu states and audits civic education and English curricula for media literacy content. Fewer than one in five teachers could correctly describe lateral reading or reverse image search, while curricula address media only as grammar-comprehension passages. Teachers nonetheless improvise: 41% report informally teaching students to verify viral claims. The article proposes a curriculum integration pathway through existing civic education frameworks and an in-service training model costed for state adoption.",
      keywords: ["media literacy", "education", "curriculum", "misinformation", "teacher training"],
    },
  ],
];

/** Pool of realistic APA-style references; each article samples deterministically. */
export const REFERENCE_POOL: string[] = [
  "Adeyanju, A. M. (2021). Mass media and public discourse in Nigeria's Fourth Republic. African Journalism Studies, 42(3), 45–62.",
  "Akinfeleye, R. A. (2008). Essentials of journalism: An introductory text (4th ed.). Malthouse Press.",
  "Ansu-Kyeremeh, K. (2005). Indigenous communication in Africa: Concept, application and prospects. Ghana Universities Press.",
  "Castells, M. (2009). Communication power. Oxford University Press.",
  "Couldry, N., & Mejias, U. A. (2019). The costs of connection: How data is colonizing human life and appropriating it for capitalism. Stanford University Press.",
  "Entman, R. M. (1993). Framing: Toward clarification of a fractured paradigm. Journal of Communication, 43(4), 51–58.",
  "Ekeanyanwu, N. T. (2015). International communication. Covenant University Press.",
  "Habermas, J. (1989). The structural transformation of the public sphere. MIT Press.",
  "Mabweazara, H. M. (2018). Newsmaking cultures in Africa: Normative trends in the dynamics of socio-political and economic struggles. Palgrave Macmillan.",
  "Moyo, L. (2020). The decolonial turn in media studies in Africa and the Global South. Palgrave Macmillan.",
  "Nyamnjoh, F. B. (2005). Africa's media: Democracy and the politics of belonging. Zed Books.",
  "Obijiofor, L., & Hanusch, F. (2011). Journalism across cultures: An introduction. Palgrave Macmillan.",
  "Ojebode, A. (2018). Celebrating a digital-era community radio pioneer: Why Nigeria is no longer the giant of Africa. Journal of Radio & Audio Media, 25(1), 158–164.",
  "Okoro, N., & Nwafor, K. A. (2013). Social media and political participation in Nigeria during the 2011 general elections. Global Journal of Arts Humanities and Social Sciences, 1(3), 29–46.",
  "Omenugha, K. A., & Oji, M. (2008). News commercialization, ethics and objectivity in journalism practice in Nigeria. Estudos em Comunicação, 3, 13–28.",
  "Oso, L. (2012). Press and politics in Nigeria: On whose side? Lagos State University Inaugural Lecture Series.",
  "Pate, U. A., & Idris, H. (2017). How journalists survived to report: Professionalism and risk management in the reporting of terror groups and violent extremism in North East Nigeria. In U. Carlsson (Ed.), Freedom of expression and media in transition (pp. 159–170). Nordicom.",
  "Salawu, A. (2015). A political economy of sub-Saharan African language press: The case of Nigeria and South Africa. Review of African Political Economy, 42(144), 299–313.",
  "Tufekci, Z. (2017). Twitter and tear gas: The power and fragility of networked protest. Yale University Press.",
  "Uwakwe, O. (2010). Media writing and reporting. Africana First Publishers.",
  "Wasserman, H. (2018). Media, geopolitics, and power: A view from the Global South. University of Illinois Press.",
  "Willems, W., & Mano, W. (Eds.). (2017). Everyday media culture in Africa: Audiences and users. Routledge.",
  "McQuail, D. (2010). McQuail's mass communication theory (6th ed.). Sage.",
  "Ndlela, M. N. (2009). African media research in the era of globalization. Journal of African Media Studies, 1(1), 55–68.",
  "Ogola, G. (2015). African journalism: A journey of failures and triumphs. African Journalism Studies, 36(1), 93–102.",
];

/** Generic but coherent body paragraphs assembled per article. */
export function buildBodyParagraphs(a: SeedArticle): string[] {
  const kw = a.keywords[0] ?? "communication";
  return [
    "## 1. Introduction",
    `${a.abstract.split(". ")[0]}. The significance of this inquiry lies in its contribution to ongoing debates within African communication scholarship, where empirical attention to ${kw} remains uneven despite its growing salience in public discourse. This article addresses that gap by combining conceptual synthesis with original evidence drawn from the Nigerian media environment.`,
    `The remainder of the paper proceeds in five sections. Section two situates the study within the relevant theoretical and empirical literature. Section three details the research design, data sources, and analytical procedures. Section four presents the findings, while section five discusses their implications for theory, practice, and policy. The conclusion reflects on limitations and identifies directions for future research.`,
    "## 2. Literature Review and Theoretical Framework",
    `Scholarship on ${kw} has developed along two broad trajectories. The first, rooted in normative media theory, interrogates the obligations of media institutions to democratic publics; the second, informed by audience and reception studies, foregrounds the interpretive agency of media users. Both trajectories converge on the recognition that communication phenomena in African contexts cannot be adequately explained by frameworks developed for Northern media systems without careful adaptation.`,
    `Within the Nigerian context specifically, prior studies have documented the structural conditions of media production—ownership concentration, advertising dependence, and regulatory pressure—while a younger body of work examines digital platforms as sites of both democratic possibility and new vulnerability. This study draws these strands together, deploying a framework that is attentive simultaneously to institutional structure and situated practice.`,
    "## 3. Methodology",
    `The study adopted a rigorous design appropriate to its research questions, combining systematic data collection with iterative analysis. Sampling decisions balanced representativeness against feasibility, and all instruments were piloted prior to deployment. Ethical approval was obtained from the relevant institutional review board, and informed consent was secured from all human participants. Data were analysed using established procedures, with inter-coder reliability checks performed where applicable and reflexive memoing used to guard against interpretive drift.`,
    "## 4. Findings",
    `The analysis yielded three principal findings. First, the evidence confirms that ${kw} operates as a structuring force in the Nigerian media field, shaping both production routines and audience practices in ways that prior literature has under-specified. Second, the data reveal significant variation across demographic and institutional contexts, cautioning against monolithic accounts. Third, and most notably, the findings surface practices of negotiation and adaptation through which Nigerian media actors creatively manage the constraints they face.`,
    `These findings were robust across analytical specifications. Triangulation between data sources strengthened confidence in the central claims, while deviant case analysis sharpened the boundaries of their applicability. Detailed supporting evidence is presented in the tables and extracts above.`,
    "## 5. Discussion",
    `The findings carry implications at three levels. Theoretically, they extend existing frameworks by demonstrating the necessity of incorporating infrastructural and economic constraints into accounts of ${kw} in Global South contexts. Practically, they offer media professionals and civil society actors an evidence base for intervention design. At the level of policy, the study identifies concrete regulatory openings through which the documented problems might be addressed without compromising expressive freedom.`,
    "## 6. Conclusion",
    `This article set out to examine ${a.title.toLowerCase().slice(0, 60)}..., and has shown that the phenomenon is both more consequential and more contingent than prevailing accounts suggest. The study's limitations—principally its geographic scope and temporal window—define an agenda for comparative and longitudinal extension. Future research should pursue these questions across additional Nigerian regions and African media systems.`,
  ];
}

/** Deterministically pick n references for article index i. */
export function pickReferences(i: number, n = 10): string[] {
  const refs: string[] = [];
  for (let k = 0; k < n; k++) {
    refs.push(REFERENCE_POOL[(i * 7 + k * 3) % REFERENCE_POOL.length]);
  }
  return [...new Set(refs)].sort();
}
