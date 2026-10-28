#!/usr/bin/env python3
"""Check the public deployment and report redirects and actual HTTP errors."""
import os
import re
import socket
import sys
import time
import urllib.error
import urllib.request


class TraceRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, request, fp, code, message, headers, newurl):
        print(f'Przekierowanie {code}: {request.full_url} -> {newurl}', flush=True)
        return super().redirect_request(request, fp, code, message, headers, newurl)


def fetch(opener, url):
    request = urllib.request.Request(url, headers={'Cache-Control': 'no-cache', 'User-Agent': 'Sezam-Deployment-Check/1.0'})
    try:
        with opener.open(request, timeout=20) as response:
            body = response.read(2_000_000).decode('utf-8', errors='replace')
            print(f'HTTP {response.status}: {response.url}', flush=True)
            title = re.search(r'<title[^>]*>(.*?)</title>', body, re.S | re.I)
            if title:
                print('Tytuł strony: ' + title.group(1).strip(), flush=True)
            return body
    except (urllib.error.URLError, OSError) as error:
        print(f'Błąd {url}: {error}', flush=True)
        return None


def main():
    commit = os.environ['GITHUB_SHA']
    base = os.environ.get('JDM_PUBLIC_URL', 'http://lombard-gorzow.pl').rstrip('/')
    opener = urllib.request.build_opener(TraceRedirect())
    from urllib.parse import urlsplit
    host = urlsplit(base).hostname
    try:
        print('Adresy DNS domeny: ' + ', '.join(sorted({item[4][0] for item in socket.getaddrinfo(host, 80)})), flush=True)
    except OSError as error:
        print('Błąd DNS: ' + str(error), flush=True)
    for attempt in range(3):
        marker = fetch(opener, base + '/deployment-version.txt?v=' + commit)
        if marker is not None and marker.strip() == commit:
            homepage = fetch(opener, base + '/?v=' + commit)
            if homepage and 'Pożyczki pod zastaw' in homepage:
                print(f'Potwierdzono publiczną publikację: {base}/ — {commit}', flush=True)
                return 0
        elif marker is not None:
            print('Domena zwróciła inną treść niż numer wdrożenia.', flush=True)
        if attempt < 2:
            time.sleep(3)
    print('Diagnostyka strony głównej i jawnego index.html:', flush=True)
    homepage = fetch(opener, base + '/?v=' + commit)
    explicit = fetch(opener, base + '/index.html?v=' + commit)
    if explicit and 'Pożyczki pod zastaw' in explicit and (not homepage or 'Pożyczki pod zastaw' not in homepage):
        print('Nowy index.html jest dostępny, ale serwer pod / wybiera inną stronę. Sprawdź priorytet index.php w JDM.', flush=True)
    print('Pliki przesłano na JDM, ale publikacja pod domeną nie została potwierdzona. Przyczyny są podane powyżej.', flush=True)
    return 1


if __name__ == '__main__':
    sys.exit(main())
