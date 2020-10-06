## Google Spreadheets and Headless-browser NodeJS
Project has 3 steps
- The project get list urls from Google SpreedSheet use Google API
- Use Headless-browser (selenium-webdriver, selenium-webdriver/proxy, browsermob-proxy-client) to log all request domains to each url
- Write new data to Google SpreedSheet

### Setting Up

1. Clone the repository.
1. Run `npm install`.
1. Run `npm install selenium-webdriver`.
1. Run `npm install selenium-webdriver/proxy`.
1. Run `npm install browsermob-proxy-client`
1. Update `SPREADSHEET_ID` in `monitor_network.js` to your desired spreadsheet.
1. Go to the [documentation](https://developers.google.com/sheets/api/quickstart/nodejs) and follow Step 1 to turn on the Google Sheets API. Save the resulting `credentials.json` file in your project root.
1. Run `./browsermob-proxy` 
1. Run `node monitor_network.js`. You will be asked to visit a URL and paste the resulting code into your command line.
