let toGroupMap = new Map();
const fromGroupMap = new Map();
let auxMap = new Map();

export function expand(el)
{
    if (el && el.dataset.state == "collapse")
    {
        el.classList.add("expand");
        el.classList.remove("collapse");
        el.dataset.state = "expand";
    }
}

export function collapse(el)
{
    if (el && el.dataset.state == "expand") {
        el.classList.add("collapse");
        el.classList.remove("expand");
        el.dataset.state = "collapse";
    }
};

export function toggle(el)
{
    if (el)
    {
        const expanded = el.classList.toggle("expand");
        el.classList.toggle("collapse", !expanded);
        el.dataset.state = expanded ? "expand" : "collapse";
        return expanded;
    }
    return false;
};

function toggleInGroup(el)
{
    const group = toGroupMap.get(el);
    if (!group) return toggle(el);
    if (toggle(el)) {
        for (let other of fromGroupMap.get(group)) {
            if (other !== el) collapse(other);
        }
        return true;
    }
    return false;
};

function managed(el, stateCheck)
{
    if (stateCheck == null)
        return !!el.dataset.state;
    return (el.dataset.state == stateCheck);
};

function manage(el)
{
    const aux = auxMap.get(el);
    if (!aux) return;

    if (!aux.btn)
    {
        aux.btn = document.createElement("button");
        aux.btn.textContent = "Show More";
        aux.btn.className = "expand-trigger heavy small chip btn";
        aux.btn.onclick = () =>
        {
            const nowActive = toggleInGroup(el);
            aux.btn.textContent = nowActive ? "Show Less" : "Show More";
        };
        el.after(aux.btn);
    }
    
    if (!aux.btn.isConnected)
    {
        // reattach button if it was removed during reload
        el.after(aux.btn);
    }

    if (!el.dataset.state)
    {
        el.classList.add("collapse");
        el.dataset.state = "collapse";
    }
};

function unmanage(el)
{
    let aux = auxMap.get(el);
    aux.btn?.remove();
    aux.btn = null;
    el.classList.remove("expand");
    el.classList.remove("collapse");
    delete el.dataset.state;
};


const resizeObserver = new ResizeObserver((entries) =>
{
    for (const entry of entries)
    {
        const target = entry.target;
        const isOversize = target.scrollHeight > auxMap.get(target).ghost.clientHeight;
        
        const isManaged = managed(target);

        if (isOversize)
        {
            if (!isManaged) manage(target);
        }
        else
        {
            if (isManaged) unmanage(target);
        }
    }
});


export function makeExpandable(el)
{
    if (el.dataset.tracked) return;
    el.dataset.tracked = "true";

    el.classList.add("expandable");

    const group = el.closest(".expandable-group") || null;
    toGroupMap.set(el, group);
    if (group)
    {
        if (!fromGroupMap.has(group))
            fromGroupMap.set(group, new Set());
        fromGroupMap.get(group).add(el);
    }

    const collapseGhost = document.createElement("span");
    collapseGhost.className = el.className;
    collapseGhost.classList.add("collapse-ghost");

    el.before(collapseGhost);
    
    auxMap.set(el, {ghost: collapseGhost, btn: null});

    resizeObserver.observe(el);
}

const targets = document.querySelectorAll(".expandable");

targets.forEach((el) =>
{
    makeExpandable(el);
});