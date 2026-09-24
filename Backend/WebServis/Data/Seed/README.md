# Ürün kataloğu seed verisi

`products-tr.json.gz` — WebServis açılışında `Products` tablosu boşsa `ProductSeeder` tarafından yüklenir.

**Kaynak:** [Open Food Facts](https://world.openfoodfacts.org), [Open Beauty Facts](https://world.openbeautyfacts.org),
[Open Products Facts](https://world.openproductsfacts.org) — Türkiye'de satılan ürünler + GS1 Türkiye (`869…`) barkodlu ürünler.

**Lisans:** Veritabanı [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/), ürün görselleri
[CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). Uygulamada kaynak belirtilmesi gerekir
("Ürün verileri: Open Food Facts katkıcıları").

**Yeniden üretme:** `scripts/catalog/build_seed.py` (bkz. dosya başındaki açıklama).
Fiyat bilgisi içermez — alış/satış fiyatları ve stok mağaza bazında `StoreProducts` tablosunda tutulur.
