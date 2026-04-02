const ports = [3000,3001,3002,3003,5173];
(async ()=>{
  for (const p of ports) {
    try {
      const res = await fetch(`http://localhost:${p}/`);
      const t = await res.text();
      console.log('PORT', p, 'STATUS', res.status, 'LEN', t.length);
      console.log(t.slice(0,400));
      process.exit(0);
    } catch (e) {
      console.error('PORT', p, 'ERR', e.message);
    }
  }
  process.exit(1);
})();
