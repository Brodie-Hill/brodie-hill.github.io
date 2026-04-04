
let schedulePagi = new Set();


const changeObserver = new MutationObserver((entries) =>
{
    for (const entry of entries)
    {        
        const target = entry.target;
        
        if (schedulePagi.has(target)) return;
        if (entry.type != "childList") continue;

        if (target.classList.contains("carousel-content"))
        {
            const carousel = target.parentElement;
            schedulePagi.add(target);
            requestAnimationFrame(() => {
                schedulePagi.delete(target);
                buildNav(carousel);
            });
        }
    }
});

function buildNav(carousel)
{
    let carouselDefaultClasses = {
        dot: ["carousel-dot", ...(carousel.dataset.carouselNavDot?.split(" ") || [])],
        button: ["carousel-btn", ...(carousel.dataset.carouselNavButton?.split(" ") || [])]
    }
    
    carousel.dataset.currentPage = "0";
    let p = Number(carousel.dataset.currentPage);

    const navContainer = carousel.querySelector(".carousel-nav");
    if (!navContainer) return false;

    const contentContainer = carousel.querySelector(".carousel-content");

    navContainer.innerHTML = "";
    
    const randId = "carousel-" + Math.random().toString(36).slice(2); // random string of letters and numbers
    const idBase = carousel.id || randId;

    const dotsContainer = document.createElement("div");
    dotsContainer.className = "carousel-nav__dots";
    navContainer.append(dotsContainer);
    const controls = [];
    const content = Array.from(contentContainer.children);

    for (const [index, child] of content.entries())
    {
        const control = document.createElement("input");
        control.type = "radio";
        control.id = `${idBase}-dot${index}`;
        control.name = idBase;
        control.style.display = "none";
        control.dataset.index = index;
        controls.push(control);
        const dot = document.createElement("label");
        dot.setAttribute("for", control.id);
        dot.classList.add(...carouselDefaultClasses.dot);
        dot.classList.add(`carousel-dot__${child.tagName.toLowerCase()}`); // img, video, audio specific styling

        dot.addEventListener("click", () =>
        {
            carouselScrollTo(index);
        });

        dotsContainer.appendChild(control);
        dotsContainer.appendChild(dot);
    };

    const lastIndex = contentContainer.childElementCount - 1;

    const backBtn = document.createElement("button");
    const nextBtn = document.createElement("button");

    backBtn.classList.add("carousel-button", "back", ...carouselDefaultClasses.button);
    nextBtn.classList.add("carousel-button", "next", ...carouselDefaultClasses.button);
    backBtn.innerText = "\u25C0";
    nextBtn.innerText = "\u25B6";
    
    backBtn.onclick = () => { if (p > 0) carouselScrollTo(p - 1); };
    nextBtn.onclick = () => { if (p < lastIndex) carouselScrollTo(p + 1); };

    navContainer.prepend(backBtn);
    navContainer.append(nextBtn);

    let timeoutId;
    contentContainer.addEventListener("scroll", (event) =>
    {
        for (const [index, child] of content.entries())
        {
            if (child.offsetLeft > contentContainer.scrollLeft)
            {
                p = index;
                carousel.dataset.currentPage = p.toString();
                clearTimeout(timeoutId);
                timeoutId = setTimeout(updateUi, 50);
                break;
            }
        };
    });
            
    updateUi();


    function updateUi()
    {
        controls.forEach((control, index) =>
        {
            const checked = (index == p);
            control.checked = checked;
            backBtn.disabled = (p == 0);
            nextBtn.disabled = (p == lastIndex);
            if (checked)
                control.nextElementSibling.scrollIntoView({block: "nearest", inline: "center", behavior: "smooth"})
        });
        content.forEach((media, index) =>
        {
            if (media instanceof HTMLMediaElement)
            {
                if (index == p) media.play();
                else media.pause();
            }
        });
    }

    function carouselScrollTo(index)
    {
        carousel.dataset.currentPage = (p = index).toString();
        contentContainer.children[p].scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center"});
        updateUi();
    }
}

export function setPlayable(carousel, playable)
{
    carousel.dataset.playable = `${playable}`;
    const contentContainer = carousel.querySelector(".carousel-content")
    const page = carousel.dataset.currentPage || "0";
    const content = Array.from(contentContainer.children);
    
    content.forEach((media, index) =>
    {
        if (media instanceof HTMLMediaElement)
        {
            if (index == page && playable) media.play();
            else media.pause();
        }

    });
}

export function makeCarousel(parent, addNav)
{   
    let carouselDefaultClasses =
    {
        content: ["carousel-content", ...(parent.dataset.carouselContent?.split(" ") || [])],
        nav: ["carousel-nav", ...(parent.dataset.carouselNav?.split(" ") || [])]
    }

    const contentContainer = document.createElement("div");
    contentContainer.classList.add(...carouselDefaultClasses.content);
    // move id so future appends using it go to contentContainer
    if (parent.id)
    {
        contentContainer.id = parent.id;
        parent.removeAttribute("id");
    }
    // any existing childs from loaded DOM need moving too
    while (parent.firstChild) {contentContainer.appendChild(parent.firstChild);console.log("G");}
    parent.appendChild(contentContainer);

    if (addNav)
    {
        const nav = document.createElement("div");
        nav.classList.add(...carouselDefaultClasses.nav);
        parent.appendChild(nav)
        changeObserver.observe(contentContainer, {"childList": true});
        buildNav(parent);
    }
}

const targets = document.querySelectorAll(".carousel");

targets.forEach((el) =>
{
    makeCarousel(el, true);
});