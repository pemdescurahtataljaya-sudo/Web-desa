const q = `[out:json][timeout:25];
relation["name"="Curah Tatal"]["admin_level"="8"];
out geom;`;

fetch('https://overpass-api.de/api/interpreter', {
  method: 'POST', 
  body: q
})
.then(r => r.text())
.then(text => {
  try {
    const data = JSON.parse(text);
    if (data.elements && data.elements.length > 0) {
      console.log('FOUND:', data.elements[0].tags.name);
      const fs = require('fs');
      fs.writeFileSync('curah_tatal_geom.json', JSON.stringify(data.elements[0].geometry, null, 2));
      console.log('Saved geometry');
    } else {
      console.log('Not found in OSM.');
    }
  } catch(e) {
    console.log('Error parsing JSON:', text.substring(0, 100));
  }
})
.catch(console.error);
