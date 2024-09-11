// requests.js
export default class RequestsController {
    constructor(element, params) {
        this.element = element;
        this.params = params;
        this.initIframe();
        window.addEventListener('resize', () => this.adjustIframeSize()); 
    }


    initIframe() {
        ApiClient.getServerConfiguration().then(config => {
            const iframe = document.createElement('iframe');
            iframe.src = config.RequestsUrl || "https://olivetin.soultaco.club"; // Use dynamic URL
            iframe.style.width = "100%";
            iframe.style.height = "100%";
            iframe.frameborder = "0";
            iframe.allow = "fullscreen";
            iframe.allowfullscreen = true;
        
            this.element.appendChild(iframe);
            this.adjustIframeSize(); 
        });
    }

    adjustIframeSize() {
        const iframe = this.element.querySelector('iframe');
        if (iframe) {
            iframe.style.height = `${window.innerHeight}px`;
            iframe.style.width = `${window.innerWidth}px`;
        }
    }

    onResume(options) {
        // Implement what should happen when the tab is resumed (shown)
        console.log('Requests tab resumed with options:', options);
    }

    onPause() {
        // Implement what should happen when the tab is paused (hidden)
        console.log('Requests tab paused');
    }
}
document.addEventListener('DOMContentLoaded', () => {
    const element = document.querySelector('#requestsTab');
    const params = {};
    new RequestsController(element, params);
});