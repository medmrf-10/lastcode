
# Intro to Headings

Last updated February 2023

Every page of your website focuses on a particular topic. We should clearly label this topic for the browser and the user (semantics). The main topic of the page (which is also the most important topic) should be labeled with an `h1` element.

## The heading 1 (h1) element

The heading 1 `h1` element, also called heading level 1, is used to represent the highest-level, most important topic of the current web page.

Let's take an example. If you visit [Sir Tim Berners-Lee's Wikipedia page](https://en.wikipedia.org/wiki/Tim_Berners-Lee), which text will be labeled with an `h1`?

![Browser screenshot of Sir Tim Berners-Lee's Wikipedia page](https://res.cloudinary.com/dbfn5lnvx/image/upload/q_auto/v1635846731/learnhtmlcss/lessons/wikipedia-tim-berners-lee.png)

The `h1` element is used to label **Tim Berners-Lee** because this page is talking about Tim Berners-Lee, which is the most important topic on this page.

The HTML code for it is:

```html
<h1>Tim Berners-Lee</h1>
```

You open the `<h1>` tag, write the content of the heading, and then close with an `</h1>` closing tag (don't forget the `/` in the closing tag).

### Heading element (not a header)

Sometimes developers confuse the _heading_ element with the word _header_. They are not the same. We will learn about the `header` element later in this course.

You can think of a _heading_ as one of the big titles you see in a newspaper.

### Semantics vs. Appearance

This is a crucial and slightly tricky topic that many HTML developers/engineers struggle with. This is why we'll start covering it early on and revisit it on multiple occasions throughout this course.

When writing HTML code, it's important to focus on the _semantics_ rather than the _appearance_. HTML is meant for the content, and the structure, whereas CSS is used to style that content (appearance).

You should not use an HTML element based on its appearance but rather its meaning/purpose/role. This is what we mean by semantic HTML.

Let's take a look at an example. Here's a screenshot of the MDN (Mozilla Developer Network) Web Docs' landing page:

![Browser screenshot of MDN's landing page](https://res.cloudinary.com/dbfn5lnvx/image/upload/q_auto/v1635847507/learnhtmlcss/lessons/mdn-landing.png)

Which text do you think is the `h1` on this page? Is it:

- _Resources for developers, by developers._
- or, _Hacks Blog_
- or, _Help improve MDN Web Docs_

Give it a try and guess which one of these 3 is the heading 1 of this page.

See answer

Instead of looking at the appearance, you should focus on the meaning and the role on the page. So, to get the correct answer, ask yourself: _What is the most important topic on this page?_ The answer is that MDN provides Resources for developers, by developers.  
_Hacks Blog_ is not the most important topic of the page, nor is _Help improve MDN Web Docs_.

The font size (how big the characters appear) of the heading does not matter at this stage. Later on, once we learn about CSS, we'll learn how to make a heading larger or smaller. At this stage, it's important to understand that when we label an element as `h1`, we're signaling to the browser that this is the most important topic on the page (regardless of how large/small the font size is).

### Examples of h1 usage

To better prepare you for the real world, here are some examples of what an `h1` could be on different web pages in various industries:

- If I were to build a personal portfolio web page, the `h1` would generally be my full name: `<h1>Jad Joubran</h1>`. It is also possible to have another text, for example, your expertise, if your website is more about your expertise than your personal brand. For example, `<h1>Web performance consultant</h1>`.
- On a blog post, the `h1` should be the title of that blog post (rather than the blog's name). Let's say there's a blog called **TechBlog** that has a post talking about _The benefits of semantic HTML_; the `h1` should wrap the title of the blog post: `<h1>The benefits of semantic HTML</h1>`.
- A web page comparing two phone models should have an `h1` representing this comparison. For example, `<h1>iPhone 13 vs Pixel 6</h1>`.
- A web page showing movie reviews of a certain movie, for example, the movie _Memento_, will most likely have an `<h1>Memento</h1>` or `<h1>Memento reviews</h1>`.

After we learn about accessibility, we will have an entire chapter covering headings!

## Recap

- The heading 1 `h1` element is used to represent the highest-level, most important topic of the current web page.
- `<h1>Most important topic of the page</h1>`
- When writing HTML code, it's important to focus on the _semantics_ rather than the _appearance_. HTML is meant for the content, and the structure, whereas CSS is used to style that content (appearance).
- You should not use an HTML element based on its appearance but rather its meaning/purpose/role.
- If you're not sure which element should be labeled as the `h1` on the page, ask yourself: _What is the most important topic on this page?_