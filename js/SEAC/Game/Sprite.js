/* 
 * The MIT Modified License (MIT, Erich Horn)
 * Copyright (c) 2012, 2013 Erich
 *
 * Author Erich
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy 
 * of this software and associated documentation files (the "Software"), to 
 * deal in the Software without restriction, including without limitation the 
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or 
 * sell copies of the Software, and to permit persons to whom the Software is 
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice, author and this permission notice shall be 
 * included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS 
 * IN THE SOFTWARE.
 */
( function ( ) {
    var modules = typeof modules !== 'undefined' ? modules : window,
        _ArrayProto = Array.prototype,
        _ForEach = _ArrayProto.forEach,
        _Slice = _ArrayProto.slice,
        _ImageURL = /^http:\/\/[\w\-\.]+(?::\d+)?\/(?:~[\w\-\.]+\/)?(?:[\w\-\.]+\/)*([a-z]\w+(?:\-[a-z]\w+)*)(?:\-(\d+(?:\.\d*)?|\.\d+)x(\d+(?:\.\d*)?|\.\d+)y\-(\d+)c(\d+)r)?\.(png|jpg|jpeg|gif|bmp)/i,
        _Configure = function ( ) {
            var list = _Slice.call( arguments ),
                config = list.shift( ) || { };
            list.forEach( function ( conf ) {
                if ( conf )
                    for ( var i in conf )
                        if ( config[i] == null )
                            config[i] = conf[i];
            } );
            return config;
        },
        SEAC = modules.SEAC || ( modules.SEAC = { } ),
        Sprite = SEAC.Sprite || ( SEAC.Sprite = ( function ( ) {
            var _UID = 0,
                _GetUniqueSelector = function ( element ) {
                    var t;
                    return ( element.tagName || '' )
                            + ( t = element.id ) ? '#' + t : ''
                            + ( t = _Slice.call( element.classList ) ) ? '.' + t.join( '.' ) : '';
                },
                _CreateSheetData = function ( el, options, force ) {
                    var sheetList = this,
                        ssi = el instanceof HTMLImageElement ? el : document.querySelector( el ),
                        src = ssi.src,
                        data = ssi.dataset,
                        parts = ssi.src.match( _ImageURL ) || [],
                        name = parts[1] || 'sheet' + _UID++,
                        t,
                        init = function ( ) { 
                            var columns = options.columns || data.columns || parseInt( parts[4] ) || 1,
                                rows = options.rows|| data.rows  || parseInt( parts[5] ) || 1;
                            if ( ssi.parentElement )
                                ssi.removeEventListener( 'load', init );
                            return sheetList[name] = {
                                backgroundImage: 'url(' + src + ')',
                                columns: columns,
                                rows: rows,
                                width: options.width || data.width || parseFloat( parts[2] ) || ssi.width / columns,
                                height: options.height || data.height || parseFloat( parts[3] ) || ssi.height / rows,
                                direction: ( t = ( options.direction || data.direction ) ) && t[0] === 'v' ? 'vertical' : 'horizontal',
                                ready: !! ssi.parentElement
                            };
                        },
                        sheet = ( ! force && sheetList[name] ) || init( );
                    ssi.removeEventListener( 'load', init );
                    ssi.addEventListener( 'load', init, false );
                    return sheet;
                },
                _CreateSprite = function ( el, options ) {
                    var element = el instanceof HTMLElement ? el : el ? document.body.querySelector( el ) : document.createElement( options.tagName || 'div' ),
                        data = element.dataset,
                        classList = element.classList,
                        className = options.className || 'sprite';
                    classList.contains( className ) || classList.add( options.className || 'sprite' );
                    return element;
                },
                Factory = function ( config ) {
                    var _Options = _Configure( { }, config ),
                        _Sheets = { },
                        _Stylesheet = document.createElement( 'style' ),
                        Sprite = function ( el, config ) {
                            if ( ! ( this instanceof Sprite ) )
                                throw 'Sprite class called as function, try preceeding with "new"';
                            var options = _Configure( config, _Options ),
                                t,
                                element = _CreateSprite( el, options ),
                                style = element.style,
                                data = element.dataset,
                                sheet = options.sheet || data.sheet,
                                animation = options.animation || data.animation || 'animation'+ _UID++,
                                conf = _Sheets[sheet],
                                start = parseInt( data.start || 0 ),
                                steps = parseInt( data.steps || ( data.end - start + 1 ) || conf.columns ),
                                end = start + steps - 1,
                                delay = data.delay || ( ( t = data.fps ) ? 1000 / t : 250 ) + 'ms',
                                vertical = ( t = ( options.direction || data.direction ) ) && t[0] === 'v',
                                v = animation + ( vertical
                                        ? ' { from { background-position: ' + ( -conf.width * ( start - ( t = start % conf.rows ) ) / conf.rows ) + 'px ' + ( -conf.height * t ) + 'px; } to { background-position: ' + ( -conf.width * ( end - ( t = end % conf.rows ) ) / conf.rows ) + 'px ' + ( -conf.height * ( t + 1 ) ) + 'px; } }'
                                        : ' { from { background-position: ' + ( -conf.width * ( t = start % conf.columns ) ) + 'px ' + ( -conf.height * ( ( start - t ) / conf.columns ) ) + 'px; } to { background-position: ' + ( -conf.width * ( ( t = end % conf.columns ) + 1 ) ) + 'px ' + ( -conf.height * ( ( end - t ) / conf.columns ) ) + 'px; } }' );
                            console.debug( conf, start, end, delay );
                            console.debug( v );
                            v = '@-webkit-keyframes ' + v + ' @-moz-keyframes ' + v;
                            _Stylesheet.appendChild( document.createTextNode( v ) );
                            style.backgroundImage = conf.backgroundImage;
                            style.width = conf.width + 'px';
                            style.height = conf.height + 'px';
                            v = animation + ' ' + delay + ' steps(' + steps + ') ' + ( data.reverse == 'true' ? 'reverse ' : ' ' ) + ( data.loop == null ? 'infinite' : data.loop );
                            style.webkitAnimation = v;
                            style.mozAnimation = v;
                            style.msAnimation = v;
                            style.oAnimation = v;
                            style.animation = v;
                        };
                    
                    _Stylesheet.type = "text/css";
                    document.head.appendChild( _Stylesheet );
                    
                    Sprite.AddSheet = _CreateSheetData.bind( _Sheets );
                    Sprite.AutoLoadSheets = function ( selector ) {
                        _ForEach.call( document.querySelectorAll( selector || 'img.spritesheet' ), function ( ssi ) {
                            SEAC.Sprite.AddSheet( ssi, _Options );
                        } );
                    };
                    Sprite.Factory = Factory;
                    return Sprite;
                };
            
            return Factory( );
        } )( ) );
    
    return Sprite;
} )( );
