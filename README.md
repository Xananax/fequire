# Fequire

A `require()` replacement that doesn't cache modules and is pretty nifty for doing all kinds of manipulations. Fequire stands for "fake require". Yeah.

Fequire loads the module specified by the path you set, and runs it in a virtual machine (using the native `vm` node module), with a context you provide. The default context mimicks the node environment by providing `require()`, `module`, and `console`, and anything you pass will be mixed in.

You can also pass in your custom context your own `require` or `console` to override default functionality.

Lastly, fequire can work async, which can be useful if you're loading modules dynamically.

## Usage

```
npm install -s fequire
```

```js
//module.js
var fs = require('fs');
var file = fs.readFileSync('./some.file')
module.exports = add(1,2);
```

```js
//index.js
var fequire = require('fequire');
var module = fequire('./module.js',{
    add:function(a,b){return a+b;}
});
```

The `add` function has been passed as a context, so it is available in the global scope of `module.js`. `module.js` can also use the `fs` module normally, because require is part of the default context. But you could override it:

```js
//index.js
var fequire = require('fequire');
var module = fequire('./module.js',{
    add:function(a,b){return a+b;}
,   require:function(name){
        if(name.charAt(0) == '.'){
            return require(fequire.resolve('./',name));
        }
        if(name=='fs'){return require('fake-fs');}
        return require('fs');
    }
});
```

In this instance, if the module asked for `fs`, it would get `fake-fs` and would be none the wiser. As an aside, fequire.resolve is a simple function to get a path relative to the module location.

----

What if you wanted to manipulate the text of the module before evaluating it? For example, to use your own macros? In this case, use `fequire.run`:

```js
//module.js
module.exports = function(){
    args = ##arguments##;
    console.log(args);
}
```


```js
//index.js
var fequire = require('fequire');
var fs = require('fs');
var moduleText = fs.readFileSync('./module.js',{encoding:'utf8'});
moduleText = moduleText.replace('##arguments##','Array.prototype.slice.call(arguments);');
var module = fequire.run('./module.js',moduleText);
```

-----

## API

###FEQUIRE()
Loads modules

###fequire(path)
Equivalent to `require()`, but without caching.

###fequire(path,context)
Equivalent to `require()`, but with a custom 'context' object you provide.

###fequire(path,callback)
Async `require()`. the `callback` argument is a function with the following signature:
```js
function callback(err,returnedValue){}
```
Where `err` is any error encountered, and `returnedValue` is what the module returned, either by using `exports=` or `module.exports =`.

###fequire(path,context,callback)
Async `require()` with a custom 'context' object you provide.

----

###FEQUIRE.RUN
Creates modules out of text you provide.

###fequire.run(path,text)
Equivalent to `require()`, but you are tasked to load the module text (or generate it) and pass it to the function as the `text` argument. The `path` argument is only used for error reporting.

###fequire.run(path,text,context)
Equivalent to `fequire(path,context)`: provides a custom context to the module you provide.

###fequire.run(path,text,callback)
It doesn't make much sense (after all the module is already loaded, since you pass the text yourself), but for the sake of consistency, this is the equivalent to `fequire(path,callback)`: async module loading.

###fequire.run(path,text,context,callback)
Same as above, but with a custom context.

----

## TODO
tests!

----

## License

MIT