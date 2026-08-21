<!-- provenance: ai-completed | source: course curriculum outline (roadmaps/L-2-frontend-1-jobran-1.md chapter 3 item) | completed-by: cmd agent | date: 2026-08-21 -->

# First accessibility testing

Last updated August 2026

In the previous lesson, we learned about [Axe](https://www.deque.com/axe/), the automated accessibility testing tool that is built into this course. It's time to see it in action!

## Your first Axe run

From this challenge onward, most challenges end with a final test named **Axe Accessibility checks**. When you press *Run tests*, Axe scans your HTML the same way it would scan a real website, and reports any accessibility issues it finds.

Let's look at an example. Suppose you wrote the following page:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <title>My first accessible page</title>
</head>
<body>
  <main>
    <p>Welcome to my corner of the web.</p>
  </main>
</body>
</html>
```

If you run the Axe checks on this page, you will get a failing test with a descriptive error message. Can you guess why?

---

The page has **no `h1` element**! Remember: the `h1` represents the highest-level, most important topic of the page. A page without any `h1` makes it much harder for screen reader users to understand what the page is about — and Axe knows that.

Here is the fixed version:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <title>My first accessible page</title>
</head>
<body>
  <main>
    <h1>Welcome to my corner of the web</h1>
    <p>This page is about me and the things I love building.</p>
  </main>
</body>
</html>
```

Now all the checks pass, including the **Axe Accessibility checks**.

## Reading the error messages

When an Axe check fails, you don't just get a red test. You also get:

- The name of the rule that failed (for example: `page-has-heading-one`).
- A short description of *why* this matters for accessibility.
- A link to read more about the issue.

Don't worry if the links lead to documentation that feels advanced right now. As we learn more HTML throughout this course, more and more of it will make sense.

## What Axe can and cannot catch

Axe catches a big chunk of accessibility issues automatically: missing headings, missing alternative text for images, low color contrast, and many more that we'll learn about step by step.

However, no automated tool can catch *everything*. Some questions — like "is this heading actually meaningful?" or "is this description helpful?" — need a human. That's why real projects combine automated testing with manual testing. In this course, you'll practice both.

## Recap

- Most challenges from now on end with an **Axe Accessibility checks** test.
- A page without any `h1` element fails the Axe check `page-has-heading-one`.
- Failed checks come with the rule name, a short explanation, and a link to read more.
- Automated tools catch many issues, but manual accessibility testing is still necessary in real projects.
