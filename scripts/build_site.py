#!/usr/bin/env python3
"""Build crawlable static pages using only Python's standard library."""
import hashlib
import html
import json
import re
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parent.parent
BASE = 'https://lombard-gorzow.pl'
DATA = json.loads((ROOT / 'content/site.json').read_text())
SNAPSHOT = json.loads((ROOT / 'prices-snapshot.json').read_text())
SECTIONS = DATA['sections']
METALS = {
    'gold': ('złota', 'Złoto', 'cennik-zlota.html'),
    'silver': ('srebra', 'Srebro', 'cennik-srebra.html'),
    'platinum': ('platyny', 'Platyna', 'cennik-platyny.html'),
    'palladium': ('palladu', 'Pallad', 'cennik-palladu.html'),
}
ROUTES = {'przyjmujemy': 'co-przyjmujemy.html', 'sprzedaz': 'na-sprzedaz.html', 'zloto': 'cennik-zlota.html',
          'kalkulator': 'kalkulator-oplat.html', 'blog': 'blog.html', 'kontakt': 'kontakt.html',
          'wycena': 'kontakt.html#wycena', 'zasady': 'co-przyjmujemy.html'}
PAGES = []
CANONICAL_PATHS = {'cennik.html': 'cennik-zlota.html'}

def escape(s):
    return html.escape(str(s), quote=True)

def revision(filename):
    return hashlib.sha256((ROOT / filename).read_bytes()).hexdigest()[:10]

def links(fragment, prefix):
    for anchor, route in ROUTES.items():
        fragment = fragment.replace(f'href="#{anchor}"', f'href="{prefix}{route}"')
    fragment = fragment.replace('href="#"', f'href="{prefix}index.html"')
    fragment = re.sub(r'src="(assets/[^"?]+)"', lambda m: f'src="{prefix}{m[1]}?v={revision(m[1])}"', fragment)
    return fragment

def page(path, title, description, content, scripts=(), article=None):
    prefix = '../' if '/' in path else ''
    canonical_path = CANONICAL_PATHS.get(path, path)
    canonical = BASE + ('/' if canonical_path == 'index.html' else '/' + canonical_path)
    header = links(DATA['header'], prefix)
    header = header.replace('>Cennik skupu złota</a>', '>Cennik skupu</a>').replace(f'href="{prefix}cennik-zlota.html">Cennik skupu', f'href="{prefix}cennik.html">Cennik skupu')
    header = header.replace(f'href="{prefix}{path}"', f'href="{prefix}{path}" aria-current="page"')
    if path.startswith('cennik-'):
        header = header.replace(f'href="{prefix}cennik.html"', f'href="{prefix}cennik.html" aria-current="page"')
    schemas = [{'@context': 'https://schema.org', '@type': 'WebSite', 'name': 'Lombard Sezam', 'url': BASE + '/'}]
    if article:
        schemas.append({'@context': 'https://schema.org', '@type': 'BlogPosting', 'headline': article['title'],
                        'description': article['lead'], 'image': BASE + '/assets/' + article['image'],
                        'author': {'@type': 'Organization', 'name': 'Lombard Sezam'}, 'mainEntityOfPage': canonical})
    image = BASE + '/assets/' + (article['image'] if article else 'lombard-gotowka.webp')
    schemas_json = json.dumps(schemas, ensure_ascii=False).replace('</', '<\\/')
    script_tags = ''.join(f'<script defer src="{prefix}{script}?v={revision(script)}"></script>' for script in scripts)
    body = f'''<!doctype html>
<html lang="pl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{escape(title)}</title><meta name="description" content="{escape(description)}"><link rel="canonical" href="{canonical}">
<meta property="og:type" content="{'article' if article else 'website'}"><meta property="og:title" content="{escape(title)}"><meta property="og:description" content="{escape(description)}"><meta property="og:url" content="{canonical}"><meta property="og:image" content="{image}"><meta property="og:locale" content="pl_PL">
<link rel="stylesheet" href="{prefix}style.css?v={revision('style.css')}">
<script type="application/ld+json">{schemas_json}</script>
<script defer src="{prefix}app.js?v={revision('app.js')}"></script>
{script_tags}
</head><body><a class="skip-link" href="#tresc">Przejdź do treści</a>{header}<main id="tresc">{links(content, prefix)}</main>{links(DATA['footer'], prefix)}</body></html>'''
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(body)
    PAGES.append(path)

