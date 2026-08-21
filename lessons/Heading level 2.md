
# Heading level 2

Last updated November 2025

## Features & FAQ

Now that you've completed the first 3 chapters of this course, we recommend that you read the **Features & FAQ** page from the top-right menu. This will familiarize you with all the features available in this app as well as the reasoning behind some of them. It also explains the importance of _sleep_ when learning something new!

Also, if you'd like to skip to a certain chapter, you can do so from the _Help Center_ (bottom-right corner). However, this is discouraged as the course follows a carefully planned structure and many chapters build upon previous concepts.

Two chapters ago, we learned about the Heading 1 `h1` element.

The heading 1 `h1` element, also called heading level 1, is used to represent the highest-level, most important topic of the current web page.

The heading (level) 2 `h2` element is used to define the titles of the major sections of a webpage. The `h2` element is a "sub-section" of the `h1` element on the page.

![Best practice icon](https://learnhtmlcss.online/assets/v2/circle-check-filled.svg?v=2)

Remember to use **emmet** to write the `h2` element. Write `h2` and then press the `Tab` key.

Let's take a look at an example:

```html
<h1>Tesla car</h1>
<h2>Photos</h2>
<h2>Specifications</h2>
<h2>Pricing</h2>
```

This page is about a _Tesla car_. This is the highest-level, most important topic on the current web page. This web page then discusses three sub-sections of this topic. It shows _photos_ of this car, its _specifications_, and its _pricing_.

## Structural outline & hierarchy

The `h1` and `h2` (and the remaining heading levels that we'll learn about in the next lesson) are used to create a structural outline of the web page.

This allows for easier and more accessible navigation and a better understanding of browsers and search engine of the content described on your web page.

It's important to think of the `h1` and `h2` elements on the page as the outline of a book. The `h1` is the book's title, and the `h2` elements are the chapters of that book.

Let's take a look at MDN Web Docs' home page again:  
![Browser screenshot of MDN's landing page](https://res.cloudinary.com/dbfn5lnvx/image/upload/q_auto/v1635847507/learnhtmlcss/lessons/mdn-landing.png)

The `Resources for developers, by developers` is the `h1`. What do you think is/are the `h2` element(s) on the page?

---

They're `Hacks Blog` and `Help improve MDN Web Docs`. So, in terms of outline of the page, here's what we've got:

```html
<h1>Resources for developers, by developers</h1>
<h2>Hacks Blog</h2>
<h2>Help improve MDN Web Docs</h2>
```

We're taking our time and focusing on the little details because it's very important to use `h1` and `h2` based on their _hierarchy_ in the document rather than their font size. This is a difficult concept even for seasoned developers.

We can adjust the font size later in CSS. What's important is to think in terms of hierarchy and structural outline.

In the MDN Web Docs example above, the `h2` has a bigger font size than the `h1` (using CSS). That's perfectly fine. We'll have several challenges to help you practice that.

### Personal portfolio example

Let's say a person called _Sam Green_ is building their personal portfolio. They would like to list their experience, hobbies, and skills. Here's one of the possible ways to represent the outline of the page:

```html
<h1>Sam Green</h1>
<h2>Experience</h2>
<h2>Hobbies</h2>
<h2>Skills</h2>
```

## One h1 per page

You may have noticed that we've used one `h1` per page in all the examples above.

This is because the `h1` element represents the most important topic of the page. There can only be one.

If you feel like there should be more than one `h1` elements then most likely, these elements should be `h2`, and you should have another `h1` element on top of all of these. If that's still not possible, you may use more than one `h1` on the page.

Remember that the `h1` element can have a smaller font size than the `h2`. It's about the hierarchy.

### Axe

Axe does not fail if you have more than one `h1` on a page. It does fail if you do not have an `h1` element.

In all cases, we recommend that you pay attention to this yourself and make sure that you only have one `h1` per page.

![Best practice icon](https://learnhtmlcss.online/assets/v2/circle-check-filled.svg?v=2)

In most cases, make sure to have one (and only one) `h1` element per page.

## Recap

- The heading (level) 2 element `h2` is used to define the titles of the major sections of a webpage. The `h2` element is a "sub-section" of the `h1` element on the page.
- The `h1` and `h2` (and the remaining heading levels that we'll learn about in the next lesson) are used to create a structural outline of the web page.
- Use `h1` and `h2` based on their _hierarchy_ in the document rather than their font size.
- Make sure to have one (and only one) `h1` element per page.