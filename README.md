# Collaborative Text Editor

## Project Description

## Local setup

## Technical Overview

### WebSocket Security

I want to preface this section by saying I am by no means an expert on security, so this likely is not the best way to do things. From my personal research however these are the solutions I decided were best for this project :)

The JavaScript WebSocket interface doesn't support authentication headers, hence when establishing a connection, the users private auth jwt cannot be sent. From my research, query parameters appeared to be the only straight forward way to passing data to the server during the handshake.

Theoretically, if proper SSL is used, sending the token via a query parameter should be acceptable and secure enough, however in many cases this isn't **secure enough** and we risk exposing the users private authentication JWT way too much for my liking.

To combat this I instead implemented a ticket system. When the user first requests the document, a unique ticket (uuid4) is sent along with it. This unique ticket is then passed as a query param when messages are sent via the WebSocket connection, allowing the user to be uniquely identified relatively securely.

Obviously there are some improvements that could be made here, for one we could log the IP address of the user when requesting this ticket, then only allow the WebSocket messages to be sent if the requests came from the same source.

Once a connection has been established, this is no longer an issue as we can attach the auth JWT securely within the body of the message, rather than having to use query params.

### Tech Stack
