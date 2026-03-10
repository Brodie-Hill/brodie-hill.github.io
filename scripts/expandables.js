let toGroupMap = new Map();
const fromGroupMap = new Map();


const actions = {
    expand(el) {
        if (el && el.classList.contains("collapse"))
        {
            el.classList.add("expand");
            el.classList.remove("collapse");
        }
    },
    collapse(el) {
        if (el && el.classList.contains("expand"))
        {
            el.classList.add("collapse");
            el.classList.remove("expand");
        }
    },
    toggle(el)
    {
        if (el)
        {
            const active = el.classList.toggle("expand");
            el.classList.toggle("collapse", !active);
            return active;
        }
        return false;
    },
    toggleInGroup(el) {
        const group = toGroupMap.get(el);
        if (!group) return this.toggle(el);
        if (this.toggle(el))
        {
            for (let other of fromGroupMap.get(group))
            {
                if (other !== el) this.collapse(other);
            }
            return true;
        }
        return false;
    }
}


const resizeObserver = new ResizeObserver((entries) =>
{
    for (const entry of entries)
        {
        const target = entry.target;
        const isOversize = target.scrollHeight > target.clientHeight;
        const expanded = target.classList.contains("expand");
        
        let btn = target.nextElementSibling;
        const managed = btn?.classList.contains("expand-trigger");

        if (isOversize && !managed)
        {
            let newBtn = document.createElement("button");
            newBtn.textContent = "Show More";
            newBtn.className = "expand-trigger heavy small chip btn";
            newBtn.onclick = () =>
            {
                const nowActive = actions.toggleInGroup(target);
                newBtn.textContent = nowActive ? "Show Less" : "Show More";
            };
            target.after(newBtn);

            target.classList.add("collapse");
        }
        else if (!isOversize && managed && !expanded)
        {
            btn.remove();
            target.classList.remove("collapse");
        }
    }
});

function initExpandable(el)
{
    if (el.dataset.tracked) return;
    el.dataset.tracked = "true";

    const group = el.closest(".expandable-group") || null;
    toGroupMap.set(el, group);
    if (group)
    {
        if (!fromGroupMap.has(group))
            fromGroupMap.set(group, new Set());
        fromGroupMap.get(group).add(el);
    }

    resizeObserver.observe(el);
}

const globalObserver = new MutationObserver((mutations) =>
{
    mutations.forEach(mutation =>
    {
        mutation.addedNodes.forEach(node =>
        {
            if (node.nodeType === 1) { // element
                if (node.classList.contains('expandable')) {
                    initExpandable(node);
                }
                node.querySelectorAll('.expandable').forEach(initExpandable);
            }
        });
    });
});
globalObserver.observe(document.body, {childList: true, subtree: true});

window.addEventListener("resize", ()=>
{
    toGroupMap.forEach((v, k) =>
    {
        actions.collapse(k);
    });
})
// for initial elements
const targets = document.querySelectorAll(".expandable");

targets.forEach((el) =>
{
    initExpandable(el);
});
