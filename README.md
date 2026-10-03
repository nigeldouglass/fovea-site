# fovea-site

The public pages for the Fovea iPhone app, served by GitHub Pages: home, privacy policy and support.

## Help topics

`help/articles.js` holds the app's help articles, generated from its `HelpArticles.json` by `update-help.sh`. `help/help.js` builds the support page's topic list from it and opens each article in a popup. Link to one article with `support.html#<article id>`, e.g. `support.html#long-exposure`.

When the app's help changes, regenerate it (expects the app repo at `../Fovea`, or pass the JSON's path):

    ./update-help.sh

To preview, open `support.html` in a browser; it works straight from Finder.
