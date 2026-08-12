const q = `[out:json];
area["name"="Situbondo"]->.searchArea;
relation["name"="Curah Tatal"](area.searchArea);
out geom;`;
fetch('https://overpass-api.de/api/interpreter', {method: 'POST', body: q})
  .then(r=>r.json())
  .then(data => {
    if (data.elements && data.elements.length > 0) {
      console.log('Found elements:', data.elements.length);
    } else {
      console.log('No elements found.');
    }
  })
  .catch(console.error);
