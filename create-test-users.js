// Use dynamic import for node-fetch
async function getFetch() {
  const { default: fetch } = await import('node-fetch');
  return fetch;
}

const TEST_USERS = [
  // Admin users
  {
    name: "Admin Test User",
    email: "admin.test@bidsquire.com",
    password: "Admin123!",
    role: "admin",
    isActive: true
  },
  {
    name: "Super Admin",
    email: "superadmin@bidsquire.com", 
    password: "SuperAdmin123!",
    role: "admin",
    isActive: true
  },
  
  // Research 1 users
  {
    name: "Primary Researcher",
    email: "researcher1@bidsquire.com",
    password: "Research123!",
    role: "researcher",
    isActive: true
  },
  {
    name: "Research Assistant",
    email: "research.assistant@bidsquire.com",
    password: "Research123!",
    role: "researcher", 
    isActive: true
  },
  {
    name: "Junior Researcher",
    email: "junior.researcher@bidsquire.com",
    password: "Research123!",
    role: "researcher",
    isActive: true
  },
  
  // Research 2 users
  {
    name: "Senior Researcher",
    email: "senior.researcher@bidsquire.com",
    password: "Research2_123!",
    role: "researcher2",
    isActive: true
  },
  {
    name: "Final Review Specialist",
    email: "final.review@bidsquire.com", 
    password: "Research2_123!",
    role: "researcher2",
    isActive: true
  },
  {
    name: "Quality Controller",
    email: "quality.control@bidsquire.com",
    password: "Research2_123!",
    role: "researcher2",
    isActive: true
  },
  
  // Photographer users
  {
    name: "Lead Photographer",
    email: "photographer1@bidsquire.com",
    password: "Photo123!",
    role: "photographer",
    isActive: true
  },
  {
    name: "Photo Assistant",
    email: "photo.assistant@bidsquire.com",
    password: "Photo123!",
    role: "photographer",
    isActive: true
  },
  {
    name: "Studio Manager",
    email: "studio.manager@bidsquire.com",
    password: "Photo123!",
    role: "photographer",
    isActive: true
  },
  
  // Inactive test users for edge cases
  {
    name: "Inactive User",
    email: "inactive@bidsquire.com",
    password: "Inactive123!",
    role: "researcher",
    isActive: false
  },
  {
    name: "Disabled Admin",
    email: "disabled.admin@bidsquire.com", 
    password: "Disabled123!",
    role: "admin",
    isActive: false
  }
];

async function createTestUsers() {
  console.log('🚀 Creating test users for TestSprite...');
  
  const fetch = await getFetch();
  const results = [];
  
  for (const user of TEST_USERS) {
    try {
      console.log(`Creating user: ${user.name} (${user.email}) - Role: ${user.role}`);
      
      const response = await fetch('http://localhost:3000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(user)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Created: ${user.email}`);
        results.push({ ...user, success: true, id: result.id });
      } else {
        const error = await response.text();
        console.log(`❌ Failed to create ${user.email}: ${error}`);
        results.push({ ...user, success: false, error });
      }
    } catch (error) {
      console.log(`❌ Error creating ${user.email}: ${error.message}`);
      results.push({ ...user, success: false, error: error.message });
    }
  }
  
  console.log('\n📊 Summary:');
  console.log(`✅ Successfully created: ${results.filter(r => r.success).length} users`);
  console.log(`❌ Failed to create: ${results.filter(r => !r.success).length} users`);
  
  console.log('\n👥 Test Credentials for TestSprite:');
  console.log('='.repeat(50));
  
  const roles = ['admin', 'researcher', 'researcher2', 'photographer'];
  roles.forEach(role => {
    const roleUsers = results.filter(r => r.success && r.role === role && r.isActive);
    if (roleUsers.length > 0) {
      console.log(`\n${role.toUpperCase()} Users:`);
      roleUsers.forEach(user => {
        console.log(`  Email: ${user.email} | Password: ${user.password}`);
      });
    }
  });
  
  // Create test credentials file for TestSprite
  const testCredentials = {
    admin: results.filter(r => r.success && r.role === 'admin' && r.isActive).map(u => ({
      email: u.email,
      password: u.password,
      name: u.name
    })),
    researcher: results.filter(r => r.success && r.role === 'researcher' && r.isActive).map(u => ({
      email: u.email,
      password: u.password,
      name: u.name
    })),
    researcher2: results.filter(r => r.success && r.role === 'researcher2' && r.isActive).map(u => ({
      email: u.email,
      password: u.password,
      name: u.name
    })),
    photographer: results.filter(r => r.success && r.role === 'photographer' && r.isActive).map(u => ({
      email: u.email,
      password: u.password,
      name: u.name
    }))
  };
  
  require('fs').writeFileSync('./testsprite_tests/test-credentials.json', JSON.stringify(testCredentials, null, 2));
  console.log('\n💾 Test credentials saved to testsprite_tests/test-credentials.json');
  
  return results;
}

createTestUsers().catch(console.error);
