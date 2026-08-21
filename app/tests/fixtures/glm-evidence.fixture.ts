/**
 * عينات مجمّدة من أول طلب GLM حقيقي (glm-5.2): الملفات الثلاثة كما كانت وقت الرفض،
 * والأدلة الثمانية التي رُفضت لاختلاف Markdown فقط (inline code / emphasis / NBSP).
 * الهدف: إثبات أن التحقق يقبلها بعد canonicalization المرئي دون الاعتماد على .learn أو الـ vault الحيّ.
 * المصدر: .learn/proposals/frontend-1-ch1-2.rejected.json + ملفات الدروس بتاريخ الطلب.
 */

export const glmLessonFiles: Record<string, string> = {
  'lessons/Intro to HTML.md':
    "\n# Intro to HTML\n\nLast updated October 2023\n\nHTML is a _markup_ language. It does not contain programming logic such as `if...else`.\n\nA markup language in this context means that it helps you label your content in a way that gives it extra meaning and structure. Imagine you're writing using your favorite writing editor (for example, Google Docs, Apple Pages, Microsoft Office, etc.). You write the sentence _Benefits of doing sports every other day_. Then, you select this sentence and make it the title of the page. This is an analogy of how you markup a document.\n\nHTML allows you to markup your document. For that, we'll learn many HTML elements with different meanings.\n\n## HTML and CSS\n\nIn this course, we'll start by learning HTML followed by CSS. Then, we'll learn about the two concepts together as they are intertwined.\n\nSuppose you compare HTML and CSS to the process of building a house. In that case, HTML represents the house structure, and CSS represents the finishing (aesthetics, styles, colors, etc.).\n\n## Focus on semantics and accessibility\n\nThis course is different than many other courses as it heavily focuses on _semantics_ and _accessibility_. These two concepts will be introduced in the following two chapters. They are also part of most of the lessons of this course.\n\nYou will later see that browsers are pretty forgiving. You will almost always see a result on your screen. Many HTML courses teach you the quick and dirty way of doing things. This will be the opposite. So, please be patient. You will read lots of _'we will learn about this in later chapters_'. You will learn a lot (even if you've been writing HTML/CSS in the last few years)!\n\n## A brief history of HTML\n\nHTML was originally developed by [Tim Berners-Lee](https://en.wikipedia.org/wiki/Tim_Berners-Lee) while [working at CERN](https://home.cern/science/computing/birth-web). The main goal of HTML was the representation of documents that could be linked together.\n\n## HTML element basic syntax\n\nThis chapter is meant to ease you into HTML. So, we won't be writing any HTML elements ourselves yet. In the next chapter, we will do so once we learn about the `h1` element.\n\nHere's what an HTML element looks like:\n\n```html\n<h1>Benefits of doing sports every other day</h1>\n```\n\nIn the code above, we have **one** `h1` element.  \nThis is made up of the `h1` _opening tag_ `<h1>` and the `h1` _closing tag_ `</h1>`.\n\nWe'll ask you to change a word inside the `<h1>...</h1>` tags in the following challenges.\n\nWe'll then re-explain the HTML element syntax in the next chapter.",
  'lessons/Intro to Headings.md':
    "\n# Intro to Headings\n\nLast updated February 2023\n\nEvery page of your website focuses on a particular topic. We should clearly label this topic for the browser and the user (semantics). The main topic of the page (which is also the most important topic) should be labeled with an `h1` element.\n\n## The heading 1 (h1) element\n\nThe heading 1 `h1` element, also called heading level 1, is used to represent the highest-level, most important topic of the current web page.\n\nLet's take an example. If you visit [Sir Tim Berners-Lee's Wikipedia page](https://en.wikipedia.org/wiki/Tim_Berners-Lee), which text will be labeled with an `h1`?\n\n![Browser screenshot of Sir Tim Berners-Lee's Wikipedia page](https://res.cloudinary.com/dbfn5lnvx/image/upload/q_auto/v1635846731/learnhtmlcss/lessons/wikipedia-tim-berners-lee.png)\n\nThe `h1` element is used to label **Tim Berners-Lee** because this page is talking about Tim Berners-Lee, which is the most important topic on this page.\n\nThe HTML code for it is:\n\n```html\n<h1>Tim Berners-Lee</h1>\n```\n\nYou open the `<h1>` tag, write the content of the heading, and then close with an `</h1>` closing tag (don't forget the `/` in the closing tag).\n\n### Heading element (not a header)\n\nSometimes developers confuse the _heading_ element with the word _header_. They are not the same. We will learn about the `header` element later in this course.\n\nYou can think of a _heading_ as one of the big titles you see in a newspaper.\n\n### Semantics vs. Appearance\n\nThis is a crucial and slightly tricky topic that many HTML developers/engineers struggle with. This is why we'll start covering it early on and revisit it on multiple occasions throughout this course.\n\nWhen writing HTML code, it's important to focus on the _semantics_ rather than the _appearance_. HTML is meant for the content, and the structure, whereas CSS is used to style that content (appearance).\n\nYou should not use an HTML element based on its appearance but rather its meaning/purpose/role. This is what we mean by semantic HTML.\n\nLet's take a look at an example. Here's a screenshot of the MDN (Mozilla Developer Network) Web Docs' landing page:\n\n![Browser screenshot of MDN's landing page](https://res.cloudinary.com/dbfn5lnvx/image/upload/q_auto/v1635847507/learnhtmlcss/lessons/mdn-landing.png)\n\nWhich text do you think is the `h1` on this page? Is it:\n\n- _Resources for developers, by developers._\n- or, _Hacks Blog_\n- or, _Help improve MDN Web Docs_\n\nGive it a try and guess which one of these 3 is the heading 1 of this page.\n\nSee answer\n\nInstead of looking at the appearance, you should focus on the meaning and the role on the page. So, to get the correct answer, ask yourself: _What is the most important topic on this page?_ The answer is that MDN provides Resources for developers, by developers.  \n_Hacks Blog_ is not the most important topic of the page, nor is _Help improve MDN Web Docs_.\n\nThe font size (how big the characters appear) of the heading does not matter at this stage. Later on, once we learn about CSS, we'll learn how to make a heading larger or smaller. At this stage, it's important to understand that when we label an element as `h1`, we're signaling to the browser that this is the most important topic on the page (regardless of how large/small the font size is).\n\n### Examples of h1 usage\n\nTo better prepare you for the real world, here are some examples of what an `h1` could be on different web pages in various industries:\n\n- If I were to build a personal portfolio web page, the `h1` would generally be my full name: `<h1>Jad Joubran</h1>`. It is also possible to have another text, for example, your expertise, if your website is more about your expertise than your personal brand. For example, `<h1>Web performance consultant</h1>`.\n- On a blog post, the `h1` should be the title of that blog post (rather than the blog's name). Let's say there's a blog called **TechBlog** that has a post talking about _The benefits of semantic HTML_; the `h1` should wrap the title of the blog post: `<h1>The benefits of semantic HTML</h1>`.\n- A web page comparing two phone models should have an `h1` representing this comparison. For example, `<h1>iPhone 13 vs Pixel 6</h1>`.\n- A web page showing movie reviews of a certain movie, for example, the movie _Memento_, will most likely have an `<h1>Memento</h1>` or `<h1>Memento reviews</h1>`.\n\nAfter we learn about accessibility, we will have an entire chapter covering headings!\n\n## Recap\n\n- The heading 1 `h1` element is used to represent the highest-level, most important topic of the current web page.\n- `<h1>Most important topic of the page</h1>`\n- When writing HTML code, it's important to focus on the _semantics_ rather than the _appearance_. HTML is meant for the content, and the structure, whereas CSS is used to style that content (appearance).\n- You should not use an HTML element based on its appearance but rather its meaning/purpose/role.\n- If you're not sure which element should be labeled as the `h1` on the page, ask yourself: _What is the most important topic on this page?_",
  'lessons/Intro to emmet.md':
    "\n# Intro to emmet\n\nLast updated July 2023\n\nBefore proceeding with the course, we'd like to teach you about [emmet](https://emmet.io/).\n\nEmmet is a code editor plugin that allows you to write HTML faster (among other things).  \nIf you're using [Visual Studio Code](https://code.visualstudio.com/), then emmet is already installed.\n\nEmmet is also already installed in the desktop editor of this course. Unfortunately, if you're visiting the course on mobile, it won't work.\n\n## HTML element + tab\n\nInstead of writing `<h1>`, you can write `h1` and then press the `Tab` key on your keyboard, which will automatically convert it to `<h1></h1>`.\n\n![Warning sign](https://learnhtmlcss.online/assets/v2/info-triangle-filled.svg?v=2)\n\nThis behavior only works in an `html` file.\n\nThis saves you time from:\n\n- writing the `<` and `>` characters (especially on some keyboard layouts where those keys are slightly hidden)\n- writing the corresponding closing tag (`</h1>` in this example)\n\nGenerally, you will make fewer mistakes when using _emmet_, so we recommend that you get used to it from the start!\n\n## Emmet offers much more\n\nEmmet offers a lot more! Here's a sneak peek, but promise that you won't get discouraged as the preview below contains lots of things that we have not explained yet!\n\nThis is a bit of an advanced use case, so don't worry if it looks like it's over complicated. It aims to 'show off' _emmet_'s capabilities, but you don't always have to use them!\n\n## Recap\n\n- Emmet is a code editor plugin that allows you to write HTML faster (among other things).\n- Instead of writing `<h1></h1>` yourself, you can type `h1` and then press the `Tab` key on your keyboard and the `h1` will automatically be replaced by `<h1></h1>`.",
};

