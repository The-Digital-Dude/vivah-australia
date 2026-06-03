# Blog System Improvements

This document outlines the modifications made to correct 404 links on blog articles and extend the blog engine to support advanced metadata.

## Fixes Applied
1. **Dynamic Routing**: Replaced links pointing to `/pages/:slug` with `/blog/:slug`. Created a dynamic details page at `apps/web/app/blog/[slug]/page.tsx` that fetches content from `/api/public/blogs/:slug`.
2. **Schema Extension**: Extended `BlogPostModel` schema to include:
   - `coverImage` (String): Custom article banner image.
   - `tags` (Array of Strings): Key topics and advice categories.
   - `readTimeMinutes` (Number): Expected duration to read.
3. **Admin Controls**: Updated the admin blog editor inside the Content Management tab to support editing cover images, tags, and read times.
4. **Related Articles**: Added a recommendation query that suggests up to three related blog articles at the bottom of each post detail view to improve site navigation.
