const cities = require("all-the-cities");
console.log(cities.filter(c => c.name.includes('Saranap') || c.name.includes('Moraga')))

