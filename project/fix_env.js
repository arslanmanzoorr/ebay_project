const fs = require('fs');
const content = `DATABASE_URL="postgresql://auctionuser:auctionpass@localhost:5432/auctionflow"
NEXTAUTH_SECRET="your-super-secret-nextauth-secret-key-change-this-in-production"
NEXTAUTH_URL="http://localhost:3000"
STRIPE_PUBLISHABLE_KEY="pk_test_51NeMgsHo4otQW1AuljtMsUoGPSYWXRApOwtWDuykbqinqfkcPo5MdLg9n2ulpDuT2xwrkb0U"
STRIPE_SECRET_KEY="sk_test_51NeMgsHo4otQW1AuhQ76a0LcKHBZj8AqX7ltWVqsS7sqRGj4jRRmjG8yGUwSb6dGoHqkvf2ZFhywOelvRXnOeit900Leyq00nat_51NeMgsHo4otQW1AuhQ76a0"
BIDSQUIRE_WEBHOOK_URL="https://your-bidsquire-app.com/api/webhooks/register"
`;
fs.writeFileSync('.env', content);
console.log('Fixed .env file.');
