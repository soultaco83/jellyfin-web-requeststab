// requests.js
export default class RequestsController {
    constructor(element, params) {
        this.element = element;
        this.params = params;
        this.initIframe();
        
        // Debounce the resize handler to improve performance
        this.resizeHandler = _.debounce(() => this.adjustIframeSize(), 150);
        window.addEventListener('resize', this.resizeHandler);
    }

    initIframe() {
        ApiClient.getJSON(ApiClient.getUrl('Plugins/RequestsAddon/PublicRequestsUrl'))
            .then(response => {
                const container = document.createElement('div');
                container.style.cssText = `
                    position: relative;
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                `;

                const iframe = document.createElement('iframe');
                const defaultUrl = 'https://www.example.com';
                iframe.src = response || defaultUrl;
                
                // Add viewport meta tag for proper mobile scaling
                const meta = document.createElement('meta');
                meta.name = 'viewport';
                meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
                document.head.appendChild(meta);

                // Set iframe styles for better mobile handling
                iframe.style.cssText = `
                    width: 100%;
                    height: 100%;
                    border: none;
                    position: absolute;
                    top: 0;
                    left: 0;
                    transform-origin: 0 0;
                    overflow: hidden;
                `;
                
                iframe.setAttribute('frameborder', '0');
                iframe.setAttribute('allowfullscreen', 'true');
                iframe.setAttribute('allow', 'fullscreen');
                
                // Add scroll wrapper for mobile
                const scrollWrapper = document.createElement('div');
                scrollWrapper.style.cssText = `
                    width: 100%;
                    height: 100%;
                    overflow: auto;
                    -webkit-overflow-scrolling: touch;
                    position: relative;
                `;

                scrollWrapper.appendChild(iframe);
                container.appendChild(scrollWrapper);
                this.element.appendChild(container);
                
                this.iframe = iframe;
                this.scrollWrapper = scrollWrapper;
                this.adjustIframeSize();

                // Add load event listener to handle content sizing
                iframe.addEventListener('load', () => {
                    this.adjustIframeSize();
                    // Try to set viewport of iframe content if possible
                    try {
                        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                        const viewportMeta = iframeDoc.querySelector('meta[name="viewport"]');
                        if (!viewportMeta) {
                            const newMeta = iframeDoc.createElement('meta');
                            newMeta.name = 'viewport';
                            newMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0';
                            iframeDoc.head.appendChild(newMeta);
                        }
                    } catch (e) {
                        console.log('Unable to modify iframe viewport - cross-origin restrictions');
                    }
                });
            })
            .catch(error => {
                console.error('Error fetching RequestsUrl:', error);
                this.element.innerHTML = '<div class="error">Error loading requests page. Please try again later.</div>';
            });
    }

    adjustIframeSize() {
        if (!this.iframe || !this.scrollWrapper) return;

        // Get the available viewport dimensions
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        
        // Calculate the available space for the iframe
        const headerHeight = document.querySelector('.skinHeader') ? 
            document.querySelector('.skinHeader').offsetHeight : 0;
        const tabsHeight = document.querySelector('.emby-tabs-slider') ?
            document.querySelector('.emby-tabs-slider').offsetHeight : 0;
        
        // Set the wrapper height accounting for header and tabs
        const availableHeight = viewportHeight - (headerHeight + tabsHeight);
        this.scrollWrapper.style.height = `${availableHeight}px`;

        // Adjust iframe scale for mobile devices
        if (window.innerWidth <= 768) {
            const scale = viewportWidth / this.iframe.offsetWidth;
            this.iframe.style.transform = `scale(${scale})`;
            this.iframe.style.width = `${(100 / scale)}%`;
            this.iframe.style.height = `${(availableHeight / scale)}px`;
        } else {
            // Reset transform for desktop
            this.iframe.style.transform = 'none';
            this.iframe.style.width = '100%';
            this.iframe.style.height = '100%';
        }
    }

    onResume(options) {
        this.adjustIframeSize();
    }

    onPause() {
        // Cleanup
    }

    destroy() {
        window.removeEventListener('resize', this.resizeHandler);
        this.element = null;
        this.iframe = null;
        this.scrollWrapper = null;
    }
}
