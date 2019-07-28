# graycli

`graycli` is a command line interface to query Graylog via the REST API. It tries emulate the \"docker logs -f\" behavior.

Installation
============

```bash
$ npm install -g graycli
```

Usage
=====

![Usage](https://media.giphy.com/media/2vmjOC8G99RCBNadPN/giphy.gif)

Examples:

    > graycli --url http://127.0.0.1:9000 -u john
    ...

graycli usage:

    Usage: graycli [options]

    Options:
      -v, --version                 Output the version number
      --url <url>                   Graylog URL
      -u, --username <username>     Graylog API Username
      -i, --interval <interval>     Polling interval in seconds (default: 3)
      -r, --range <range>           Relative timerange, specified as seconds from now (default: 60)
      -f, --filter <filter>         Search string
      -q, --query <query>           Query search string
      -d, --debug                   Show debug messages
      -h, --help                    Output usage information
