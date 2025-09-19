const projectJsonPath = "data/projects.json";
const mediaPath = "data/media/";
const tagIconPath = "data/tagicons/";

    
const imageMedia = ["png", "jpg", "jpeg", "gif"];
const audioMedia = ["mp3", "wav"];
const videoMedia = ["mp4"];


function genMediaHtml(filePath, additionalAttribs, image = true, audio = true, video = true)
{
    const ext = filePath.split(".").pop().toLowerCase();
    const src = `${mediaPath}${filePath}`;

    let ret = null;

    if (imageMedia.includes(ext) && image) ret = document.createElement("img");

    else if (audioMedia.includes(ext) && audio) ret = document.createElement("audio");

    else if (videoMedia.includes(ext) && video) ret = document.createElement("video");
        
    else return null;

    ret.src = src;

    for (const [k, v] of Object.entries(additionalAttribs))
    {
        if (k in ret) ret[k] = v;
        else ret.setAttribute(k, v);
    }

    return ret;
}

function linebrk()
{
    const linebrk = document.createElement("span");
    linebrk.classList.add("line-brk");
    return linebrk;
}

function genTagRow(tags)
{
    const row = document.createElement("div");
    row.classList.add("flex-horizontal", "content-padding", "content-gap")

    for(const tag of tags)
    {
        const chip = document.createElement("span");
        chip.classList.add("chip", "tag")
        chip.title = tag;
        let tagIcon = document.createElement("img");
        tagIcon.src = `${tagIconPath}${encodeURIComponent(tag.toLowerCase())}.png`;
        tagIcon.onload = () =>
        {
            chip.classList.add("logo");
            chip.appendChild(tagIcon);
        };
        tagIcon.onerror = () =>
        {
            chip.textContent = tag;
        };
        row.appendChild(chip);
    }

    return row;
}

function genCard(project)
{
    const card = document.createElement("div");
    card.classList.add("card", "grad-dark");

    const thumbnailSource = project.thumbnail || (project.media?.[0]);

    const banner = document.createElement("div");
    banner.classList.add("card-banner");

    if (thumbnailSource)
    {
        const thumbnail = genMediaHtml(
            thumbnailSource,
            {
                class: "cover-bg",
                autoplay: true,
                muted: true,
                loop: true
            },
            { audio: false }
        );
        if (thumbnail) banner.appendChild(thumbnail);
    }
    
    banner.appendChild(genTagRow(project.tags));

    const body = document.createElement("div");
    body.classList.add("flex-vertical", "content-padding", "content-gap", "card-body");

    if (project.name)
        body.appendChild(document.createElement("h3")).innerText = project.name;

    if (project.date || project.authors)
    {
        const h4 = document.createElement("h4");
        h4.innerText = `${project.date ? (project.date + "  •  ") : ""}${project.authors ? "Collab" : "Solo"}`;
        h4.classList.add("light");
        body.appendChild(h4);
    }

    if (project.blurb)
    {
        const p = document.createElement("p");
        p.classList.add("text-area");
        p.innerText = project.blurb;
        body.appendChild(p);
    }

    
    card.appendChild(banner);
    card.appendChild(body);

    return card;
}

function genRow(groupName, groupProjects)
{
    const parent = document.createElement("div");
    parent.classList.add("project-group", "sector-margin-blk");
    const header = document.createElement("h2");
    header.classList.add("content-padding-blk", "sector-padding-inl")
    header.textContent = groupName;
    
    let row = document.createElement("div");
    row.classList.add("grid-horizontal", "content-padding-blk", "sector-padding-inl", "content-gap", "nopad-bot");

    for (const project of groupProjects)
    {
        let card = genCard(project);
        row.appendChild(card);
    }

    parent.appendChild(linebrk());
    parent.appendChild(header);
    parent.appendChild(linebrk());
    parent.inner = parent.appendChild(row);
    return parent;
}

async function parseProjects()
{
    const result = await fetch(projectJsonPath);
    const projects = await result.json();
    const container = document.getElementById("projects");
    
    if (!container)
    {
        console.error("No parent found to place project cards under!");
        return;
    }

    projects.sort(
        (a, b) =>
        {
            if (a.featured > b.featured) return -1; // a before b
            if (b.featured > a.featured) return 1; // a after b
            return 0;
        }
    );

    // reorganise the projects by group

    let projectGroups = new Map();
    
    for (const project of projects)
    {
        const group = project.group || "Ungrouped";

        if (!projectGroups.has(group)) projectGroups.set(group, []);

        projectGroups.get(group).push(project);
    }

    for (const [group, projects] of projectGroups)
    {
        let rowGroup = genRow(group, projects);

        container.appendChild(rowGroup);
    }
}

parseProjects();