export const glmRejectedEvidences: Array<{ atomId: string; file: string; evidence: string }> = [
  {
    atomId: 'a1',
    file: 'lessons/Intro to HTML.md',
    evidence: 'HTML is a markup language. It does not contain programming logic such as if...else.',
  },
  {
    atomId: 'a4',
    file: 'lessons/Intro to HTML.md',
    evidence: 'This is made up of the h1 opening tag <h1> and the h1 closing tag </h1>.',
  },
  {
    atomId: 'a8',
    file: 'lessons/Intro to Headings.md',
    evidence:
      'The heading 1 h1 element, also called heading level 1, is used to represent the highest-level, most important topic of the current web page.',
  },
  {
    atomId: 'a9',
    file: 'lessons/Intro to Headings.md',
    evidence:
      'Sometimes developers confuse the heading element with the word header. They are not the same.',
  },
  {
    atomId: 'a11',
    file: 'lessons/Intro to Headings.md',
    evidence:
      "when we label an element as h1, we're signaling to the browser that this is the most important topic on the page (regardless of how large/small the font size is).",
  },
  {
    atomId: 'a12',
    file: 'lessons/Intro to Headings.md',
    evidence:
      "If you're not sure which element should be labeled as the h1 on the page, ask yourself: What is the most important topic on this page?",
  },
  {
    atomId: 'a14',
    file: 'lessons/Intro to emmet.md',
    evidence:
      'Instead of writing <h1>, you can write h1 and then press the Tab key on your keyboard, which will automatically convert it to <h1></h1>.',
  },
  {
    atomId: 'a15',
    file: 'lessons/Intro to emmet.md',
    evidence: 'This behavior only works in an html file.',
  },
];
