
import kFade from "../css/dynamic-fade.css" with { type: "css" };
import noScrollbar from "../css/no-scrollbar.css" with { type: "css" }
import checker from "../css/checker-bg.css" with { type: "css" }
import Range from "../scripts/range.js";

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
                flex: 0 0 calc((100% - var(--gap) * (var(--per-page) - 1)) / var(--per-page));

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
                gap: var(--gap);
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
            
            button:hover:not(:disabled)
            {
                cursor: pointer;
            }
            
            button:disabled
            {
                opacity: 0.5;
                filter: saturate(0.5);
                cursor: not-allowed;
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
    #currentItems = new Range(0, 0);
    #changeObserver = null;
    #resizeObserver = null;


    constructor()
    {
        super();

        this.#shadow = this.attachShadow({ mode: "open" });
        this.#shadow.adoptedStyleSheets = [KCarousel.defaultStyles, ...KCarousel.#importedStyles];

        let content = KCarousel.template.content.cloneNode(true);
        this.#attachRefs(content);
        this.#shadow.appendChild(content);

        this.#changeObserver = new MutationObserver(this.#onRefresh.bind(this));
        this.#resizeObserver = new ResizeObserver(this.#onScroll.bind(this));
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
        this.#resizeObserver.observe(this.#refs.track);

        requestAnimationFrame(() => { this.#onRefresh(); })
    }

    disconnectedCallback()
    {
        this.#changeObserver.disconnect();
        this.#resizeObserver.disconnect();
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

        const perPage = parseInt(getComputedStyle(this).getPropertyValue("--per-page"));
        
        this.#currentItems = new Range(0, perPage - 1);
        this.#recreateDots();
    }

    #onScroll()
    {
        const track = this.#refs.track;
        const perPage = parseInt(getComputedStyle(this).getPropertyValue("--per-page"));

        const newStart = Math.round(track.scrollLeft / (track.scrollWidth / this.children.length));

        const newRange = new Range(newStart, newStart + perPage - 1);
        if (!newRange.equals(this.#currentItems))
        {
            this.#currentItems = newRange;
            this.#backSyncNav();
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

            this.#refs.pagi.appendChild(input);
            this.#pagiDotInputs.push(input);
        }

        this.#backSyncNav();
    }

    #backSyncNav()
    {
        this.#pagiDotInputs.forEach((dot, index) =>
        {
            console.log("Testing dot", index, "against range", this.#currentItems.start, "-", this.#currentItems.end);
            const active = this.#currentItems.test(index);
            console.log("Dot", index, "is", active ? "active" : "inactive");
            dot.classList.toggle("active", active);
            dot.part.toggle("nav-dot-active", active);
        });
        this.#refs.btnPrev.disabled = this.#currentItems.test(0);
        this.#refs.btnNext.disabled = this.#currentItems.test(this.children.length - 1);
    }

    scrollTo(index)
    {
        const targets = {content: this.children[index], dot: this.#pagiDotInputs[index]};

        if (!targets.content) return;

        targets.content.scrollIntoView({ behavior : "smooth", block: "nearest", inline: "nearest"});
        
        targets.dot?.scrollIntoView({ behavior : "smooth", block: "nearest", inline: "center"});
    }

    scrollBy(amount)
    {
        this.scrollTo(this.#currentItems.offset(amount));
    }
}


customElements.define("k-carousel", KCarousel);