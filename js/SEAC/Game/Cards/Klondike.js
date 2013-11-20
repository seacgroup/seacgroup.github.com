( function ( ) {
    var modules = typeof modules !== 'undefined' ? modules : window,
        SEAC = modules.SEAC || ( modules.SEAC = { } ),
        Game = SEAC.Game || ( SEAC.Game = { } ),
        Cards = Game.Cards || ( Game.Cards = { } ),
        Klondike = Cards.Klondike || ( Cards.Klondike = ( function ( ) {
            var body, deckContainer, wasteContainer, foundationContainer, tableauContainer,
                foundationStackList,  tableauStackList,
                ArrayProto = Array.prototype,
                indexOf = ArrayProto.indexOf,
                forEach = ArrayProto.forEach,
                slice = ArrayProto.slice,
                _stackLists = {},
                _stackListObserverOptions = {
                    childList: true,
                    attributes: true,
                    subtree: true,
                    attributeFilter: [ 'data-uid', 'data-face', 'data-open' ]
                },
                clearStackLists = function ( name ) { _stackLists = {}; },
                registerStackList = function ( name, stackList, observer ) {
                    if ( ! ( stackList instanceof HTMLElement ) 
                            && ! ( ( stackList = document.querySelector( stackList ) ) instanceof HTMLElement ) )
                        throw 'registerStackList: attempt for register non-stackList or stack';
                    stackList = stackList.classList.contains( 'card-stack' ) 
                            ? [ stackList ] 
                            : slice.call( stackList.querySelectorAll( 'card-stack' ) );
                    if ( stackList.length && observer ) {
                        if ( observer instanceof Function )
                            observer = new MutationObserver( observer );
                        else if ( ! ( observer instanceof MutationObserver ) )
                            throw 'registerStackList: third argument must be a function, mutation observer or empty';
                        stackList.forEach( function ( stack ) { observer.observe( stack, _stackListObserverOptions ); } );
                    }
                    return _stackLists[name] = stackList;
                },
                unregisterStackList = function ( ) {
                    var stackList = _stackLists[name];
                    if ( stackList )
                        _stackLists[name] = null;
                    return stackList;
                },
                _cardUid = 1,
                _uidCardLookup = {},
                _uidFaceLookup = {},
                _cardOpenList = [],
                _cardOpenHandlers = [],
                cardOpenToggle = function ( card, open, manageFace ) {
                    var data, t;
                    if ( ( ! ( card instanceof HTMLElement ) && ! ( ( card = _uidCardLookup[card] ) instanceof HTMLElement ) ) || ! ( data = card.dataset ).uid )
                        throw "cardOpenToggle: attempt on non-card(uid=" + data.uid + ')';
                    if ( manageFace == null )
                        manageFace = true;

                    if ( ( open = ( open == null ) ? ! ( data.face && parseBool( data.open ) ) : parseBool( open ) ) ) {
                        data.open = true;
                        if ( _cardOpenList.indexOf( card ) < 0 )
                            _cardOpenList.push( card );
                        // turn card up (open card)
                        if ( manageFace ) {
                            if ( ! ( data.face = _uidFaceLookup[data.uid] || '' ) )
                                throw "cardOpenToggle: attempt to open faceless card(uid=" + data.uid + ')';
                        }
                    } else {
                        // turn card down
                        if ( manageFace )
                            data.face = '';
                        data.open = false;
                        if ( ( t = _cardOpenList.indexOf( card ) ) >= 0 )
                            _cardOpenList.splice( t, 1 );
                    }
                    t = parseBool( data.open );
                    _cardOpenHandlers.forEach( function ( handler ) { handler( card, t ); } );
                    console.debug( _cardOpenList );
                    return card;
                },
                configCard = function ( card, face, attrs ) {
                    if ( typeof card === 'string' )
                        card = document.querySelector( card );
                    var dataset = card.dataset,
                        uid = card.uid,
                        t;
                    if ( uid && _uidCardLookup[uid] )
                        _uidCardLookup[uid] = null;
                    dataset.open = false;
                    if ( attrs )
                        for ( t in attrs )
                            card.setAttribute( t, attrs[t] );
                    _uidCardLookup[uid = dataset.uid] = card;
                    _uidFaceLookup[uid] = ( face == null ? dataset.face : dataset.face = face ) || '';
                    cardOpenToggle( card, parseBool( dataset.open ) );
                    return card;
                },
                buildCard = function ( face, uid, attrs ) {
                    var card = document.createElement( 'div' );
                    card.dataset.uid = ( uid || _cardUid++ );
                    card.classList.add( 'card' );
                    card.innerHTML = '<div class="rank"></div><div class="suit"></div><div class="face"></div>';
                    return configCard( card, face, attrs );
                },
                cloneCard = function ( card, uid, attrs ) {
                    ( card = card.cloneNode( ) ).dataset.uid = ( uid || _cardUid++ );
                    card.classList.add( 'card' );
                    return configCard( card, null, attrs );
                },
                _deckSize = 0,
                _deckCount = 0,
                _deckCardIds = ["A♦", "2♦", "3♦", "4♦", "5♦", "6♦", "7♦", "8♦", "9♦", "10♦", "J♦", "Q♦", "K♦", "A♣", "2♣", "3♣", "4♣", "5♣", "6♣", "7♣", "8♣", "9♣", "10♣", "J♣", "Q♣", "K♣", "A♥", "2♥", "3♥", "4♥", "5♥", "6♥", "7♥", "8♥", "9♥", "10♥", "J♥", "Q♥", "K♥", "A♠", "2♠", "3♠", "4♠", "5♠", "6♠", "7♠", "8♠", "9♠", "10♠", "J♠", "Q♠", "K♠"],
                _deckSuitNames = {
                    '♦': [ 'Diamonds', 'Diamond', 'Diamonds' ],
                    '♣': [ 'Clubs', 'Club', 'Clubs' ],
                    '♥': [ 'Hearts', 'Heart', 'Hearts' ],
                    '♠': [ 'Spades', 'Spade', 'Spades' ]
                },
                _deckSuitColors = {
                    '♦': 'Red',
                    '♣': 'Black',
                    '♥': 'Red',
                    '♠': 'Black'
                },
                _rankStacking = {
                    '2': ['A'],
                    '3': ['2'],
                    '4': ['3'],
                    '5': ['4'],
                    '6': ['5'],
                    '7': ['6'],
                    '8': ['7'],
                    '9': ['8'],
                    '10': ['9'],
                    'J': ['10'],
                    'Q': ['J'],
                    'K': ['Q']
                },
                _deckList = [],
                lastCard = null,
                expandCallback = function ( evt ) {
                    if ( evt ) {
                        if ( evt.srcElement === this ) {
                            if ( lastCard )
                                lastCard.classList.remove( 'expand' );
                            ( lastCard = this ).classList.add( 'expand' );
                            if ( evt.cancelable )
                                evt.cancelBubble = true;
                            return false;
                        }
                    } else if ( lastCard )
                        lastCard.classList.remove( 'expand' );
                },
                collapseAll = function ( evt ) {
                    lastCard = null;
                    forEach.call( foundationContainer.querySelectorAll( '.card.expand' ), function ( card ) {
                        card.classList.remove( 'expand' );
                    } );
                },
                createDeck = function ( deckSize, deckCount ) {
                    var i = ( _deckSize = deckSize || 52 ) * ( _deckCount = deckSize || 1 ),
                        j = _deckCount,
                        config = {},
                        k, elt;
                    
                    _deckList.splice( 0 );
                    if ( i > 0 ) {
                        while ( j-- ) {
                            k = _deckSize;
                            while ( k-- ) {
                                _deckList[--i] = elt = buildCard( _deckCardIds[k] );
                            }
                        }
                    }
                },
                shuffleDeck = function ( ) {
                    var c = _deckList.length;
                    while ( c > 0 ) {
                        _deckList.push( _deckList.splice( Math.random( c-- ) * 10 | 0, 1 )[0] );
                    }
                },
                moveCards = function ( source, sourceOffset, dest, destOffset, count, open, removeListeners, requireAll ) {
                    var destLength = dest.children.length,
                        reverse = ( count | 0 ) <= 0 ? ( count = -count || 0 ) : false, 
                        n = 0;
                    if ( source instanceof HTMLElement ) {
                        if ( sourceOffset == null )
                            sourceOffset = reverse ? source.childElementCount - count : 0;
                        else if ( sourceOffset < 0 )
                            sourceOffset = source.childElementCount + sourceOffset;
                        source = slice.call( source.children, sourceOffset, sourceOffset + count );
                    } else {
                        if ( sourceOffset == null )
                            sourceOffset = reverse ? source.length - count : 0;
                        else if ( sourceOffset < 0 )
                            sourceOffset = source.length + sourceOffset;
                        source = slice.call( source, sourceOffset, sourceOffset + count );
                    }
                    if ( requireAll && source.length < sourceOffset + count )
                        throw 'moveCards: ' + count + ' cards required, ' + source.length + ' found';
                    if ( reverse )
                        source = source.reverse( );
                    destOffset = destOffset == null ? destLength : ( destOffset < 0 ? destLength + destOffset : destOffset );
                    if ( open == null ) {
                        source.forEach( function ( card ) {
                            if ( removeListeners )
                                card.removeEventListener( 'click', removeListeners );
                            card = card.parentElement.removeChild( card );
                            if ( destOffset < destLength )
                                dest.insertBefore( card, dest.children[destOffset] );
                            else
                                dest.appendChild( card );
                            destOffset++;
                            n++;
                        } );
                    } else {
                        source.forEach( function ( card ) {
                            cardOpenToggle( card, open, true );
                            if ( removeListeners )
                                card.removeEventListener( 'click', removeListeners );
                            card = card.parentElement.removeChild( card );
                            if ( destOffset < destLength )
                                dest.insertBefore( card, dest.children[destOffset] );
                            else
                                dest.appendChild( card );
                            destOffset++;
                            n++;
                        } );
                    }
                    return n;
                },
                selectedCardList = [],
                selectCard = function ( card, select, count ) {
                    var i = selectedCardList.indexOf( card ),
                        l = card.parentElement.children,
                        j = indexOf.call( l, card ), 
                        c = slice.call( l, j, count || undefined ),
                        i, cl;
                    if ( select ) {
                        c.forEach( function ( card ) {
                            card.classList.add( 'selected' );
                            if ( selectedCardList.indexOf( card ) < 0 )
                                selectedCardList.push( card );
                        } );
                    } else if ( select == null ) {
                        c.forEach( function ( card ) {
                            if ( ( cl = card.classList ).contains( 'selected' ) ) {
                                cl.add( 'selected' );
                                if ( selectedCardList.indexOf( card ) < 0 )
                                    selectedCardList.push( card );
                            }
                        } );
                    } else {
                        c.forEach( function ( card ) {
                            card.classList.remove( 'selected' );
                            if ( ( i = selectedCardList.indexOf( card ) ) >= 0 )
                                selectedCardList.splice( card, i, 1 );
                        } );
                    }
                },
                deselectAllCards = function ( ) {
                    selectedCardList.forEach( function ( card ) {
                        card.classList.remove( 'selected' );
                    } );
                    selectedCardList.splice( 0 );
                },
                inWaste = function ( card ) {
                    var stack = card.parentElement;
                    return stack === wasteContainer
                            && stack.classList.contains( 'card-stack' )
                            && stack;
                },
                inFoundation = function ( card ) {
                    var stack = card.parentElement;
                    return stack
                            && stack.classList.contains( 'card-stack' )
                            && stack.parentElement === foundationContainer
                            && stack;
                },
                inTableau = function ( card ) {
                    var stack = card.parentElement;
                    return stack
                            && stack.classList.contains( 'card-stack' )
                            && stack.parentElement === tableauContainer
                            && stack;
                },
                wasteDeal = function ( evt, count ) {
                    var i, n;
                    if ( isNaN( count ) )
                        count = 3;
                    deselectAllCards( );
                    if ( ! deckContainer.childElementCount ) {
                        //  moveCards( source, sourceOffset, dest, destOffset, count, open, removeListeners, requireAll )
                        n = moveCards( wasteContainer, null, deckContainer, null, -wasteContainer.childElementCount, false, openCardMove, true );
                    }
                    //  moveCards( source, sourceOffset, dest, destOffset, count, open, removeListeners, requireAll )
                    n = moveCards( deckContainer, null, wasteContainer, null, -count, true, openCardMove );
                    console.debug( n + ' cards moved to wasteContainer' );
                    if ( n ) {
                        i = wasteContainer.childElementCount - n;
                        while ( i < wasteContainer.childElementCount ) {
                            console.debug( 'wasteContainer card #' + i + ' adding click openCardMove listener' );
                            wasteContainer.children[i++].addEventListener( 'click', openCardMove, false );
                        }
                    }
                    return n;
                },
                openCardMove = function ( evt ) {
                    var card = ( evt instanceof Event ? evt.srcElement : evt ) || this,
                        dataset = card.dataset,
                        face = dataset.face,
                        stack, selected, selectedFace, ds,
                        rank, suit, color, i, j, t;

                    if ( ! ( ( card instanceof Event ? ( card = card.srcTarget ) : card ) instanceof HTMLElement ) )
                        return deselectAllCards( );
                    if ( ! ( face = ( ds = card.dataset ).face ) ) {
                        // either card is down or not a card at all
                        if ( card.classList.contains( 'card-stack' ) ) {
                            // our click was on a card-stack with things to move there
                            // make sure the stack is empty, if not empty then we failed to manage stack listerners correctly
                            if ( card.childElementCount )
                                throw 'openCardMove: tried to move to an non-empty card-stack, this should never happen!';
                            if ( selectedCardList.length ) {
                                console.debug( card.parentElement.id + ' stack #' + indexOf.call( card.parentElement, card ) + ' clicked' );
                                if ( card.parentElement.id === 'foundation' ) {
                                    // we clicked on a foundation stack, move 1 card ONLY (an ace)
                                    if ( selectedCardList.length === 1 
                                            && ( t = ( selected = selectedCardList[0] ).dataset.face )
                                            && t.slice( 0, -1 ) === 'A' ) {
                                        // open selected undercard for tableau ONLY
                                        if ( ( t = selected.parentElement ) && t.parentElement === tableauContainer ) {
                                            if ( ( t = selected.previousElementSibling ) ) {
                                                cardOpenToggle( t, true, true );
                                                t.addEventListener( 'click', openCardMove, false );
                                            } else if ( ( t = selected.parentElement ).classList.contains( 'card-stack' ) ) {
                                                t.addEventListener( 'click', openCardMove, false );
                                            }
                                        }
                                        // do the move
                                        moveCards( selectedCardList, 0, card, null, 1, null, false, true );
                                        card.removeEventListener( 'click', openCardMove );
                                    }
                                } else if ( card.parentElement.id === 'tableau' ) {
                                    // we clicked on a tableau stack, move selected cards if first is king
                                    if ( ( t = ( selected = selectedCardList[0] ).dataset.face )
                                            && t.slice( 0, -1 ) === 'K' ) {
                                        // open selected undercard for tableau ONLY
                                        if ( ( t = selected.parentElement ) && t.parentElement === tableauContainer ) {
                                            if ( ( t = selected.previousElementSibling ) ) {
                                                cardOpenToggle( t, true, true );
                                                t.addEventListener( 'click', openCardMove, false );
                                            } else if ( ( t = selected.parentElement ).classList.contains( 'card-stack' ) ) {
                                                t.addEventListener( 'click', openCardMove, false );
                                            }
                                        }
                                        // do the move
                                        moveCards( selectedCardList, 0, card, null, selectedCardList.length, null, false, true );
                                        card.removeEventListener( 'click', openCardMove );
                                    }
                                } else
                                    throw 'openCardMove: tried to move to an invalid card-stack(' + card.parentElement.id + '#' + indexOf.call( card.parentElement, card ) + '), this should never happen!';
                            }
                        }
                        return deselectAllCards( );
                    }
                    rank = face.slice( 0, -1 );
                    color = _deckSuitColors[suit = face.slice( -1 )];

                    if ( selectedCardList.length ) {
                        if ( selectedCardList.indexOf( card ) >= 0 )
                            return deselectAllCards( );
                        // if cards already selected: card is dest, selected is source
                        if ( selectedCardList.indexOf( card ) < 0 ) {// as long as dest is not in source
                            selectedFace = ( selected = selectedCardList[0] ).dataset.face;
                            if ( ( stack = inFoundation( card ) ) ) {
                                // dest is foundation: check if valid move to foundation
                                //  1) can only move 1 (the last) card at a time
                                //  2) suit must match suit and rank must be incr, note:
                                //     aces are handled by openCardAutoMove
                                if ( selectedCardList.length === 1
                                        && card === stack.lastElementChild
                                        && suit === selectedFace.slice( -1 )
                                        && ( t =_rankStacking[selectedFace.slice( 0, -1 )] )
                                        && t.indexOf( rank ) >= 0 ) {
                                    // open selected undercard for tableau ONLY
                                    if ( ( t = selected.parentElement ) && t.parentElement === tableauContainer ) {
                                        if ( ( t = selected.previousElementSibling ) ) {
                                            cardOpenToggle( t, true, true );
                                            t.addEventListener( 'click', openCardMove, false );
                                        } else if ( ( t = selected.parentElement ).classList.contains( 'card-stack' ) ) {
                                            t.addEventListener( 'click', openCardMove, false );
                                        }
                                    }
                                    moveCards( selectedCardList, 0, stack, null, 1, null, false, true );
                                }
                            } else if ( ( stack = inTableau( card ) ) ) {
                                // dest is tableau, check if valid move to
                                //  1) can move 1 or more incremental cards
                                //  2) suit must NOT match and rank must be incr
                                //  3) source card must be incr and alternating suits
                                if ( card === stack.lastElementChild
                                        && color !== _deckSuitColors[selectedFace.slice( -1 )]
                                        && ( t = _rankStacking[rank] )
                                        && t.indexOf( selectedFace.slice( 0, -1 ) ) >= 0 ) {
                                    // open selected undercard for tableau ONLY
                                    if ( ( t = selected.parentElement ) && t.parentElement === tableauContainer ) {
                                        if ( ( t = selected.previousElementSibling ) ) {
                                            cardOpenToggle( t, true, true );
                                            t.addEventListener( 'click', openCardMove, false );
                                        } else if ( ( t = selected.parentElement ).classList.contains( 'card-stack' ) ) {
                                            t.addEventListener( 'click', openCardMove, false );
                                        }
                                    }
                                    moveCards( selectedCardList, 0, stack, null, selectedCardList.length, null, false, true );
                                    // remove potential stack listener because now we have cards there to listen
                                    stack.removeEventListener( 'click', openCardMove );
                                }
                            }
                            return deselectAllCards( );
                        }

                        // deselect and fall through to new selection
                        deselectAllCards( );
                    }

                    // new selection: card is source and becomes selected
                    if ( ( stack = inTableau( card ) ) || ( stack = inWaste( card ) ) ) {
                        // is in tableau: multiple card selection allowed
                        if ( ( i = indexOf.call( j = stack.children, card ) ) < 0 )
                            throw 'This should never happen, inTableau return stack that does not contain the card';
                        selectCard( card, true );
                    } else {
                        // assume is in waste or foundation: single (last) card selection allowed
                        selectCard( card, true );
                    }
                },
                openCardAutoMove = function ( ) {
                    var stackList, stack, ds, face, t;
                    // check if card is Ace: move to first open foundation
                    // else if all cards up, then check if can fill foundation
                    _cardOpenList.forEach( function ( card, i ) {
                        if ( ! ( card instanceof HTMLElement && card.classList.contains( 'card' ) ) )
                            throw 'openCardAutoMove: non-card in _cardOpenList at ' +  i + ', this should never happen!';
                        stackList = ( stack = card.parentElement ) && stack.parentElement;
                        if ( stackList && stackList.id !== 'foundation' ) {
                            if ( ( ds = card.dataset ) && ( face = ds.face ) && face.slice( 0, -1 ) === 'A'
                                    && ( t = foundationContainer.querySelector( '.card-stack:empty' ) ) ) {
                                selectCard( card, true );
                                openCardMove( t );
                            }
                        }
                    } );
                },
                newDeal = function ( ) {
                    var stacks = ( tableauStackList.children || tableauStackList ),
                        n = stacks.length,
                        i = 0,
                        j, elt;
                    while ( i < n ) {
                    //  moveCards( source, sourceOffset, dest, destOffset, count, open, removeListeners, requireAll )
                        moveCards( deckContainer, null, elt = stacks[i++], null, 1, true );
                        elt.lastElementChild.addEventListener( 'click', openCardMove, false );
                        for ( j = i; j < n; j++ )
                            moveCards( deckContainer, null, stacks[j], null, 1, false );
                    }
                    wasteDeal( null, 1 );
                    openCardAutoMove( );
                },
                newGame = function ( gameUID ) {
                    if ( ! gameUID )
                        gameUID = 0;
                    deckContainer.innerHTML = '';
                    wasteContainer.innerHTML = '';
                    deckContainer.removeEventListener( 'click', wasteDeal );
                    forEach.call( foundationStackList, function ( stack ) { stack.innerHTML = ''; stack.addEventListener( 'click', openCardMove, false ); } );
                    forEach.call( tableauStackList, function ( stack ) { stack.innerHTML = ''; } );
                    createDeck( );
                    shuffleDeck( );
                    _deckList.forEach( function ( card ) { deckContainer.appendChild( card ); } );
                    newDeal( );
                    deckContainer.addEventListener( 'click', wasteDeal, false );
                },
                Klondike = function ( ) {
                    body = document.body;
                    deckContainer = document.querySelector( '#deck' );
                    wasteContainer = document.querySelector( '#waste' );
                    foundationContainer = document.querySelector( '#foundation' );
                    tableauContainer = document.querySelector( '#tableau' );
                    foundationStackList = foundationContainer.querySelectorAll( '.card-stack' );
                    tableauStackList = tableauContainer.querySelectorAll( '.card-stack' );

                    newGame( );
//                    body.addEventListener( 'click', expandCallback, false );
                };
            
            Klondike.prototype = {
                newGame: newGame
            };
            return Klondike;
        } )( ) );
    
    return Klondike;
} )( );

