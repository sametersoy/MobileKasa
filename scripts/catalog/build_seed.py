"""Open Food/Beauty/Products Facts Türkiye verisinden WebServis ürün seed dosyasını üretir.

Kaynak: Open*Facts resmi CSV dökümleri (static.<site>.org/data/en.<site>.org.products.csv.gz; food ~1,3 GB).
Filtre: Türkiye'de satılan ürünler (countries_tags ∋ en:turkey) + GS1 Türkiye barkodlu (869…) ürünler.
Kullanım: python3 build_seed.py <indirme_klasörü> Backend/WebServis/Data/Seed/products-tr.json.gz
          (dosyalar klasörde yoksa indirilir; ek paket gerekmez)
"""
import csv
import gzip
import json
import os
import re
import shutil
import sys
import urllib.request
from collections import Counter

csv.field_size_limit(sys.maxsize)

# (slug, ad, eşleşen OFF kategori etiketleri) — sıra önemli: ilk eşleşen kazanır
CATEGORIES = [
    ("bebek", "Bebek Ürünleri", ["en:baby-foods", "en:baby-milks", "en:infant-formulas"]),
    ("su", "Su & Maden Suyu", ["en:waters", "en:mineral-waters", "en:spring-waters"]),
    ("gazli-icecek", "Gazlı İçecekler", ["en:sodas", "en:carbonated-drinks", "en:colas"]),
    ("meyve-suyu", "Meyve Suyu", ["en:fruit-juices", "en:juices-and-nectars", "en:nectars", "en:fruit-based-beverages"]),
    ("cay-kahve", "Çay & Kahve", ["en:teas", "en:tea-bags", "en:coffees", "en:instant-coffees", "en:herbal-teas"]),
    ("icecek", "Diğer İçecekler", ["en:beverages", "en:plant-milks", "en:ayran", "en:energy-drinks"]),
    ("dondurma", "Dondurma", ["en:ice-creams", "en:frozen-desserts"]),
    ("peynir", "Peynir", ["en:cheeses"]),
    ("yogurt", "Yoğurt", ["en:yogurts", "en:fermented-milk-products"]),
    ("sut", "Süt & Süt Ürünleri", ["en:milks", "en:dairies", "en:butters", "en:creams"]),
    ("sarkuteri", "Şarküteri", ["en:sausages", "en:sucuk", "en:salamis", "en:prepared-meats", "en:hams", "en:pastirma"]),
    ("et-tavuk", "Et & Tavuk", ["en:meats", "en:poultries", "en:chickens", "en:fishes", "en:seafood"]),
    ("kahvaltilik", "Kahvaltılık", ["en:honeys", "en:jams", "en:spreads", "en:hazelnut-spreads", "en:tahini",
                                    "en:molasses", "en:olives", "en:breakfast-cereals", "en:breakfasts"]),
    ("cikolata-sekerleme", "Çikolata & Şekerleme", ["en:chocolates", "en:confectioneries", "en:candies",
                                                    "en:chewing-gum", "en:turkish-delights", "en:halva"]),
    ("biskuvi-kek", "Bisküvi & Kek", ["en:biscuits", "en:cakes", "en:wafers", "en:biscuits-and-cakes", "en:pastries"]),
    ("atistirmalik", "Cips & Atıştırmalık", ["en:chips-and-fries", "en:crisps", "en:salty-snacks", "en:crackers",
                                            "en:nuts", "en:dried-fruits", "en:popcorn", "en:snacks"]),
    ("makarna-pirinc-bakliyat", "Makarna, Pirinç & Bakliyat", ["en:pastas", "en:rices", "en:legumes", "en:bulgur",
                                                               "en:noodles", "en:cereal-grains"]),
    ("un-ekmek", "Un & Unlu Mamuller", ["en:flours", "en:breads", "en:yeasts", "en:baking-decorations"]),
    ("yag", "Yağlar", ["en:fats", "en:vegetable-oils", "en:olive-oils", "en:margarines"]),
    ("sos-baharat", "Sos, Salça & Baharat", ["en:sauces", "en:condiments", "en:spices", "en:tomato-pastes",
                                            "en:salts", "en:vinegars", "en:ketchup", "en:mayonnaises"]),
    ("seker-tatli", "Şeker & Tatlı Malzemesi", ["en:sugars", "en:desserts", "en:dessert-mixes", "en:puddings"]),
    ("konserve", "Konserve & Hazır Yemek", ["en:canned-foods", "en:meals", "en:soups", "en:pickles", "en:prepared-vegetables"]),
    ("dondurulmus", "Dondurulmuş Gıda", ["en:frozen-foods"]),
    ("meyve-sebze", "Meyve & Sebze", ["en:fruits", "en:vegetables", "en:fresh-foods"]),
    ("kisisel-bakim", "Kişisel Bakım & Kozmetik", []),   # Open Beauty Facts ürünleri
    ("ev-temizlik", "Ev & Temizlik", []),                 # Open Products Facts ürünleri
    ("diger", "Diğer", []),
]
TAG_TO_SLUG = {}
for slug, _, tags in CATEGORIES:
    for t in tags:
        TAG_TO_SLUG.setdefault(t, slug)

