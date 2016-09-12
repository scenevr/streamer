# Scene Streamer

[![Build Status](https://travis-ci.org/scenevr/streamer.svg?branch=master)](https://travis-ci.org/scenevr/streamer)
[![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg?style=flat-square)](https://github.com/Flet/semistandard)


Watch a dom for changes and stream changes to the dom via an xml protocol.

## Usage

Install:

    npm install --save scene-streamer

Then require:

    import { Patch, Apply } from 'scene-streamer'

Watch a DOM and generate patches:

    new Patch(domnode, (events) => {
      ws.send(events);
    });

Recieve patches and apply them to a local DOM:

    let apply = new Apply(domnode);

    ws.on('message', (event) => {
      apply.onPatch(event.data);
    })

# Overview

I invented this for SceneVR, where I need to simulate a scene on the server
and then stream changes down to all connected clients.

Your dom implementation must support MutationObservers, thats how we watch for
changes. The wire format looks like this:

    <patch><html data-uuid="2f77f229-0f39-42c1-9cb5-ac6a398db356"><body data-uuid="d923081d-8afa-4436-8cef-752ab208fa3f"><a-scene data-uuid="df37f93d-e67f-4878-9613-8d3c2edb51be"><a-cube data-uuid="2443b32f-8c93-4cca-ac57-5767fb747f0d"></a-cube></a-scene></body></html></patch>

Each patch is send in a patch element. Each element has a `data-uuid` added. This
is a private attribute that won't be added to your markup. You can look up an
element by `data-uuid`, or find an elements `data-uuid` using the `private-attributes`
module.

When an element is deleted, we send a `dead` element. Here is an exaxample of removing
an element that is parented to the scene.

    <patch><a-scene data-uuid="cdb755c3-87fa-492c-b8a5-29034968c3d9"><dead data-uuid="c20fb03d-7eaa-4277-8dc2-0ee09b55d82e"></dead></a-scene></patch>

Use the supplied `apply` function to apply changes to the dom. The wire protocol
may change as I find more efficient ways of diffing and patching, but the exposed
API should stay the same.

The 