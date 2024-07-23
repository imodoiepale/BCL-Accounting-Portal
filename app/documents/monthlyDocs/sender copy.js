const { Client } = require('whatsapp-web.js');
const client = new Client();

client.on('ready', () => {
    console.log('Client is ready!');

    // Number where you want to send the message
    const phoneNumber = '+254743854888';

    // Your message
    const message = 'Hello, world!';

    // Getting chatId from the number
    // We remove the '+' from the beginning and add '@c.us' at the end
    const chatId = phoneNumber.substring(1) + '@c.us';

    // Sending the message
    client.sendMessage(chatId, message)
        .then(() => {
            console.log('Message sent successfully!');
            client.destroy(); // Close the connection
        })
        .catch((error) => {
            console.error('Error sending message:', error);
            client.destroy(); // Close the connection
        });
});

// Connect to WhatsApp Web
client.initialize();
