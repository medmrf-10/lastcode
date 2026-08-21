
# Intro to Semantics

Last updated November 2025

## Save notes

When you read lessons in this course, you can **highlight** a single line and save it to your notes. Highlight a single line with your mouse (or your finger on mobile) and then a popup will appear asking you to save it to your notes.

Highlight a line to save it to your notes

You will be able to find these notes at the top of the page by clicking on the **Note** icon on the top bar. Give it a try!

Popular notes will also be shown in yellow highlights which can be added to your notes with a single click. You can also disable those popular highlights from the top-right menu.

The save notes popup will not show up if you select lines spanning multiple paragraphs. That's because you retain information better when you take shorter notes.

While writing a fully functioning website without proper semantics is possible, we do not recommend that. This course will guide you step by step on how to write semantic HTML. But first, what does _semantic_ mean?

## The meaning of _semantic_

In the English language, the word _semantic_ means:

> relating to meaning in language or logic.

In the context of programming, _semantics_ refers to:

> the meaning of a particular piece of code.

Both of these definitions are a bit generic. Let's explore what _semantic_ means in the context of HTML.

## Semantic HTML

Writing semantic HTML means giving meaning to the elements we use. It allows you to focus on the element's purpose rather than its appearance.

Let's take a look at the two examples, keeping in mind that we have _yet_ to learn about all of these HTML elements:

```html
<div>My Blog</div>
<div>
    <div>This is the content of my blog</div>
</div>
<div>We are located in Amsterdam</div>
```

```html
<header>My Blog</header>
<main>
    <p>This is the content of my blog</p>
</main>
<footer>We are located in <address>Amsterdam</address></footer>
```

Even though we have not learned about any of the HTML elements yet, which one of these code snippets conveys more meaning?

From the first piece of code, we could not tell that the `My Blog` is necessarily functioning as the header of the website. And the same thing for the footer. Notice how the footer labels `Amsterdam` as the **address** of the blog. Moreover, the page's main content is enclosed in between the `<main>...</main>` tags.

Both examples will produce very similar results. However, the second example is written with semantics in mind.

In conclusion, semantic HTML focuses on providing meaning and purpose for the elements you use.

---

We will continue exploring the concept of semantics throughout this course as it's not limited to the above. We will go through it step by step so that it becomes fun rather than overwhelming.

### Why write semantic HTML?

There are many benefits to writing semantic HTML. Some of the benefits below might not be very clear at this stage (as we have yet to learn about the various HTML elements). But don't worry about that! The concept of semantics is baked into this course, and we'll come back to the benefits on multiple occasions.

Some of the benefits of semantic HTML:

- It makes your code machine-readable. Browsers and search engines (for example, Google, DuckDuckGo, Bing, Yandex, etc.) will better understand your website.
    - When browsers better understand your website, the accessibility of your website will improve (this is discussed in the next chapter).
    - When search engines better understand your website, you get some benefits in Search Engine Optimization (SEO) — more on that in a later chapter.
- It helps you (as a developer) make sense of the information on the page, just like how we saw in the two code snippets above.
- It helps you maintain the code as it makes it a lot more readable.

## Recap

- Writing semantic HTML means giving meaning to the elements we use.
- Semantic HTML focuses on providing meaning and purpose for the elements you use.
- Some of the benefits of semantic HTML:
    - It makes your code machine-readable. Browsers and search engines will better understand your website.
    - It helps you make sense of the information on the page.
    - It helps you maintain the code as it makes it a lot more readable.