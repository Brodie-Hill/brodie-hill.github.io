
import kFade from "../css/dynamic-fade.css" with { type: "css" };
import noScrollbar from "../css/no-scrollbar.css" with { type: "css" }
import checker from "../css/checker-bg.css" with { type: "css" }

export class KCarousel extends HTMLElement
{
    static #importedStyles = [kFade, noScrollbar, checker];

    static #backing_defaultStyles = null;
    static get defaultStyles()
    {
        if (KCarousel.#backing_defaultStyles) return KCarousel.#backing_defaultStyles;

        KCarousel.#backing_defaultStyles = new CSSStyleSheet();
        KCarousel.#backing_defaultStyles.replaceSync(`
            :host
            {
                --per-page: 1;
                --gap: 1rem;

                position: relative;
                display: flex;
                flex-direction:column;
                justify-content: stretch;
                gap: var(--gap);
                width: 100%;
            }
                        
            ::slotted(*)
            {
                box-sizing: border-box;
                flex: 0 0 100%;

                scroll-snap-align: start;
                object-fit: contain;
            }

            .track
            {
                display: flex;
                flex-direction: row;
                overflow-x: auto;
                height: 100%;
                scroll-snap-type: x mandatory;
                scroll-behavior: smooth;
                gap: 1px;
            }

            .controls
            {
                display: flex;
                flex-direction: row;
                justify-content: space-between;
                align-items: center;
                gap: var(--gap);
            }

            .controls__dots
            {
                display: flex;
                flex-direction: row;
                justify-content: flex-start;
                align-items: center;
                gap: var(--gap);
                overflow: auto visible;

                scrollbar-width: none;
                &::-webkit-scrollbar: none;

                /* flex: 1; */
                margin-left:auto;
                margin-right: auto;
            }

            button
            {
            }
            
            button:hover
            {
                cursor: pointer;
            }
            
            .pagi-dot
            {
                height: 10px;
                aspect-ratio: 1 / 1;
                padding: 0;
                margin: 0;
                border-radius: 50cqh;
                position: relative;
            }
            
            .pagi-dot:hover
            {
                cursor:pointer;
            }
            .pagi-dot.active
            {
                background: blue;
            }
        `);
        return KCarousel.#backing_defaultStyles;
    }

    static #backing_template = null;
    static get template()
    {
        if (KCarousel.#backing_template) return KCarousel.#backing_template;

        KCarousel.#backing_template = document.createElement("template");
        KCarousel.#backing_template.innerHTML = `
            <div part="content" class="checkerboard-digradial">
                <slot part="track" class="track no-scrollbar "></slot>
            </div>
            
            <div part="nav" class="controls">
                <button id="prev" part="nav-button nav-button-prev" aria-label="Previous slide">&#10094;</button>
                <span id="pagination" class="controls__dots k-fade">
                    <!-- dots spawn here -->
                </span>
                <button id="next" part="nav-button nav-button-next" aria-label="Next slide">&#10095;</button>
            </div>
        `;
        return KCarousel.#backing_template;
    }

    static get observedAttributes()
    {
        return [];
    }


    #shadow = null;
    #pagiDotInputs = [];
    #refs = {};
    #currentPage = 0;
    #changeObserver = null;


    constructor()
    {
        super();

        this.#shadow = this.attachShadow({ mode: "open" });
        this.#shadow.adoptedStyleSheets = [KCarousel.defaultStyles, ...KCarousel.#importedStyles];

        let content = KCarousel.template.content.cloneNode(true);
        this.#attachRefs(content);
        this.#shadow.appendChild(content);

        this.#changeObserver = new MutationObserver(this.#onRefresh.bind(this));
    }

    #attachRefs(root)
    {
        this.#refs.track = root.querySelector(".track");
        this.#refs.pagi = root.querySelector("#pagination");
        this.#refs.btnPrev = root.querySelector("#prev");
        this.#refs.btnNext = root.querySelector("#next");

        this.#refs.btnPrev.onclick = () => this.scrollBy(-1);
        this.#refs.btnNext.onclick = () => this.scrollBy(1);

        this.#refs.track.addEventListener("scroll", () => this.#onScroll(), { passive: true });
    }

    connectedCallback()
    {  
        this.#changeObserver.observe(this, { attributes: true, childList: true });

        requestAnimationFrame(() => { this.#onRefresh(); })
    }

    disconnectedCallback()
    {
        this.#changeObserver.unobserve(this);
    }
    
    attributeChangedCallback(name, oldValue, newValue)
    {
        switch(name)
        {
            case "per-page":
            {
                if (newValue)
                    this.style.setAttribute("--per-page", newValue);
                else
                    this.style.removeProperty("--per-page");

                break;
            }
        }
    }

    #onRefresh()
    {
        this.#refs.track.scrollTo(
        {
            top: 0,
            left: 0,
            behavior: "instant"
        });

        this.#currentPage = 0;
        this.#recreateDots();
    }

    #onScroll()
    {
        const track = this.#refs.track;
        const currentPage = Math.round(track.scrollLeft / track.clientWidth);

        if (currentPage != this.#currentPage)
        {
            this.#currentPage = currentPage;
            this.#backSyncDots();
        }
    }

    #recreateDots()
    {
        this.#refs.pagi.innerHTML = "";
        this.#pagiDotInputs = [];

        const myId = this.id || Math.random().toString(16).slice(2);

        for (let index = 0; index < this.children.length; index++)
        {
            const input = document.createElement("span");
            input.id = `pagi-${myId}-${index}`;
            input.className = "pagi-dot";
            input.onclick = () => this.scrollTo(index);
            input.part = `nav-dot`;

            input.classList.toggle("active", index == this.#currentPage);
            input.part.toggle("nav-dot-active", index == this.#currentPage);

            this.#refs.pagi.appendChild(input);
            this.#pagiDotInputs.push(input);
        }

    }

    #backSyncDots()
    {
        this.#pagiDotInputs.forEach((dot, index) =>
        {
            dot.classList.toggle("active", index == this.#currentPage);
            dot.part.toggle("nav-dot-active", index == this.#currentPage);
        });
    }

    scrollTo(index)
    {
        const targets = {content: this.children[index], dot: this.#pagiDotInputs[index]};

        if (!targets.content) return;

        targets.content.scrollIntoView({ behavior : "smooth", block: "start", inline: "nearest"});
        
        targets.dot?.scrollIntoView({ behavior : "smooth", block: "start", inline: "center"});
    }

    scrollBy(amount)
    {
        this.scrollTo(this.#currentPage += amount);
    }
}


customElements.define("k-carousel", KCarousel);