// Injects home-screen (PWA) icon/meta tags into the exported index.html
const fs = require('fs');
const file = 'dist/index.html';
let html = fs.readFileSync(file, 'utf8');
const tags = `
<style>html,body{background:#0B0B14;}</style>
<title>KatTracker</title>
<link rel="icon" type="image/png" href="/favicon.png" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#0B0B14" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-title" content="KatTracker" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
`;
const SW = `<script>if ('serviceWorker' in navigator) { window.addEventListener('load', function () { navigator.serviceWorker.register('/sw.js').catch(function () {}); }); }</script>
`;
html = html.replace(/<title>.*?<\/title>/, '').replace('</head>', tags + SW + '</head>');
fs.writeFileSync(file, html);
