import { registerPlugin } from '@capacitor/core';

const NodeJS = registerPlugin('NodeJS');

async function startApp() {
    if (window.Capacitor && window.Capacitor.isNativePlatform()) {
        try {
            await NodeJS.start();
        } catch (e) {
            console.error('Failed to start local node server', e);
        }
    }
}

startApp();
