// requests.js
export default class RequestsController {
    constructor(element, params) {
        this.element = element;
        this.params = params;
        this.initIframe();
        window.addEventListener('resize', () => this.adjustIframeSize());
    }

    initIframe() {
        // Use ApiClient directly to get the RequestsUrl
        ApiClient.getJSON(ApiClient.getUrl('Plugins/RequestsAddon/PublicRequestsUrl'))
            .then(response => {
                const iframe = document.createElement('iframe');
                const defaultUrl = 'https://www.example.com'; // Default URL if none is set
                iframe.src = response || defaultUrl; // Use dynamic URL or default
                iframe.style.width = '100%';
                iframe.style.height = '100%';
                iframe.frameborder = '0';
                iframe.allow = 'fullscreen';
                iframe.allowfullscreen = true;

                this.element.appendChild(iframe);
                this.adjustIframeSize();
            })
            .catch(error => {
                console.error('Error fetching RequestsUrl:', error);
                // Handle the error (e.g., display a message to the user)
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
        console.log('Requests tab resumed with options:', options);
    }

    onPause() {
        console.log('Requests tab paused');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const element = document.querySelector('#requestsTab');
    const params = {};
    new RequestsController(element, params);
});
