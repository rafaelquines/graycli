# graycli

`graycli` is a command line interface to query Graylog via the REST API. It tries emulate the \"docker logs -f\" behavior.

Installation
============

```bash
$ npm install -g graycli
```

Usage
=====

Examples:

    > graycli --api-url http://127.0.0.1:9000/api -u john -p 123456
    ...

    > graycli --api-host 127.0.0.1 --api-port 9000 --api-path /api --api-protocol http -u john -p 123456
    ...

graycli usage:

    Usage: graycli [options]

    Options:
      -v, --version             output the version number
      --url url                 Graylog URL
      -u, --username username   Graylog API Username
      -i, --interval interval   Polling interval in seconds (default: 3)
      -r, --range range         Relative timerange, specified as seconds from now (default: 60)
      -f, --filter filter       Search string
      -h, --help                Output usage information
