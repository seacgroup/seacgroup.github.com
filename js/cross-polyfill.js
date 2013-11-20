/* cross platform helpers */
(function () {
    'use strict';
    
    /* cross platform support */
    
    var ArrayProto = Array.prototype
    
    if ( ! window.parseBool )
        window.parseBool = function ( val ) { return ! ( typeof val !== 'string' ? ! val : /^\s*(?:f(?:alse)?|0+(?:\.0*|e(?:[+\-]?\d+)?)?|\.0*|)\s*$/i.test( val ) ); };

    if ( ! window.addEventListener) {// not W3C standard supported
        if ( window.attachEvent ) // Microsoft
            window.addEventListener = function ( type, callback, dummy ) { this.attachEvent( 'on' + type, callback ); };
        else
            window.addEventListener = function ( type, callback, dummy ) { this['on' + type] = callback; };
    }
    
    if ( ! Node.prototype.addEventListener) {// not W3C standard supported
        if ( Node.prototype.attachEvent ) // Microsoft
            Node.prototype.addEventListener = function ( type, callback, dummy ) { this.attachEvent( 'on' + type, callback ); };
        else
            Node.prototype.addEventListener = function ( type, callback, dummy ) { this['on' + type] = callback; };
    }
    
    if ( ! window.XMLHttpRequest ) {
        var XMLHttpFactories = [
            function () {return new ActiveXObject("Microsoft.XMLHTTP")},
            function () {return new ActiveXObject("Msxml3.XMLHTTP")},
            function () {return new ActiveXObject("Msxml2.XMLHTTP")}
        ],
        i = XMLHttpFactories.length;
        
        while ( i-- ) {
            try {
                XMLHttpFactories[i]();
            } catch (e) {
                continue;
            }
            window.XMLHttpRequest = XMLHttpFactories[i];
            break;
        }
    }
    
    if ( ! XMLHttpRequest.DONE ) {
        [   'UNSENT',
            'OPENED',
            'HEADERS_RECEIVED',
            'LOADING',
            'DONE' ].forEach( function ( tag, idx ) {
                XMLHttpRequest[tag] = idx;
                XMLHttpRequest.prototype[tag] = idx;
            } );
    }
    
    if ( ! XMLHttpRequest.prototype.sendAsBinary && Uint8Array ) {
        XMLHttpRequest.prototype.sendAsBinary = function ( str ) {
            var n = str.length,
                bin = new Uint8Array( n ),
                i = 0;
            
            while ( i < n )
                bin[i] = str.charCodeAt( i++ ) & 0xff;
            this.send( bin );
        };
    }
    
    if ( ! XMLHttpRequest.prototype.responseJSON )
        XMLHttpRequest.prototype.__defineGetter__( 'responseJSON', function ( ) {
            'use strict';
            return this.responseType === 'json' 
                    ? this.response
                    : JSON.parse( this.responseText );
        } );

} )();
