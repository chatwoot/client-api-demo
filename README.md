## API Channel Public API demo

This repo is a POC implementation using Public API of Chatwoot's API Channels.

### Steps

1) Create an API Channel in chatwoot and obtain the channel identifier
```
# replace api_inbox_id with your inbox id
Inbox.find(api_inbox_id).channel.identifier
```
2) Edit `frontend.js` and update `chatwoot.inboxIdentifier` with the value of channel identifier. 
3) Run and local server and try interacting with the interface
```
python3 -m http.server
``` 
