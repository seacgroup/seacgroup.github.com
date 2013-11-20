( typeof modules === 'undefined' ? modules : self ).SEAC.CacheQueue = ( function ( ) {
    // requestTypes: "ajax", "script", "css", "xml", "image", "media", "object", function
    // contentTypes: "text", "mustache", "image", "xml", "json", "jsonp", function
    var _ContentTypes = {
            text: { process: function ( id ) { }, requestTypes: {
                ajax: function ( content ) { }
            } },
            script: { process: function ( id ) { }, requestTypes: {
                script: function ( content ) { },
                ajax: function ( content ) { }
            } },
            css: { process: function ( id ) { }, requestTypes: {
                link: function ( content ) { },
                ajax: function ( content ) { }
            } },
            mustache: { process: function ( id ) { }, requestTypes: {
                ajax: function ( content ) { }
            } },
            xml: { process: function ( id ) { }, requestTypes: {
                ajax: function ( content ) { }
            } },
            json: { process: function ( id ) { }, requestTypes: {
                ajax: function ( content ) { }
            } },
            jsonp: { process: function ( id ) { }, requestTypes: {
                ajax: function ( content ) { }
            } },
            image: { process: function ( id ) { }, requestTypes: {
                img: function ( content ) { },
                ajax: function ( content ) { }
            } },
            media: { process: function ( id ) { }, requestTypes: {
                media: function ( content ) { },
                ajax: function ( content ) { }
            } },
            object: { process: function ( id ) { }, requestTypes: {
                object: function ( content ) { },
                ajax: function ( content ) { }
            } }
        },
        ValidateOptions = function ( options, defaults ) {
            defaults || ( defaults = {} );
            var contentType = ( options || ( options = {} ) ).contentType || defaults.contentType,
                requestType = options.requestType || defaults.requestType;
            if ( ! contentType )
                contentType = Object.keys( _ContentTypes )[0];
            if ( ! requestType )
                requestType = Object.keys( _ContentTypes[contentType].requestTypes )[0];
            options.contentType = contentType;
            options.requestType = requestType;
            return options;
        },
        _Cache = { },
        _Queue = [ ],
        Factory = function ( options ) {
            var _Options = {
                    requestType: ( _ValidateOptions( options ) ).requestType,
                    contentType: options.contentType,
                    cache: options.cache || _Cache,
                    queue: options.queue || _Queue,
                },
                CacheQueue = function ( options ) {
                    if ( ! ( this instanceof CacheQueue ) )
                        return Factory.apply( null, arguments );
                    var _options = {
                            requestType: ( _ValidateOptions( options, _Options ) ).requestType,
                            contentType: options.contentType
                        },
                        _cache = options.cache || _Options.cache,
                        _queue = options.queue || _Options.queue;
                    this.__defineGetter__( 'cache', function ( ) { return _cache; } );
                    this.__defineGetter__( 'queue', function ( ) { return _queue; } );
                    Object.seal( this );
                };
        };
    Factory.Cache = _Cache;
    Factory.Queue = _Queue;
    Object.freeze( Factory );
    return Factory( );
} )( );
