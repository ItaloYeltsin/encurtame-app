import puppeteer from 'puppeteer';
import fs from 'fs/promises';
async function getTimeToLoadPage(url) {
  const browser = await puppeteer.launch({headless: 'shell'});
  const page = await browser.newPage();

  // Navigate the page to a URL
  await page.goto(url);

  const perf = await page.evaluate(_ => {
    const { loadEventEnd, navigationStart } = performance.timing;
    return { loadTime: loadEventEnd - navigationStart };
  });

  await browser.close();
  return perf.loadTime;
}

(async () => {
  await fs.writeFile('./result.txt', ``);
  // Launch the browser and open a new blank page
  for(let i = 0; i < 30; i++) {
    console.log('Execution: ' + i);
    let timeToLoadFromCDN = await getTimeToLoadPage('http://d2hpr3ymkykonx.cloudfront.net/');
    let timeToLoadFromS3 = await getTimeToLoadPage('http://encurtame-web-app.s3-website-us-east-1.amazonaws.com/');
    await fs.writeFile('./result.txt', `${timeToLoadFromCDN}  ${timeToLoadFromS3}\n`, {flag: 'a+'});
  }
  
})();