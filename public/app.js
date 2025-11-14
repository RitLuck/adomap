// public/app.js
(async function(){
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
      ({ '&':'&amp;','<':'&lt;','>':'&gt;','\'':'&#39;','"':'&quot;' }[c])
    );
  }

  // ---------- AUTOCOMPLETE FOR COUNTRY & CITY ----------
  const countryInput = document.getElementById('country');
  const cityInput = document.getElementById('city');

  let countries = [];
  async function loadCountries() {
    const res = await fetch('https://restcountries.com/v3.1/all');
    const data = await res.json();
    countries = data.map(c => c.name.common).sort();
  }

  countryInput.addEventListener('input', () => {
    const listId = 'country-list';
    let datalist = document.getElementById(listId);
    if (!datalist) {
      datalist = document.createElement('datalist');
      datalist.id = listId;
      document.body.appendChild(datalist);
      countryInput.setAttribute('list', listId);
    }
    const val = countryInput.value.toLowerCase();
    datalist.innerHTML = countries
      .filter(c => c.toLowerCase().includes(val))
      .map(c => `<option value="${c}">`).join('');
  });

  cityInput.addEventListener('input', async () => {
    const country = countryInput.value;
    if (!country) return;

    const val = cityInput.value;
    if (!val) return;

    const listId = 'city-list';
    let datalist = document.getElementById(listId);
    if (!datalist) {
      datalist = document.createElement('datalist');
      datalist.id = listId;
      document.body.appendChild(datalist);
      cityInput.setAttribute('list', listId);
    }

    const url = `https://nominatim.openstreetmap.org/search?format=json&country=${encodeURIComponent(country)}&city=${encodeURIComponent(val)}&limit=10`;
    const res = await fetch(url, { headers: { 'User-Agent': 'AdoFansMap/1.0' } });
    const data = await res.json();

    datalist.innerHTML = data.map(c => `<option value="${c.display_name.split(',')[0]}">`).join('');
  });

  await loadCountries();

  // ---------- LOAD FANS AND ADD TO MAP ----------
  async function loadFans(){
    const res = await fetch('/api/fans');
    const fans = await res.json();
    markerLayer.clearLayers();
    const list = document.getElementById('fansList');
    list.innerHTML = '';
    document.getElementById('fanCount').innerText = `Total fans: ${fans.length}`;

    for (let f of fans) {
      const div = document.createElement('div');
      div.className = 'fan-item';
      div.innerHTML = `<strong>${escapeHtml(f.name||'Anonymous')}</strong><br>
                       <small class='gray'>${escapeHtml(f.city||'')}${f.city && f.country ? ', ' : ''}${escapeHtml(f.country||'')}</small><br>
                       ${escapeHtml(f.message||'')}`;
      list.appendChild(div);

      // Use lat/lng from database
      if (f.lat != null && f.lng != null) {
        L.marker([f.lat, f.lng])
          .bindPopup(`<strong>${escapeHtml(f.name||'Anonymous')}</strong><br>${escapeHtml(f.message||'')}`)
          .addTo(markerLayer);
      }
    }
  }

  document.getElementById('addBtn').addEventListener('click', async () => {
    const city = cityInput.value.trim();
    const country = countryInput.value.trim();
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

    if (!r.ok) return alert('Error: '+(await r.json()).error);

    document.getElementById('name').value='';
    cityInput.value='';
    countryInput.value='';
    document.getElementById('message').value='';

    await loadFans();
    alert('Thanks — you are now on the map!');
  });

  await loadFans();
  setInterval(loadFans, 10000);

})();
