const selectParent = "skill-category";
const skillJsonPath = "data/skills.json";

let active = null;
let skillGroups = new Map();

const proficiencyGrades = [
    { lvl: 40, alias: "Familiar",  gradient: "grad-dark", shade: "var(--color-dark)" },
    { lvl: 60, alias: "Intermediate",  gradient: "grad-primary", shade: "var(--color-primary)" },
    { lvl: 80, alias: "Competent",  gradient: "grad-primary", shade: "var(--color-primary)" },
    { lvl: 99, alias: "Proficient", gradient: "grad-accent", shade: "var(--color-accent)" },
    { lvl: 100, alias: "Expert", gradient: "grad-accent", shade: "var(--color-accent)" },
];

function evaluateProficiency(prof)
{
    return proficiencyGrades.find(grade => grade.lvl >= prof);
}

function changeGroup(newGroup)
{
    if (active) active.style.display = "none";
    active = skillGroups.get(newGroup);
    if (active) active.style.display = "";
}

function genSkills(group, skills)
{
    let list = document.createElement("ul");
    list.classList.add("progress-list");

    const observer = new IntersectionObserver(
        (entries, observer) =>
        {
            for (const entry of entries)
            {
                if (!entry.isIntersecting) continue;
                
                const fills = entry.target.querySelectorAll(".progress-bar-fill");
                fills.forEach(fill => { fill.style.width = fill.dataset.targetWidth; });
                
                observer.unobserve(entry.target);
            }
        },
        {
            root: null,
            threshold: 0.0
        }
    );
    observer.observe(list);


    for (const skill of skills)
    {
        const profGrade = evaluateProficiency(skill.proficiency);

        let li = document.createElement("li");

        const name = document.createElement("span");
        name.innerText = skill.name;
        name.classList.add("skill-name");
        li.appendChild(name);

        const bar = document.createElement("span");
        bar.classList.add("progress-bar");
        const fill = document.createElement("span");
        fill.classList.add("progress-bar-fill");
        fill.style.backgroundImage = `var(--${profGrade.gradient})`;
        fill.style.boxShadow = `inset 0 0 8px ${profGrade.shade}, 0 0 2rem ${profGrade.shade}`;
        fill.style.width = "0";
        fill.dataset.targetWidth = `${skill.proficiency}%`;

        bar.appendChild(fill);
        li.appendChild(bar);

        const alias = document.createElement("span");
        alias.innerText = profGrade.alias;
        alias.classList.add("skill-alias");
        li.appendChild(alias);
        
        list.appendChild(li);
    }

    return list;
}

async function loadSkills()
{
    const result = await fetch(skillJsonPath);
    const skills = await result.json();
    const dropdown = document.getElementById("skill-category");
    const container = document.getElementById("skills");


    if (!container)
    {
        console.error("No parent found to place skills under!");
        return;
    }

    // reorganise the skills by group

    for (const skill of skills)
    {
        const group = skill.group || "Misc";

        if (!skillGroups.has(group)) skillGroups.set(group, []);

        skillGroups.get(group).push(skill);
    }

    for (const [group, skills] of skillGroups)
    {
        skills.sort(
            (a, b) =>
            {
                if (a.proficiency > b.proficiency) return -1; // a before b
                if (b.proficiency > a.proficiency) return 1; // a after b
                return 0;
            }
        );
        
        let opt = document.createElement("option");
        opt.innerText = opt.value = group;
        dropdown.appendChild(opt);

        // replace the raw input data with the generated html element
        let content = genSkills(group, skills);
        skillGroups.set(group, content);
        
        content.style.display = "none";
        container.appendChild(content);
    }

    changeGroup(dropdown.value);
}

loadSkills();