CATEGORY_ORDER = {slug: i for i, (slug, _, _) in enumerate(CATEGORIES)}

# OFF etiketi olmayan ürünler için ad tabanlı sınıflandırma (Türkçe karakterler sadeleştirilmiş).
# Sıra önemli: ilk eşleşen kazanır. 5+ harfli kelimeler ön ek olarak eşleşir (peynir → peyniri), kısalar tam eşleşir.
NAME_KEYWORDS = [
    ("bebek", ["bebek", "baby", "devam sutu"]),
    ("kisisel-bakim", ["sampuan", "shampoo", "sabun", "soap", "deodorant", "dis macunu", "toothpaste", "parfum",
                       "losyon", "lotion", "sac kremi", "tiras", "islak mendil", "wet wipes", "schaumfestiger", "hijyenik"]),
    ("ev-temizlik", ["deterjan", "detergent", "detergente", "bulasik", "camasir", "temizleyici", "cleaner",
                     "yumusatici", "cop torbasi", "pecete", "tuvalet kagidi", "kagit havlu"]),
    ("dondurma", ["dondurma", "ice cream", "magnum", "cornetto", "algida"]),
    ("gazli-icecek", ["kola", "cola", "gazoz", "fanta", "sprite", "gazli"]),
    ("meyve-suyu", ["nektar", "nectar", "nektari", "juice", "meyve suyu", "saft", "portakal suyu", "elma suyu", "visne suyu", "nar suyu",
                    "seftali suyu", "kayisi suyu", "limon suyu", "havuc suyu", "domates suyu"]),
    ("icecek", ["ice tea", "icetea", "ayran", "boza", "salgam", "icecek", "drink", "limonata", "lemonade",
                "enerji", "energy", "kefir"]),
    ("su", ["su", "suyu", "water", "soda", "maden"]),
    ("cay-kahve", ["cay", "tea", "kahve", "coffee", "nescafe", "matcha", "espresso", "latte", "cappuccino"]),
    ("cikolata-sekerleme", ["cikolata", "chocolate", "choco", "chocolat", "schokolade", "lokum", "turkish delight",
                            "sekerleme", "candy", "jelly", "haribo", "sakiz", "helva", "halva", "pismaniye",
                            "pismanije", "draje", "karamel", "caramel", "bonbon", "yupo"]),
    ("biskuvi-kek", ["biskuvi", "biscuit", "cookie", "kurabiye", "gofret", "wafer", "kek", "cake", "cakes", "brownie",
                     "tart", "petibor", "halley", "negro"]),
    ("peynir", ["peynir", "cheese", "kasar", "lor", "labne", "tulum", "cheddar", "mozzarella", "hellim"]),
    ("yogurt", ["yogurt", "yoghurt"]),
    ("sut", ["sut", "milk", "tereyag", "tereyagi", "butter", "krema"]),
    ("sarkuteri", ["sucuk", "salam", "salami", "sosis", "pastirma", "jambon", "fume", "kavurma"]),
    ("et-tavuk", ["tavuk", "pilic", "chicken", "hindi", "dana", "kuzu", "kofte", "burger", "balik", "ton baligi",
                  "tuna", "somon", "nugget", "schnitzel"]),
    ("yag", ["zeytinyag", "zeytinyagi", "olive oil", "sunflower oil", "aycicek yag", "aycicek yagi", "yag", "yagi",
             "oil", "margarin", "tournesol"]),
    ("kahvaltilik", ["bal", "honey", "recel", "receli", "jam", "marmelat", "tahin", "pekmez", "zeytin", "olive",
                     "olives", "oliven", "ezmesi", "nutella", "musli", "granola", "gevrek", "corn flakes", "kaymak"]),
    ("atistirmalik", ["cips", "chips", "kraker", "cracker", "crackers", "cubuk", "sticks", "cerez", "fistik",
                      "findik", "badem", "leblebi", "patlamis", "popcorn", "tortilla", "kuruyemis", "protein",
                      "whey", "bar"]),
    ("makarna-pirinc-bakliyat", ["makarna", "spagetti", "spaghetti", "eriste", "noodle", "noodles", "pirinc",
                                 "rice", "bulgur", "mercimek", "nohut", "fasulye", "lentil", "chickpea", "kuskus"]),
    ("un-ekmek", ["un", "flour", "ekmek", "ekmegi", "bread", "lavas", "bazlama", "simit", "maya", "yeast", "yufka",
                  "galeta"]),
    ("sos-baharat", ["sos", "sosu", "sauce", "ketcap", "ketchup", "mayonez", "mayonnaise", "hardal", "mustard",
                     "salca", "salcasi", "biber", "baharat", "spice", "tuz", "salt", "sirke", "vinegar", "eksisi",
                     "kimyon", "nane", "kekik", "paprika", "paprikamark", "sumak"]),
    ("seker-tatli", ["toz seker", "kup seker", "puding", "pudding", "jole", "tatli", "sutlac", "kazandibi", "irmik",
                     "muhallebi", "keskul", "kremsanti"]),
    ("konserve", ["konserve", "tursu", "pickle", "pickled", "corba", "soup", "sarma", "dolma", "bamya", "bezelye",
                  "hazir yemek"]),
    ("dondurulmus", ["dondurulmus", "frozen"]),
]
_TR = str.maketrans("çğıöşüÇĞİÖŞÜâîû", "cgiosucgiosuaiu")


