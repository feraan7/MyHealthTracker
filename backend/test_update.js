async function test() {
  try {
    let resLog = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ email: 'test3@test.com', password: 'password123' })
    });
    let token = (await resLog.json()).token;

    const payload = {
      date: new Date().toISOString(),
      waterIntake: '9',
      weight: '75',
      mood: 'Sad'
    };

    let resHealth = await fetch('http://localhost:5000/api/health', {
      method: 'POST', headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token},
      body: JSON.stringify(payload)
    });
    console.log('Status Update 1:', resHealth.status);
    console.log('Resp 1:', await resHealth.text());

    const payload2 = {
      date: new Date().toISOString(),
      steps: '5000'
    };
    let resHealth2 = await fetch('http://localhost:5000/api/health', {
      method: 'POST', headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token},
      body: JSON.stringify(payload2)
    });
    console.log('Status Update 2:', resHealth2.status);
    console.log('Resp 2:', await resHealth2.text());
    
  } catch (err) {
    console.log('ERROR:', err.message);
  }
}

test();
