import { Nodejs } from '@capawesome/capacitor-nodejs';

let redirected = false;
function openLocalApp() {
  if (redirected || window.location.hostname === '127.0.0.1') return;
  redirected = true;
  window.location.replace('http://127.0.0.1:8080/');
}

async function waitForNodeServer() {
  try {
    await Nodejs.addListener('ready', openLocalApp);
    const status = await Nodejs.isReady();
    if (status.ready) openLocalApp();
  } catch (error) {
    console.error('eShareX embedded Node.js startup failed:', error);
  }
}
waitForNodeServer();
