// Codebase/Ticketing-Platform-Repo/demo-cli.js
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

const GATEWAY_URL = 'http://api-gateway:8080';
let jwtToken = '';
let lockedSeatId = '';
let currentUserId = '';

async function showMenu() {
    console.clear();
    console.log("=============================================================");
    console.log(" 🎫 TicketSaz Ticketing Platform - Interactive Live Demo 🎫");
    console.log("=============================================================");
    console.log(`👤 Current User: ${currentUserId || 'Unauthenticated'}`);
    console.log(`🔑 Security JWT Token: ${jwtToken ? '✓ Issued & Loaded' : '✗ Not Issued'}`);
    console.log(`🪑 Locked Seat: ${lockedSeatId || 'None'}`);
    console.log("-------------------------------------------------------------");
    console.log("1. 🔑 Authenticate & Issue JWT Token (IAM Service)");
    console.log("2. 📅 Fetch Active Events (Catalog Service -> PostgreSQL)");
    console.log("3. 🔒 Request Temporary Seat Lock for 10 Min (Reservation -> Redis)");
    console.log("4. 💳 Pay Invoice & Issue Digital Ticket (Billing -> Kafka Queue)");
    console.log("0. ❌ Exit Interactive Simulation");
    console.log("=============================================================");
}

async function main() {
    let running = true;
    while (running) {
        await showMenu();
        const choice = await askQuestion("👉 Please select an option: ");

        switch (choice.trim()) {
            case '1':
                console.log("\n--- STEP 1: Authentication via Identity Service (IAM) ---");
                const username = await askQuestion("👤 Enter username (e.g., ali): ");
                if (!username) {
                    console.log("❌ Username cannot be empty.");
                    await askQuestion("\n[Press Enter to return to main menu]");
                    break;
                }
                try {
                    const response = await fetch(`${GATEWAY_URL}/api/v1/auth/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username })
                    });
                    const data = await response.json();
                    jwtToken = data.token;
                    currentUserId = username;
                    console.log("\n✓ Authentication successful! Token loaded into session:");
                    console.log(`🔑 JWT Token: ${jwtToken.substring(0, 45)}...`);
                } catch (error) {
                    console.error("❌ Gateway Connection Error (Make sure docker is running):", error.message);
                }
                await askQuestion("\n[Press Enter to return to main menu]");
                break;

            case '2':
                console.log("\n--- STEP 2: Querying Catalog Service ---");
                try {
                    const response = await fetch(`${GATEWAY_URL}/api/v1/events`);
                    const data = await response.json();
                    console.log("\n📅 Active Events retrieved dynamically from PostgreSQL Database:");
                    console.table(data);
                } catch (error) {
                    console.error("❌ Connection to Catalog Service failed:", error.message);
                }
                await askQuestion("\n[Press Enter to return to main menu]");
                break;

            case '3':
                console.log("\n--- STEP 3: Requesting Temporary Seat Lock in Redis ---");
                if (!currentUserId) {
                    console.log("⚠️ Warning: You must authenticate first (Option 1).");
                    await askQuestion("\n[Press Enter to return to main menu]");
                    break;
                }
                const seatId = await askQuestion("🪑 Enter desired seat ID (e.g., VIP_15): ");
                if (!seatId) {
                    console.log("❌ Seat ID cannot be empty.");
                    await askQuestion("\n[Press Enter to return to main menu]");
                    break;
                }
                try {
                    const response = await fetch(`${GATEWAY_URL}/api/v1/reservations/lock`, {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${jwtToken}`
                        },
                        body: JSON.stringify({ seat_id: seatId, user_id: currentUserId, event_id: 'e1' })
                    });
                    const data = await response.json();
                    if (response.status === 200) {
                        lockedSeatId = seatId;
                        console.log(`\n✓ ${data.message}`);
                        console.log(`⏰ Seat ${data.seat_id} is now LOCKED in Redis with a strict 600-second (10 minutes) TTL.`);
                    } else {
                        console.log(`\n❌ Lock Rejected: ${data.error}`);
                    }
                } catch (error) {
                    console.error("❌ Request to Lock Seat failed:", error.message);
                }
                await askQuestion("\n[Press Enter to return to main menu]");
                break;

            case '4':
                console.log("\n--- STEP 4: Invoice Checkout & Cryptographic Ticket Issuance ---");
                if (!lockedSeatId) {
                    console.log("⚠️ Warning: You must lock a seat first (Option 3).");
                    await askQuestion("\n[Press Enter to return to main menu]");
                    break;
                }
                console.log(`💸 Invoice generated for Seat ${lockedSeatId} for User ${currentUserId} - Amount: $15.00`);
                const payChoice = await askQuestion("💳 Would you like to simulate gateway payment? (y/n): ");
                if (payChoice.toLowerCase() === 'y') {
                    try {
                        const response = await fetch(`${GATEWAY_URL}/api/v1/payments/checkout`, {
                            method: 'POST',
                            headers: { 
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${jwtToken}`
                            },
                            body: JSON.stringify({ 
                                user_id: currentUserId, 
                                seat_id: lockedSeatId, 
                                reservation_id: `res_${Math.floor(Math.random() * 1000)}`,
                                amount: 15.00 
                            })
                        });
                        const data = await response.json();
                        if (response.status === 200) {
                            console.log(`\n✓ Payment processed successfully! Bank Ref ID: ${data.reference_id}`);
                            console.log("📢 OrderPaidEvent published successfully to Kafka Message Broker.");
                            console.log("💡 Note: The Notification Service is consuming this event asynchronously to generate your cryptographic QR Hash.");
                            lockedSeatId = ''; // Reset local locked seat state after checkout
                        } else {
                            console.log(`\n❌ Payment failed: ${data.error}`);
                        }
                    } catch (error) {
                        console.error("❌ Connection to Billing Service failed:", error.message);
                    }
                } else {
                    console.log("❌ Transaction cancelled by the user.");
                }
                await askQuestion("\n[Press Enter to return to main menu]");
                break;

            case '0':
                running = false;
                rl.close();
                console.log("\nThank you for using the TicketSaz Interactive Demo. Good luck with your project defense!");
                break;

            default:
                console.log("\n❌ Invalid option. Please select again.");
                await askQuestion("\n[Press Enter to return to main menu]");
                break;
        }
    }
}

main();