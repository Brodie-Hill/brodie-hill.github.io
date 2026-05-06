import {genMediaHtml, genTagRow} from "./projectloader.js";
import {dumpIntoP} from "./p-dump.js";

const viewer = {
    overlay: document.getElementById("project-viewer-overlay"),
    root: document.getElementById("project-viewer"),

    info: document.getElementById("pv-info"),
    name: document.getElementById("pv-name"),
    tags: document.getElementById("pv-tags"),
    blurb: document.getElementById("pv-blurb"),
    media: document.getElementById("pv-media"),
    description: document.getElementById("pv-description"),

    linksFeatured: document.getElementById("pv-speclinks"),
    linksList: document.getElementById("pv-misclinks"),
    credits: document.getElementById("pv-credits"),
    close: document.getElementById("pv-close"),
    intersectionObserver: new IntersectionObserver(checkPlayable, {threshold: 0.25})
}

export function viewProject(project)
{
    viewer.overlay.classList.add("active");
    viewer.root.classList.add("active");


    const groupSpan = `<span id="pv-group">${project.group}</span>`;
    const dateSpan = `<span id="pv-date">${project.date}</span>`;
    
    viewer.info.innerHTML = `${groupSpan} //${dateSpan}`;
    viewer.name.innerText = `${project.name}`;
    
    viewer.tags.innerHTML = "";
    viewer.tags.appendChild(genTagRow(project.tags, ["flex-horizontal", "content-gap", "centered"]));


    viewer.media.innerHTML = "";
    viewer.intersectionObserver.disconnect();

    if (!project.media || project.media.length == 0)
    {
        viewer.media.appendChild(genMediaHtml("project-media-placeholder.png", {"controls": false}))
    }
    else
    {
        project.media?.forEach((mediaPath) =>
        {
            const mediaElement = genMediaHtml(mediaPath, {"controls": true});
            viewer.media.appendChild(mediaElement);
            viewer.intersectionObserver.observe(mediaElement);
        });
    }
        
    if (project.description)
        viewer.description.innerText = project.description;
    else
        dumpIntoP(viewer.description, {defaultText: "This project has no description.", filePath: project.descriptionPath});

    viewer.credits.innerHTML = "";
    project.authors?.forEach(author =>
    {
        const authorElement = document.createElement("li");
        authorElement.textContent = author;
        viewer.credits.appendChild(authorElement);
    });


    viewer.linksFeatured.innerHTML = "";
    viewer.linksList.innerHTML = "";
    project.links?.forEach((link) =>
    {
        const li = document.createElement("li");
        li.innerHTML = `<a href="${link.a}" target="blank">${link.label}</a>`;

        if (link.feature)
        {
            li.classList.add("chip", "btn", "grad-primary", "heavy");
            viewer.linksFeatured.appendChild(li)
        }
        else
        {
            viewer.linksList.appendChild(li)
        }
    });
}

export function closeProjectViewer()
{
    viewer.overlay.classList.remove("active");
    viewer.root.classList.remove("active");
    
    Array.from(viewer.media.children).forEach(stopMedia);

    viewer.intersectionObserver.disconnect();
}

function checkPlayable(entries)
{
    entries.forEach(entry =>
    {
        const media = entry.target;

        if (!entry.isIntersecting)
        {
            pauseMedia(media);
        }
        else if (viewer.media.hasAttribute("autoplay"))
        {
            startMedia(media)?.catch(err => console.warn(`Autoplay failed: ${err}`));
        }
    });
}

function startMedia(mediaElement)
{
    return mediaElement?.play?.() ?? null;
}

function pauseMedia(mediaElement)
{
    mediaElement?.pause?.();
}

function stopMedia(mediaElement)
{
    mediaElement?.pause?.();
    if ("currentTime" in mediaElement)
        mediaElement.currentTime = 0;
}

viewer.close.addEventListener("click", (event)=>{
    if (event.target != event.currentTarget) return;
    closeProjectViewer()
});

viewer.overlay.addEventListener("click", (event)=>{
    if (event.target != event.currentTarget) return;
    closeProjectViewer()
});
window.addEventListener("closeAll", closeProjectViewer);