def normalize(text):
    return " ".join(re.findall(r"[a-z0-9]+", text.translate(_TR).lower()))


def category_from_name(name):
    tokens = normalize(name).split()
    padded = f" {' '.join(tokens)} "
    for slug, keywords in NAME_KEYWORDS:
        for kw in keywords:
            if " " in kw:
                if f" {kw} " in padded:
                    return slug
            elif any(t == kw or (len(kw) >= 5 and t.startswith(kw)) for t in tokens):
                return slug
    return None

UNIT_PIECE = 0  # Paketli ürünler adet; tartılı satış mağaza tarafında ayarlanır
SRC_FOOD, SRC_BEAUTY, SRC_PRODUCTS = 1, 2, 3
SOURCES = [("openfoodfacts", SRC_FOOD), ("openbeautyfacts", SRC_BEAUTY), ("openproductsfacts", SRC_PRODUCTS)]


def valid_gtin(code: str) -> bool:
    if not code.isdigit() or len(code) not in (8, 12, 13, 14):
        return False
    digits = [int(c) for c in code]
    check = digits.pop()
    total = sum(d * (3 if i % 2 == 0 else 1) for i, d in enumerate(reversed(digits)))
    return (10 - total % 10) % 10 == check


LATIN = re.compile(r"[A-Za-zÇĞİÖŞÜçğıöşü]{2,}")


def clean(text, maxlen):
    if not text:
        return None
    text = re.sub(r"\s+", " ", text).strip(" ,;-")
    return text[:maxlen] or None


def category_of(tags, source, name):
    if source == SRC_BEAUTY:
        return "kisisel-bakim"
    if source == SRC_PRODUCTS:
        return "ev-temizlik"
    # Etiketlerden eşleşen kategoriler içinde CATEGORIES sırasında önce geleni (daha özel olanı) seç
    hits = [TAG_TO_SLUG[t] for t in (tags or []) if t in TAG_TO_SLUG]
    if hits:
        return min(hits, key=CATEGORY_ORDER.get)
    return category_from_name(name) or "diger"


def download(site, in_dir):
    path = f"{in_dir}/{site}.csv.gz"
    if not os.path.exists(path):
        url = f"https://static.{site}.org/data/en.{site}.org.products.csv.gz"
        request = urllib.request.Request(url, headers={"User-Agent": "MobilKasa/1.0 (catalog seed)"})
        with urllib.request.urlopen(request) as r, open(path, "wb") as f:
            shutil.copyfileobj(r, f, 1 << 20)
    return path


def main(in_dir, out_file):
    products = {}
    for site, source in SOURCES:
        with gzip.open(download(site, in_dir), "rt", encoding="utf-8", errors="replace") as f:
            for row in csv.DictReader(f, delimiter="\t", quoting=csv.QUOTE_NONE):
                code = (row.get("code") or "").strip()
                countries = (row.get("countries_tags") or "").split(",")
                if "en:turkey" not in countries and not code.startswith("869"):
                    continue
                if not valid_gtin(code):
                    continue
                name = clean(row.get("product_name"), 300)
                if not name or len(name) < 3 or not LATIN.search(name):
                    continue
                brand = clean((row.get("brands") or "").split(",")[0], 200)
                image = (row.get("image_url") or "").strip() or None
                entry = {
                    "barcode": code,
                    "name": name,
                    "brand": brand,
                    "category": category_of((row.get("categories_tags") or "").split(","), source, name),
                    "quantity": clean(row.get("quantity"), 50),
                    "unit": UNIT_PIECE,
                    "imageUrl": image,
                    "source": source,
                }
                old = products.get(code)
                # Aynı barkod birden fazla kaynakta varsa, görseli/markası olanı tut
                if not old or (not old["imageUrl"] and image) or (not old["brand"] and brand):
                    products[code] = entry
        print(site, "→ toplam", len(products), flush=True)

    used = {p["category"] for p in products.values()}
    seed = {
        "categories": [{"slug": s, "name": n, "sortOrder": i}
                       for i, (s, n, _) in enumerate(CATEGORIES) if s in used],
        "products": sorted(products.values(), key=lambda p: p["barcode"]),
    }
    with gzip.open(out_file, "wt", encoding="utf-8") as f:
        json.dump(seed, f, ensure_ascii=False, separators=(",", ":"))

    print(f"{len(products)} ürün, {len(seed['categories'])} kategori")
    for slug, n in Counter(p["category"] for p in products.values()).most_common():
        print(f"  {n:6d}  {slug}")
    print("görselli:", sum(1 for p in products.values() if p["imageUrl"]),
          "markalı:", sum(1 for p in products.values() if p["brand"]))


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
