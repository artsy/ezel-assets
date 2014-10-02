# ezel-assets

A tiny CLI to take a folder of stylus & browserify files, iterate through them running transforms, and spit them out to another folder. Used as a task in [Ezel](http://ezeljs.com), but maybe useful outside of that as well. Uses your app's dependencies so make sure to specify `"browserify":"*", "stylus":"*"` in your package.json.

## Example

````
ezel-assets assets/ public/assets
````

## Contributing

Please fork the project and submit a pull request with tests. Install node modules `npm install` and run tests with `npm test`.

## License

MIT
