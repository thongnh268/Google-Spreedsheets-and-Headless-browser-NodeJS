const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

const TOKEN_PATH = 'token.json';

const BrowserMob = require('browsermob-proxy-client')
const selProxy = require('selenium-webdriver/proxy')
const webdriver = require('selenium-webdriver');
const { auth } = require('googleapis/build/src/apis/abusiveexperiencereport');
// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Google Sheets API.
    authorize(JSON.parse(content), colorSheet);
});

function authorize(credentials, callback) {
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getNewToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client);
    });
}

function getNewToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error('Error while trying to retrieve access token', err);
            oAuth2Client.setCredentials(token);
            // Store the token to disk for later program executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) return console.error(err);
                console.log('Token stored to', TOKEN_PATH);
            });
            callback(oAuth2Client);
        });
    });
}


function colorSheet(auth) {
    const sheets = google.sheets({ version: 'v4', auth });
    const myRange = {
        sheetId: 777389948,
        startRowIndex: 1,
        endRowIndex: 600,
        startColumnIndex: 15,
        endColumnIndex: 16,
    };
    const requests = [
    {
        addConditionalFormatRule: {
            rule: {
                ranges: [myRange],
                booleanRule: {
                    condition: {
                        type: 'CUSTOM_FORMULA',
                        values: [{ userEnteredValue: '=ISNUMBER(FIND("Đã đổi mã nhúng mới",P2))'}],
                    },
                    format: {
                        // textFormat: { foregroundColor: { red: 1 } },
                        backgroundColor: { red: 0, green: 1, blue: 0 },
                    },
                },
            },
            index: 0,
        },
    }, 
    {
        addConditionalFormatRule: {
            rule: {
                ranges: [myRange],
                booleanRule: {
                    condition: {
                        type: 'CUSTOM_FORMULA',
                        values: [{ userEnteredValue: '=ISNUMBER(FIND("An toàn nhưng mã cũ",P2))'}],
                    },
                    format: {
                        // textFormat: { foregroundColor: { red: 1 } },
                        backgroundColor: { red: 1, green: 1, blue: 0 },
                    },
                },
            },
            index: 0,
        },
    },
    {
        addConditionalFormatRule: {
            rule: {
                ranges: [myRange],
                booleanRule: {
                    condition: {
                        type: 'CUSTOM_FORMULA',
                        values: [{ userEnteredValue: '=ISNUMBER(FIND("Không phát hiện mã nhúng Subiz",P2))'}],
                    },
                    format: {
                        // textFormat: { foregroundColor: { red: 1 } },
                        backgroundColor: { red: 0, green: 0.5, blue: 1 },
                    },
                },
            },
            index: 0,
        },
    },
    {
        addConditionalFormatRule: {
            rule: {
                ranges: [myRange],
                booleanRule: {
                    condition: {
                        type: 'CUSTOM_FORMULA',
                        values: [{ userEnteredValue: '=ISNUMBER(FIND("Chưa đổi mã nhúng mới",P2))'}],
                    },
                    format: {
                        // textFormat: { foregroundColor: { red: 1 } },
                        backgroundColor: { red: 1, green: 0, blue: 0 },
                    },
                },
            },
            index: 0,
        },
    },
];
    const resource = {
        requests,
    };
    sheets.spreadsheets.batchUpdate({
        spreadsheetId: '1T7DwI4iyvWHyrqFm_ljzz5vyjNz0OWUGj6N96nVX3IE',
        resource,
    }, (err, response) => {
        if (err) {
            // Handle error.
            console.log(err);
        } else {
            console.log(` cells updated.`);
        }
    });
}