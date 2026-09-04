---
title: test
description: test blog publication
date: 2026-08-27T16:58:00.000+00:00
author: Mohiseen
featured_image: https://picsum.photos/id/841/1920/1280.webp
category: test
tags:
  - test
draft: false
---

## Why static, and why it stays that way

A static site has no server to keep patched and no runtime to fall over at three in the morning. The whole site is a folder of HTML files. That constraint is doing most of the work: if there is no server, there is nothing to slow down under load.

### The trade you are making

You give up anything that needs to be computed per request — personalised pages, live counts, server-side search. In exchange you get a site that is cheap to host, hard to break, and fast by default.

### The trade you are not making

You do not give up comments, search, or a content editor. Each of those has a static-friendly answer, and this site uses one of each.

## Where the time actually goes

Most slow blogs are not slow because of their framework. They are slow because of images and third-party scripts, in that order.

| Cause | Typical cost | Fixed by |
| --- | --- | --- |
| Unoptimised hero images | 1–3 MB per page | Build-time resizing and modern formats |
| Embedded social widgets | 200–600 KB of JS | Plain links instead of widgets |
| Web fonts | 100–300 KB, blocking | System font stack |
| Analytics and tag managers | 50–150 KB | Leaving them out |
