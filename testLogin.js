async function test() {
  try {
    const res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'ehfaaz_mgmt', password: 'EhfaazDirector2026!$' })
    });
    console.log('STATUS:', res.status);
    console.log('LOCATION:', res.headers.get('location'));
  } catch(e) {
    console.error(e);
  }
}
test();
