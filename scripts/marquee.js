

export class KMarquee extends HTMLElement
{
    static #defaultStyles = null;
    static get defaultStyles()
    {
        if (KMarquee.#defaultStyles) return KMarquee.#defaultStyles;

        KMarquee.#defaultStyles = new CSSStyleSheet();
        KMarquee.#defaultStyles.replaceSync(`
            :host
            {
                display: block;
                overflow: hidden;
                width: 100%;
            }

            slot
            {
                display: inline-block;
                white-space: nowrap;
            }
        `);
        return KMarquee.#defaultStyles;
    }
    static get observedAttributes()
    {
        return ["speed", "pause"];
    }


    #shadow = null;
    #slot = null;
    #updater = null;
    #animation = null;
    
    constructor()
    {
        super();
        this.#shadow = this.attachShadow({ mode: "closed" });

        this.#shadow.adoptedStyleSheets = [KMarquee.defaultStyles];
        this.#slot = document.createElement("slot");
        this.#shadow.appendChild(this.#slot);

        let callback = (r) => { this.#updateAnimation(); }
        this.#updater = new ResizeObserver(callback);

    }

    connectedCallback()
    {
        this.#updater.observe(this)
        this.#updater.observe(this.#slot)
        this.#updateAnimation();
    }

    disconnectedCallback()
    {
        this.#updater.disconnect();
    }

    attributeChangedCallback(name, oldValue, newValue)
    {
        if (oldValue === newValue) return;
        this.#updateAnimation();
    }

    #updateAnimation()
    {
        if (!this.isConnected) return;

        const scrollSpeed = parseFloat(this.getAttribute("speed") ?? 30);
        const stopDuration = parseFloat(this.getAttribute("pause") ?? 1.0);

        const slotWidth = this.#slot.offsetWidth;
        const hostWidth = this.clientWidth;
        const remainder = slotWidth - hostWidth;
        
        const travelTime = remainder / scrollSpeed;
        const animPeriod = travelTime + 2 * stopDuration;

        if (remainder <= 0)
        {
            if (this.#animation) this.#animation.cancel();
            return;
        }

        const p1 = (0 + stopDuration) / animPeriod;
        const p2 = (animPeriod - stopDuration) / animPeriod;

        const keyframes = [
            { transform: `translateX(0)`, offset: 0.0 },
            { transform: `translateX(0)`, offset: p1 },
            { transform: `translateX(-${remainder}px)`, offset: p2 },
            { transform: `translateX(-${remainder}px)`, offset: 1.0 }
        ];

        const options = {
                duration: animPeriod * 1000, // API uses milliseconds
                iterations: Infinity,
                easing: 'linear'
        };

        if (this.#animation) this.#animation.cancel();
        this.#animation = this.#slot.animate(keyframes, options);
    }
}

customElements.define("k-marquee", KMarquee);
