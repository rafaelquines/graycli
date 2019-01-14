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
      -v, --version               output the version number
      --api-url TEXT              Full Graylog Api URL
      --api-host TEXT             Graylog API Hostname (default: "127.0.0.1")
      --api-port INTEGER          Graylog API Port (default: "9000")
      --api-path TEXT             Graylog API Path (default: "/api/")
      --api-protocol TEXT         Graylog API Protocol (default: "http")
      -u, --username TEXT         Graylog API Username
      -p, --password TEXT         Graylog API Password
      -i, --interval INTEGER      Polling interval in seconds (default: 3)
      -r, --range INTEGER         Relative timerange, specified as seconds from now (default: 60)
      -f, --filter TEXT           Search string
      -s, --save TEXT             Save config
      -c, --config TEXT           Load saved config
      -h, --help                  output usage information