def intro(title, paragraph):
    return f'<section class="page-intro"><div class="eyebrow">LOMBARD SEZAM · GORZÓW WIELKOPOLSKI</div><h1>{title}</h1><p>{paragraph}</p></section>'

def blog_cards(limit=None):
    posts = DATA['posts'][:limit] if limit else DATA['posts']
    return '<div class="blog-grid">' + ''.join(f'''<article class="blog-card"><a class="blog-image-link" href="blog/{p['slug']}.html" aria-label="{escape(p['title'])}"><img class="blog-photo" src="assets/{p['image']}" alt="{escape(p['title'])} — ilustracja poglądowa" loading="lazy" decoding="async" width="1672" height="941"></a><div class="blog-meta">PORADNIK LOMBARDU SEZAM</div><h2 class="blog-card-title"><a href="blog/{p['slug']}.html">{escape(p['title'])}</a></h2><p class="blog-lead">{escape(p['lead'])}</p><a class="read-article" href="blog/{p['slug']}.html">Czytaj artykuł →</a></article>''' for p in posts) + '</div>'

home = SECTIONS['hero']
home += '<section class="home-links"><h2>W czym możemy pomóc?</h2><div class="service-links"><a href="co-przyjmujemy.html"><span class="service-icon" aria-hidden="true"><svg viewBox="0 0 24 26" width="30" height="32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 8 9-5 9 5-9 5-9-5Zm0 0v9l9 5 9-5V8M12 13v9M7.5 5.5l9 5"/></svg></span><strong>Co przyjmujemy</strong><span>Złoto, elektronika, elektronarzędzia, rowery i inne przedmioty →</span></a><a href="cennik.html"><span class="service-icon" aria-hidden="true"><svg viewBox="0 0 24 26" width="30" height="32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="9" cy="8" rx="6" ry="3"/><path d="M3 8v5c0 1.7 2.7 3 6 3m-6-5c0 1.7 2.7 3 6 3"/><ellipse cx="15" cy="16" rx="6" ry="3"/><path d="M9 16v4c0 1.7 2.7 3 6 3s6-1.3 6-3v-4M17 4l1-2 1 2 2 1-2 1-1 2-1-2-2-1 2-1Z"/></svg></span><strong>Cennik metali szlachetnych</strong><span>Sprawdź skup złota, srebra, platyny i palladu →</span></a><a href="na-sprzedaz.html"><span class="service-icon" aria-hidden="true"><svg viewBox="0 0 24 26" width="30" height="32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 7h14l2 14H3L5 7Z"/><path d="M8 8V6a4 4 0 0 1 8 0v2M8 14l3 3 5-5"/></svg></span><strong>Na sprzedaż</strong><span>Zobacz nasze aktualne ogłoszenia na OLX →</span></a></div></section>'
summary_stamp = datetime.fromisoformat(SNAPSHOT['fetchedAt'].replace('Z', '+00:00')).astimezone(ZoneInfo('Europe/Warsaw')).strftime('%d.%m.%Y, %H:%M')
home += f'<section class="home-price-summary" data-snapshot-date="{summary_stamp}"><div class="section-head"><div><div class="eyebrow">SPRAWDŹ WARTOŚĆ SWOICH METALI</div><h2>Ceny skupu złota i srebra</h2></div></div><div class="summary-price-grid">'
for metal, purity, label, route in [('gold', '585', 'Złoto', 'cennik-zlota.html'), ('silver', '925', 'Srebro', 'cennik-srebra.html')]:
    amount = f"{SNAPSHOT['metals'][metal]['purities'][purity]['price']:,.2f}".replace(',', ' ').replace('.', ',')
    home += f'<a class="summary-price-card {metal}" href="{route}"><span class="summary-metal">{label} <small>próba {purity}</small></span><span class="summary-amount"><strong data-summary-price="{metal}">{amount}</strong> <span>zł/g</span></span></a>'
