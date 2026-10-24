"""Check generated pages, crawlable local links, SEO metadata and static prices."""
import json
import unittest
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent.parent

class Document(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.h1 = 0
        self.ids = []
        self.links = []
        self.assets = []
        self.canonical = []
        self.description = []
        self.titles = []
        self.in_title = False
        self.feed(source)
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        self.h1 += tag == 'h1'
        if 'id' in a: self.ids.append(a['id'])
        if tag == 'a' and 'href' in a: self.links.append(a['href'])
        if tag in ('img', 'script') and a.get('src'): self.assets.append(a['src'])
        if tag == 'link' and a.get('rel') == 'stylesheet': self.assets.append(a['href'])
        if tag == 'link' and a.get('rel') == 'canonical': self.canonical.append(a['href'])
        if tag == 'meta' and a.get('name') == 'description': self.description.append(a['content'])
        if tag == 'title': self.in_title = True
    def handle_endtag(self, tag):
        if tag == 'title': self.in_title = False
    def handle_data(self, data):
        if self.in_title: self.titles.append(data)

class SiteTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.pages = json.loads((ROOT / 'site-manifest.json').read_text())['pages']
        cls.docs = {p: Document((ROOT / p).read_text()) for p in cls.pages}
    def test_metadata_and_headings(self):
        titles, descriptions = [], []
        for name, doc in self.docs.items():
            with self.subTest(page=name):
                self.assertEqual(doc.h1, 1)
                self.assertEqual(len(doc.ids), len(set(doc.ids)))
                self.assertEqual(len(doc.canonical), 1)
                canonical_name = 'cennik-zlota.html' if name == 'cennik.html' else name
                self.assertEqual(doc.canonical[0], 'https://lombard-gorzow.pl' + ('/' if canonical_name == 'index.html' else '/' + canonical_name))
                self.assertEqual(len(doc.description), 1)
                self.assertTrue(doc.description[0])
                self.assertTrue(doc.titles)
                titles.append(''.join(doc.titles))
                descriptions.append(doc.description[0])
        self.assertEqual(len(titles), len(set(titles)))
        self.assertEqual(len(descriptions), len(set(descriptions)))
    def test_local_links_and_assets(self):
        for name, doc in self.docs.items():
            for url in doc.links + doc.assets:
                parsed = urlsplit(url)
                if parsed.scheme or parsed.netloc: continue
                target = (ROOT / name).parent / unquote(parsed.path) if parsed.path else ROOT / name
                with self.subTest(page=name, url=url):
                    self.assertTrue(target.is_file())
                    if parsed.fragment and target.suffix == '.html':
                        self.assertIn(parsed.fragment, Document(target.read_text()).ids)
    def test_crawlable_articles_and_sitemap(self):
        articles = [p for p in self.pages if p.startswith('blog/')]
        self.assertEqual(len(articles), 4)
        for article in articles:
            self.assertIn(article, self.docs['blog.html'].links)
            self.assertIn('BlogPosting', (ROOT / article).read_text())
        locations = [x.text for x in ET.parse(ROOT / 'sitemap.xml').findall('.//{*}loc')]
        self.assertCountEqual(locations, sorted(set(d.canonical[0] for d in self.docs.values())))
    def test_all_metal_prices_exist_without_javascript(self):
        snapshot = json.loads((ROOT / 'prices-snapshot.json').read_text())
        for metal, filename in [('gold', 'cennik-zlota.html'), ('silver', 'cennik-srebra.html'), ('platinum', 'cennik-platyny.html'), ('palladium', 'cennik-palladu.html')]:
            source = (ROOT / filename).read_text()
            self.assertIn('data-price-metal="' + metal + '"', source)
            for purity, entry in snapshot['metals'][metal]['purities'].items():
                price = f"{entry['price']:,.2f}".replace(',', ' ').replace('.', ',')
                self.assertIn(price + ' zł/g', source)
            self.assertIn('disabled aria-disabled="true">Brylanty', source)
    def test_home_summary_replaces_blog_preview(self):
        source = (ROOT / 'index.html').read_text()
        snapshot = json.loads((ROOT / 'prices-snapshot.json').read_text())
        self.assertNotIn('class="blog-card"', source)
        self.assertIn('data-summary-price="gold"', source)
        self.assertIn('data-summary-price="silver"', source)
        for metal, purity in [('gold', '585'), ('silver', '925')]:
            value = f"{snapshot['metals'][metal]['purities'][purity]['price']:,.2f}".replace(',', ' ').replace('.', ',')
            self.assertIn(value, source)
        self.assertIn('Pełny cennik', source)

    def test_price_entry_has_table_and_footer_has_new_domains(self):
        source = (ROOT / 'cennik.html').read_text()
        self.assertIn('data-price-metal="gold"', source)
        self.assertIn('aria-label="Wybierz metal"', source)
        self.assertIn('id="price-rows"', source)
        self.assertNotIn('class="service-links"', source)
        for name in self.pages:
            page = (ROOT / name).read_text()
            for domain in ('obrączkigorzów.pl', 'skupzłotagorzów.pl'):
                self.assertIn('https://www.' + domain.encode('idna').decode(), page)

    def test_only_needed_scripts(self):
        for name, doc in self.docs.items():
            js = [urlsplit(a).path for a in doc.assets if '.js' in a]
            self.assertEqual('prices.js' in js, name.startswith('cennik-') or name == 'cennik.html')
            self.assertEqual('calculator.js' in js, name == 'kalkulator-oplat.html')
            self.assertEqual('home-prices.js' in js, name == 'index.html')

if __name__ == '__main__': unittest.main()
