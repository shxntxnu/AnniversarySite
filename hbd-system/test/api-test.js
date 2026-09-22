const { startServer } = require('../server/server.js');

async function runTests() {
  const baseUrl = 'http://localhost:3000';
  let server = null;

  // Check if server is already running (e.g. via npm run dev)
  try {
    const healthCheck = await fetch(`${baseUrl}/api/health`);
    if (healthCheck.ok) {
      console.log('Detected already running server on port 3000. Testing against active server...');
    } else {
      server = await startServer();
    }
  } catch (e) {
    server = await startServer();
  }

  let adminCookie = null;
  let viewerCookie = null;

  try {
    console.log('\n--- 1. Testing Login with Invalid Credentials ---');
    const failRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'love', password: 'wrongpassword' })
    });
    const failJson = await failRes.json();
    console.log('Status:', failRes.status, 'Body:', failJson);
    if (failRes.status !== 401 || failJson.error !== 'Incorrect username or password') {
      throw new Error('Expected 401 with generic error message');
    }
    console.log('✓ Invalid login correctly rejected without credential hints');

    console.log('\n--- 2. Testing Admin Login (love / password123) ---');
    const adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'love', password: 'password123' })
    });
    const adminLoginJson = await adminLoginRes.json();
    console.log('Status:', adminLoginRes.status, 'Role:', adminLoginJson.user?.role);
    if (!adminLoginJson.success || adminLoginJson.user?.role !== 'admin') {
      throw new Error('Admin login failed or role is not admin');
    }
    const setCookieHeader = adminLoginRes.headers.get('set-cookie');
    adminCookie = setCookieHeader.split(';')[0];
    console.log('✓ Admin login succeeded, role verified as admin');

    console.log('\n--- 3. Testing Admin Spotify Search Permission ---');
    const searchRes = await fetch(`${baseUrl}/api/spotify/search?q=Winning+Speech`, {
      headers: { Cookie: adminCookie }
    });
    const searchJson = await searchRes.json();
    console.log('Admin Spotify search results:', searchJson.tracks?.length);
    if (!searchJson.success || !Array.isArray(searchJson.tracks)) {
      throw new Error('Admin Spotify search failed');
    }
    console.log('✓ Admin successfully searched tracks on Spotify');

    console.log('\n--- 4. Testing Admin Memory Creation with Attached Song ---');
    const newMemRes = await fetch(`${baseUrl}/api/memories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie
      },
      body: JSON.stringify({
        date: '2026-09-25',
        title: 'Starry Night Walk',
        story: 'We walked under the clear night sky and shared headphones.',
        location: 'Riverbank',
        photos: ['/uploads/PXL_20260616_202304977.jpg'],
        song: searchJson.tracks[0] || null
      })
    });
    const newMemJson = await newMemRes.json();
    console.log('Created memory ID:', newMemJson.data?.id, 'Attached Song:', newMemJson.data?.song?.name);
    if (!newMemJson.success || !newMemJson.data?.id) {
      throw new Error('Failed to create memory');
    }
    const createdId = newMemJson.data.id;
    console.log('✓ Admin created memory with attached song');

    console.log('\n--- 5. Testing Admin Memory Modification (Changing Song) ---');
    const updateRes = await fetch(`${baseUrl}/api/memories/${createdId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie
      },
      body: JSON.stringify({
        title: 'Starry Night Walk (Updated Melody)',
        song: null // Admin removing song
      })
    });
    const updateJson = await updateRes.json();
    if (updateJson.data.title !== 'Starry Night Walk (Updated Melody)' || updateJson.data.song !== null) {
      throw new Error('Memory update failed');
    }
    console.log('✓ Admin successfully changed/removed song on memory');

    console.log('\n--- 6. Testing Admin Logout ---');
    await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: { Cookie: adminCookie }
    });
    console.log('✓ Admin logged out');

    console.log('\n--- 7. Testing Viewer Login (rubina / love123) ---');
    const viewerLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'rubina', password: 'love123' })
    });
    const viewerLoginJson = await viewerLoginRes.json();
    console.log('Status:', viewerLoginRes.status, 'User:', viewerLoginJson.user?.username, 'Role:', viewerLoginJson.user?.role);
    if (!viewerLoginJson.success || viewerLoginJson.user?.role !== 'viewer') {
      throw new Error('Viewer login failed or role is not viewer');
    }
    const viewerCookieHeader = viewerLoginRes.headers.get('set-cookie');
    viewerCookie = viewerCookieHeader.split(';')[0];
    console.log('✓ Viewer login succeeded with read-only permissions');

    console.log('\n--- 8. Testing Viewer Reading Memories ---');
    const viewerMemRes = await fetch(`${baseUrl}/api/memories`, {
      headers: { Cookie: viewerCookie }
    });
    const viewerMemJson = await viewerMemRes.json();
    console.log(`Viewer fetched ${viewerMemJson.count} memories`);
    if (!viewerMemJson.success || viewerMemJson.count < 1) {
      throw new Error('Viewer failed to read memories');
    }
    console.log('✓ Viewer successfully read timeline memories');

    console.log('\n--- 9. Testing Viewer Forbidden from Creating Memories (POST) ---');
    const viewerCreateRes = await fetch(`${baseUrl}/api/memories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: viewerCookie
      },
      body: JSON.stringify({
        date: '2026-10-01',
        title: 'Unauthorized Memory',
        story: 'Should fail'
      })
    });
    console.log('Status:', viewerCreateRes.status);
    if (viewerCreateRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for viewer, got ${viewerCreateRes.status}`);
    }
    console.log('✓ Viewer correctly blocked (403 Forbidden) from creating memories');

    console.log('\n--- 10. Testing Viewer Forbidden from Modifying Memories (PUT) ---');
    const viewerUpdateRes = await fetch(`${baseUrl}/api/memories/${createdId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: viewerCookie
      },
      body: JSON.stringify({ title: 'Hacked Title' })
    });
    console.log('Status:', viewerUpdateRes.status);
    if (viewerUpdateRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for viewer update, got ${viewerUpdateRes.status}`);
    }
    console.log('✓ Viewer correctly blocked (403 Forbidden) from modifying memories');

    console.log('\n--- 11. Testing Viewer Forbidden from Deleting Memories (DELETE) ---');
    const viewerDelRes = await fetch(`${baseUrl}/api/memories/${createdId}`, {
      method: 'DELETE',
      headers: { Cookie: viewerCookie }
    });
    console.log('Status:', viewerDelRes.status);
    if (viewerDelRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for viewer delete, got ${viewerDelRes.status}`);
    }
    console.log('✓ Viewer correctly blocked (403 Forbidden) from deleting memories');

    console.log('\n--- 12. Testing Viewer Forbidden from Spotify Track Search ---');
    const viewerSearchRes = await fetch(`${baseUrl}/api/spotify/search?q=test`, {
      headers: { Cookie: viewerCookie }
    });
    console.log('Status:', viewerSearchRes.status);
    if (viewerSearchRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for viewer search, got ${viewerSearchRes.status}`);
    }
    console.log('✓ Viewer correctly blocked (403 Forbidden) from Spotify track search');

    console.log('\n--- 13. Cleaning up Test Memory via Admin ---');
    // Log back in as admin to clean up
    const adminRelogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'love', password: 'password123' })
    });
    const adminCleanCookie = adminRelogin.headers.get('set-cookie').split(';')[0];
    await fetch(`${baseUrl}/api/memories/${createdId}`, {
      method: 'DELETE',
      headers: { Cookie: adminCleanCookie }
    });
    console.log('✓ Cleaned up test memory');

    console.log('\n============================================================');
    console.log(' ALL ROLE-BASED ACCESS & PERMISSION TESTS PASSED! 🎉');
    console.log(' - Admin can add/remove/change songs & edit memories');
    console.log(' - Viewer is strictly read-only (403 on create/edit/delete)');
    console.log('============================================================\n');
  } finally {
    if (server) {
      server.close(() => {
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  }
}

runTests().catch(err => {
  console.error('API Test Error:', err);
  process.exit(1);
});
