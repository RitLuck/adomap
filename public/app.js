// public/app.js
(async function() {
  // Initialize map
  const map = L.map('map').setView([20, 0], 2);
  const layer = protomapsL.leafletLayer({
    url: 'https://api.protomaps.com/tiles/v4/{z}/{x}/{y}.mvt?key=916a121e477f4a33',
    flavor: 'light',
    lang: 'en'
  });
  layer.addTo(map);

  const markerLayer = L.layerGroup().addTo(map);

  function escapeHtml(s) {
    return String(s||'').replace(/[&<>'"]/g, c =>
      ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '\'':'&#39;', '"':'&quot;' }[c])
    );
  }

  // Geocode city+country using Nominatim
  async function geocodeLocation(city, country) {
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    spinner.innerText = 'Loading...';
    document.getElementById('fansList').prepend(spinner);

    const query = encodeURIComponent(`${city}, ${country}`);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`;
    const res = await fetch(url, { headers: { 'User-Agent': 'AdoFansMap/1.0' } });
    const data = await res.json();

    spinner.remove();
    if (data && data[0]) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
    return null;
  }

  // Load fans and place markers
  async function loadFans() {
    const res = await fetch('/api/fans');
    const fans = await res.json();

    markerLayer.clearLayers();
    const list = document.getElementById('fansList');
    list.innerHTML = '';
    document.getElementById('fanCount').innerText = `Total fans: ${fans.length}`;

    for (let f of fans) {
      const div = document.createElement('div');
      div.className = 'fan-item';
      div.innerHTML = `<strong>${escapeHtml(f.name || 'Anonymous')}</strong><br>
                       <small class="gray">${escapeHtml(f.city || '')}${f.city && f.country ? ', ' : ''}${escapeHtml(f.country || '')}</small><br>
                       ${escapeHtml(f.message || '')}`;
      list.appendChild(div);

      if (f.city && f.country) {
        const coords = await geocodeLocation(f.city, f.country);
        if (coords) {
          L.marker([coords.lat, coords.lng])
            .bindPopup(`<strong>${escapeHtml(f.name || 'Anonymous')}</strong><br>${escapeHtml(f.message || '')}`)
            .addTo(markerLayer);
        }
      }
    }
  }

  // Handle Add Fan button
  document.getElementById('addBtn').addEventListener('click', async () => {
    const city = document.getElementById('city').value.trim();
    const country = document.getElementById('country').value.trim();
    if (!city || !country) return alert('Please fill both city and country');

    const payload = {
      name: document.getElementById('name').value,
      city,
      country,
      message: document.getElementById('message').value,
      hide_exact: true
    };

    const r = await fetch('/api/fans', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify(payload)
    });

    if (!r.ok) return alert('Error: ' + (await r.json()).error);

    document.getElementById('name').value = '';
    document.getElementById('city').value = '';
    document.getElementById('country').value = '';
    document.getElementById('message').value = '';

    await loadFans();
    alert('Thanks — you are now on the map!');
  });

  // Initial load + polling every 10s
  await loadFans();
  setInterval(loadFans, 10000);
})();
