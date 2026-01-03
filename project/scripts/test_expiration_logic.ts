
import { databaseService } from '../services/database';

async function main() {
    console.log('Running Credit Expiration Verification...');

    // 1. Create a Test User
    const testEmail = `test-expiration-${Date.now()}@example.com`;
    console.log(`Creating test user: ${testEmail}`);

    // Create user manually or via service
    const user = await databaseService.createUser({
        name: 'Expiration Tester',
        email: testEmail,
        password: 'password123',
        role: 'user',
        isActive: true,
        createdBy: 'script'
    });

    const userId = user.id;
    console.log(`User created: ${userId}`);

    // 2. Add Credits with Expiration (Expires in 30 days) - Batch A
    console.log('Adding 10 credits expiring in 30 days (Batch A)');
    await databaseService.addCredits(userId, 10, 'Monthly Credits', 30);

    // 3. Add Credits with No Expiration (Never) - Batch B
    console.log('Adding 50 credits with NO expiration (Batch B)');
    await databaseService.addCredits(userId, 50, 'Permanent Credits', null);

    // 4. Add Credits expiring SOON (Expires in 1 day) - Batch C
    console.log('Adding 5 credits expiring in 1 day (Batch C)');
    await databaseService.addCredits(userId, 5, 'Urgent Credits', 1);

    // Expected Consumption Order: Batch C (1 day), then Batch A (30 days), then Batch B (Never)

    // Check Status
    let balance = await databaseService.getUserCredits(userId);
    console.log('Current Balance (Should be 65):', balance?.current_credits);

    if (balance?.current_credits !== 65) {
        console.error('Balance mismatch!');
        process.exit(1);
    }

    // 5. Deduct 3 credits. Should come from Batch C (Urgent).
    // Remaining in C: 2.
    console.log('Deducting 3 credits...');
    await databaseService.deductCredits(userId, 3, 'Test Deduction 1');

    // 6. Deduct 4 credits. Should take 2 from C (emptying it), and 2 from Batch A.
    // Batch C: 0. Batch A: 8. Batch B: 50. Total: 58.
    console.log('Deducting 4 credits...');
    await databaseService.deductCredits(userId, 4, 'Test Deduction 2');

    balance = await databaseService.getUserCredits(userId);
    console.log('Current Balance (Should be 58):', balance?.current_credits);

    // Inspect batches directly to verify consumption order
    const client = await databaseService.getClient();
    const res = await client.query('SELECT remaining_amount, expires_at FROM credit_batches WHERE user_id = $1 ORDER BY expires_at ASC NULLS LAST', [userId]);
    client.release();

    console.log('Batches state:');
    res.rows.forEach(r => {
        const desc = r.expires_at ? `Expires ${r.expires_at.toISOString()}` : 'Never Expire';
        console.log(`- Amount: ${r.remaining_amount}, ${desc}`);
    });

    // Verification Logic
    // Row 0 should be Batch C (1 day) -> Remaining 0
    // Row 1 should be Batch A (30 days) -> Remaining 8
    // Row 2 should be Batch B (Never) -> Remaining 50

    // Note: JS sort order of SQL might vary slightly if dates are identical, but here one is 1d, one 30d, one NULL.
    // 1d < 30d < NULL.

    const batchC = res.rows[0]; // 1 day
    const batchA = res.rows[1]; // 30 days
    const batchB = res.rows[2]; // Never

    if (parseInt(batchC.remaining_amount) !== 0) {
        console.error('FAIL: Batch C (Urgent) should be empty, but has ' + batchC.remaining_amount);
    } else {
        console.log('PASS: Batch C is empty (Correctly consumed first)');
    }

    if (parseInt(batchA.remaining_amount) !== 8) {
        console.error('FAIL: Batch A (Monthly) should have 8, but has ' + batchA.remaining_amount);
    } else {
        console.log('PASS: Batch A has 8 (Correctly consumed second)');
    }

    if (parseInt(batchB.remaining_amount) !== 50) {
        console.error('FAIL: Batch B (Permanent) should have 50, but has ' + batchB.remaining_amount);
    } else {
        console.log('PASS: Batch B has 50 ( untouched)');
    }

    // 7. Test Expiration
    // We can't easily "wait" 30 days. But we can manually expire a batch in DB.
    // Let's create an expired batch.
    console.log('Injecting an EXPIRED batch (expired 10 days ago)...');
    await client.query(`
        INSERT INTO credit_batches (id, user_id, amount, remaining_amount, expires_at, created_at)
        VALUES ($1, $2, 100, 100, NOW() - INTERVAL '10 days', NOW())
    `, [`batch-expired-${Date.now()}`, userId]);

    // Check balance logic filters it out
    balance = await databaseService.getUserCredits(userId);
    console.log('Current Balance after adding expired credits (Should still be 58):', balance?.current_credits);

    if (balance?.current_credits !== 58) {
        console.error('FAIL: Expired credits are being counted! ' + balance?.current_credits);
        process.exit(1);
    } else {
        console.log('PASS: Expired credits are correctly ignored.');
    }

    console.log('Verification Complete: Success');
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
