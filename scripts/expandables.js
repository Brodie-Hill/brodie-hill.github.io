let toGroupMap = new Map();
const fromGroupMap = new Map();
const targets = document.querySelectorAll(".expandable");
const groups = document.querySelectorAll(".expandable-group");



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
        if (this.toggle(el) && group)
            for (let other of fromGroupMap.get(group))
            {
                if (other !== el) this.collapse(other);
            }
    }
}



targets.forEach((el) =>
{
    toGroupMap.set(el, null);
});

groups.forEach((group) =>
{
    const targets = Array.from(group.querySelectorAll(".expandable"));
    targets.forEach((el) =>
    {
        toGroupMap.set(el, group);

    });
    fromGroupMap.set(group, targets);
});

const observerCallback = (entries) =>
{
    for (const entry of entries)
        {
        const target = entry.target;
        const isOversize = target.scrollHeight > target.clientHeight;
        let btn = target.nextElementSibling; // show more button would beafter it
        const hasButton = btn?.classList.contains("expand-trigger");
            
        if (isOversize && !hasButton)
        {
            const newBtn = document.createElement("button");
            newBtn.textContent = "Show More";
            newBtn.className = "expand-trigger heavy small chip btn";
            newBtn.onclick = () =>
            {
                actions.toggleInGroup(target);
                this.textContent = "Show Less";
            };
            target.after(newBtn);

            target.classList.add("collapse");
        }
        else if (hasButton && !expanded) {
            btn.remove();
        }
    }
};

const observer = new ResizeObserver(observerCallback);
targets.forEach(target => observer.observe(target));