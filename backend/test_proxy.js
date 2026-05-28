async function test() {
  try {
    let resLog = await fetch('http://localhost:5173/api/auth/login', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ email: 'test3@test.com', password: 'password123' })
    });
    let token = (await resLog.json()).token;

    const payload = {
      date: new Date().toISOString(),
      waterIntake: '8'
    };

    let resHealth = await fetch('http://localhost:5173/api/health', {
      method: 'POST', headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token},
      body: JSON.stringify(payload)
    });
    console.log('Status via Proxy:', resHealth.status);
    console.log('Response via Proxy:', await resHealth.text());
    
  } catch (err) {
    console.log('ERROR:', err.message);
  }
}

test();
