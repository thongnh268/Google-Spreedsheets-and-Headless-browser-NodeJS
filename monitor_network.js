const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

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
  const {client_secret, client_id, redirect_uris} = credentials.installed;
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
  const sheets = google.sheets({version: 'v4', auth});
  try {
    const a = await sheets.spreadsheets.values.get({
      spreadsheetId: '1T7DwI4iyvWHyrqFm_ljzz5vyjNz0OWUGj6N96nVX3IE',
      range: 'Sub update 30.09!A2:E',
    })
    const rows = a.data.values;
    const outs = []
      for (let i = 0; i < 4; i++) {

        const result = await getUrls(`${rows[i][1]}`)
        outs[i] = new Array(result)
       }
      console.log(outs) 
      await sheets.spreadsheets.values.update({
        auth: auth,
        spreadsheetId: '1__iv0SfSeXe3BvlZysDTB8RO3fRW9Pjw5wxfXfZUFKs',
        range: 'Sheet1!F1', //Change Sheet1 if your worksheet's name is something else
        valueInputOption: "USER_ENTERED",
        resource: {
          values: outs,
        }
      });
  } catch (e) {
    console.log(e)
  }
}

async function getUrls (link) {
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
  console.log('-------------------------',link)
  await driver.get(link)

  try {
    await driver.wait(() => false, 4000)
  }catch(e) {}
  const har = await defaultProxy.getHar()
  await driver.close()
	await defaultProxy.closeProxies()
	await defaultProxy.end()
  let urls = har.log.entries.map(obj => obj.request.url)
	if (urls.includes('https://public-gcs.subiz-cdn.com/widget-v4/public/174e2e99733.app.js')){
		return('Đã đổi mã nhúng mới')
	} else if (urls.includes('https://public-gcs.subiz-cdn.com/widget-v4/public/174d9079970.app.js')){
		return('Chưa đổi mã nhúng mới')
	} else {
		return('Đã gỡ mã nhúng Subiz')
  }

  } catch (e) {
    console.log(e)
    return 'Error when parsing'
  }
	
}