home += f'</div><p class="summary-price-status" role="status">Ostatnio pobrane ceny · notowania: {summary_stamp} (Polska). Aktualność potwierdzisz telefonicznie.</p><a class="button" href="cennik.html">Pełny cennik →</a></section>'
page('index.html', 'Lombard Gorzów — pożyczki pod zastaw | Sezam', 'Lombard Sezam w Gorzowie Wielkopolskim. Pożyczki pod zastaw, 5% za 30 dni dla nowych klientów. Skup metali szlachetnych. Pocztowa 11.', home, scripts=('home-prices.js',))

accepted = SECTIONS['przyjmujemy'].replace('<h2>Co <em>przyjmujemy?</em></h2>', '<h1>Co przyjmujemy w lombardzie w Gorzowie?</h1>')
accepted += '<section class="reading-section"><h2>Przynieś przedmiot lub zapytaj o wycenę</h2><p>Przyjmujemy różne wartościowe przedmioty. Podane kategorie to przykłady, a nie zamknięta lista. Jeśli masz inny przedmiot, napisz do Lombardu Sezam lub zadzwoń. Ustalimy, czy możemy go przyjąć i jakie informacje będą potrzebne.</p><p>Przy elektronice i elektronarzędziach podaj model, stan oraz posiadane akcesoria. Do roweru przygotuj informacje o wyposażeniu i ewentualnych usterkach. Przy złocie i srebrze znaczenie mają między innymi próba oraz masa. Ostateczna wycena wymaga sprawdzenia przedmiotu.</p><a class="button" href="kontakt.html">Zapytaj o swój przedmiot →</a></section>'
page('co-przyjmujemy.html', 'Co przyjmujemy pod zastaw? Lombard Gorzów | Sezam', 'Złoto, srebro, telefony, laptopy, elektronarzędzia i rowery. Sprawdź, co przyjmuje Lombard Sezam w Gorzowie i jak przygotować przedmiot do wyceny.', accepted)

sales = intro('Na sprzedaż — oferty Lombardu Sezam', 'Przeglądaj aktualne przedmioty w naszych ogłoszeniach OLX. Zdjęcia, ceny i dostępność znajdziesz przy konkretnej ofercie.') + SECTIONS['sprzedaz']
sales += '<section class="reading-section"><h2>Sprawdź szczegóły przed zakupem</h2><p>Nasze ogłoszenia obejmują różne przedmioty, w tym biżuterię i elektronikę. Oferta zmienia się, dlatego przed przyjazdem na ul. Pocztową 11 w Gorzowie potwierdź dostępność interesującej Cię rzeczy.</p><p>Zapoznaj się z opisem stanu, zestawem akcesoriów i warunkami sprzedaży w ogłoszeniu. Masz pytanie o konkretny przedmiot? Prześlij nam link przez WhatsApp.</p><a class="link" href="kontakt.html">Kontakt z Lombardem Sezam →</a></section>'
page('na-sprzedaz.html', 'Na sprzedaż — oferty OLX | Lombard Sezam Gorzów', 'Zobacz aktualne oferty Lombardu Sezam w Gorzowie na OLX. Przedmioty, zdjęcia, ceny i szczegóły ogłoszeń w jednym miejscu.', sales)


