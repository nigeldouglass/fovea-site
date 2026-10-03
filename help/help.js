// Renders the app's help articles (window.FOVEA_HELP, from help/articles.js,
// which update-help.sh generates from HelpFeature's HelpArticles.json) as
// topic cards, and opens one in a dialog.
// An article can be linked to directly: support.html#<article id>.

(function () {
  "use strict";

  // Same order and titles as HelpCategory in the app.
  const CATEGORIES = {
    gettingStarted: "Getting started",
    exposure: "Exposure",
    focus: "Focus and monitoring",
    colour: "Colour and looks",
    capture: "Capture",
    guidance: "Guidance",
    journal: "Journal and profiles",
    support: "Privacy and troubleshooting",
  };

  const list = document.getElementById("help-topics");
  const dialog = document.getElementById("help-dialog");
  const body = document.getElementById("help-article");
  const category = document.getElementById("help-category");
  let articles = new Map();

  function escape(text) {
    return text.replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[c]);
  }

  // The articles use **bold** and *italic*, as the app's Markdown does.
  function inline(text) {
    return escape(text)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>");
  }

  function articleLink(id, text) {
    return `<a href="#${encodeURIComponent(id)}" data-article="${escape(id)}">${inline(text)}</a>`;
  }

  function renderBlock(block) {
    switch (block.kind) {
      case "paragraph":
        return `<p>${inline(block.text)}</p>`;
      case "heading":
        return `<h3>${inline(block.text)}</h3>`;
      case "list":
        return `<ul>${block.items.map((i) => `<li>${inline(i)}</li>`).join("")}</ul>`;
      case "steps":
        return `<ol>${block.items.map((i) => `<li>${inline(i)}</li>`).join("")}</ol>`;
      case "note":
        return `<p class="note note-${escape(block.tone || "tip")}">${inline(block.text)}</p>`;
      case "link":
        return articles.has(block.target)
          ? `<p class="see-also">See ${articleLink(block.target, block.text)}</p>`
          : "";
      default:
        return "";
    }
  }

  function renderArticle(article) {
    const related = article.related
      .filter((id) => articles.has(id))
      .map((id) => `<li>${articleLink(id, articles.get(id).title)}</li>`)
      .join("");
    category.textContent = CATEGORIES[article.category] || "";
    body.innerHTML =
      `<h2 id="help-title">${inline(article.title)}</h2>` +
      `<p class="lead">${inline(article.summary)}</p>` +
      article.blocks.map(renderBlock).join("") +
      (related ? `<div class="related"><p class="label">Related</p><ul>${related}</ul></div>` : "");
  }

  function open(id, { updateHash = true } = {}) {
    const article = articles.get(id);
    if (!article) return;
    renderArticle(article);
    if (!dialog.open) dialog.showModal();
    // Focus the article rather than the close button (no focus ring on open),
    // then start at the top.
    body.focus({ preventScroll: true });
    dialog.scrollTop = 0;
    requestAnimationFrame(() => { dialog.scrollTop = 0; });
    if (updateHash && location.hash !== `#${id}`) {
      setAddress(`#${id}`);
    }
  }

  // Keeps the open article in the address bar. Chrome refuses this on file://
  // pages (opened from Finder), so it's skipped there; the dialog works without it.
  function setAddress(url) {
    if (location.protocol === "file:") return;
    try { history.pushState(null, "", url); } catch (_) { /* not allowed */ }
  }

  function close() {
    if (dialog.open) dialog.close();
  }

  function renderList(all) {
    const groups = Object.keys(CATEGORIES)
      .map((key) => ({ key, items: all.filter((a) => a.category === key) }))
      .filter((g) => g.items.length);
    list.innerHTML = groups.map((g) =>
      `<p class="label topic-group">${escape(CATEGORIES[g.key])}</p>` +
      `<ul class="topics">${g.items.map((a) =>
        `<li><button type="button" data-article="${escape(a.id)}">` +
        `<strong>${inline(a.title)}</strong><span>${inline(a.summary)}</span></button></li>`
      ).join("")}</ul>`
    ).join("");
  }

  // Any element carrying data-article opens that article, in the list or
  // inside the dialog (related links, "See …" links).
  document.addEventListener("click", (event) => {
    const target = event.target.closest("[data-article]");
    if (!target) return;
    event.preventDefault();
    open(target.dataset.article);
  });

  dialog.querySelector(".dialog-close").addEventListener("click", close);

  // A click on the backdrop (outside the dialog's box) closes it.
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) close();
  });

  // Clear the article from the address when the dialog closes (also on Esc).
  dialog.addEventListener("close", () => {
    if (articles.has(location.hash.slice(1))) {
      setAddress(location.pathname + location.search);
    }
  });

  // Back/forward moves between articles, or closes the dialog.
  window.addEventListener("popstate", () => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (articles.has(id)) open(id, { updateHash: false });
    else close();
  });

  const data = window.FOVEA_HELP;
  if (data && Array.isArray(data.articles)) {
    articles = new Map(data.articles.map((a) => [a.id, a]));
    renderList(data.articles);
    const id = decodeURIComponent(location.hash.slice(1));
    if (articles.has(id)) open(id, { updateHash: false });
  } else {
    list.innerHTML = "<p>The help topics couldn't be loaded. They're also in the app under <strong>Settings › Help</strong>.</p>";
  }
})();
