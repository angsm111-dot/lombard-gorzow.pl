#!/usr/bin/env python3
"""Return deployment diagnostics through a separate Git branch, never secrets."""
import base64
import json
import os
import urllib.error
import urllib.request
from pathlib import Path


def api(path, method='GET', data=None):
    request = urllib.request.Request(
        'https://api.github.com/repos/' + os.environ['GITHUB_REPOSITORY'] + path,
        method=method,
        data=json.dumps(data).encode() if data is not None else None,
        headers={'Authorization': 'Bearer ' + os.environ['GH_TOKEN'],
                 'Accept': 'application/vnd.github+json', 'Content-Type': 'application/json'})
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)


branch = os.environ.get('JDM_STATUS_BRANCH', 'jdm-status')
try:
    api('/git/ref/heads/' + branch)
except urllib.error.HTTPError as error:
    if error.code != 404:
        raise
    api('/git/refs', 'POST', {'ref': 'refs/heads/' + branch, 'sha': os.environ['GITHUB_SHA']})

report = {'commit': os.environ['GITHUB_SHA'], 'run': os.environ['GITHUB_RUN_ID'],
          'status': os.environ['DEPLOY_STATUS'], 'steps': json.loads(os.environ.get('DEPLOY_STEPS', '{}'))}
for name in ('build', 'upload', 'server', 'public', 'cleanup'):
    path = Path(os.environ['RUNNER_TEMP']) / ('jdm-' + name + '.txt')
    report[name] = path.read_text() if path.exists() else 'Step not reached'
# Do not rely on GitHub log masking for a file stored in Git.
body = json.dumps(report, ensure_ascii=False, indent=2)
password = os.environ.get('JDM_PASSWORD')
if password:
    body = body.replace(password, '[REDACTED]')
payload = {'message': 'JDM deployment status ' + os.environ['GITHUB_SHA'][:7],
           'content': base64.b64encode(body.encode()).decode(), 'branch': branch}
try:
    payload['sha'] = api('/contents/jdm-status.json?ref=' + branch)['sha']
except urllib.error.HTTPError as error:
    if error.code != 404:
        raise
api('/contents/jdm-status.json', 'PUT', payload)
print('Wynik diagnostyki zapisano na gałęzi jdm-status.')