stamp = datetime.fromisoformat(SNAPSHOT['fetchedAt'].replace('Z', '+00:00')).astimezone(ZoneInfo('Europe/Warsaw')).strftime('%d.%m.%Y, %H:%M')
for key, (name, label, route) in METALS.items():
    tab_links = []
    for tab_key, (_, tab_label, tab_route) in METALS.items():
        current = ' aria-current="page"' if tab_key == key else ''
        tab_links.append(f'<a href="{tab_route}"{current}>{tab_label}</a>')
    tabs = '<nav class="metal-tabs" aria-label="Wybierz metal">' + ''.join(tab_links) + '</nav>'
    rows = ''
    for purity, item in sorted(SNAPSHOT['metals'][key]['purities'].items(), key=lambda p: int(p[0])):
        price = f"{item['price']:,.2f}".replace(',', ' ').replace('.', ',')
        fraction = f'{int(purity) / 10:g}'.replace('.', ',')
        rows += f'<tr><th scope="row">{purity} <span>{fraction}% metalu</span></th><td>{price} zł/g</td></tr>'
    content = intro(f'Skup {name} w Gorzowie — cennik', f'Sprawdź ceny skupu {name} według próby. Kwoty podano w złotych za jeden gram metalu. Podane stawki uwzględniają ustawienia cennika Sezam.')
    content += f'<section class="metal-content" data-price-metal="{key}">{tabs}<aside class="jewelry-premium" aria-label="Indywidualna wycena biżuterii"><span class="jewelry-premium-label">WAŻNE DLA WŁAŚCICIELI BIŻUTERII</span><h2>Za biżuterię płacimy więcej niż za złom.</h2><p>Stawki w tabeli dotyczą skupu złomu metali szlachetnych. Biżuterię wyceniamy indywidualnie — zapytaj o wyższą cenę za swój przedmiot.</p><a class="link" href="kontakt.html">Zapytaj o wycenę biżuterii →</a></aside><div class="gold-prices"><table><caption>Ceny skupu {name} za 1 gram</caption><thead><tr><th scope="col">Próba</th><th scope="col">Cena za gram</th></tr></thead><tbody id="price-rows" data-has-prices="true" data-snapshot-date="{stamp}">{rows}</tbody></table><p id="price-status" class="price-note" role="status">Ostatnio pobrany cennik · notowania: {stamp} (Polska). Aktualność cen potwierdzisz telefonicznie.</p><button type="button" id="refresh-prices" class="price-refresh">Odśwież cennik</button><noscript><p>Automatyczne odświeżanie wymaga JavaScript. Powyżej widoczny jest ostatnio pobrany cennik z datą notowań.</p></noscript></div></section>'
    content += f'<section class="reading-section"><h2>Jak sprawdzić wartość {name}?</h2><p>Próba określa udział metalu szlachetnego w stopie. Cena w tabeli odnosi się już do podanej próby — nie przeliczaj jej ponownie przez zawartość metalu. Orientacyjną kwotę uzyskasz, mnożąc stawkę za gram przez masę elementów zakwalifikowanych do wyceny.</p><p>Kamienie, zapięcia i inne dodatki mogą wymagać osobnego sprawdzenia. Ostateczna wycena zależy od weryfikacji przedmiotu. Nie znasz próby? Skontaktuj się z nami przed wizytą przy ul. Pocztowej 11 w Gorzowie Wielkopolskim.</p><a class="button" href="kontakt.html">Zapytaj o wycenę →</a></section>'
    page(route, f'Skup {name} Gorzów — ceny za gram | Lombard Sezam', f'Cennik skupu {name} w Gorzowie Wielkopolskim. Ceny za gram dla poszczególnych prób z panelu Sezam. Wycena przy ul. Pocztowej 11.', content, scripts=('prices.js',))
    if key == 'gold':
        direct_content = content.replace('Skup złota w Gorzowie — cennik</h1>', 'Cennik skupu metali szlachetnych</h1>')
        page('cennik.html', 'Cennik skupu metali szlachetnych Gorzów | Sezam', 'Ceny skupu złota, srebra, platyny i palladu w Gorzowie. Wybierz metal i od razu sprawdź tabelę stawek za gram z panelu Sezam.', direct_content, scripts=('prices.js',))

