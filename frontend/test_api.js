const axios = require('axios');

async function test() {
  try {
    const resReg = await axios.post('http://localhost:5000/api/auth/register', { name: 'Test', email: 'test1@test.com', password: 'password123' });
    const token = resReg.data.token;
    console.log('Registered, token length:', token.length);

    const payload = {
      date: new Date().toISOString(),
      waterIntake: '8',
      sleepDuration: '7.5',
      steps: '10000',
      calories: '2000',
      weight: '70',
      bmi: '24.2',
      mood: 'Happy'
    };

    const res = await axios.post('http://localhost:5000/api/health', payload, {
      headers: { Authorization: 'Bearer ' + token }
    });
    console.log('Success!', res.data);
  } catch (err) {
    console.log('ERROR:', err.response ? err.response.data : err.message);
  }
}

test();
