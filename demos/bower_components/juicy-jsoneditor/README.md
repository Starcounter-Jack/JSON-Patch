# &lt;juicy-jsoneditor&gt;

> Polymer Element that wraps [josdejong/jsoneditor](http://github.com/josdejong/jsoneditor) and adds two-way binding for edited JSON.

## Demo

[Check it live!](http://juicy.github.io/juicy-jsoneditor)

## Install

Install the component using [Bower](http://bower.io/):

```sh
$ bower install juicy-jsoneditor --save
```

Or [download as ZIP](https://github.com/juicy/juicy-jsoneditor/archive/master.zip).

## Usage

1. Import Web Components' polyfill, if needed:

    ```html
    <script src="bower_components/webcomponentsjs/webcomponents.min.js"></script>
    ```

2. Import Custom Element:

    ```html
    <link rel="import" href="bower_components/juicy-jsoneditor/juicy-jsoneditor.html">
    <!-- josdejong/jsoneditor#104 workaround-->
    <link rel="stylesheet" type="text/css" href="bower_components/jsoneditor/jsoneditor.min.css">
    ```

3. Start using it!

    ```html
    <juicy-jsoneditor></juicy-jsoneditor>
    ```

## Options

Attribute      | Options            | Default  | Description
---            | ---                | ---      | ---
`json`         | *Object*           | `{}`     | JSON to edit.
`mode`         | *String*           | `tree`   | Editing mode, see [API](https://github.com/josdejong/jsoneditor/blob/master/docs/api.md#constructor)
`modes`        | *Array of Strings* |          | List of editing modes to be available, see [API](https://github.com/josdejong/jsoneditor/blob/master/docs/api.md#constructor)
`name`         | *String*           |          | Object name, see [API](https://github.com/josdejong/jsoneditor/blob/master/docs/api.md#constructor)
`search`       | *Boolean*          | `true`   | Toggle search box, see [API](https://github.com/josdejong/jsoneditor/blob/master/docs/api.md#constructor)
`indentation`  | *Number*           | `2`      | Indentation, see [API](https://github.com/josdejong/jsoneditor/blob/master/docs/api.md#constructor)
`history`      | *Boolean*          | `true`   | Toggle history - undo, redo, see [API](https://github.com/josdejong/jsoneditor/blob/master/docs/api.md#constructor)

## Properties
All attributes, plus:

Name          | Type            |  Description
---           | ---             | ---
`editor`      | *JSONEditor*    |  [JSONEditor](https://github.com/josdejong/jsoneditor/blob/master/docs/api.md#constructor) instance.

## Methods

- `set`,
- `setMode`,
- `setName`,
- `setText`,
- `get`,
- `getName`,
- `getText`

delegated to [`JSONEditor`'s methods](https://github.com/josdejong/jsoneditor/blob/master/docs/api.md#methods)

## Events

Event    | event.details                                  | Description
---      | ---                                            | ---
`change` | `{action: "JSONEditor-action", params: {..} }` | Triggers when json changes.

## [Contributing and Development](CONTRIBUTING.md)

## History

For detailed changelog, check [Releases](https://github.com/juicy/dummyCRM/releases).

## License

 - `<juicy-jsoneditor>` MIT
 - `josdejong/JSONEditor` [Apache License](https://github.com/josdejong/jsoneditor/blob/master/LICENSE)
