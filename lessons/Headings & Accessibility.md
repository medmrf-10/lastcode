

# Headings & Accessibility

Last updated July 2023

In the previous chapter, we learned about the Heading (level) 1 element `h1`.

In this lesson, we'll get a short introduction to the impact of headings on accessibility.

In the previous lesson, we mentioned _enabling access through the use of assistive technology_. A screen reader is _one_ example of assistive technology. A magnifier is another example of assistive technology.

## Screen readers

A screen reader is a software that has commands to quickly jump between headings or specific landmark regions (we'll learn about landmarks soon!).

A [survey of screen reader users](http://www.heydonworks.com/article/responses-to-the-screen-reader-strategy-survey) concludes that they usually navigate an unfamiliar page by exploring the headings.

This makes it essential to have meaningful headings. It helps users with assistive technologies easily navigate and explore your page. Note that this is not the _only_ benefit of having meaningful headings. There are many benefits regarding Search Engine Optimization (SEO), browsers, etc.

Note that we've only learned about the Heading 1 element so far. So, this tip will make more sense once we learn about the remaining heading levels in the next chapter. We'll also revisit this accessibility recommendation in the next chapter.

## Accessibility testing with Axe

[Axe](https://www.deque.com/axe/) is an automated accessibility testing tool. It's available as a browser extension (Chrome, Firefox, and Edge at the moment), Command-line tool, JavaScript SDK library, and more.

Throughout this course, we'll be using Axe to test your code for accessibility issues. We will do that step by step by introducing topics one by one so that you get to learn from the errors you see on Axe without being overwhelmed.

Please note that some manual accessibility testing is still necessary for a real-life project. No automated tool can catch all accessibility issues. However, having an automated accessibility testing tool will catch a big chunk of accessibility issues.

So, most challenges from now on will have the last "test" checking your code for accessibility issues. It will have the name **Axe Accessibility checks**. Axe is already built into the course, so you do not have to install it for this course.

If one of the checks is failing, you will get a descriptive error message and a link to read more. We'll see an example of a failed test in the next challenge!

Note: Since the next challenge will start testing you for accessibility issues, we will wrap all the code in the `body` element with the `<main>` tag. This is a landmark tag that we'll explain in a future chapter. Do **not** remove it; otherwise, the accessibility checks will fail!

## Recap

- A screen reader is a software that has commands to jump between headings or specific landmark regions quickly.
- A survey of screen reader users concludes that they usually navigate an unfamiliar page by exploring the headings.
- [Axe](https://www.deque.com/axe/) is an automated accessibility testing tool.
- Most challenges from now on will have the last "test" checking your code for accessibility issues. It will have the name **Axe Accessibility checks**.