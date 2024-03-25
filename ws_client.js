const WebSocket = require('ws');
const fs = require('fs');

const TOKEN = 'Your token here!';
const wsUrl = `wss://api.syndica.io/api-token/${TOKEN}`;
const websocket = new WebSocket(wsUrl);

// Path where you want to save the JSON file
const filePath = 'example.json';

var n_tx = 0;
let transactions = [];

websocket.onopen = function (event) {
    console.log('Connection established');

    // Send the specified request to subscribe
    websocket.send(JSON.stringify({
        "jsonrpc": "2.0",
        "id": 123,
        "method": "chainstream.transactionsSubscribe",
        "params": {
            "network": "solana-mainnet",
            "verified": false,
            "filter": {
                "accountKeys": {
                    "all": ["sasawZ2goHu4L1W95Y6xzBzmFz6hCyTdN7Ybxp4dQxR"], // Fake address with no activity.
                    "exclude": []
                }
            }
        }
    }));

    setInterval(() => {
        websocket.ping();
        websocket.pong();
    }, 30000);
};

websocket.onmessage = function (event) {
    n_tx += 1;

    if (n_tx == 1) {
        console.log(`subscribe result: ${event.data}`);
    } else {
        const tsJson = JSON.parse(event.data);
        tsJson.timestamp = new Date().toISOString();

        const signature = tsJson.params.result.context.signature;
        console.log(`Transaction signature: ${signature}`);

        transactions.push(tsJson);

        if (n_tx == 10) {
            const formattedJson = JSON.stringify(transactions, null, 4);
            fs.writeFile(filePath, formattedJson, (err) => {
                if (err) {
                    console.error('Error writing to file:', err);
                } else {
                    console.log(`Final batch of transactions have been written to ${filePath}`);
                    process.exit();
                }
            });
        }
    }
};

websocket.onerror = function (event) {
    console.error('WebSocket Error: ', event);
};

websocket.onclose = function (event) {
    console.log('WebSocket connection closed');
};
