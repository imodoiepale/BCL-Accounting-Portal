const twilio = require('twilio');

// Store credentials in environment variables for security
const accountSid = process.env.TWILIO_ACCOUNT_SID || 'AC86becb7184f64a7fd567b4f9a29c8770';
const authToken = process.env.TWILIO_AUTH_TOKEN || 'a8960ada6dc39e161ee764179398e290';
const whatsappSenderNumber = 'whatsapp:+254752298298';

const client = new twilio(accountSid, authToken);

async function sendMissingDocumentsRequest(phoneNumbers, missingDocuments) {
  const numbersArray = phoneNumbers.split(',').map(number => number.trim());

  try {
    const messages = await Promise.all(numbersArray.map(async phoneNumber => {
      const message = await client.messages.create({
        body: `Hello {{1}}. This is a reminder of your appointment on https://zyszsqgdlrpnunkegipk.supabase.co/storage/v1/object/public/documents/agrolt%20solutions%20private%20limited/citizen_ids_rows.csv at {{3}}.  If you need to reschedule, please visit {{4}} or contact us directly. `,
        from: whatsappSenderNumber,
        to: `whatsapp:${phoneNumber}`
      });
      return message;
    }));

    messages.forEach(message => {
      console.log("Reminder sent successfully. Message SID:", message.sid);
    });
  } catch (error) {
    console.error("Error sending reminder:", error);
  }
}

// Test Data - Modify as needed
const phoneNumbers = "+254700298298, +254743854888"; // Modify or add more numbers as needed
const missingDocuments = "Passport Copy, Signed Agreement";

// Send messages every 5 seconds
const intervalId = setInterval(() => {
  sendMissingDocumentsRequest(phoneNumbers, missingDocuments);
}, 5000); // 5000 milliseconds = 5 seconds

// Stop sending messages after a certain number of iterations (for testing purposes)
// You can remove this if you want to keep sending messages indefinitely
const maxIterations = 10; // Adjust as needed
let iterationCount = 0;

// Stop interval after maxIterations
const stopInterval = () => {
  clearInterval(intervalId);
};

// Call stopInterval after maxIterations
setTimeout(stopInterval, maxIterations * 5000); // Stop after maxIterations * 5 seconds
