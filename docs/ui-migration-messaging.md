# UI Migration - Messaging Experience

## Goal

Restyle the member messaging surface into a more premium three-column matchmaking workspace while preserving all current chat, attachment, safety, and deletion behavior.

## What changed

- Rebuilt the messaging layout into a more premium communication workspace with:
  - left conversation rail
  - center conversation pane
  - right profile, settings, and safety rail
- Upgraded the conversation list so chats feel more curated and relationship-focused instead of appearing like a generic utility inbox.
- Refined the active conversation header with:
  - clearer member identity
  - city and occupation context
  - safe-chat trust framing
  - preserved action controls
- Restyled the message composer and secure attachment section to feel calmer, more premium, and more trustworthy.
- Added a stronger right-side utility experience for:
  - member context
  - chat settings framing
  - safety reminders

## Logic preserved

- Conversation loading still uses the existing member conversation endpoints.
- Socket join, typing, incoming message, and read refresh behavior remain unchanged.
- Attachment upload still uses the existing sign-upload and complete flow.
- Message send, message delete, conversation delete, and profile safety actions remain unchanged.

## Design intent

This phase makes member chat feel like a protected, premium matchmaking conversation space rather than a plain inbox, while keeping all of the current messaging behavior stable.
