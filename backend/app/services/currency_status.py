"""DRISHTI AI — Official RBI Currency & Coin Legal Tender Knowledge Base.

Provides sourced legal status, physical security features, and authenticity
advisory according to the Reserve Bank of India (RBI) and the Coinage Act, 2011.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


# ---------------------------------------------------------------------------
# Sourced RBI Status Data for Banknotes and Coins
# ---------------------------------------------------------------------------

CURRENCY_REGISTRY: Dict[str, Dict[str, Any]] = {
    # ---------------- Banknotes ----------------
    "₹10": {
        "denomination": "₹10",
        "currency_type": "banknote",
        "series": "Mahatma Gandhi (New) Series & Earlier Series",
        "legal_tender": True,
        "circulation_status": "active_circulation",
        "status_label": "Valid Legal Tender — Active Circulation",
        "base_color": "Chocolate Brown",
        "dimensions_mm": "63 × 123",
        "reverse_motif": "Sun Temple, Konark",
        "legal_basis": "Reserve Bank of India Act, 1934 (Section 26)",
        "rbi_summary": (
            "₹10 banknotes in both the Mahatma Gandhi (New) Series (Chocolate Brown) "
            "and all earlier issued series continue to be valid legal tender in active circulation."
        ),
        "rbi_summary_ta": "₹10 ரூபாய் நோட்டுகள் செல்லுபடியாகும் பணப்பரிவர்த்தனைக்கு உரியவை.",
        "rbi_summary_hi": "₹10 का बैंकनोट वैध मुद्रा है और सक्रिय संचलन में है।",
        "physical_security_features": [
            "See-through register with denominational numeral 10",
            "Latent image with denominational numeral 10 visible at 45° eye level",
            "Devanagari numeral १० on front",
            "Portrait of Mahatma Gandhi at the center",
            "Microletters 'RBI', 'भारत', 'INDIA' and '10'",
            "Demarcated windowed security thread with inscriptions 'भारत' and 'RBI'",
            "Guarantee Clause, Governor's signature with Promise Clause and RBI emblem",
        ],
        "tactile_features_visually_impaired": (
            "Intaglio/raised printing of Mahatma Gandhi portrait and Ashoka Pillar emblem."
        ),
    },
    "₹20": {
        "denomination": "₹20",
        "currency_type": "banknote",
        "series": "Mahatma Gandhi (New) Series & Earlier Series",
        "legal_tender": True,
        "circulation_status": "active_circulation",
        "status_label": "Valid Legal Tender — Active Circulation",
        "base_color": "Greenish Yellow",
        "dimensions_mm": "63 × 129",
        "reverse_motif": "Ellora Caves (UNESCO World Heritage Site)",
        "legal_basis": "Reserve Bank of India Act, 1934 (Section 26)",
        "rbi_summary": (
            "₹20 banknotes in both the Mahatma Gandhi (New) Series (Greenish Yellow) "
            "and prior series remain legal tender in active circulation throughout India."
        ),
        "rbi_summary_ta": "₹20 ரூபாய் நோட்டுகள் செல்லுபடியாகும் சட்டப்பூர்வ பணமாகும்.",
        "rbi_summary_hi": "₹20 का बैंकनोट वैध मुद्रा है और पूर्ण संचलन में है।",
        "physical_security_features": [
            "See-through register with denominational numeral 20",
            "Latent image with numeral 20 visible at 45° angle",
            "Portrait of Mahatma Gandhi at center",
            "Windowed security thread with inscriptions 'भारत' and 'RBI'",
            "Ashoka Pillar emblem on the right",
            "Microletters 'RBI', 'भारत', 'INDIA' and '20'",
        ],
        "tactile_features_visually_impaired": (
            "Raised printing of Mahatma Gandhi portrait, Ashoka Pillar emblem, and bleed identifiers."
        ),
    },
    "₹50": {
        "denomination": "₹50",
        "currency_type": "banknote",
        "series": "Mahatma Gandhi (New) Series & Earlier Series",
        "legal_tender": True,
        "circulation_status": "active_circulation",
        "status_label": "Valid Legal Tender — Active Circulation",
        "base_color": "Fluorescent Blue",
        "dimensions_mm": "66 × 135",
        "reverse_motif": "Hampi with Chariot",
        "legal_basis": "Reserve Bank of India Act, 1934 (Section 26)",
        "rbi_summary": (
            "₹50 banknotes in the Mahatma Gandhi (New) Series (Fluorescent Blue) "
            "and earlier Mahatma Gandhi series are valid legal tender."
        ),
        "rbi_summary_ta": "₹50 ரூபாய் நோட்டுகள் செல்லுபடியாகும் பணமாகும்.",
        "rbi_summary_hi": "₹50 का बैंकनोट वैध मुद्रा है।",
        "physical_security_features": [
            "See-through register with denominational numeral 50",
            "Latent image with numeral 50",
            "Windowed security thread with inscriptions 'भारत' and 'RBI'",
            "Ashoka Pillar emblem on the right",
            "Portrait of Mahatma Gandhi at the center",
            "Electrotype (50) watermark alongside Gandhi portrait watermark",
        ],
        "tactile_features_visually_impaired": (
            "Intaglio/raised printing of Mahatma Gandhi portrait, Ashoka Pillar, and tactile identifiers."
        ),
    },
    "₹100": {
        "denomination": "₹100",
        "currency_type": "banknote",
        "series": "Mahatma Gandhi (New) Series & Earlier Series",
        "legal_tender": True,
        "circulation_status": "active_circulation",
        "status_label": "Valid Legal Tender — Active Circulation",
        "base_color": "Lavender",
        "dimensions_mm": "66 × 142",
        "reverse_motif": "Rani ki Vav (The Queen's Stepwell)",
        "legal_basis": "Reserve Bank of India Act, 1934 (Section 26)",
        "rbi_summary": (
            "₹100 banknotes in the Mahatma Gandhi (New) Series (Lavender) "
            "and prior series remain valid legal tender in active circulation."
        ),
        "rbi_summary_ta": "₹100 ரூபாய் நோட்டுகள் செல்லுபடியாகும் சட்டப்பூர்வ பணமாகும்.",
        "rbi_summary_hi": "₹100 का बैंकनोट वैध मुद्रा है और सक्रिय संचलन में है।",
        "physical_security_features": [
            "See-through register with numeral 100",
            "Latent image with denominational numeral 100",
            "Windowed security thread with inscriptions 'भारत' and 'RBI', color shift green to blue on tilt",
            "Microletters 'RBI', 'भारत', 'INDIA' and '100'",
            "Mahatma Gandhi portrait and electrotype (100) watermark",
            "Number panel with numerals growing from small to large",
        ],
        "tactile_features_visually_impaired": (
            "Raised triangle identification mark above Ashoka Pillar, and four angular bleed lines on left and right edges."
        ),
    },
    "₹200": {
        "denomination": "₹200",
        "currency_type": "banknote",
        "series": "Mahatma Gandhi (New) Series (Introduced August 2017)",
        "legal_tender": True,
        "circulation_status": "active_circulation",
        "status_label": "Valid Legal Tender — Active Circulation",
        "base_color": "Bright Yellow",
        "dimensions_mm": "66 × 146",
        "reverse_motif": "Sanchi Stupa",
        "legal_basis": "RBI Press Release 2017-2018/542 (August 24, 2017)",
        "rbi_summary": (
            "₹200 banknotes in Bright Yellow were introduced in August 2017 "
            "to bridge the denominational gap and remain fully valid legal tender."
        ),
        "rbi_summary_ta": "₹200 ரூபாய் நோட்டுகள் செல்லுபடியாகும் பணமாகும்.",
        "rbi_summary_hi": "₹200 का बैंकनोट पूर्ण रूप से वैध मुद्रा है।",
        "physical_security_features": [
            "See-through register with denominational numeral 200",
            "Color-shifting windowed security thread ('भारत', 'RBI', color green to blue on tilt)",
            "Color-changing numeral 200 in optical variable ink on front",
            "Mahatma Gandhi portrait and electrotype 200 watermark",
            "Latent image with numeral 200",
        ],
        "tactile_features_visually_impaired": (
            "Raised circle identification mark with ₹200 in relief, plus four angular bleed lines with two small circles between them."
        ),
    },
    "₹500": {
        "denomination": "₹500",
        "currency_type": "banknote",
        "series": "Mahatma Gandhi (New) Series (Introduced November 10, 2016)",
        "legal_tender": True,
        "circulation_status": "active_circulation",
        "status_label": "Valid Legal Tender — Active Circulation",
        "base_color": "Stone Grey",
        "dimensions_mm": "66 × 150",
        "reverse_motif": "Red Fort, Delhi with Indian Flag",
        "legal_basis": "Government of India Notification S.O. 3407(E) & RBI Circular DCM (Plg) No. 1226/10.27.00/2016-17",
        "rbi_summary": (
            "₹500 banknotes in Stone Grey (Mahatma Gandhi New Series) introduced post-demonetization "
            "are valid legal tender. Old pre-November 2016 ₹500 series notes ceased to be legal tender on Nov 8, 2016."
        ),
        "rbi_summary_ta": "₹500 புதிய சீரிஸ் ரூபாய் நோட்டுகள் செல்லுபடியாகும் சட்டப்பூர்வ பணமாகும்.",
        "rbi_summary_hi": "₹500 (स्टोन ग्रे) महात्मा गांधी नई श्रृंखला वैध मुद्रा है। पुरानी 2016-पूर्व श्रृंखला अमान्य है।",
        "physical_security_features": [
            "Windowed security thread with color shift from green to blue on tilt",
            "Color-shifting optical variable ink for denomination numeral 500",
            "See-through register with numeral 500",
            "Latent image with numeral 500 visible at eye level",
            "Mahatma Gandhi portrait and electrotype (500) watermark",
            "Microletters 'RBI' and '500'",
        ],
        "tactile_features_visually_impaired": (
            "Raised circle identification mark on right above Ashoka Pillar, and five angular bleed lines on both left and right edges."
        ),
    },
    "₹2000": {
        "denomination": "₹2000",
        "currency_type": "banknote",
        "series": "Mahatma Gandhi (New) Series (Introduced Nov 2016; Withdrawn May 19, 2023)",
        "legal_tender": True,
        "circulation_status": "withdrawn_legal_tender",
        "status_label": "Withdrawn from Circulation — Legal Tender for RBI Exchange Only",
        "base_color": "Magenta",
        "dimensions_mm": "66 × 166",
        "reverse_motif": "Mangalyaan (Mars Orbiter Mission)",
        "legal_basis": "RBI Press Release 2023-2024/245 (May 19, 2023) under Clean Note Policy",
        "rbi_summary": (
            "NOTICE: The ₹2000 denomination banknote was WITHDRAWN from circulation by the RBI on May 19, 2023. "
            "While it continues to be legal tender, commercial bank deposit/exchange facilities ended on October 7, 2023. "
            "Currently, ₹2000 notes can ONLY be exchanged or deposited at the 19 Regional Issue Offices of the RBI, "
            "or sent via India Post to an RBI Issue Office. Do not accept ₹2000 notes for commercial daily transactions."
        ),
        "rbi_summary_ta": (
            "எச்சரிக்கை: ₹2000 ரூபாய் நோட்டுகள் புழக்கத்திலிருந்து திரும்பப் பெறப்பட்டுள்ளன. "
            "இவற்றை ரிசர்வ் வங்கியின் 19 பிராந்திய அலுவலகங்களில் மட்டுமே மாற்ற முடியும்."
        ),
        "rbi_summary_hi": (
            "सूचना: ₹2000 का नोट 19 मई 2023 को आरबीआई द्वारा संचलन से वापस ले लिया गया था। "
            "यह कानूनी निविदा बना हुआ है लेकिन इसे केवल 19 आरबीआई निर्गम कार्यालयों में ही बदला जा सकता है।"
        ),
        "physical_security_features": [
            "Windowed security thread with color shift from green to blue",
            "Color-shifting optical variable ink on numeral 2000",
            "See-through register with numeral 2000",
            "Latent image with numeral 2000",
            "Mahatma Gandhi portrait and electrotype 2000 watermark",
        ],
        "tactile_features_visually_impaired": (
            "Raised rectangle identification mark on right, and seven angular bleed lines on left and right edges."
        ),
    },

    # ---------------- Coins ----------------
    "₹1 Coin": {
        "denomination": "₹1 Coin",
        "currency_type": "coin",
        "series": "Ferritic Stainless Steel / Various GOI Mint Series",
        "legal_tender": True,
        "circulation_status": "active_circulation",
        "status_label": "Valid Legal Tender — Government of India Coin",
        "base_color": "Silver (Ferritic Stainless Steel)",
        "dimensions_mm": "Diameter: 21.93 mm, Thickness: 1.45 mm, Weight: 3.85 g",
        "reverse_motif": "One Rupee numeral with thumbs-up or floral design",
        "legal_basis": "Coinage Act, 2011 (Act No. 11 of 2011)",
        "rbi_summary": (
            "All ₹1 coins minted by the Government of India across various design series and mint marks "
            "are valid legal tender for payments up to ₹1,000 as per Section 6 of the Coinage Act, 2011."
        ),
        "rbi_summary_ta": "₹1 நாணயம் செல்லுபடியாகும் இந்திய அரசு சட்டப்பூர்வ நாணயமாகும்.",
        "rbi_summary_hi": "₹1 का सिक्का भारत सरकार द्वारा जारी पूर्ण रूप से वैध सिक्का है।",
        "physical_security_features": [
            "Ferritic Stainless Steel composition (approx 83% iron, 17% chromium)",
            "Lion Capital of Ashoka Pillar with 'सत्यमेव जयते' on obverse",
            "Mint mark under the year of issue (Star for Hyderabad, Dot for Noida, Diamond for Mumbai, None for Kolkata)",
            "Plain smooth edge",
        ],
        "tactile_features_visually_impaired": "Circular shape, 21.93mm diameter with smooth edge.",
    },
    "₹2 Coin": {
        "denomination": "₹2 Coin",
        "currency_type": "coin",
        "series": "Cupro-Nickel / Ferritic Stainless Steel Series",
        "legal_tender": True,
        "circulation_status": "active_circulation",
        "status_label": "Valid Legal Tender — Government of India Coin",
        "base_color": "Silver (Ferritic Stainless Steel)",
        "dimensions_mm": "Diameter: 25.0 mm (older 11-sided) / 25.0 mm circular, Weight: 4.07 g to 5.62 g",
        "reverse_motif": "Numeral 2 with National Integration / Rupee symbol and grains",
        "legal_basis": "Coinage Act, 2011",
        "rbi_summary": (
            "All variants of ₹2 coins (including circular and 11-sided hendecagonal variants) "
            "are valid legal tender for payments up to ₹1,000."
        ),
        "rbi_summary_ta": "₹2 நாணயம் செல்லுபடியாகும் சட்டப்பூர்வ நாணயமாகும்.",
        "rbi_summary_hi": "₹2 का सिक्का पूरी तरह से वैध है।",
        "physical_security_features": [
            "Ashoka Lion Capital with motto 'सत्यमेव जयते'",
            "Mint mark under the year of issue",
            "Reeded or smooth edge depending on series",
        ],
        "tactile_features_visually_impaired": "Circular 25mm diameter or 11-sided distinct corners.",
    },
    "₹5 Coin": {
        "denomination": "₹5 Coin",
        "currency_type": "coin",
        "series": "Nickel-Brass / Cupro-Nickel / Stainless Steel Series",
        "legal_tender": True,
        "circulation_status": "active_circulation",
        "status_label": "Valid Legal Tender — Government of India Coin",
        "base_color": "Golden (Nickel-Brass) or Silver (Cupro-Nickel)",
        "dimensions_mm": "Diameter: 23.0 mm, Thickness: 1.9 mm, Weight: 6.0 g",
        "reverse_motif": "Denominational numeral 5 with wavy lines / lotus / floral pattern",
        "legal_basis": "Coinage Act, 2011",
        "rbi_summary": (
            "All ₹5 coins, including older thick cupro-nickel coins, golden nickel-brass coins, "
            "and newer 2019 Azadi Ka Amrit Mahotsav series, are valid legal tender."
        ),
        "rbi_summary_ta": "₹5 நாணயம் செல்லுபடியாகும் பணப்பரிவர்த்தனைக்கு உரியது.",
        "rbi_summary_hi": "₹5 का सिक्का वैध मुद्रा है।",
        "physical_security_features": [
            "Distinct thickness (1.9mm) and weight (approx 6 grams)",
            "Milled/reeded edge",
            "Lion Capital of Ashoka Pillar with 'भारत' and 'INDIA'",
        ],
        "tactile_features_visually_impaired": "Heavier weight (6.0g), thick 1.9mm rim, and serrated reeded edges.",
    },
    "₹10 Coin": {
        "denomination": "₹10 Coin",
        "currency_type": "coin",
        "series": "Bi-Metallic (10 rays, 15 rays, Rupee symbol, and Azadi Ka Amrit Mahotsav series)",
        "legal_tender": True,
        "circulation_status": "active_circulation",
        "status_label": "Valid Legal Tender — ALL 14 Variants Confirmed by RBI",
        "base_color": "Bi-Metallic (Copper-Nickel center, Aluminium-Bronze outer ring)",
        "dimensions_mm": "Diameter: 27.0 mm, Weight: 7.71 g",
        "reverse_motif": "Denomination numeral 10 with radiating rays and Rupee symbol",
        "legal_basis": "RBI Press Release 2017-2018/1647 & Press Release 2019-2020/1518",
        "rbi_summary": (
            "IMPORTANT RBI CLARIFICATION: The Reserve Bank of India has issued multiple circulars "
            "confirming that ALL 14 VARIANTS of ₹10 coins minted since 2006 (with 10 rays, 15 rays, "
            "with or without the ₹ symbol) are GENUINE and VALID LEGAL TENDER. "
            "Refusal to accept ₹10 coins by merchants or individuals is illegal under Indian law."
        ),
        "rbi_summary_ta": (
            "ரிசர்வ் வங்கி அறிவிப்பு: ₹10 நாணயங்களின் அனைத்து வகைகளும் (10 கதிர்கள், 15 கதிர்கள் கொண்டவை) "
            "சட்டப்பூர்வமாக செல்லுபடியாகும். இவற்றை வாங்க மறுப்பது சட்டப்படி குற்றமாகும்."
        ),
        "rbi_summary_hi": (
            "आरबीआई स्पष्टीकरण: ₹10 के सिक्के के सभी 14 डिज़ाइन पूरी तरह से वैध हैं। "
            "सिक्के को स्वीकार करने से मना करना कानूनी रूप से अनुचित है।"
        ),
        "physical_security_features": [
            "Authentic Bi-Metallic construction: outer ring Aluminium-Bronze (Golden), center core Cupro-Nickel (Silver)",
            "Precisely fused concentric ring without loose seam",
            "Lion Capital of Ashoka Pillar on obverse",
            "Weight: exactly 7.71 grams; Diameter: exactly 27.0 mm",
            "Plain smooth edge",
        ],
        "tactile_features_visually_impaired": (
            "Large 27mm diameter, bi-metallic tactile rim seam, smooth edge, and heavier weight."
        ),
    },
    "₹20 Coin": {
        "denomination": "₹20 Coin",
        "currency_type": "coin",
        "series": "12-Edged Dodecagon Bi-Metallic Series (Introduced 2019)",
        "legal_tender": True,
        "circulation_status": "active_circulation",
        "status_label": "Valid Legal Tender — Government of India Coin",
        "base_color": "Bi-Metallic (Nickel-Silver center, Nickel-Brass outer ring)",
        "dimensions_mm": "Diameter: 27.0 mm, Weight: 8.54 g, 12-edged (Dodecagon)",
        "reverse_motif": "Denominational numeral 20 with agricultural grains motif",
        "legal_basis": "Coinage of the Twenty Rupees notification dated March 7, 2019",
        "rbi_summary": (
            "The ₹20 coin was designed specifically with visually impaired accessibility in mind: "
            "it has a 12-sided (dodecagonal) polygon shape, bi-metallic design, and is valid legal tender."
        ),
        "rbi_summary_ta": "₹20 நாணயம் 12 பக்கங்கள் கொண்ட செல்லுபடியாகும் சட்டப்பூர்வ நாணயமாகும்.",
        "rbi_summary_hi": "₹20 का 12-भुजाओं वाला द्वि-धात्विक सिक्का पूर्ण रूप से वैध मुद्रा है।",
        "physical_security_features": [
            "Distinct 12-edged (dodecagon) perimeter",
            "Bi-metallic construction: Nickel-Brass outer ring with Nickel-Silver center",
            "Ashoka Lion Capital with motto 'सत्यமேव जयते'",
            "Weight: 8.54 grams",
        ],
        "tactile_features_visually_impaired": (
            "Distinct 12-edged polygonal corners easily recognizable by fingertip touch."
        ),
    },
    "25 Paisa Coin": {
        "denomination": "25 Paisa Coin",
        "currency_type": "coin",
        "series": "Historical Cupro-Nickel / Ferritic Stainless Steel Series",
        "legal_tender": False,
        "circulation_status": "withdrawn_demonetized",
        "status_label": "Withdrawn — Ceased to be Legal Tender on June 30, 2011",
        "base_color": "Silver (Cupro-Nickel / Ferritic Stainless Steel)",
        "dimensions_mm": "Diameter: 19.0 mm, Weight: 2.83 g",
        "reverse_motif": "Denominational numeral 25 with rhinoceros or agricultural motif",
        "legal_basis": "Government of India Notification S.O. 2529 & RBI Circular DCM(NE) No.3402/09.07.01/2010-11",
        "rbi_summary": (
            "NOTICE: 25 Paisa coins (and all smaller denominations) were officially called in "
            "and CEASED to be legal tender with effect from June 30, 2011. They cannot be used "
            "for commercial transactions and are preserved only as historical numismatic items."
        ),
        "rbi_summary_ta": (
            "எச்சரிக்கை: 25 காசு நாணயங்கள் ஜூன் 30, 2011 முதல் செல்லாததாக்கப்பட்டுவிட்டன. "
            "இவற்றை பரிவர்த்தனைகளுக்குப் பயன்படுத்த முடியாது."
        ),
        "rbi_summary_hi": (
            "सूचना: 25 पैसे का सिक्का 30 जून 2011 से संचलन से बाहर होकर अमान्य घोषित हो चुका है। "
            "यह किसी भी वाणिज्यिक लेनदेन के लिए मान्य नहीं है।"
        ),
        "physical_security_features": [
            "Ashoka Lion Capital on obverse with 'भारत' and 'INDIA'",
            "Ferritic Stainless Steel / Cupro-Nickel composition",
            "Small 19.0 mm diameter",
        ],
        "tactile_features_visually_impaired": "Small 19.0mm diameter, reeded edge.",
    },
    "50 Paisa Coin": {
        "denomination": "50 Paisa Coin",
        "currency_type": "coin",
        "series": "Ferritic Stainless Steel Series (Introduced 1988/2008/2011)",
        "legal_tender": True,
        "circulation_status": "limited_legal_tender",
        "status_label": "Limited Legal Tender — Valid for Payments up to ₹10",
        "base_color": "Silver (Ferritic Stainless Steel)",
        "dimensions_mm": "Diameter: 22.0 mm, Thickness: 1.45 mm, Weight: 3.79 g",
        "reverse_motif": "Denominational numeral 50 with Indian map or lotus motif",
        "legal_basis": "Coinage Act, 2011 (Section 6)",
        "rbi_summary": (
            "Under Section 6 of the Coinage Act, 2011, genuine 50 paise coins remain valid legal tender "
            "for any sum not exceeding ten rupees (₹10). However, their day-to-day commercial usage "
            "is exceedingly rare."
        ),
        "rbi_summary_ta": (
            "50 காசு நாணயம் ₹10 வரை செலுத்துவதற்கு சட்டப்பூர்வமாக செல்லுபடியாகும் இந்திய அரசு நாணயமாகும்."
        ),
        "rbi_summary_hi": (
            "50 पैसे का सिक्का सिक्का अधिनियम 2011 की धारा 6 के तहत ₹10 तक के भुगतान के लिए वैध मुद्रा है।"
        ),
        "physical_security_features": [
            "Ferritic Stainless Steel construction",
            "Ashoka Lion Capital with motto 'सत्यमेव जयते'",
            "Diameter: 22.0 mm, Weight: 3.79 g",
            "Milled or plain edge",
        ],
        "tactile_features_visually_impaired": "Circular 22.0mm rim, serrated or smooth edge.",
    },
}

# Synonyms for matching detected labels to registry keys
NORMALIZED_LOOKUP: Dict[str, str] = {
    # Banknotes
    "10": "₹10",
    "₹10": "₹10",
    "10_rupees": "₹10",
    "rs10": "₹10",
    "20": "₹20",
    "₹20": "₹20",
    "20_rupees": "₹20",
    "rs20": "₹20",
    "50": "₹50",
    "₹50": "₹50",
    "50_rupees": "₹50",
    "rs50": "₹50",
    "100": "₹100",
    "₹100": "₹100",
    "100_rupees": "₹100",
    "rs100": "₹100",
    "200": "₹200",
    "₹200": "₹200",
    "200_rupees": "₹200",
    "rs200": "₹200",
    "500": "₹500",
    "₹500": "₹500",
    "500_rupees": "₹500",
    "rs500": "₹500",
    "2000": "₹2000",
    "₹2000": "₹2000",
    "2000_rupees": "₹2000",
    "rs2000": "₹2000",
    # Coins
    "1 coin": "₹1 Coin",
    "₹1 coin": "₹1 Coin",
    "1_coin": "₹1 Coin",
    "1 rupee coin": "₹1 Coin",
    "2 coin": "₹2 Coin",
    "₹2 coin": "₹2 Coin",
    "2_coin": "₹2 Coin",
    "2 rupees coin": "₹2 Coin",
    "5 coin": "₹5 Coin",
    "₹5 coin": "₹5 Coin",
    "5_coin": "₹5 Coin",
    "5 rupees coin": "₹5 Coin",
    "10 coin": "₹10 Coin",
    "₹10 coin": "₹10 Coin",
    "10_coin": "₹10 Coin",
    "10 rupees coin": "₹10 Coin",
    "20 coin": "₹20 Coin",
    "₹20 coin": "₹20 Coin",
    "20_coin": "₹20 Coin",
    "20 rupees coin": "₹20 Coin",
    "25 paisa coin": "25 Paisa Coin",
    "25_paisa_coin": "25 Paisa Coin",
    "25 paisa": "25 Paisa Coin",
    "25p coin": "25 Paisa Coin",
    "25p": "25 Paisa Coin",
    "50 paisa coin": "50 Paisa Coin",
    "50_paisa_coin": "50 Paisa Coin",
    "50 paisa": "50 Paisa Coin",
    "50p coin": "50 Paisa Coin",
    "50p": "50 Paisa Coin",
}


# ---------------------------------------------------------------------------
# Sourced Counterfeit Advisory & Reporting Protocol
# ---------------------------------------------------------------------------

RBI_COUNTERFEIT_ADVISORY = (
    "IMPORTANT LEGAL NOTICE: Visual camera scans cannot guarantee that a banknote is genuine. "
    "Features such as intaglio ink tactile ridges, magnetic ink, UV fluorescence, and watermark depth "
    "require specialized physical and laboratory inspection. "
    "If you suspect a note is counterfeit, NEVER attempt to pass it to someone else (an offence under Section 489B IPC). "
    "As per RBI Master Direction DCM(FNVD) No. G-1/16.01.52/2023-24, present the note to any commercial bank branch. "
    "The bank will impound the note and issue an official Acknowledgement Receipt (Form I)."
)

RBI_COUNTERFEIT_ADVISORY_TA = (
    "முக்கிய அறிவிப்பு: கேமரா மூலம் மட்டுமே ஒரு ரூபாய் நோட்டு அசல் என்பதை உறுதிப்படுத்த முடியாது. "
    "சந்தேகத்திற்குரிய நோட்டுகளை மற்றவர்களுக்குக் கொடுப்பது சட்டப்படி குற்றமாகும். "
    "அருகிலுள்ள வங்கி கிளையில் ஒப்படைத்து ரசீது பெற்றுக் கொள்ளவும்."
)

RBI_COUNTERFEIT_ADVISORY_HI = (
    "महत्वपूर्ण कानूनी सूचना: केवल कैमरा स्कैन से किसी नोट के असली होने की पूर्ण पुष्टि नहीं की जा सकती। "
    "यदि नोट पर संदेह हो, तो उसे किसी अन्य व्यक्ति को न दें। बैंक शाखा में ले जाकर आधिकारिक रसीद प्राप्त करें।"
)


# ---------------------------------------------------------------------------
# Core Service Functions
# ---------------------------------------------------------------------------

def resolve_currency_key(denomination: str) -> Optional[str]:
    """Resolve a raw denomination string to its canonical registry key."""
    cleaned = denomination.strip().lower()
    if cleaned in NORMALIZED_LOOKUP:
        return NORMALIZED_LOOKUP[cleaned]
    # Check direct match in registry
    for k in CURRENCY_REGISTRY:
        if k.lower() == cleaned:
            return k
    return None


def get_currency_info(denomination: str) -> Optional[Dict[str, Any]]:
    """Fetch complete RBI metadata for a given denomination."""
    key = resolve_currency_key(denomination)
    if not key:
        return None
    return CURRENCY_REGISTRY.get(key)


def get_all_currency_info() -> List[Dict[str, Any]]:
    """Fetch complete list of all official RBI currency specifications for all 14 classes."""
    return list(CURRENCY_REGISTRY.values())


def build_safety_check(
    denomination: str,
    confidence: float,
    image_quality: Optional[Dict[str, Any]] = None,
    language: str = "en",
) -> Dict[str, Any]:
    """Build the official 3-part Currency Safety Check result.

    Parts:
    1. Recognized denomination & confidence
    2. Sourced legal & circulation status information
    3. Authenticity physical guidance and observable anomaly screening
    """
    key = resolve_currency_key(denomination)
    info = CURRENCY_REGISTRY.get(key) if key else None
    today_str = datetime.now(timezone.utc).strftime("%B %d, %Y")

    # Observable image anomalies that the system can genuinely check
    observable_concern = False
    concern_reasons: List[str] = []

    if image_quality:
        if image_quality.get("is_blurry"):
            concern_reasons.append("Image is blurry; fine security microprinting is obscured.")
        if image_quality.get("is_poorly_lit"):
            concern_reasons.append("Extreme lighting or underexposure impedes color-shift thread visibility.")
        if image_quality.get("framing_concern"):
            concern_reasons.append(image_quality.get("framing_concern"))

    if concern_reasons:
        observable_concern = True

    # Multi-lingual summary
    if info:
        if language == "ta":
            rbi_summary = info.get("rbi_summary_ta", info["rbi_summary"])
            advisory = RBI_COUNTERFEIT_ADVISORY_TA
        elif language == "hi":
            rbi_summary = info.get("rbi_summary_hi", info["rbi_summary"])
            advisory = RBI_COUNTERFEIT_ADVISORY_HI
        else:
            rbi_summary = info["rbi_summary"]
            advisory = RBI_COUNTERFEIT_ADVISORY

        currency_type = info["currency_type"]
        legal_tender = info["legal_tender"]
        circulation_status = info["circulation_status"]
        status_label = info["status_label"]
        features = info.get("physical_security_features", [])
        tactile_feat = info.get("tactile_features_visually_impaired", "")
    else:
        # Fallback for unlisted/custom denomination
        currency_type = "coin" if "coin" in denomination.lower() else "banknote"
        legal_tender = True
        circulation_status = "active_circulation"
        status_label = "Unverified Denomination Class"
        rbi_summary = (
            f"Denomination {denomination} is not in the standard RBI currency registry. "
            "Please verify the denomination manually."
        )
        advisory = RBI_COUNTERFEIT_ADVISORY
        features = ["Manual verification required"]
        tactile_feat = "Check raised tactile lines or coin edge manually."

    return {
        "denomination": denomination,
        "currency_type": currency_type,
        "recognized": True,
        "confidence": round(confidence, 4),
        "is_low_confidence": confidence < 0.50,
        "legal_tender": legal_tender,
        "circulation_status": circulation_status,
        "status_label": status_label,
        "rbi_summary": rbi_summary,
        "checked_date": today_str,
        "physical_features_to_check": features,
        "tactile_guide_for_visually_impaired": tactile_feat,
        "authenticity_advisory": advisory,
        "observable_anomaly_detected": observable_concern,
        "anomaly_reasons": concern_reasons,
    }
