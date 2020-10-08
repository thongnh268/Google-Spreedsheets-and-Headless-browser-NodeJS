const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

const TOKEN_PATH = 'token.json';

const BrowserMob = require('browsermob-proxy-client')
const selProxy = require('selenium-webdriver/proxy')
const webdriver = require('selenium-webdriver')
// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Google Sheets API.
    authorize(JSON.parse(content), listMajors);
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

async function listMajors(auth) {
    const sheets = google.sheets({ version: 'v4', auth });
    try {
        const a = await sheets.spreadsheets.values.get({
            spreadsheetId: '1T7DwI4iyvWHyrqFm_ljzz5vyjNz0OWUGj6N96nVX3IE',
            range: 'Sub update 30.09!A2:P',
        })
        const rows = a.data.values;
        const outs = []
        for (let i = 0; i < rows.length; i++) {
            // console.log(`${rows[i][15]}`)
            if (`${rows[i][15]}` == "Đã đổi mã nhúng mới") {
                const result = await getUrls(`${rows[i][1]}`);
                console.log(result)
                rows[i][15] = result
            }
            outs[i] = new Array(rows[i][15])
            //   outs[i] = new Array(result)
        }

        await sheets.spreadsheets.values.update({
            auth: auth,
            spreadsheetId: '1T7DwI4iyvWHyrqFm_ljzz5vyjNz0OWUGj6N96nVX3IE',
            range: 'Sub update 30.09!P2', //Change Sheet1 if your worksheet's name is something else
            valueInputOption: "USER_ENTERED",
            resource: {
                values: outs,
            }
        });
    } catch (e) {
        console.log(e)
    }
}

async function getUrls(link) {
    try {
        let defaultProxy = BrowserMob.createClient()

        await defaultProxy.start()
        await defaultProxy.createHar()
        let driver = new webdriver.Builder().
            withCapabilities({
                browserName: 'chrome',
                acceptSslCerts: true,
                acceptInsecureCerts: true,
            }).
            setProxy(
                selProxy.manual({
                    http: 'localhost:' + defaultProxy.proxy.port,
                    https: 'localhost:' + defaultProxy.proxy.port,
                })
            ).
            build()
        console.log('-------------------------', link)
        await driver.get(link)

        try {
            await driver.wait(() => false, 8000)
        } catch (e) { }
        const har = await defaultProxy.getHar()
        await driver.close()
        await defaultProxy.closeProxies()
        await defaultProxy.end()
        let urls = har.log.entries.map(obj => obj.request.url)
        // console.log(urls)
        const a = checkSubiz(urls)
        return a
    } catch (e) {
        console.log(e)
        return 'Error when parsing'
    }
}

function checkSubiz(urls) {
     if (urls.some(urls => urls.indexOf("https://widget.subiz.xyz/sbz/app.js") > -1)) {
        return ('Chưa đổi mã nhúng mới')
    }
    if (urls.some(urls => urls.indexOf("https://widget.subiz.net/sbz/app.js") > -1)) {
        return ('Đã đổi mã nhúng mới')
    }
    if (urls.includes('https://widgetv4.subiz.com/static/js/app.js') || urls.includes('https://static.subiz.com/public/js/loader.js')) {
        return ('An toàn nhưng mã cũ')
    } 
    else {
        return ('Không phát hiện mã nhúng Subiz')
    }
}