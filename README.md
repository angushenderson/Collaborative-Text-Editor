# Collaborative Text Editor

[!!THIS PROJECT IS STILL UNDER DEVELOPMENT!!] I'm currently making new changes weekly, however once complete, I'll provide a proper setup guide and a deployed example online! I have big ambitions for this project and can't wait to share it all with you once its finished!! :)

## Project Description

## Local setup

## Tech Stack

 - Backend
   - Python
   - Django → Out of all the Python Web Frameworks I've tried, Django was just my favourite to develop with. No technical reason for choosing this per say, I just loved using it!
     - Django Rest Framework
     - Django Channels
 - Database
   - SQLite3 → As this is just a small side/passion project that realistically isn't going to get used very much when deployed, SQLite3's simple integration with Django just made it simple to get this project off the ground, despite some of its technical limitations.
   - Redis → Django Channels uses this to create Socket Channels, however I'll also probably use it to store documents whilst they're being edited to reduce the number of hits on the SQLite database, and improve response times.
 - Frontend
   - React → Again, like Django, I just love using React!
     - DraftJS
 

## Technical Overview

### WebSocket Security

I want to preface this section by saying I am by no means an expert on security, so this likely is not the best way to do things. From my personal research however these are the solutions I decided were best for this project :)

The JavaScript WebSocket interface doesn't support authentication headers, hence when establishing a connection, the users private auth jwt cannot be sent. From my research, query parameters appeared to be the only straight forward way to passing data to the server during the handshake.

Theoretically, if proper SSL is used, sending the token via a query parameter should be acceptable and secure enough, however in many cases this isn't **secure enough** and we risk exposing the users private authentication JWT way too much for my liking.

To combat this I instead implemented a ticket system. When the user first requests the document, a unique ticket (uuid4) is sent along with it. This unique ticket is then passed as a query param when messages are sent via the WebSocket connection, allowing the user to be uniquely identified relatively securely.

Obviously there are some improvements that could be made here, for one we could log the IP address of the user when requesting this ticket, then only allow the WebSocket messages to be sent if the requests came from the same source.

Once a connection has been established, this is no longer an issue as we can attach the auth JWT securely within the body of the message, rather than having to use query params.
