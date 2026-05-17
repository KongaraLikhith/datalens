import httpx, json
with open(r'frontend\public\sample_data.csv', 'rb') as f:
    r = httpx.post('http://127.0.0.1:8000/api/analyze', files={'file': ('sample_data.csv', f, 'text/csv')})
data = r.json()
print('Status:', r.status_code)
print('Keys:', list(data.keys()))
print('Metadata:', data['metadata'])
print('Bias findings count:', len(data['bias_audit']))
for bf in data['bias_audit']:
    sev = bf['severity']
    name = bf['check_name']
    finding = bf['finding'][:60]
    print(f'  [{sev}] {name}: {finding}')
print('Quality score:', data['quality_score'])
story = data['data_story']
print('Data story (first 200 chars):', story[:200])
