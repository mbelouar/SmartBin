/**
 * Browser Console Script to Test Admin Bin Creation
 * 
 * Instructions:
 * 1. Open http://localhost:3000 in your browser
 * 2. Open Developer Tools (F12 or Cmd+Option+I)
 * 3. Go to the Console tab
 * 4. Copy and paste this entire script
 * 5. Press Enter
 */

(async function testAdminBinCreation() {
  console.log('🧪 Testing Admin Bin Creation');
  console.log('==============================\n');

  try {
    // Step 1: Login as admin
    console.log('🔐 Step 1: Logging in as admin...');
    const loginResponse = await fetch('http://localhost:8001/api/auth/login/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status} ${loginResponse.statusText}`);
    }

    const loginData = await loginResponse.json();
    
    if (!loginData.access) {
      throw new Error('No access token received');
    }

    // Save token to localStorage
    localStorage.setItem('smartbin_token', loginData.access);
    localStorage.setItem('smartbin_user', JSON.stringify(loginData.user));
    
    console.log('✅ Logged in successfully!');
    console.log('   Username:', loginData.user.username);
    console.log('   is_staff:', loginData.user.is_staff);
    console.log('   Token saved to localStorage\n');

    // Step 2: Create a test bin
    console.log('📦 Step 2: Creating a test bin...');
    
    const timestamp = Date.now();
    const binData = {
      name: `Test Bin #${timestamp}`,
      qr_code: `SB-TEST-${timestamp}`,
      location: `Test Location - ${new Date().toLocaleString()}`,
      latitude: 40.7128,
      longitude: -74.0060,
      capacity: 100,
      status: 'active'
    };

    const createResponse = await fetch('http://localhost:8002/api/bins/list/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginData.access}`
      },
      body: JSON.stringify(binData)
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      throw new Error(`Failed to create bin: ${createResponse.status} - ${JSON.stringify(errorData)}`);
    }

    const binResult = await createResponse.json();
    
    console.log('✅ Bin created successfully!');
    console.log('   Bin ID:', binResult.id);
    console.log('   Bin Name:', binResult.name);
    console.log('   QR Code:', binResult.qr_code);
    console.log('   Location:', binResult.location);
    console.log('');

    // Step 3: Verify the bin
    console.log('🔍 Step 3: Verifying bin was created...');
    const listResponse = await fetch('http://localhost:8002/api/bins/list/', {
      headers: {
        'Authorization': `Bearer ${loginData.access}`
      }
    });

    if (listResponse.ok) {
      const binsData = await listResponse.json();
      const bins = binsData.results || binsData;
      const foundBin = bins.find(b => b.id === binResult.id);
      
      if (foundBin) {
        console.log('✅ Bin verified in database!');
        console.log(`   Total bins: ${bins.length}`);
      } else {
        console.log('⚠️  Bin created but not found in list');
      }
    }

    console.log('\n==============================');
    console.log('✅ Test completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Navigate to http://localhost:3000/admin');
    console.log('   2. You should see your new bin in the list');
    console.log('   3. The page should reload automatically...');
    
    // Reload the page to show the new bin
    setTimeout(() => {
      window.location.href = '/admin';
    }, 2000);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
    
    if (error.message.includes('Authentication') || error.message.includes('credentials')) {
      console.log('\n💡 Tip: Make sure test users exist. Run:');
      console.log('   python3 create_test_users.py');
    } else if (error.message.includes('permission')) {
      console.log('\n💡 Tip: Make sure the admin user has is_staff=True');
    }
  }
})();
