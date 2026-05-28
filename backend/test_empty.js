async function test() {
  try {
    let resLog = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ email: 'test3@test.com', password: 'password123' })
    });
    let token = (await resLog.json()).token;

    const payload = {
      date: new Date().toISOString()
    };

    let resHealth = await fetch('http://localhost:5000/api/health', {
      method: 'POST', headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token},
      body: JSON.stringify(payload)
    });
    let healthData = await resHealth.text();
    console.log('Status:', resHealth.status);
    console.log('Response:', healthData);
    
  } catch (err) {
    console.log('ERROR:', err.message);
  }
}

test();
