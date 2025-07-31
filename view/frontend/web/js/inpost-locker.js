const InpostLockerModule = {
    validationRegistered: false,

    init() {
        this.elements = this.getElements();

        if (!this.elements.selectBtn || !this.elements.modal) {
            return;
        }

        if (this.elements.selectBtn.dataset.inPostInitialized === 'true') {
            return;
        }

        this.config = this.getConfig();
        console.log('Config', this.config);
        this.bindEvents();
        this.restoreSelectedPoint();
        this.elements.selectBtn.dataset.inPostInitialized = 'true';
    },

    getSelectedPoint() {
        try {
            const stored = localStorage.getItem('inpostinternational_locker_id');
            return stored ? JSON.parse(stored) : (this.config?.savedPoint || null);
        } catch (e) {
            console.warn('Error getting selected point:', e);
            return null;
        }
    },

    getElements() {
        return {
            selectBtn: document.getElementById('inpost-select-picker'),
            modal: document.getElementById('inpost-modal-wrapper'),
            codeEl: document.getElementById('inpost_locker-code'),
            addressEl: document.getElementById('inpost_locker-address'),
            closeBtn: document.getElementById('inpost-modal-close'),
            mapContainer: document.getElementById('inpost-map-container'),
            configEl: document.getElementById('inpost-config-data')
        };
    },

    getConfig() {
        const el = this.elements.configEl;
        if (!el) return {};

        const config = {};
        Object.keys(el.dataset).forEach(key => {
            switch (key) {
                case 'isSandbox':
                    config[key] = el.dataset[key] === 'true';
                    break;
                case 'shippingMethods':
                    config[key] = (el.dataset[key] || '').split(',').filter(Boolean);
                    break;
                case 'savedPoint':
                    try {
                        config[key] = JSON.parse(el.dataset[key] || 'null');
                    } catch (e) {
                        console.warn('Invalid savedPoint JSON:', e);
                        config[key] = null;
                    }
                    break;
                default:
                    config[key] = el.dataset[key];
            }
        });

        return config;
    },

    bindEvents() {
        const { selectBtn, modal, closeBtn } = this.elements;

        if (selectBtn && !selectBtn.hasAttribute('data-inpost-bound')) {
            selectBtn.setAttribute('data-inpost-bound', 'true');
            selectBtn.addEventListener('click', () => {
                this.openModal();
            });
        }

        if (closeBtn) {
            closeBtn.removeEventListener('click', this.handleCloseClickBound);
            this.handleCloseClickBound = this.handleCloseClick.bind(this);
            closeBtn.addEventListener('click', this.handleCloseClickBound);
        }

        if (modal) {
            modal.removeEventListener('click', this.handleOutsideClickBound);
            this.handleOutsideClickBound = (e) => {
                if (e.target === e.currentTarget) this.closeModal();
            };
            modal.addEventListener('click', this.handleOutsideClickBound);
        }

        document.removeEventListener('keyup', this.handleEscapeKeyBound);
        this.handleEscapeKeyBound = this.handleEscapeKey.bind(this);
        document.addEventListener('keyup', this.handleEscapeKeyBound);
    },

    handleCloseClick(e) {
        e.preventDefault();
        this.closeModal();
    },

    handleEscapeKey(e) {
        const modal = document.getElementById('inpost-modal-wrapper');
        if (e.key === 'Escape' && modal?.style.display === 'flex') {
            this.closeModal();
        }
    },

    openModal() {
        const modal = document.getElementById('inpost-modal-wrapper');
        if (!modal) return;
        this.restoreSelectedPoint();

        document.body.classList.add('_has-inpost-modal');
        modal.style.display = 'flex';
        this.loadGeowidget();
    },

    closeModal() {
        const modal = document.getElementById('inpost-modal-wrapper');
        const mapContainer = document.getElementById('inpost-map-container');

        if (modal) modal.style.display = 'none';
        if (mapContainer) mapContainer.innerHTML = '';
        document.body.classList.remove('_has-inpost-modal');
    },

    loadGeowidget() {
        const container = document.getElementById('inpost-map-container');
        if (!container) return;

        const baseUrl = this.config?.isSandbox
            ? 'https://sandbox-global-geowidget-sdk.easypack24.net'
            : 'https://geowidget.inpost-group.com';

        this.loadResource('link', {
            rel: 'stylesheet',
            href: `${baseUrl}/inpost-geowidget.css`
        });

        this.loadResource('script', {
            src: `${baseUrl}/inpost-geowidget.js`,
            defer: true,
            onload: () => this.initWidget(
                this.config?.token,
                this.config?.geowidgetCountries,
                this.config?.isSandbox
            )
        });
    },

    loadResource(type, attrs) {
        const selector = type === 'link'
            ? `link[href="${attrs.href}"]`
            : `script[src="${attrs.src}"]`;

        if (!document.querySelector(selector)) {
            const el = document.createElement(type);
            Object.assign(el, attrs);
            document.head.appendChild(el);
        } else if (attrs.onload && typeof attrs.onload === 'function') {
            attrs.onload();
        }
    },

    initWidget(token, country, isSandbox) {
        const container = document.getElementById('inpost-map-container');
        if (!container) return;

        container.innerHTML = '';

        const widget = document.createElement('inpost-geowidget');
        widget.setAttribute('token', token);
        widget.setAttribute('config', 'parcelCollect');
        if (country) widget.setAttribute('country', country);
        if (isSandbox) widget.setAttribute('sandbox', 'true');

        widget.setAttribute('onpoint', 'onpointselect');
        widget.addEventListener('onpointselect', (event) => {
            this.handlePointSelect(event.detail);
        });

        container.appendChild(widget);
    },

    handlePointSelect(point) {
        this.updatePointInfo(point);
        this.savePoint(point);
        this.closeModal();
    },

    savePoint(point) {
        const json = JSON.stringify(point);
        const carrierCode = document.querySelector('input[name="shipping-method-option"]:checked')?.value?.split('_')[0];

        if (carrierCode) {
            localStorage.setItem(`inpostinternational_locker_id_${carrierCode}`, json);
        }
        localStorage.setItem('inpostinternational_locker_id', json);

        const formKey = document.querySelector('input[name="form_key"]')?.value ||
            window.checkoutConfig?.formKey;

        if (!this.config?.savePointUrl || !formKey) return;

        fetch(this.config.savePointUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: new URLSearchParams({
                form_key: formKey,
                point_data: json,
                point_id: point.name,
                carrier_code: document.querySelector('input[name="shipping-method-option"]:checked')?.value || ''
            })
        }).catch(console.error);
    },

    restoreSelectedPoint() {
        const point = this.getBestSavedPoint();

        if (point) {
            this.updatePointInfo(point);
            this.savePoint(point);
        }
    },

    updatePointInfo(point) {
        const address = [
            point.address?.line1,
            point.address?.line2,
            point.location_description
        ].filter(Boolean).join('\n');

        const codeEl = document.getElementById('inpost_locker-code');
        const addressEl = document.getElementById('inpost_locker-address');

        if (codeEl) codeEl.innerText = point.name;
        if (addressEl) addressEl.innerHTML = address.replace(/\n/g, '<br/>');

        document.getElementById('inpost_locker-selected').style.display = 'block';
    },

    getBestSavedPoint() {
        const method = document.querySelector('input[name="shipping-method-option"]:checked')?.value || '';
        const carrierCode = method.split('_')[0];

        let specificServerSavedPoint = null;
        let specificLocalStoragePoint = null;
        let genericServerSavedPoint = null;
        let genericLocalStoragePoint = null;

        try {
            if (carrierCode && this.config[`savedPoint_${carrierCode}`]) {
                specificServerSavedPoint = JSON.parse(this.config[`savedPoint_${carrierCode}`]);
            }
        } catch (e) {
            console.warn('Failed to parse specificServerSavedPoint:', e);
        }

        try {
            if (carrierCode) {
                const storedSpecific = localStorage.getItem(`inpostinternational_locker_id_${carrierCode}`);
                if (storedSpecific) {
                    specificLocalStoragePoint = JSON.parse(storedSpecific);
                }
            }
        } catch (e) {
            console.warn('Failed to parse specificLocalStoragePoint:', e);
        }

        try {
            if (this.config.savedPoint) {
                genericServerSavedPoint = this.config.savedPoint;
            }
        } catch (e) {
            console.warn('Failed to get generic saved point from config:', e);
        }

        try {
            const stored = localStorage.getItem('inpostinternational_locker_id');
            if (stored) {
                genericLocalStoragePoint = JSON.parse(stored);
            }
        } catch (e) {
            console.warn('Failed to parse genericLocalStoragePoint:', e);
        }

        return specificLocalStoragePoint ||
            specificServerSavedPoint ||
            genericServerSavedPoint ||
            genericLocalStoragePoint;
    },
};

// Translation helper function
function __(text) {
    return window.hyva?.translate?.(text) || text;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        InpostLockerModule.init();
    });
} else {
    InpostLockerModule.init();
}

window.addEventListener('checkout:shipping:method-activate', event => {
    InpostLockerModule.init();
});
