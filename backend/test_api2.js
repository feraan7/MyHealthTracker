async function test() {
  try {
    let token;
    let resReg = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ name: 'Test3', email: 'test3@test.com', password: 'password123' })
    });
    let dataReg = await resReg.json();
    if (!resReg.ok) {
      let resLog = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST', headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ email: 'test3@test.com', password: 'password123' })
      });
      dataReg = await resLog.json();
    }
    token = dataReg.token;
    console.log('Token length:', token ? token.length : 'none');

    const payload = {
      date: new Date().toISOString(),
      waterIntake: '8',
      sleepDuration: '7.5',
      steps: '10000',
      calories: '2000',
      weight: '70',
      bmi: '24.2'
    };

    let resHealth = await fetch('http://localhost:5000/api/health', {
      method: 'POST', headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token},
      body: JSON.stringify(payload)
    });
    let healthData = await resHealth.json();
    console.log('Success POST!', healthData);
    
  } catch (err) {
    console.log('ERROR:', err.message);
  }
}

test();
