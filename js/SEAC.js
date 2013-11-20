'use strict';

( typeof modules !== 'undefined' ? modules : self ).SEAC = ( function ( ) {
        var stripDomain = function ( url ) {
            return url.replace( /^\w+:[\/\\]{0,2}[\w\-\.%+]+(?::\d+)?[\/\\]?/, '' );
        },
        loadScript = function ( scriptURL, onLoad, whereElement ) {
            var tag;
            ( tag = document.createElement( 'script' ) ).setAttribute( 'src', scriptURL );
            if ( onLoad ) {
                tag.setAttribute( 'async', true );
                tag.addEventListener( 'load', onLoad );
                tag.addEventListener( 'timeout', onLoad );
                tag.addEventListener( 'error', onLoad );
            }
            ( whereElement instanceof HTMLElement 
                    ? whereElement
                    : document.querySelector( whereElement || 'head' ) ).appendChild( tag );
            return tag;
        },
        loadPackage = function ( packageURL, onLoad ) {
            throw 'Reserver for later implementation';
        },
        SEAC = {
            stripDomain: stripDomain,
            set script ( scriptURL ) {
                if ( scriptURL instanceof Array )
                    return scriptURL.forEach( SEAC.loadScriptOnce );
                if ( ( scriptURL = stripDomain( scriptURL ) ).lastIndexOf( 'package.json' ) >= 0 )
                    return loadPackage
                loadScript( stripDomain( scriptURL ) );
            },
            set package ( packageURL ) {
                return loadPackage( stripDomain( packageURL ) );
            },
            loadScript: function ( scriptURL, onLoad, whereElement ) {
                return loadScript( stripDomain( scriptURL ), onLoad, whereElement );
            },
            loadScriptOnce: function ( scriptURL, onLoad, whereElement ) {
                var tag = document.querySelector('script[src="' + ( scriptURL = stripDomain( scriptURL ) )+ '"]');
                if ( tag ) {
                    onLoad && onLoad.call( tag );
                    return tag;
                }
                return loadScript( scriptURL, onLoad, whereElement );
            },
            loadPackage: function ( packageURL, onLoad ) {
                return loadPackage( stripDomain( packageURL ), onLoad );
            },
        };

    return SEAC;
} )( );
