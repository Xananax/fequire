/**********************************************************
	Utility to load modules while passing context.
	Equivalent to using 'require()', but modules
	aren't cached, so it can be used to load files that
	change.
	The second benefit is passing a context object, which
	allows to have globals without polluting node.js
	global space.
	The default context object passes require & console.
	You can pass your own with your own functions, or
	pass your custom require(module) to swap modules
	on the fly (say, replace fs by a virtual fs).
	Works synchronously and asynchronously.

	usage:

	load(filePath)
	// equivalent to require(filePath)

	load(filePath,callback)
	// Async require

	load(filePath,context) 
	// equivalent to require, but with a custom context
	// context is a hash that is used as globals

	load(filePath,context,callback)
	// Async require + custom context

	if you've already read the file contents, you
	can use the alternative load.run function

	load.run(filePath,contents)
	// equivalent to require(filePath)

	load.run(filePath,contents,context)
	// custom context  

	load.run(filePath,contents,callback)
	// async require

	load.run(filePath,contents,context,callback)
	// async require + custom context

**********************************************************/
var vm = require('vm')
,   fs = require('fs')
,   path = require('path')
;
 
function resolveModule(filePath,name){
	if (name.charAt(0) !== '.') return name;
	return path.resolve(path.dirname(filePath), name);
}

function extend(context,defaultContext){
	if(!context.hasOwnProperty('module')){context.module = defaultContext.module;}
	if(!context.hasOwnProperty('exports')){context.exports = defaultContext.exports;}
	if(!context.module.hasOwnProperty('exports')){context.module.exports = defaultContext.exports;}
	for(var n in defaultContext){
		if(n == 'module' || n=== 'exports'){continue;}
		if(!context.hasOwnProperty(n)){
			context[n] = defaultContext[n];
		}
	}
	return context;
}

function isEmpty(obj){
	if((typeof obj == 'undefined') || obj == ''){return false;}
	if(typeof obj == 'function'){return obj;}
	for (var key in obj) {
		if (obj.hasOwnProperty(key)){return obj;}
	}
	return false;
}

function run(filePath,contents,context,callback){
	var exports = {}
	,	defaultContext = {
			require: function fakeRequire(name) {
				return require(LoadModule.resolve(filePath,name));
			}
		,	__filePath:filePath
		,	console:console
		,	exports:exports
		,	module:{
				exports:exports
			}
		}
	;
	context = (context && extend(context,defaultContext)) || defaultContext;
	try{
		var script = vm.createScript(contents,filePath);
		script.runInNewContext(context);
		var returned = isEmpty(context.exports) || context.module.exports;
		if(callback){callback(null,returned);}
		return returned;
	}catch(e){
		e.message='"'+e.message+'" in `'+filePath+'`';
		if(callback){return callback(e);}
		throw e;
	}
}

function LoadModule(filePath,context,callback){
	if(typeof context == 'function'){
		callback = context;
		context = null;
	}
	if(!callback){
		var contents = fs.readFileSync(filePath,{encoding:'utf8'});
		return run(filePath,contents,context);
	}
	fs.readFile(filePath,{encoding:'utf8'},function(err,contents){
		if(err){return callback(err);}
		run(filePath,contents,context,callback);
	});
};

LoadModule.resolve = resolveModule;
LoadModule.run = run;

module.exports = LoadModule;