calc = SECTIONS['kalkulator'].replace('<h2 id="fee-title">Sprawdź,<br> ile <em>zapłacisz.</em></h2>', '<h1 id="fee-title">Kalkulator opłat lombardu w Gorzowie</h1>')
# Source may have the original line break without a following space.
calc = re.sub(r'<h2 id="fee-title">.*?</h2>', '<h1 id="fee-title">Kalkulator opłat lombardu w Gorzowie</h1>', calc)
page('kalkulator-oplat.html', 'Kalkulator opłat — 2,5% / 15 dni, 5% / 30 dni | Sezam', 'Sprawdź opłatę i łączną kwotę do spłaty w Lombardzie Sezam Gorzów. Kalkulator: 2,5% za 15 dni lub 5% za 30 dni, od 50 do 100 000 zł.', calc, scripts=('calculator.js',))

contact = SECTIONS['kontakt'].replace('<h2>Masz pytanie?<br> Napisz na <em>WhatsApp.</em></h2>', '<h1>Kontakt — Lombard Sezam Gorzów</h1>')
contact = re.sub(r'<h2>Masz pytanie\?.*?</h2>', '<h1>Kontakt — Lombard Sezam Gorzów</h1>', contact)
page('kontakt.html', 'Kontakt i dojazd — Pocztowa 11, Gorzów | Lombard Sezam', 'Lombard Sezam: ul. Pocztowa 11, 66-400 Gorzów Wielkopolski. Zadzwoń 601 775 146, napisz na WhatsApp lub wyznacz trasę.', contact + SECTIONS['wycena'])
page('blog.html', 'Blog — złoto, zastaw i praktyczne porady | Lombard Gorzów', 'Poradniki Lombardu Sezam: co przyjmujemy pod zastaw, wycena złota, przygotowanie telefonu do sprzedaży i planowanie świątecznych wydatków.', intro('Blog Lombardu Sezam', 'Praktyczne informacje o wycenie przedmiotów, złocie i przygotowaniu do wizyty w lombardzie.') + '<section class="blog-section">' + blog_cards() + '</section>')
for post in DATA['posts']:
    body = post['body'].replace('<h4>', '<h2>').replace('</h4>', '</h2>')
    body = re.sub(r'<a class="link".*?</a>\s*$', '', body)
    content = f'<article class="article-page"><nav class="breadcrumbs" aria-label="Ścieżka nawigacji"><a href="../index.html">Strona główna</a><span> / </span><a href="../blog.html">Blog</a></nav><header class="article-header"><div class="eyebrow">PORADNIK LOMBARDU SEZAM</div><h1>{escape(post["title"])}</h1><p>{escape(post["lead"])}</p></header><img class="article-photo" src="assets/{post["image"]}" alt="{escape(post["title"])} — ilustracja poglądowa" width="1672" height="941" fetchpriority="high"><div class="article-body">{body}<aside class="article-contact"><h2>Zapytaj w Lombardzie Sezam w Gorzowie</h2><p>Znajdziesz nas przy ul. Pocztowej 11. Opisz swój przedmiot lub zadzwoń, aby ustalić szczegóły przed wizytą.</p><a class="button" href="#kontakt">Kontakt →</a></aside></div></article>'
    page('blog/' + post['slug'] + '.html', post['title'] + ' | Lombard Sezam Gorzów', post['lead'], content, article=post)

sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + ''.join('<url><loc>' + BASE + ('/' if p == 'index.html' else '/' + p) + '</loc></url>\n' for p in PAGES if p not in CANONICAL_PATHS) + '</urlset>\n'
(ROOT / 'sitemap.xml').write_text(sitemap)
(ROOT / 'robots.txt').write_text('User-agent: *\nAllow: /\nSitemap: ' + BASE + '/sitemap.xml\n')
(ROOT / 'site-manifest.json').write_text(json.dumps({'pages': PAGES}, indent=2) + '\n')
print('Built', len(PAGES), 'static HTML pages, sitemap and robots.txt.')
