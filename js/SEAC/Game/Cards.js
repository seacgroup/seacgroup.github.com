( function ( ) {
    var modules = typeof modules !== 'undefined' ? modules : window,
        SEAC = modules.SEAC || ( modules.SEAC = { } ),
        Game = SEAC.Game || ( SEAC.Game = { } ),
        Cards = Game.Cards || ( Game.Cards = ( function ( view, name ) {
    var CardAttr = function ( ) {
        
        },
        CardRank = function ( ) {
        
        },
        CardSuit = function ( ) {
        
        },
        CardFace = function ( ) {
        
        },
        Card = function ( ) {
        
        },
        CardState = function ( ) {
        
        },
        DeckAttr = function ( ) {
        
        },
        DeckState = function ( ) {
        
        },
        Deck = function ( ) {
        
        },
        Stack = function ( ) {
        
        },
        StackList = function ( ) {
        
        },
        Cards = {
            Card: Card,
            CardRank: CardRank,
            CardFace: CardFace,
            CardState: CardState,
            Deck: Deck,
            DeckAttr: DeckAttr,
            DeckState: DeckState,
            Stack: Stack,
            StackList: StackList
        };
    
    if ( view ) {
        var SEAC = view.SEAC || ( view.SEAC = { } ),
            Game = SEAC.Game || ( SEAC.Game = { } );
        if ( Game.Cards )
            _ObjectMerge( Game.Cards, Cards );
        else
            Game.Cards = Cards;
    }
    return Cards;
} )( ) );
    
    return Game;
} )( );
