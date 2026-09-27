import fs from 'fs';
const server=fs.readFileSync(new URL('../src/server.js',import.meta.url),'utf8');
if(server.includes("return x};\\nfunction normalizeProductImageData"))throw Error('Quebra de linha escapada encontrada no bloco de foto.');
if(!server.includes("function normalizeProductImageData"))throw Error('Validador de foto ausente.');
if(!server.includes("/^data:image\\/(jpeg|png|webp);base64,"))throw Error('Regex de foto inválida ou ausente.');
if(!server.includes("/api/products/:id/photo"))throw Error('Rota de foto do produto ausente.');
if(!server.includes("image_data"))throw Error('Persistência de foto ausente.');
console.log('OK: sintaxe e persistência da foto de produto validadas.');
