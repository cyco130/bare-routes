# bare-routes

`bare-routes` is a bare-bones client-side router for [React](https://reactjs.org) web applications. It doesn't provide any means for matching routes, fetching data or dynamically importing modules. _You_ do all that in your `render` callback. `bare-routes` only handles the history API and the scroll position restoration.

**DO NOT USE IN PRODUCTION. This is still in early development. The API will almost certainly change -probably multiple times- before it reaches version 1.0.**

## Why?
[react-router](https://reactrouter.com/) is very powerful but its dynamic way of routing makes it difficult to determine the data needed for the next page and fetch it before rendering. [Next.JS](https://nextjs.org/) has a filesystem based router that works like a charm but I can't help but feel it's an overkill for small projects. Yet it's also too opinionated for some use cases like localized URL segments or multitenant apps with an occasional tenant specific route.

## Installation
```sh
npm install --save bare-routes
```

## Usage
Let's say you have a very simple web app with three pages, each page represented by a React component:

| Path     | Component   |
| -------- | ----------- |
| `/`      | `HomePage`  |
| `/new`   | `NewsPage`  |
| `/about` | `AboutPage` |

You would do something like this:

```jsx
import React from "react";
import { Router, Link } from "bare-routes";

const App = () => (
  <Router
    render={({ url /* a URL object instance */ }) => {
      // Map path to component
      const Component = {
        "/": HomePage,
        "/news": NewsPage,
        "/about": AboutPage,
      }[url.pathname] || NotFoundPage;

      return (
        <div>
          {/* This navigation menu will be shared by all pages */}
          <nav>
            <ul>
              <li><Link href="/">Home</Link></li>
              <li><Link href="/news">News</Link></li>
              <li><Link href="/about">About</Link></li>
              <li><Link href="/404">Broken link</Link></li>
            </ul>
          </nav>
          <Component />
        </div>
      );
    }}
  >
    Loading...
  </Router>
);

const HomePage = () => <p>This is the home page</p>;
const NewsPage = () => <p>This is the news page</p>;
const AboutPage = () => <p>This is the about page</p>;

const NotFoundPage = () => <p>Not found</p>;
```

A more involved scenario would look like this:

```jsx
const App = () => (
    <Router
        // Render callback can return a Promise (so it can use async logic)
        render={async ({ url }) => {
            try {
                // findModuleNameForUrl is a hypothetical function for matching
                // URLs with modules that default export a page component
                const moduleName = findModuleNameForUrl(url);

                // All modern bundlers support something like this:
                const pageModule = await import(`./pages/${moduleName}`);

                // Extract the page component and render it
                const PageComponent = pageModule.default;
                return <PageComponent />;
            } catch (error) {
                // Render callback should not throw and if returns a Promise
                // it should not reject.
                return <p>Could not load page: {error.message}</p>;
            }
        }}
    >
        Loading...
    </Router>
);
```

## TO DO
- LinkContainer
- Redirect
- Scroll restoration
- Navigation blocking